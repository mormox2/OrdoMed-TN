/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Medicine,
  MedicineAlias,
  DosageTemplate,
  Patient,
  Prescription,
  PrescriptionItem,
  AuditLog,
  DoctorConfig,
} from './types';
import pctMedications from './pct_medications.json';

// Helper to remove French accents
export function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Helper to normalize text for search (fr & ar)
export function normalizeSearchText(str: string): string {
  let normalized = removeAccents(str.trim());
  // Basic arabic normalization
  normalized = normalized
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
  return normalized;
}

export const DEFAULT_DOCTOR_CONFIG: DoctorConfig = {
  name_fr: 'Dr. Anis Ben Youssef',
  name_ar: 'الدكتور أنيس بن يوسف',
  specialty_fr: 'Cardiologie et Médecine Générale',
  specialty_ar: 'أمراض القلب والشرايين والطب العام',
  order_number: 'TN-2026-9482',
  address_fr: 'Cabinet Médical, 45 Avenue Habib Bourguiba, Belvédère, Tunis 1002',
  address_ar: 'العيادة الطبية، 45 شارع الحبيب بورقيبة، البلفيدير، تونس 1002',
  phone: '+216 71 889 456',
  email: 'anis.benyoussef@ordre-medecins.tn',
  matricule_fiscal: 'MF 1489245/A/P/M/000',
  code_cnam: '9482-12-00',
  hours_fr: 'Lundi - Vendredi: 08:30 - 17:00 | Samedi: 08:30 - 13:00',
  hours_ar: 'الإثنين - الجمعة: 08:30 - 17:00 | السبت: 08:30 - 13:00',
  footer_fr: 'Présenter cette ordonnance lors de chaque visite. Validité de 3 mois.',
  footer_ar: 'يرجى تقديم هذه الوصفة في كل زيارة. صالحة لمدة 3 أشهر.',
  stamp_text: 'Cabinet Médical\nDr. Anis Ben Youssef\nCardiologie - Tunis\nN° Ordre: TN-2026-9482',
  show_automatic_stamp: true,
  website: 'https://cabinet-anis-benyoussef.tn',
};

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    name_first: 'Mohamed',
    name_last: 'Trabelsi',
    birth_date: '1974-04-12', // Adult
    gender: 'M',
    weight: 84,
    allergies: ['Pénicilline', 'Amoxicilline'],
    has_renal_impairment: true,
  },
  {
    id: 'pat-2',
    name_first: 'Maya',
    name_last: 'Gharbi',
    birth_date: '2021-09-05', // Child (Pédiatrie)
    gender: 'F',
    weight: 14, // Poids crucial pour dosage
    allergies: [],
    is_pregnant: false,
  },
  {
    id: 'pat-3',
    name_first: 'Emna',
    name_last: 'Louati',
    birth_date: '1995-11-20', // Young Adult Woman
    gender: 'F',
    weight: 62,
    allergies: ['Sulfamides'],
    is_pregnant: true, // Pregnant flag
  },
  {
    id: 'pat-4',
    name_first: 'Hédi',
    name_last: 'Chaouch',
    birth_date: '1948-02-28', // Elderly
    gender: 'M',
    weight: 70,
    allergies: [],
    has_hepatic_impairment: true,
  },
];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    source_type: 'pct',
    source_url: 'https://www.phcentral.com.tn',
    pct_code: '102540',
    amm_number: '9153011',
    amm_date: '2015-04-20',
    name_brand: 'CLAMOXYL',
    name_normalized: 'clamoxyl',
    dci_name: 'Amoxicilline',
    dci_normalized: 'amoxicilline',
    dosage_strength: '500 mg',
    pharmaceutical_form: 'Gélule',
    route: 'Orale',
    package_label: 'Boite de 24',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'GlaxoSmithKline Tunisie',
    therapeutic_class: 'Antibiotique - Bêta-lactamines',
    status: 'active',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-2',
    source_type: 'pct',
    source_url: 'https://www.phcentral.com.tn',
    pct_code: '102541',
    amm_number: '9153022',
    amm_date: '2015-04-20',
    name_brand: 'CLAMOXYL suspension',
    name_normalized: 'clamoxyl suspension',
    dci_name: 'Amoxicilline',
    dci_normalized: 'amoxicilline',
    dosage_strength: '250 mg / 5 mL',
    pharmaceutical_form: 'Poudre pour suspension orale',
    route: 'Orale',
    package_label: 'Flacon de 60 mL',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'GlaxoSmithKline Tunisie',
    therapeutic_class: 'Antibiotique - Bêta-lactamines',
    status: 'active',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-3',
    source_type: 'pct',
    source_url: 'https://www.phcentral.com.tn',
    pct_code: '104320',
    amm_number: '9213054',
    amm_date: '2016-01-15',
    name_brand: 'DOLIPRANE',
    name_normalized: 'doliprane',
    dci_name: 'Paracétamol',
    dci_normalized: 'paracetamole',
    dosage_strength: '1000 mg',
    pharmaceutical_form: 'Comprimé effervescent',
    route: 'Orale',
    package_label: 'Boite de 8',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'Sanofi Aventis Tunisie',
    therapeutic_class: 'Antalgique - Antipyrétique',
    status: 'active',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-4',
    source_type: 'pct',
    source_url: 'https://www.phcentral.com.tn',
    pct_code: '104321',
    amm_number: '9213055',
    amm_date: '2016-01-15',
    name_brand: 'DOLIPRANE Pédiatrique',
    name_normalized: 'doliprane pediatrique',
    dci_name: 'Paracétamol',
    dci_normalized: 'paracetamole',
    dosage_strength: '2.4 % (120 mg / 5 mL)',
    pharmaceutical_form: 'Sirop',
    route: 'Orale',
    package_label: 'Flacon de 100 mL',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'Sanofi Aventis Tunisie',
    therapeutic_class: 'Antalgique - Antipyrétique',
    status: 'active',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-5',
    source_type: 'pct',
    source_url: 'https://www.phcentral.com.tn',
    pct_code: '112003',
    amm_number: '9083141',
    amm_date: '2012-08-11',
    name_brand: 'AUGMENTIN Adulte',
    name_normalized: 'augmentin adulte',
    dci_name: 'Amoxicilline + Acide clavulanique',
    dci_normalized: 'amoxicilline acide clavulanique',
    dosage_strength: '1 g / 125 mg',
    pharmaceutical_form: 'Comprimé pelliculé',
    route: 'Orale',
    package_label: 'Boite de 12',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'GlaxoSmithKline Tunisie',
    therapeutic_class: 'Antibiotique - Pénicilline + Inhibiteur',
    status: 'active',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-6',
    source_type: 'dpm',
    source_url: 'https://www.dpm.tn',
    pct_code: '108420',
    amm_number: '9021485',
    amm_date: '2014-03-10',
    name_brand: 'PROFENID',
    name_normalized: 'profenid',
    dci_name: 'Kétoprofène',
    dci_normalized: 'ketoprofene',
    dosage_strength: '100 mg',
    pharmaceutical_form: 'Comprimé sécable',
    route: 'Orale',
    package_label: 'Boite de 30',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'Opalia Pharma Tunisie',
    therapeutic_class: 'Anti-inflammatoire non stéroïdien (AINS)',
    status: 'active',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-7',
    source_type: 'dpm',
    source_url: 'https://www.dpm.tn',
    pct_code: '105210',
    amm_number: '8993201',
    amm_date: '2009-02-14',
    name_brand: 'LASILIX',
    name_normalized: 'lasilix',
    dci_name: 'Furosémide',
    dci_normalized: 'furosemide',
    dosage_strength: '40 mg',
    pharmaceutical_form: 'Comprimé',
    route: 'Orale',
    package_label: 'Boite de 30',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'Sanofi Aventis Tunisie',
    therapeutic_class: 'Diurétique de l\'anse',
    status: 'active',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-8',
    source_type: 'pct',
    source_url: 'https://www.phcentral.com.tn',
    pct_code: '121543',
    amm_number: '9152341',
    amm_date: '2015-06-20',
    name_brand: 'XANAX',
    name_normalized: 'xanax',
    dci_name: 'Alprazolam',
    dci_normalized: 'alprazolam',
    dosage_strength: '0.5 mg',
    pharmaceutical_form: 'Comprimé sécable',
    route: 'Orale',
    package_label: 'Boite de 30',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'Pfizer Tunisie',
    therapeutic_class: 'Anxiolytique - Benzodiazépine',
    status: 'active',
    is_available: true,
    requires_special_prescription: true, // Marked as special regulation (Psychotrope)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-9',
    source_type: 'pct',
    pct_code: '100342',
    amm_number: '8812304',
    amm_date: '2008-01-12',
    name_brand: 'ARTOTEC',
    name_normalized: 'artotec',
    dci_name: 'Diclofénac + Misoprostol',
    dci_normalized: 'diclofenac misoprostol',
    dosage_strength: '50 mg / 0.2 mg',
    pharmaceutical_form: 'Comprimé',
    route: 'Orale',
    package_label: 'Boite de 30',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'Pfizer Tunisie',
    therapeutic_class: 'AINS + Protecteur Gastrique',
    status: 'suspended', // Suspended AMM
    is_available: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-10',
    source_type: 'dpm',
    pct_code: '107412',
    amm_number: '8541290',
    amm_date: '1985-05-18',
    name_brand: 'MEDIATOR (Retiré)',
    name_normalized: 'mediator',
    dci_name: 'Benfluorex',
    dci_normalized: 'benfluorex',
    dosage_strength: '150 mg',
    pharmaceutical_form: 'Comprimé pelliculé',
    route: 'Orale',
    package_label: 'Boite de 30',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'Servier Tunisie',
    therapeutic_class: 'Adjuvant diabète / anorexigène',
    status: 'removed', // Removed AMM
    is_available: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-11',
    source_type: 'pct',
    pct_code: '113009',
    amm_number: '9183050',
    amm_date: '2018-09-12',
    name_brand: 'GLUCOPHAGE',
    name_normalized: 'glucophage',
    dci_name: 'Metformine',
    dci_normalized: 'metformine',
    dosage_strength: '850 mg',
    pharmaceutical_form: 'Comprimé pelliculé',
    route: 'Orale',
    package_label: 'Boite de 30',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'Merck Serono Tunisie',
    therapeutic_class: 'Antidiabétique oral - Biguanides',
    status: 'active',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med-12',
    source_type: 'pct',
    pct_code: '109923',
    amm_number: '9123490',
    amm_date: '2012-05-30',
    name_brand: 'SPASFON',
    name_normalized: 'spasfon',
    dci_name: 'Phloroglucinol',
    dci_normalized: 'phloroglucinol',
    dosage_strength: '80 mg',
    pharmaceutical_form: 'Comprimé',
    route: 'Orale',
    package_label: 'Boite de 30',
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: 'Opalia Pharma Tunisie',
    therapeutic_class: 'Antispasmodique musculotrope',
    status: 'active',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  ...(pctMedications as Medicine[])
];

export const INITIAL_DOSAGE_TEMPLATES: DosageTemplate[] = [
  // Clamoxyl (Amoxicilline) - Adult template
  {
    id: 'dt-1',
    medicine_id: 'med-1',
    dci_name: 'Amoxicilline',
    indication: 'Angine, sinusite, bronchite aigüe',
    patient_group: 'adult',
    min_age: 15,
    dose_text_fr: '1 gélule (500 mg)',
    dose_text_ar: 'كبسولة واحدة (500 مغ)',
    frequency_text_fr: '3 fois par jour (toutes les 8 heures)',
    frequency_text_ar: '3 مرات في اليوم (كل 8 ساعات)',
    duration_text_fr: '6 jours',
    duration_text_ar: '6 أيام',
    max_daily_dose: '3 g',
    warnings_fr: 'Prendre de préférence en début de repas. Respecter la durée prescrite même si les symptômes disparaissent.',
    warnings_ar: 'يُفضل تناوله في بداية الوجبات. يجب احترام مدة العلاج حتى لو اختفت الأعراض.',
    contraindication_flags: {
      pregnancy_alert: false,
      renal_alert: false,
    },
    requires_weight: false,
    requires_diagnosis: true,
    validation_status: 'validated',
    validated_by: 'Comité Scientifique Cabinet',
    validated_at: '2026-01-10T12:00:00Z',
    source_reference: 'PCT Guide de Prescription Thérapeutique 2025',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Clamoxyl suspension - Pediatric template (Child)
  {
    id: 'dt-2',
    medicine_id: 'med-2',
    dci_name: 'Amoxicilline',
    indication: 'Infection respiratoire haute pédiatrique',
    patient_group: 'child',
    max_age: 14,
    min_weight: 5,
    max_weight: 40,
    dose_text_fr: '1 dose-graduée de la pipette par tranche de poids',
    dose_text_ar: 'جرعة واحدة مدرجة من الماصة لكل شريحة وزن',
    frequency_text_fr: '2 fois par jour (50 mg/kg/jour)',
    frequency_text_ar: 'مرتين في اليوم (50 مغ/كغ/يوم)',
    duration_text_fr: '7 jours',
    duration_text_ar: '7 أيام',
    warnings_fr: 'Agiter vigoureusement le flacon reconstitué avant chaque utilisation. À conserver au réfrigérateur.',
    warnings_ar: 'رج الزجاجة جيداً قبل كل استعمال. تحفظ في الثلاجة.',
    requires_weight: true, // EXIGE LE POIDS
    validation_status: 'validated',
    validated_by: 'Pédiatrie Tunisienne Référentiel',
    validated_at: '2026-02-15T09:00:00Z',
    source_reference: 'DPM Recueil Posologique Pédiatrique',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Doliprane 1000mg - Adult template
  {
    id: 'dt-3',
    medicine_id: 'med-3',
    dci_name: 'Paracétamol',
    indication: 'Douleurs légères à modérées, fièvre',
    patient_group: 'adult',
    min_age: 15,
    dose_text_fr: '1 comprimé (1000 mg)',
    dose_text_ar: 'قرص واحد (1000 مغ)',
    frequency_text_fr: 'Toutes les 6 heures si besoin (maximum 4 comprimés par jour)',
    frequency_text_ar: 'كل 6 ساعات عند الحاجة (أقصى حد 4 أقراص في اليوم)',
    duration_text_fr: '3 à 5 jours',
    duration_text_ar: '3 إلى 5 أيام',
    max_daily_dose: '4 g',
    warnings_fr: 'Attention aux surdosages en cas d\'association à d\'autres médicaments. Contre-indiqué en cas d\'insuffisance hépatique sévère.',
    warnings_ar: 'انتبه لتجنب الإفراط في الجرعة عند دمجه مع أدوية أخرى. يمنع استعماله في حالة القصور الكبدي الحاد.',
    contraindication_flags: {
      hepatic_alert: true, // Alert for liver failure
    },
    requires_weight: false,
    validation_status: 'validated',
    validated_by: 'Comité National de Pharmacovigilance Tunisie',
    validated_at: '2025-11-01T10:00:00Z',
    source_reference: 'DPM Fiche Technique Doliprane',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Doliprane Sirop - Pediatric template
  {
    id: 'dt-4',
    medicine_id: 'med-4',
    dci_name: 'Paracétamol',
    indication: 'Fièvre et douleurs de l\'enfant',
    patient_group: 'child',
    max_age: 12,
    min_weight: 4,
    max_weight: 32,
    dose_text_fr: '1 graduation-poids de la seringue doseuse',
    dose_text_ar: 'تدريجة وزن واحدة من حقنة القياس',
    frequency_text_fr: 'Toutes les 6 heures si besoin (maximum 4 fois par jour)',
    frequency_text_ar: 'كل 6 ساعات عند الحاجة (أقصى حد 4 مرات يومياً)',
    duration_text_fr: '3 jours',
    duration_text_ar: '3 أيام',
    warnings_fr: 'Utiliser uniquement la seringue fournie dans la boite. Ne pas associer à un autre paracétamol.',
    warnings_ar: 'استخدم فقط المحقنة المتوفرة في العلبة. لا تدمجه مع باراسيتامول آخر.',
    requires_weight: true, // EXIGE LE POIDS
    validation_status: 'validated',
    validated_by: 'Société Tunisienne de Pédiatrie',
    validated_at: '2026-03-01T14:00:00Z',
    source_reference: 'Guide d\'utilisation pédiatrique Sanofi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Profenid - Adult template (Contraindicated in Pregnancy!)
  {
    id: 'dt-5',
    medicine_id: 'med-6',
    dci_name: 'Kétoprofène',
    indication: 'Rhumatismes, douleurs articulaires aigües',
    patient_group: 'adult',
    min_age: 15,
    dose_text_fr: '1 comprimé (100 mg)',
    dose_text_ar: 'قرص واحد (100 مغ)',
    frequency_text_fr: '2 fois par jour, au milieu des repas',
    frequency_text_ar: 'مرتين في اليوم، وسط الوجبات',
    duration_text_fr: '5 jours',
    duration_text_ar: '5 أيام',
    warnings_fr: 'Prendre impérativement au cours du repas avec un grand verre d\'eau. CONTRE-INDIQUÉ à partir du 6ème mois de grossesse.',
    warnings_ar: 'يجب تناوله أثناء الوجبة مع كوب كبير من الماء. يمنع استعماله تماماً ابتداءً من الشهر السادس للحمل.',
    contraindication_flags: {
      pregnancy_alert: true, // CRITICAL FOR PREGNANT ALERTS
      renal_alert: true,
    },
    requires_weight: false,
    validation_status: 'validated',
    source_reference: 'DPM AMM Profenid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Lasilix 40mg - Adult template (For cardiovascular/renal)
  {
    id: 'dt-6',
    medicine_id: 'med-7',
    dci_name: 'Furosémide',
    indication: 'Hypertension artérielle, œdème cardiaque',
    patient_group: 'adult',
    dose_text_fr: '1 comprimé (40 mg)',
    dose_text_ar: 'قرص واحد (40 مغ)',
    frequency_text_fr: 'Le matin à jeun',
    frequency_text_ar: 'في الصباح على الريق',
    duration_text_fr: 'Traitement continu au long cours',
    duration_text_ar: 'علاج مستمر طويل الأمد',
    warnings_fr: 'Surveiller régulièrement la tension artérielle et le potassium sanguin (kaliémie).',
    warnings_ar: 'مراقبة ضغط الدم ونسبة البوتاسيوم في الدم بانتظام.',
    requires_weight: false,
    validation_status: 'validated',
    source_reference: 'Société Tunisienne de Cardiologie',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Xanax - Special regulations (Anxiolytique psychotrope)
  {
    id: 'dt-7',
    medicine_id: 'med-8',
    dci_name: 'Alprazolam',
    indication: 'Anxiété généralisée, attaques de panique',
    patient_group: 'adult',
    dose_text_fr: '1/2 comprimé (0.25 mg)',
    dose_text_ar: 'نصف قرص (0.25 مغ)',
    frequency_text_fr: '3 fois par jour',
    frequency_text_ar: '3 مرات في اليوم',
    duration_text_fr: '7 à 14 jours maximum (limiter l\'accoutumance)',
    duration_text_ar: '7 إلى 14 يوماً كأقصى حد (لتجنب الإدمان)',
    warnings_fr: 'Médicament soumis à une surveillance stricte. Ne pas arrêter brusquement le traitement. Risque de somnolence.',
    warnings_ar: 'دواء خاضع لمراقبة صارمة. لا توقف العلاج فجأة. خطر النعاس.',
    requires_weight: false,
    validation_status: 'validated',
    source_reference: 'Ordre National des Médecins Tunisie - Vigilance Psychotropes',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// Seed some initial audit logs and past prescriptions for demonstration
export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'pres-1',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    prescription_number: 'ORD-2026-0001',
    prescription_date: '2026-05-10',
    notes_private: 'Patient hypertendu régulier. Pas d\'allergie au Furosémide.',
    print_language_mode: 'bilingual',
    status: 'signed',
    created_at: '2026-05-10T10:00:00Z',
    updated_at: '2026-05-10T10:05:00Z',
    signed_at: '2026-05-10T10:05:00Z',
    patient_name: 'Mohamed Trabelsi',
    patient_age_str: '52 ans',
    patient_gender: 'M',
    patient_weight: 84,
    patient_allergies: ['Pénicilline', 'Amoxicilline'],
  }
];

export const INITIAL_PRESCRIPTION_ITEMS: PrescriptionItem[] = [
  {
    id: 'item-1',
    prescription_id: 'pres-1',
    medicine_id: 'med-7',
    line_order: 1,
    medicine_label: 'LASILIX 40 mg Comprimé (Furosémide)',
    dci_name: 'Furosémide',
    dosage: '1 comprimé (40 mg)',
    frequency: 'Le matin à jeun',
    duration: 'Traitement continu',
    quantity: 'Boites 3',
    instructions_fr: 'À prendre avec un grand verre d\'eau.',
    instructions_ar: 'يؤخذ مع كوب كبير من الماء.',
    is_suggestion_used: true,
    doctor_modified_suggestion: false,
    created_at: '2026-05-10T10:02:00Z',
    updated_at: '2026-05-10T10:02:00Z',
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    actor_id: 'doc-1',
    action: 'INITIAL_SEED',
    entity_type: 'SYSTEM',
    entity_id: 'system',
    created_at: new Date().toISOString(),
  }
];

// DB State shape
export interface DbState {
  medicines: Medicine[];
  aliases: MedicineAlias[];
  dosageTemplates: DosageTemplate[];
  patients: Patient[];
  prescriptions: Prescription[];
  prescriptionItems: PrescriptionItem[];
  auditLogs: AuditLog[];
  doctorConfig: DoctorConfig;
}

// Load or initialize DB state
export function getDbState(): DbState {
  const stored = localStorage.getItem('tun_med_prescription_db');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure all tables exist in parsed object
      return {
        medicines: parsed.medicines || INITIAL_MEDICINES,
        aliases: parsed.aliases || [],
        dosageTemplates: parsed.dosageTemplates || INITIAL_DOSAGE_TEMPLATES,
        patients: parsed.patients || INITIAL_PATIENTS,
        prescriptions: parsed.prescriptions || INITIAL_PRESCRIPTIONS,
        prescriptionItems: parsed.prescriptionItems || INITIAL_PRESCRIPTION_ITEMS,
        auditLogs: parsed.auditLogs || INITIAL_AUDIT_LOGS,
        doctorConfig: parsed.doctorConfig || DEFAULT_DOCTOR_CONFIG,
      };
    } catch (e) {
      console.error('Failed to parse DB, using defaults', e);
    }
  }

  // Initialize and write defaults
  const state: DbState = {
    medicines: INITIAL_MEDICINES,
    aliases: [],
    dosageTemplates: INITIAL_DOSAGE_TEMPLATES,
    patients: INITIAL_PATIENTS,
    prescriptions: INITIAL_PRESCRIPTIONS,
    prescriptionItems: INITIAL_PRESCRIPTION_ITEMS,
    auditLogs: INITIAL_AUDIT_LOGS,
    doctorConfig: DEFAULT_DOCTOR_CONFIG,
  };
  localStorage.setItem('tun_med_prescription_db', JSON.stringify(state));
  return state;
}

export function saveDbState(state: DbState) {
  localStorage.setItem('tun_med_prescription_db', JSON.stringify(state));
}

// Global state logging function
export function logAudit(
  action: string,
  entity_type: string,
  entity_id: string,
  before?: any,
  after?: any
) {
  const state = getDbState();
  const log: AuditLog = {
    id: 'audit-' + Math.random().toString(36).substr(2, 9),
    actor_id: 'doctor-current',
    action,
    entity_type,
    entity_id,
    before_json: before ? JSON.stringify(before) : undefined,
    after_json: after ? JSON.stringify(after) : undefined,
    created_at: new Date().toISOString(),
  };
  state.auditLogs.unshift(log);
  saveDbState(state);
}
