import {
  ClinicalEvaluation,
  ClinicalIssue,
  ClinicalIssueSeverity,
  ClinicalRule,
  DosageTemplate,
  Patient,
} from '../types';

const severityFor = (rule: ClinicalRule, approved: boolean): ClinicalIssueSeverity | null => {
  if (rule.action === 'allowed') return null;
  if (rule.action === 'blocked' && approved) return 'blocked';
  return 'caution';
};

const issueFromRule = (
  code: string,
  rule: ClinicalRule,
  approved: boolean,
): ClinicalIssue | null => {
  const severity = severityFor(rule, approved);
  if (!severity) return null;
  return {
    code,
    severity,
    message_fr: rule.action === 'blocked' && !approved
      ? `${rule.message_fr} (règle en attente de validation clinique)`
      : rule.message_fr,
    message_ar: rule.message_ar,
    suggested_adjustment_fr: rule.dose_override_fr,
    suggested_adjustment_ar: rule.dose_override_ar,
  };
};

export const calculatePatientAge = (birthDate: string, now = new Date()): number => {
  const birth = new Date(`${birthDate}T00:00:00`);
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

const statusFromIssues = (issues: ClinicalIssue[]): ClinicalEvaluation['status'] => {
  if (issues.some((issue) => issue.severity === 'blocked')) return 'blocked';
  if (issues.some((issue) => issue.severity === 'missing_data')) return 'missing_data';
  if (issues.length) return 'caution';
  return 'compatible';
};

export const evaluateTemplateForPatient = (
  template: DosageTemplate,
  patient?: Patient | null,
  now = new Date(),
): ClinicalEvaluation => {
  const issues: ClinicalIssue[] = [];
  const approved = template.clinical_review_status === 'approved';
  const add = (issue: ClinicalIssue | null) => issue && issues.push(issue);

  if (!patient) {
    issues.push({ code: 'patient_missing', severity: 'missing_data', message_fr: 'Sélectionnez un patient pour évaluer ce protocole.' });
  } else {
    const age = calculatePatientAge(patient.birth_date, now);
    const minAge = template.clinical_rules?.age?.min ?? template.min_age;
    const maxAge = template.clinical_rules?.age?.max ?? template.max_age;
    const ageRule = template.clinical_rules?.age;
    if (minAge !== undefined && age < minAge) add(issueFromRule('age_below_min', ageRule ?? { action: 'blocked', message_fr: `Âge inférieur à la limite de ${minAge} ans.` }, approved));
    if (maxAge !== undefined && age > maxAge) add(issueFromRule('age_above_max', ageRule ?? { action: 'blocked', message_fr: `Âge supérieur à la limite de ${maxAge} ans.` }, approved));
    if (minAge === undefined && maxAge === undefined) {
      if (template.patient_group === 'child' && age >= 15) issues.push({ code: 'patient_group', severity: 'caution', message_fr: 'Ce protocole est destiné au groupe pédiatrique.' });
      if (template.patient_group === 'adult' && age < 15) issues.push({ code: 'patient_group', severity: 'caution', message_fr: 'Ce protocole est destiné au groupe adulte.' });
      if (template.patient_group === 'elderly' && age < 65) issues.push({ code: 'patient_group', severity: 'caution', message_fr: 'Ce protocole est destiné au sujet âgé.' });
    }

    const weightRule = template.clinical_rules?.weight;
    if ((template.requires_weight || weightRule?.required) && !patient.weight) {
      issues.push({ code: 'weight_missing', severity: 'missing_data', message_fr: 'Le poids du patient est requis pour appliquer ce protocole.' });
    } else if (patient.weight) {
      const minWeight = weightRule?.min ?? template.min_weight;
      const maxWeight = weightRule?.max ?? template.max_weight;
      if (minWeight !== undefined && patient.weight < minWeight) add(issueFromRule('weight_below_min', weightRule ?? { action: 'blocked', message_fr: `Poids inférieur à ${minWeight} kg.` }, approved));
      if (maxWeight !== undefined && patient.weight > maxWeight) add(issueFromRule('weight_above_max', weightRule ?? { action: 'blocked', message_fr: `Poids supérieur à ${maxWeight} kg.` }, approved));
    }

    const pregnancyStatus = patient.pregnancy_status ?? (patient.is_pregnant ? 'pregnant' : 'unknown');
    const pregnancy = pregnancyStatus === 'pregnant';
    if (template.patient_group === 'pregnant' && !pregnancy) issues.push({ code: 'patient_group', severity: 'caution', message_fr: 'Ce protocole est destiné à une patiente enceinte.' });
    if (patient.gender === 'F' && pregnancyStatus === 'unknown' && template.clinical_rules?.pregnancy?.action !== undefined && template.clinical_rules.pregnancy.action !== 'allowed') {
      issues.push({ code: 'pregnancy_status_missing', severity: 'missing_data', message_fr: 'Le statut de grossesse doit être renseigné pour évaluer ce protocole.' });
    } else if (pregnancy && template.clinical_rules?.pregnancy) add(issueFromRule('pregnancy', template.clinical_rules.pregnancy, approved));
    else if (pregnancy && template.contraindication_flags?.pregnancy_alert) issues.push({ code: 'pregnancy_legacy', severity: 'caution', message_fr: 'Grossesse : vérifier la compatibilité et adapter selon le terme.' });

    if (patient.is_breastfeeding && template.clinical_rules?.breastfeeding) add(issueFromRule('breastfeeding', template.clinical_rules.breastfeeding, approved));
    else if (patient.is_breastfeeding && template.contraindication_flags?.breastfeeding_alert) issues.push({ code: 'breastfeeding_legacy', severity: 'caution', message_fr: 'Allaitement : vérifier la compatibilité du traitement.' });

    const renalImpairment = patient.has_renal_impairment || (patient.renal_status && !['unknown', 'normal'].includes(patient.renal_status));
    if (template.clinical_rules?.renal?.length) {
      if (patient.egfr === undefined && patient.renal_status !== 'normal') {
        issues.push({ code: 'egfr_missing', severity: 'missing_data', message_fr: 'Le DFG est requis pour évaluer ce protocole rénal.' });
      } else if (patient.egfr !== undefined) {
        template.clinical_rules.renal.forEach((rule, index) => {
          const below = rule.egfr_below === undefined || patient.egfr! < rule.egfr_below;
          const above = rule.egfr_at_or_above === undefined || patient.egfr! >= rule.egfr_at_or_above;
          if (below && above) add(issueFromRule(`renal_${index}`, rule, approved));
        });
      }
    } else if (renalImpairment && template.contraindication_flags?.renal_alert) {
      issues.push({ code: 'renal_legacy', severity: 'caution', message_fr: 'Insuffisance rénale : contrôler le DFG et adapter la dose si nécessaire.' });
    }

    const hepaticImpairment = patient.has_hepatic_impairment || (patient.hepatic_status && !['unknown', 'normal'].includes(patient.hepatic_status));
    if (template.clinical_rules?.hepatic?.length && (!patient.hepatic_status || patient.hepatic_status === 'unknown')) {
      issues.push({ code: 'hepatic_status_missing', severity: 'missing_data', message_fr: 'La fonction hépatique doit être renseignée pour évaluer ce protocole.' });
    } else if (hepaticImpairment && template.clinical_rules?.hepatic?.length) {
      template.clinical_rules.hepatic.forEach((rule, index) => {
        if (rule.severity === 'any_impairment' || rule.severity === patient.hepatic_status) add(issueFromRule(`hepatic_${index}`, rule, approved));
      });
    } else if (hepaticImpairment && template.contraindication_flags?.hepatic_alert) {
      issues.push({ code: 'hepatic_legacy', severity: 'caution', message_fr: 'Insuffisance hépatique : vérifier la compatibilité et adapter si nécessaire.' });
    }
  }

  return {
    status: statusFromIssues(issues),
    evaluated_at: now.toISOString(),
    template_id: template.id,
    template_version: template.version ?? 1,
    issues,
  };
};
