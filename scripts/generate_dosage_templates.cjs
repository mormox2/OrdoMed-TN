/**
 * generate_dosage_templates.cjs
 *
 * Génère src/dosage_templates.json avec ~420 templates DosageTemplate
 * couvrant les DCI les plus courantes du registre AMM tunisien.
 *
 * Lié par dci_name (principe actif) pour couvrir générique + princeps.
 * Usage: node scripts/generate_dosage_templates.cjs
 */

'use strict';
const fs = require('fs');
const path = require('path');

const now = new Date().toISOString();
let idx = 1;
const id = () => `dt-gen-${idx++}`;

// ─── Helper ───────────────────────────────────────────────────────────────────
function t(dci, indication, group, opts = {}) {
  return {
    id: id(),
    dci_name: dci,
    indication,
    patient_group: group,
    min_age: opts.min_age ?? (group === 'child' ? 1 : group === 'adult' ? 15 : undefined),
    max_age: opts.max_age ?? (group === 'child' ? 14 : undefined),
    min_weight: opts.min_weight ?? undefined,
    max_weight: opts.max_weight ?? undefined,
    dose_text_fr: opts.dose_fr,
    dose_text_ar: opts.dose_ar,
    frequency_text_fr: opts.freq_fr,
    frequency_text_ar: opts.freq_ar,
    duration_text_fr: opts.dur_fr,
    duration_text_ar: opts.dur_ar,
    max_daily_dose: opts.max_daily ?? undefined,
    warnings_fr: opts.warn_fr ?? undefined,
    warnings_ar: opts.warn_ar ?? undefined,
    contraindication_flags: opts.ci ?? undefined,
    requires_weight: opts.needs_weight ?? (group === 'child'),
    requires_diagnosis: opts.needs_dx ?? false,
    validation_status: 'draft',
    source_reference: opts.ref ?? 'Vidal / BDPM / Guide de prescription AMM Tunisie',
    created_at: now,
    updated_at: now,
  };
}

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

const templates = [

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SYSTEME CARDIOVASCULAIRE
  // ═══════════════════════════════════════════════════════════════════════════

  // Metoprolol
  t('Métoprolol', 'Hypertension artérielle, Angine de poitrine', 'adult', {
    dose_fr: '1 comprimé (50 mg)', dose_ar: 'قرص واحد (50 مغ)',
    freq_fr: '2 fois par jour', freq_ar: 'مرتين يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '200 mg/j',
    warn_fr: 'Ne pas arrêter brutalement. Surveiller la fréquence cardiaque. Contre-indiqué si bradycardie < 45 bpm.',
    warn_ar: 'لا توقف العلاج فجأة. مراقبة ضربات القلب. يمنع إذا كان معدل ضربات القلب أقل من 45 نبضة/دقيقة.',
    ci: { pregnancy_alert: false, renal_alert: false },
    needs_weight: false,
  }),
  t('Métoprolol', 'Post-infarctus du myocarde', 'adult', {
    dose_fr: '1 comprimé (100 mg)', dose_ar: 'قرص واحد (100 مغ)',
    freq_fr: '2 fois par jour', freq_ar: 'مرتين يومياً',
    dur_fr: 'Traitement continu long cours', dur_ar: 'علاج مستمر طويل الأمد',
    max_daily: '200 mg/j',
    warn_fr: 'Ne jamais interrompre brutalement. Surveillance ECG recommandée.',
    warn_ar: 'لا توقف العلاج فجأة أبداً. يُنصح بمراقبة تخطيط القلب.',
    needs_weight: false,
  }),
  t('Métoprolol', 'Hypertension artérielle (personnes âgées)', 'elderly', {
    dose_fr: '1/2 comprimé (25 mg)', dose_ar: 'نصف قرص (25 مغ)',
    freq_fr: '2 fois par jour, à adapter selon tolérance', freq_ar: 'مرتين يومياً، تُعدَّل حسب التحمل',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '100 mg/j',
    warn_fr: 'Débuter à faible dose. Risque accru de bradycardie et hypotension.',
    warn_ar: 'ابدأ بجرعة منخفضة. خطر متزايد لبطء القلب وانخفاض الضغط.',
    needs_weight: false,
  }),

  // Amlodipine
  t('Amlodipine', 'Hypertension artérielle', 'adult', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)',
    freq_fr: '1 fois par jour, de préférence le matin', freq_ar: 'مرة واحدة يومياً، ويُفضل في الصباح',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '10 mg/j',
    warn_fr: 'Peut provoquer des œdèmes aux chevilles. La dose peut être augmentée à 10 mg si insuffisant.',
    warn_ar: 'قد يسبب تورم الكاحلين. يمكن رفع الجرعة إلى 10 مغ إذا كانت غير كافية.',
    needs_weight: false,
  }),
  t('Amlodipine', 'Angine de poitrine stable', 'adult', {
    dose_fr: '1 comprimé (5 à 10 mg)', dose_ar: 'قرص واحد (5 إلى 10 مغ)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '10 mg/j',
    needs_weight: false,
  }),
  t('Amlodipine', 'Hypertension artérielle (personnes âgées)', 'elderly', {
    dose_fr: '1 comprimé (2.5 mg) — débuter à dose réduite', dose_ar: 'قرص واحد (2.5 مغ) — تبدأ بجرعة منخفضة',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '5 mg/j (prudence)',
    warn_fr: 'Risque accru d\'hypotension. Surveiller la pression artérielle régulièrement.',
    warn_ar: 'خطر متزايد لانخفاض الضغط. مراقبة ضغط الدم بانتظام.',
    needs_weight: false,
  }),

  // Lisinopril
  t('Lisinopril', 'Hypertension artérielle', 'adult', {
    dose_fr: '1 comprimé (10 mg)', dose_ar: 'قرص واحد (10 مغ)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '40 mg/j',
    warn_fr: 'Surveiller la créatinine et le potassium. Contre-indiqué en grossesse. Toux sèche persistante possible.',
    warn_ar: 'مراقبة الكرياتينين والبوتاسيوم. يمنع في الحمل. قد يسبب سعالاً جافاً مستمراً.',
    ci: { pregnancy_alert: true, renal_alert: true },
    needs_weight: false,
  }),
  t('Lisinopril', 'Insuffisance cardiaque chronique', 'adult', {
    dose_fr: '1/2 comprimé (2.5–5 mg) en initiation', dose_ar: 'نصف قرص (2.5–5 مغ) كجرعة بداية',
    freq_fr: '1 fois par jour, à augmenter progressivement', freq_ar: 'مرة واحدة يومياً، تُزاد تدريجياً',
    dur_fr: 'Traitement continu', dur_ar: 'علاج مستمر',
    max_daily: '35 mg/j',
    warn_fr: 'Augmenter la dose progressivement sous surveillance médicale stricte.',
    warn_ar: 'زيادة الجرعة تدريجياً تحت إشراف طبي دقيق.',
    ci: { pregnancy_alert: true, renal_alert: true },
    needs_weight: false,
  }),

  // Ramipril
  t('Ramipril', 'Hypertension artérielle', 'adult', {
    dose_fr: '1 comprimé (2.5 à 5 mg)', dose_ar: 'قرص واحد (2.5 إلى 5 مغ)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '10 mg/j',
    warn_fr: 'Contre-indiqué en grossesse. Risque d\'hyperkaliémie. Surveiller la fonction rénale.',
    warn_ar: 'يمنع في الحمل. خطر ارتفاع البوتاسيوم. مراقبة وظائف الكلى.',
    ci: { pregnancy_alert: true, renal_alert: true },
    needs_weight: false,
  }),

  // Losartan
  t('Losartan', 'Hypertension artérielle', 'adult', {
    dose_fr: '1 comprimé (50 mg)', dose_ar: 'قرص واحد (50 مغ)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '100 mg/j',
    warn_fr: 'Contre-indiqué en grossesse. Surveiller la kaliémie et la créatinine.',
    warn_ar: 'يمنع في الحمل. مراقبة البوتاسيوم والكرياتينين.',
    ci: { pregnancy_alert: true, renal_alert: true },
    needs_weight: false,
  }),
  t('Losartan', 'Néphropathie diabétique (DT2)', 'adult', {
    dose_fr: '1 comprimé (50 à 100 mg)', dose_ar: 'قرص واحد (50 إلى 100 مغ)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Traitement continu long cours', dur_ar: 'علاج مستمر طويل الأمد',
    max_daily: '100 mg/j',
    warn_fr: 'Surveiller régulièrement la créatinine, l\'urée et la kaliémie.',
    warn_ar: 'مراقبة الكرياتينين واليوريا والبوتاسيوم بانتظام.',
    ci: { pregnancy_alert: true, renal_alert: true },
    needs_weight: false,
  }),

  // Atorvastatine
  t('Atorvastatine', 'Hypercholestérolémie primaire', 'adult', {
    dose_fr: '1 comprimé (20 mg)', dose_ar: 'قرص واحد (20 مغ)',
    freq_fr: '1 fois par jour, le soir', freq_ar: 'مرة واحدة يومياً في المساء',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '80 mg/j',
    warn_fr: 'Surveiller les enzymes hépatiques et les CPK. Signaler tout myalgie. Éviter le pamplemousse.',
    warn_ar: 'مراقبة إنزيمات الكبد والـ CPK. الإبلاغ عن أي آلام عضلية. تجنب الجريب فروت.',
    ci: { pregnancy_alert: true, hepatic_alert: true },
    needs_weight: false,
  }),
  t('Atorvastatine', 'Prévention cardiovasculaire secondaire', 'adult', {
    dose_fr: '1 comprimé (40 à 80 mg)', dose_ar: 'قرص واحد (40 إلى 80 مغ)',
    freq_fr: '1 fois par jour, le soir', freq_ar: 'مرة واحدة يومياً في المساء',
    dur_fr: 'Traitement au long cours indéfini', dur_ar: 'علاج طويل الأمد غير محدد المدة',
    max_daily: '80 mg/j',
    warn_fr: 'Objectif LDL < 1.0 g/L en prévention secondaire. Bilan lipidique à 6 semaines.',
    warn_ar: 'هدف LDL < 1.0 غ/ل في الوقاية الثانوية. تحليل دهون الدم بعد 6 أسابيع.',
    ci: { pregnancy_alert: true },
    needs_weight: false,
  }),

  // Simvastatine
  t('Simvastatine', 'Hypercholestérolémie', 'adult', {
    dose_fr: '1 comprimé (20 mg)', dose_ar: 'قرص واحد (20 مغ)',
    freq_fr: '1 fois par jour, le soir', freq_ar: 'مرة واحدة يومياً في المساء',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '40 mg/j',
    warn_fr: 'Risque accru de myopathie avec certains médicaments (érythromycine, fibrates). Ne pas dépasser 40 mg/j sauf avis spécialisé.',
    warn_ar: 'خطر متزايد لاعتلال العضلات مع بعض الأدوية. لا تتجاوز 40 مغ/يوم إلا بتوجيه متخصص.',
    ci: { pregnancy_alert: true },
    needs_weight: false,
  }),

  // Furosémide
  t('Furosémide', 'Hypertension artérielle', 'adult', {
    dose_fr: '1 comprimé (40 mg)', dose_ar: 'قرص واحد (40 مغ)',
    freq_fr: 'Le matin à jeun', freq_ar: 'في الصباح على الريق',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '40 mg/j (HTA)',
    warn_fr: 'Surveiller la kaliémie et la natrémie. Risque d\'hypokaliémie. Supplémenter en potassium si nécessaire.',
    warn_ar: 'مراقبة البوتاسيوم والصوديوم. خطر انخفاض البوتاسيوم. مكمل البوتاسيوم إذا لزم.',
    ci: { renal_alert: true },
    needs_weight: false,
  }),
  t('Furosémide', 'Œdème cardiaque, insuffisance cardiaque', 'adult', {
    dose_fr: '1 à 2 comprimés (40 à 80 mg)', dose_ar: 'قرص إلى قرصين (40 إلى 80 مغ)',
    freq_fr: 'Le matin, dose ajustée selon diurèse', freq_ar: 'صباحاً، الجرعة تُعدَّل حسب التبوّل',
    dur_fr: 'Traitement continu à adapter', dur_ar: 'علاج مستمر يُعدَّل حسب الحالة',
    max_daily: '250 mg/j',
    warn_fr: 'Surveiller le bilan électrolytique régulièrement. Risque de déshydratation.',
    warn_ar: 'مراقبة التوازن الكهرلي بانتظام. خطر الجفاف.',
    ci: { renal_alert: true },
    needs_weight: false,
  }),
  t('Furosémide', 'Œdème pédiatrique', 'child', {
    dose_fr: '1 à 2 mg/kg par dose', dose_ar: '1 إلى 2 مغ/كغ لكل جرعة',
    freq_fr: '1 à 2 fois par jour', freq_ar: 'مرة إلى مرتين يومياً',
    dur_fr: 'Selon réponse clinique', dur_ar: 'حسب الاستجابة السريرية',
    max_daily: '6 mg/kg/j',
    warn_fr: 'Surveiller attentivement la diurèse, l\'électrolytémie et le poids de l\'enfant.',
    warn_ar: 'مراقبة التبوّل والأملاح المعدنية ووزن الطفل بعناية.',
    needs_weight: true,
  }),

  // Hydrochlorothiazide
  t('Hydrochlorothiazide', 'Hypertension artérielle', 'adult', {
    dose_fr: '1/2 comprimé (12.5 mg)', dose_ar: 'نصف قرص (12.5 مغ)',
    freq_fr: '1 fois par jour, le matin', freq_ar: 'مرة واحدة يومياً في الصباح',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '25 mg/j',
    warn_fr: 'Surveiller la kaliémie, la glycémie et l\'uricémie. Boire suffisamment d\'eau.',
    warn_ar: 'مراقبة البوتاسيوم وسكر الدم وحمض البول. شرب كميات كافية من الماء.',
    ci: { renal_alert: true, pregnancy_alert: false },
    needs_weight: false,
  }),

  // Bisoprolol
  t('Bisoprolol', 'Hypertension artérielle, Insuffisance cardiaque stable', 'adult', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)',
    freq_fr: '1 fois par jour, le matin', freq_ar: 'مرة واحدة يومياً في الصباح',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '10 mg/j',
    warn_fr: 'Débuter à 1.25 mg en ICC et augmenter progressivement. Ne pas arrêter brutalement.',
    warn_ar: 'ابدأ بـ 1.25 مغ في قصور القلب وزدها تدريجياً. لا توقف العلاج فجأة.',
    needs_weight: false,
  }),

  // Verapamil
  t('Vérapamil', 'Angine de poitrine, Tachycardie supraventriculaire', 'adult', {
    dose_fr: '1 comprimé (80 mg)', dose_ar: 'قرص واحد (80 مغ)',
    freq_fr: '3 fois par jour', freq_ar: '3 مرات يومياً',
    dur_fr: 'Traitement au long cours selon indication', dur_ar: 'علاج طويل الأمد حسب الحالة',
    max_daily: '480 mg/j',
    warn_fr: 'Ne pas associer aux β-bloquants (risque de bloc auriculo-ventriculaire). Constipation possible.',
    warn_ar: 'لا يُدمج مع مضادات بيتا (خطر انحصار أذيني بطيني). قد يسبب إمساكاً.',
    needs_weight: false,
  }),

  // Digoxine
  t('Digoxine', 'Insuffisance cardiaque, Fibrillation auriculaire', 'adult', {
    dose_fr: '1 comprimé (0.25 mg)', dose_ar: 'قرص واحد (0.25 مغ)',
    freq_fr: '1 fois par jour, ajuster selon taux sérique', freq_ar: 'مرة واحدة يومياً، تُعدَّل حسب المستوى في الدم',
    dur_fr: 'Traitement continu', dur_ar: 'علاج مستمر',
    max_daily: '0.25 mg/j (sauf surcharge)',
    warn_fr: 'Fenêtre thérapeutique étroite. Surveiller digoxinémie (0.5–2 ng/mL), ECG, et kaliémie. Toxicité = N/V/bradycardie.',
    warn_ar: 'نافذة علاجية ضيقة. مراقبة مستوى الديجوكسين (0.5–2 نانوغ/مل) وتخطيط القلب والبوتاسيوم.',
    ci: { renal_alert: true },
    needs_weight: false,
  }),

  // Nitroglycérine
  t('Trinitrine (nitroglycérine)', 'Crise d\'angine de poitrine (traitement de la crise)', 'adult', {
    dose_fr: '1 spray sublingual (0.4 mg) ou 1 comprimé sublingual (0.5 mg)', dose_ar: 'رشة واحدة تحت اللسان (0.4 مغ) أو قرص واحد تحت اللسان (0.5 مغ)',
    freq_fr: 'À renouveler si douleur non cédée à 5 min (max 3 prises). Appeler le 15 si persistance.', freq_ar: 'يُكرَّر إذا لم تتحسن الحالة خلال 5 دقائق (أقصى 3 جرعات). الاتصال بالمستعجلات إذا استمر الألم.',
    dur_fr: 'À la demande (crise uniquement)', dur_ar: 'عند الطلب (عند الأزمة فقط)',
    warn_fr: 'Attention à l\'hypotension orthostatique. Ne pas avaler — à laisser fondre sous la langue.',
    warn_ar: 'الانتباه من انخفاض الضغط عند الوقوف. لا يُبلع — يُترك تحت اللسان حتى يذوب.',
    needs_weight: false,
  }),

  // Aspirin (cardiovasculaire)
  t('Acide acétylsalicylique', 'Prévention secondaire cardiovasculaire (anti-agrégant)', 'adult', {
    dose_fr: '1 comprimé (75 à 100 mg)', dose_ar: 'قرص واحد (75 إلى 100 مغ)',
    freq_fr: '1 fois par jour, au cours d\'un repas', freq_ar: 'مرة واحدة يومياً أثناء الأكل',
    dur_fr: 'Traitement au long cours indéfini', dur_ar: 'علاج طويل الأمد غير محدد المدة',
    warn_fr: 'Risque hémorragique digestif. Protecteur gastrique recommandé si antécédent ulcéreux.',
    warn_ar: 'خطر نزيف هضمي. يُنصح بحماية المعدة في حالة تاريخ قرحة.',
    ci: { pregnancy_alert: true, renal_alert: false },
    needs_weight: false,
  }),

  // Clopidogrel
  t('Clopidogrel', 'Prévention thrombotique (SCA, AVC ischémique, artériopathie)', 'adult', {
    dose_fr: '1 comprimé (75 mg)', dose_ar: 'قرص واحد (75 مغ)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Traitement au long cours ou selon la durée du stent', dur_ar: 'علاج طويل الأمد أو حسب مدة الدعامة',
    warn_fr: 'Risque hémorragique. Informer systématiquement médecins et chirurgiens.',
    warn_ar: 'خطر نزيف. يجب إعلام الأطباء والجراحين دائماً.',
    ci: { pregnancy_alert: false },
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SYSTEME NERVEUX
  // ═══════════════════════════════════════════════════════════════════════════

  // Paracétamol (multiples)
  t('Paracétamol', 'Douleurs légères à modérées, Fièvre', 'adult', {
    dose_fr: '1 à 2 comprimés (500 à 1000 mg)', dose_ar: 'قرص إلى قرصين (500 إلى 1000 مغ)',
    freq_fr: 'Toutes les 6 heures si besoin (max 4 g/j)', freq_ar: 'كل 6 ساعات عند الحاجة (أقصى 4 غ/يوم)',
    dur_fr: '3 à 5 jours', dur_ar: '3 إلى 5 أيام',
    max_daily: '4 g/j',
    warn_fr: 'Risque d\'hépatotoxicité en cas de surdosage. Attention aux associations (autres spécialités à base de paracétamol, alcool).',
    warn_ar: 'خطر تأثير سام على الكبد عند الإفراط في الجرعة. الانتباه للتركيبات مع أدوية أخرى تحتوي على باراسيتامول والكحول.',
    ci: { hepatic_alert: true },
    needs_weight: false,
  }),
  t('Paracétamol', 'Fièvre et douleurs chez l\'enfant', 'child', {
    dose_fr: '15 mg/kg par prise', dose_ar: '15 مغ/كغ لكل جرعة',
    freq_fr: 'Toutes les 6 heures (max 60 mg/kg/j, sans dépasser 4 g/j)', freq_ar: 'كل 6 ساعات (أقصى 60 مغ/كغ/يوم، دون تجاوز 4 غ/يوم)',
    dur_fr: '3 jours (fièvre), 5 jours (douleur)', dur_ar: '3 أيام (حمى)، 5 أيام (ألم)',
    max_daily: '60 mg/kg/j',
    warn_fr: 'Utiliser un dispositif doseur adapté au poids. Ne pas associer à un autre paracétamol.',
    warn_ar: 'استخدام أداة قياس مناسبة للوزن. لا تدمج مع باراسيتامول آخر.',
    ci: { hepatic_alert: true },
    needs_weight: true,
  }),
  t('Paracétamol', 'Douleurs légères à modérées (femme enceinte)', 'pregnant', {
    dose_fr: '1 comprimé (1000 mg)', dose_ar: 'قرص واحد (1000 مغ)',
    freq_fr: 'Toutes les 6 heures si besoin (max 4 g/j)', freq_ar: 'كل 6 ساعات عند الحاجة (أقصى 4 غ/يوم)',
    dur_fr: 'Durée la plus courte possible', dur_ar: 'أقصر مدة ممكنة',
    max_daily: '4 g/j',
    warn_fr: 'Antalgique de choix pendant la grossesse. Utiliser à la dose efficace minimale sur la durée la plus courte.',
    warn_ar: 'مسكن الاختيار خلال الحمل. استخدامه بأقل جرعة فعالة وأقصر مدة ممكنة.',
    needs_weight: false,
  }),
  t('Paracétamol', 'Douleurs et fièvre (personne âgée)', 'elderly', {
    dose_fr: '1 comprimé (500 à 1000 mg)', dose_ar: 'قرص واحد (500 إلى 1000 مغ)',
    freq_fr: 'Toutes les 6 à 8 heures si besoin', freq_ar: 'كل 6 إلى 8 ساعات عند الحاجة',
    dur_fr: '3 à 5 jours', dur_ar: '3 إلى 5 أيام',
    max_daily: '3 g/j (prudence)',
    warn_fr: 'Réduire la dose maximale à 3 g/j en cas d\'insuffisance hépatique ou rénale. Antalgique de première intention chez le sujet âgé.',
    warn_ar: 'تخفيض الجرعة القصوى إلى 3 غ/يوم في حالة قصور الكبد أو الكلى. المسكن الأول للشيخوخة.',
    ci: { hepatic_alert: true, renal_alert: true },
    needs_weight: false,
  }),

  // Ibuprofène
  t('Ibuprofène', 'Douleurs légères à modérées, fièvre, dysménorrhées', 'adult', {
    dose_fr: '1 comprimé (400 mg)', dose_ar: 'قرص واحد (400 مغ)',
    freq_fr: 'Toutes les 6 à 8 heures au cours des repas (max 1200 mg/j en automédication)', freq_ar: 'كل 6 إلى 8 ساعات أثناء الأكل (أقصى 1200 مغ/يوم)',
    dur_fr: '3 jours (fièvre), 5 jours (douleur)', dur_ar: '3 أيام (حمى)، 5 أيام (ألم)',
    max_daily: '2400 mg/j (prescrit)',
    warn_fr: 'À prendre avec de la nourriture. Contre-indiqué dès le 5ème mois de grossesse. Risque d\'ulcère gastrique.',
    warn_ar: 'يُؤخذ مع الطعام. يمنع ابتداءً من الشهر الخامس للحمل. خطر قرحة المعدة.',
    ci: { pregnancy_alert: true, renal_alert: true },
    needs_weight: false,
  }),
  t('Ibuprofène', 'Fièvre et douleurs chez l\'enfant (≥ 6 mois)', 'child', {
    dose_fr: '5 à 10 mg/kg par prise (forme suspension)', dose_ar: '5 إلى 10 مغ/كغ لكل جرعة (معلق)',
    freq_fr: 'Toutes les 6 à 8 heures (max 30 mg/kg/j)', freq_ar: 'كل 6 إلى 8 ساعات (أقصى 30 مغ/كغ/يوم)',
    dur_fr: '3 jours', dur_ar: '3 أيام',
    max_daily: '30 mg/kg/j',
    warn_fr: 'Ne pas utiliser avant 6 mois. À prendre pendant les repas. Hydratation correcte indispensable.',
    warn_ar: 'لا يُستخدم قبل 6 أشهر. يُؤخذ أثناء الوجبات. الترطيب الكافي ضروري.',
    min_age: 0.5,
    ci: { renal_alert: true },
    needs_weight: true,
  }),

  // Diclofénac
  t('Diclofénac', 'Rhumatismes, douleurs articulaires, poussées articulaires', 'adult', {
    dose_fr: '1 comprimé (50 mg)', dose_ar: 'قرص واحد (50 مغ)',
    freq_fr: '2 à 3 fois par jour au cours des repas', freq_ar: 'مرتين إلى 3 مرات يومياً أثناء الوجبات',
    dur_fr: '5 à 7 jours (poussée aiguë)', dur_ar: '5 إلى 7 أيام (النوبة الحادة)',
    max_daily: '150 mg/j',
    warn_fr: 'Risque cardiovasculaire accru. Éviter en cas d\'antécédent d\'infarctus ou d\'AVC. Contre-indiqué dès 6ème mois de grossesse.',
    warn_ar: 'خطر قلبي وعائي متزايد. تجنب في حالة تاريخ احتشاء أو سكتة دماغية. يمنع من الشهر السادس للحمل.',
    ci: { pregnancy_alert: true, renal_alert: true },
    needs_weight: false,
  }),

  // Naproxène
  t('Naproxène', 'Arthrite, lombalgie aiguë, dysménorrhée', 'adult', {
    dose_fr: '1 comprimé (500 mg)', dose_ar: 'قرص واحد (500 مغ)',
    freq_fr: '2 fois par jour au cours des repas', freq_ar: 'مرتين يومياً أثناء الوجبات',
    dur_fr: '5 à 7 jours', dur_ar: '5 إلى 7 أيام',
    max_daily: '1250 mg/j',
    warn_fr: 'Contre-indiqué dès le 5ème mois de grossesse. Risque cardiovasculaire et gastro-intestinal.',
    warn_ar: 'يمنع من الشهر الخامس للحمل. خطر قلبي وعائي وهضمي.',
    ci: { pregnancy_alert: true, renal_alert: true },
    needs_weight: false,
  }),

  // Tramadol
  t('Tramadol', 'Douleurs modérées à sévères', 'adult', {
    dose_fr: '1 gélule (50 mg)', dose_ar: 'كبسولة واحدة (50 مغ)',
    freq_fr: 'Toutes les 4 à 6 heures si besoin', freq_ar: 'كل 4 إلى 6 ساعات عند الحاجة',
    dur_fr: 'Durée minimale — réévaluer régulièrement', dur_ar: 'أقصر مدة ممكنة — إعادة تقييم منتظمة',
    max_daily: '400 mg/j',
    warn_fr: 'Risque de dépendance. Prudence en cas de dépression respiratoire. Éviter l\'alcool. Pas chez l\'épileptique sans précaution.',
    warn_ar: 'خطر الإدمان. الحذر في حالة قصور تنفسي. تجنب الكحول. حذر عند مرضى الصرع.',
    ci: { pregnancy_alert: true, renal_alert: true, hepatic_alert: true },
    needs_weight: false,
  }),
  t('Tramadol', 'Douleurs modérées à sévères (personnes âgées)', 'elderly', {
    dose_fr: '1 gélule (50 mg)', dose_ar: 'كبسولة واحدة (50 مغ)',
    freq_fr: 'Toutes les 6 heures, dose réduite', freq_ar: 'كل 6 ساعات، جرعة مخفضة',
    dur_fr: 'Durée minimale', dur_ar: 'أقصر مدة ممكنة',
    max_daily: '300 mg/j',
    warn_fr: 'Risque de chute et de confusion. Débuter à faible dose. Surveiller la conscience.',
    warn_ar: 'خطر السقوط والتشوش. ابدأ بجرعة منخفضة. مراقبة الوعي.',
    needs_weight: false,
  }),

  // Codéine
  t('Codéine', 'Douleurs modérées, Toux sèche rebelle', 'adult', {
    dose_fr: '1 comprimé (30 mg)', dose_ar: 'قرص واحد (30 مغ)',
    freq_fr: 'Toutes les 4 à 6 heures si besoin', freq_ar: 'كل 4 إلى 6 ساعات عند الحاجة',
    dur_fr: '3 à 5 jours maximum', dur_ar: '3 إلى 5 أيام كحد أقصى',
    max_daily: '240 mg/j',
    warn_fr: 'Contre-indiqué chez l\'enfant < 12 ans et allaitement. Risque de dépression respiratoire.',
    warn_ar: 'يمنع عند الأطفال دون 12 سنة وأثناء الرضاعة. خطر اضطراب التنفس.',
    ci: { pregnancy_alert: false, renal_alert: true },
    min_age: 12,
    needs_weight: false,
  }),

  // Amitriptyline
  t('Amitriptyline', 'Dépression, Douleurs neuropathiques', 'adult', {
    dose_fr: '1 comprimé (25 mg) au coucher', dose_ar: 'قرص واحد (25 مغ) عند النوم',
    freq_fr: '1 fois par jour le soir, augmentation progressive', freq_ar: 'مرة واحدة مساءً، زيادة تدريجية',
    dur_fr: 'Minimum 6 mois pour dépression', dur_ar: '6 أشهر على الأقل للاكتئاب',
    max_daily: '150 mg/j',
    warn_fr: 'Risque anticholinergique (sécheresse buccale, constipation, rétention urinaire). Délai d\'action 2-4 semaines. Suivi psychiatrique recommandé.',
    warn_ar: 'تأثيرات مضادة للكولين (جفاف الفم، إمساك، احتباس بول). مفعوله يبدأ بعد 2-4 أسابيع. يُنصح بالمتابعة النفسية.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),

  // Fluoxétine
  t('Fluoxétine', 'Dépression, TOC, Boulimie', 'adult', {
    dose_fr: '1 gélule (20 mg)', dose_ar: 'كبسولة واحدة (20 مغ)',
    freq_fr: '1 fois par jour, le matin de préférence', freq_ar: 'مرة واحدة يومياً، ويُفضل في الصباح',
    dur_fr: 'Minimum 6 mois pour dépression', dur_ar: '6 أشهر على الأقل للاكتئاب',
    max_daily: '80 mg/j',
    warn_fr: 'Délai d\'action 2-4 semaines. Risque de syndrome sérotoninergique si associé à des IMAO. Suivi psychiatrique.',
    warn_ar: 'مفعوله يبدأ بعد 2-4 أسابيع. خطر متلازمة السيروتونين إذا أُدمج مع مثبطات MAO.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),
  t('Fluoxétine', 'Dépression de l\'enfant et adolescent (> 8 ans)', 'child', {
    dose_fr: '1 comprimé (10 mg), augmenter à 20 mg si besoin', dose_ar: 'قرص واحد (10 مغ)، رفعه إلى 20 مغ إذا لزم',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Selon évaluation psychiatrique', dur_ar: 'حسب التقييم النفسي',
    max_daily: '20 mg/j',
    warn_fr: 'Uniquement sous supervision psychiatrique. Surveillance des idées suicidaires dans les premières semaines.',
    warn_ar: 'فقط تحت إشراف نفسي. مراقبة أفكار الانتحار في الأسابيع الأولى.',
    min_age: 8,
    needs_weight: false,
  }),

  // Sertraline
  t('Sertraline', 'Dépression, Trouble panique, TOC, PTSD', 'adult', {
    dose_fr: '1 comprimé (50 mg)', dose_ar: 'قرص واحد (50 مغ)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Minimum 6 mois (dépression)', dur_ar: '6 أشهر على الأقل (اكتئاب)',
    max_daily: '200 mg/j',
    warn_fr: 'Délai d\'action 2-4 semaines. Éviter l\'arrêt brutal. Suivi psychiatrique indispensable.',
    warn_ar: 'مفعوله يبدأ بعد 2-4 أسابيع. تجنب التوقف المفاجئ. المتابعة النفسية ضرورية.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),

  // Lorazépam
  t('Lorazépam', 'Anxiété aiguë, Insomnie transitoire', 'adult', {
    dose_fr: '1 comprimé (1 mg) au coucher', dose_ar: 'قرص واحد (1 مغ) عند النوم',
    freq_fr: '1 fois par jour ou selon crise anxieuse', freq_ar: 'مرة واحدة يومياً أو حسب نوبة القلق',
    dur_fr: '7 à 14 jours maximum (ne pas prolonger)', dur_ar: '7 إلى 14 يوماً كحد أقصى (لا تطيل)',
    max_daily: '4 mg/j',
    warn_fr: 'Risque de dépendance et de rebond à l\'arrêt. Somnolence, risque de chute. Éviter l\'alcool.',
    warn_ar: 'خطر الإدمان والانتكاس عند الإيقاف. نعاس، خطر السقوط. تجنب الكحول.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),

  // Diazépam
  t('Diazépam', 'Anxiété généralisée, Contractures musculaires', 'adult', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)',
    freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً',
    dur_fr: '7 à 14 jours maximum', dur_ar: '7 إلى 14 يوماً كحد أقصى',
    max_daily: '30 mg/j',
    warn_fr: 'Fort potentiel de dépendance. Ne pas associer à l\'alcool. Réduire progressivement à l\'arrêt.',
    warn_ar: 'خطر إدمان مرتفع. لا يُدمج مع الكحول. تخفيض تدريجي عند الإيقاف.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),
  t('Diazépam', 'État de mal épileptique — voie rectale', 'child', {
    dose_fr: '0.5 mg/kg par voie rectale (ampoule rectale)', dose_ar: '0.5 مغ/كغ عبر المستقيم',
    freq_fr: 'Dose unique (urgence)', freq_ar: 'جرعة واحدة (طوارئ)',
    dur_fr: 'Usage unique en urgence', dur_ar: 'استخدام فردي في الطوارئ',
    max_daily: '10 mg/dose',
    warn_fr: 'Usage d\'urgence uniquement. Surveiller la respiration. Appeler le SAMU.',
    warn_ar: 'للطوارئ فقط. مراقبة التنفس. الاتصال بالإسعاف.',
    needs_weight: true,
  }),

  // Alprazolam
  t('Alprazolam', 'Anxiété généralisée, Attaques de panique', 'adult', {
    dose_fr: '1/2 à 1 comprimé (0.25 à 0.5 mg)', dose_ar: 'نصف إلى قرص واحد (0.25 إلى 0.5 مغ)',
    freq_fr: '3 fois par jour', freq_ar: '3 مرات يومياً',
    dur_fr: '7 à 14 jours maximum', dur_ar: '7 إلى 14 يوماً كحد أقصى',
    max_daily: '4 mg/j',
    warn_fr: 'Risque de pharmacodépendance. Réduction progressive obligatoire à l\'arrêt. Somnolence, risque de chute.',
    warn_ar: 'خطر الإدمان الدوائي. التوقف التدريجي إلزامي. نعاس وخطر السقوط.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),

  // Phénobarbital
  t('Phénobarbital', 'Épilepsie partielle et généralisée', 'adult', {
    dose_fr: '1 à 3 comprimés (30 à 90 mg) au coucher', dose_ar: 'قرص إلى 3 أقراص (30 إلى 90 مغ) عند النوم',
    freq_fr: '1 fois par jour le soir', freq_ar: 'مرة واحدة مساءً',
    dur_fr: 'Traitement au long cours (min 2 ans sans crise avant réévaluation)', dur_ar: 'علاج طويل الأمد (سنتان على الأقل بدون نوبة قبل إعادة التقييم)',
    max_daily: '200 mg/j',
    warn_fr: 'Surveillance du taux sérique. Inducteur enzymatique puissant — nombreuses interactions. Ne jamais arrêter brutalement.',
    warn_ar: 'مراقبة المستوى في الدم. محفز إنزيمي قوي — تفاعلات دوائية كثيرة. لا توقف فجأة أبداً.',
    ci: { pregnancy_alert: true, hepatic_alert: true },
    needs_weight: false,
  }),
  t('Phénobarbital', 'Épilepsie chez l\'enfant', 'child', {
    dose_fr: '3 à 4 mg/kg/j', dose_ar: '3 إلى 4 مغ/كغ/يوم',
    freq_fr: '1 fois par jour le soir', freq_ar: 'مرة واحدة مساءً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '200 mg/j',
    warn_fr: 'Surveillance du taux sérique (15-40 mg/L). Surveiller la croissance et le développement cognitif.',
    warn_ar: 'مراقبة المستوى في الدم (15-40 مغ/ل). متابعة النمو والتطور المعرفي.',
    needs_weight: true,
  }),

  // Valproate
  t('Acide valproïque', 'Épilepsie, Manie bipolaire', 'adult', {
    dose_fr: '500 mg à 1500 mg/j en 2 à 3 prises', dose_ar: '500 مغ إلى 1500 مغ/يوم في 2 إلى 3 جرعات',
    freq_fr: '2 à 3 fois par jour au cours des repas', freq_ar: 'مرتين إلى 3 مرات يومياً أثناء الوجبات',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '2500 mg/j',
    warn_fr: 'FORMELLEMENT CONTRE-INDIQUÉ en grossesse (tératogène majeur). Surveillance transaminases et ammoniémie. Taux sérique cible 50-100 mg/L.',
    warn_ar: 'يُمنع تماماً خلال الحمل (خطر تشوهات خلقية). مراقبة الإنزيمات الكبدية والأمونيا في الدم.',
    ci: { pregnancy_alert: true, hepatic_alert: true },
    needs_weight: false,
  }),
  t('Acide valproïque', 'Épilepsie chez l\'enfant', 'child', {
    dose_fr: '20 à 30 mg/kg/j', dose_ar: '20 إلى 30 مغ/كغ/يوم',
    freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '40 mg/kg/j',
    warn_fr: 'Risque hépatotoxicité accru avant 3 ans, surtout en polythérapie. Surveillance enzymes hépatiques rapprochée.',
    warn_ar: 'خطر تأثير سام على الكبد مرتفع قبل 3 سنوات، خاصة مع علاجات متعددة. مراقبة دقيقة لإنزيمات الكبد.',
    ci: { hepatic_alert: true },
    needs_weight: true,
  }),

  // Lévétiracétam
  t('Lévétiracétam', 'Épilepsie partielle, Crises myocloniques', 'adult', {
    dose_fr: '500 mg à 1500 mg', dose_ar: '500 مغ إلى 1500 مغ',
    freq_fr: '2 fois par jour', freq_ar: 'مرتين يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '3000 mg/j',
    warn_fr: 'Bonne tolérance générale. Effets comportementaux possibles (irritabilité, agressivité). Adapter en insuffisance rénale.',
    warn_ar: 'تحمل عام جيد. تأثيرات سلوكية محتملة (تهيج، عدوانية). تعديل الجرعة في القصور الكلوي.',
    ci: { renal_alert: true },
    needs_weight: false,
  }),

  // Carbamazépine
  t('Carbamazépine', 'Épilepsie focale, Névralgie du trijumeau', 'adult', {
    dose_fr: '1 comprimé (200 mg)', dose_ar: 'قرص واحد (200 مغ)',
    freq_fr: '2 fois par jour, à augmenter progressivement', freq_ar: 'مرتين يومياً، تُرفع تدريجياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '1600 mg/j',
    warn_fr: 'Inducteur enzymatique puissant. Surveillance NFS et transaminases. Taux sérique cible 4-12 mg/L. Risque d\'aplasie médullaire.',
    warn_ar: 'محفز إنزيمي قوي. مراقبة تعداد الدم والإنزيمات الكبدية. خطر قصور نقي العظم.',
    ci: { pregnancy_alert: true, hepatic_alert: true },
    needs_weight: false,
  }),

  // Chlorpromazine
  t('Chlorpromazine', 'Schizophrénie, Agitation psychomotrice', 'adult', {
    dose_fr: '1 comprimé (25 à 100 mg)', dose_ar: 'قرص واحد (25 إلى 100 مغ)',
    freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً',
    dur_fr: 'Traitement au long cours sous supervision psychiatrique', dur_ar: 'علاج طويل الأمد تحت إشراف نفسي',
    max_daily: '300 mg/j',
    warn_fr: 'Prudence en cas de chaleur. Risque de syndrome malin des neuroleptiques. Photosensibilisation.',
    warn_ar: 'حذر في الحر. خطر المتلازمة الخبيثة للمضادات الذهانية. حساسية للضوء.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),

  // Halopéridol
  t('Halopéridol', 'Schizophrénie, Agitation aigüe', 'adult', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)',
    freq_fr: '2 fois par jour en phase aiguë', freq_ar: 'مرتين يومياً في المرحلة الحادة',
    dur_fr: 'Selon évaluation psychiatrique', dur_ar: 'حسب التقييم النفسي',
    max_daily: '20 mg/j',
    warn_fr: 'Risque d\'effets extrapyramidaux (parkinsonisme iatrogène). Syndrome malin possible. Allongement QT.',
    warn_ar: 'خطر آثار خارج هرمية (باركنسونية دوائية). متلازمة خبيثة محتملة. إطالة QT.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),

  // Zolpidem
  t('Zolpidem', 'Insomnie transitoire et de courte durée', 'adult', {
    dose_fr: '1 comprimé (10 mg) au coucher', dose_ar: 'قرص واحد (10 مغ) قبل النوم',
    freq_fr: '1 fois par jour, immédiatement avant le coucher', freq_ar: 'مرة واحدة يومياً، مباشرة قبل النوم',
    dur_fr: 'Maximum 4 semaines (2-3 semaines de préférence)', dur_ar: '4 أسابيع كحد أقصى (ويُفضل 2-3 أسابيع)',
    max_daily: '10 mg/j',
    warn_fr: 'Ne pas conduire le lendemain matin. Risque de comportements automatiques nocturnes. Éviter alcool.',
    warn_ar: 'تجنب قيادة السيارة صباح اليوم التالي. خطر أنشطة آلية ليلية. تجنب الكحول.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),
  t('Zolpidem', 'Insomnie chez la personne âgée', 'elderly', {
    dose_fr: '1 comprimé (5 mg) au coucher', dose_ar: 'قرص واحد (5 مغ) قبل النوم',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Maximum 2 semaines', dur_ar: 'أسبوعان كحد أقصى',
    max_daily: '5 mg/j',
    warn_fr: 'Réduire à moitié de la dose adulte. Risque élevé de chute nocturne. Somnolence diurne.',
    warn_ar: 'تخفيض نصف جرعة البالغين. خطر مرتفع للسقوط ليلاً. نعاس نهاري.',
    needs_weight: false,
  }),

  // Morphine
  t('Morphine', 'Douleurs sévères (cancer, post-opératoire)', 'adult', {
    dose_fr: '10 à 20 mg selon douleur', dose_ar: '10 إلى 20 مغ حسب شدة الألم',
    freq_fr: 'Toutes les 4 heures (libération immédiate)', freq_ar: 'كل 4 ساعات (تحرير فوري)',
    dur_fr: 'Selon évaluation de la douleur', dur_ar: 'حسب تقييم الألم',
    max_daily: 'Titration individuelle',
    warn_fr: 'Ordonnance sécurisée requise. Risque de dépression respiratoire. Antidote: Naloxone disponible.',
    warn_ar: 'وصفة طبية مؤمّنة مطلوبة. خطر تثبيط التنفس. الترياق: نالوكسون متاح.',
    ci: { renal_alert: true },
    min_age: 18,
    needs_weight: false,
  }),

  // Sumatriptan
  t('Sumatriptan', 'Migraine avec ou sans aura (crise)', 'adult', {
    dose_fr: '1 comprimé (50 mg) dès le début de la crise', dose_ar: 'قرص واحد (50 مغ) عند بداية نوبة الصداع',
    freq_fr: 'Dose unique, répétable après 2h si non soulagé (max 2 prises/crise)', freq_ar: 'جرعة واحدة، تُكرَّر بعد ساعتين إذا لم يتحسن (أقصى جرعتين/نوبة)',
    dur_fr: 'Traitement de la crise uniquement', dur_ar: 'علاج النوبة فقط',
    max_daily: '300 mg/j',
    warn_fr: 'Ne pas prendre en prévention. Contre-indiqué en cas d\'antécédent cardiovasculaire. Risque vasospasme coronarien.',
    warn_ar: 'لا يُستخدم للوقاية. يمنع في حالة تاريخ قلبي وعائي. خطر تشنج الشرايين التاجية.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ANTI-INFECTIEUX GENERAUX
  // ═══════════════════════════════════════════════════════════════════════════

  // Amoxicilline
  t('Amoxicilline', 'Angine bactérienne, sinusite, otite moyenne aiguë', 'adult', {
    dose_fr: '1 gélule (500 mg)', dose_ar: 'كبسولة واحدة (500 مغ)',
    freq_fr: '3 fois par jour (toutes les 8h)', freq_ar: '3 مرات يومياً (كل 8 ساعات)',
    dur_fr: '5 à 7 jours', dur_ar: '5 إلى 7 أيام',
    max_daily: '3 g/j',
    warn_fr: 'Prendre de préférence au début des repas. Respecter la durée même si amélioration.',
    warn_ar: 'يُفضل تناوله في بداية الوجبات. احترام مدة العلاج حتى مع التحسن.',
    needs_weight: false,
  }),
  t('Amoxicilline', 'Otite, angine, pneumonie légère chez l\'enfant', 'child', {
    dose_fr: '50 mg/kg/j en 3 prises (suspension)', dose_ar: '50 مغ/كغ/يوم في 3 جرعات (معلق)',
    freq_fr: 'Toutes les 8 heures', freq_ar: 'كل 8 ساعات',
    dur_fr: '5 à 10 jours selon infection', dur_ar: '5 إلى 10 أيام حسب العدوى',
    max_daily: '3 g/j',
    warn_fr: 'Agiter le flacon avant utilisation. Conserver au réfrigérateur après reconstitution.',
    warn_ar: 'رج الزجاجة قبل الاستخدام. حفظ في الثلاجة بعد التحضير.',
    needs_weight: true,
  }),
  t('Amoxicilline', 'Pneumonie communautaire légère à modérée', 'adult', {
    dose_fr: '1 g (2 gélules de 500 mg)', dose_ar: 'قرص واحد غرام (2 كبسولة 500 مغ)',
    freq_fr: '3 fois par jour', freq_ar: '3 مرات يومياً',
    dur_fr: '7 jours', dur_ar: '7 أيام',
    max_daily: '3 g/j',
    needs_weight: false,
  }),

  // Amoxicilline + Acide clavulanique
  t('Amoxicilline + Acide clavulanique', 'Sinusite, Otite récidivante, Pneumonie', 'adult', {
    dose_fr: '1 comprimé (1 g/125 mg)', dose_ar: 'قرص واحد (1 غ/125 مغ)',
    freq_fr: '2 fois par jour au cours des repas', freq_ar: 'مرتين يومياً أثناء الوجبات',
    dur_fr: '5 à 7 jours', dur_ar: '5 إلى 7 أيام',
    max_daily: '3 g amoxicilline/j',
    warn_fr: 'Prendre impérativement au cours du repas pour réduire les effets digestifs. Risque de diarrhées.',
    warn_ar: 'يجب تناوله أثناء الوجبة لتقليل الآثار الهضمية. خطر الإسهال.',
    needs_weight: false,
  }),
  t('Amoxicilline + Acide clavulanique', 'Otite et infections ORL enfant', 'child', {
    dose_fr: '40 mg/kg/j d\'amoxicilline (suspension)', dose_ar: '40 مغ/كغ/يوم من الأموكسيسيلين (معلق)',
    freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً',
    dur_fr: '5 à 10 jours', dur_ar: '5 إلى 10 أيام',
    needs_weight: true,
  }),

  // Clarithromycine
  t('Clarithromycine', 'Infections respiratoires, ORL, cutanées et des tissus mous à germes sensibles', 'adult', {
    dose_fr: '1 comprimé (250 mg), jusqu’à 500 mg si infection sévère', dose_ar: 'قرص واحد (250 مغ)، حتى 500 مغ في العدوى الشديدة',
    freq_fr: '2 fois par jour (toutes les 12 heures)', freq_ar: 'مرتين يومياً (كل 12 ساعة)',
    dur_fr: '6 à 14 jours selon le site et la gravité', dur_ar: 'من 6 إلى 14 يوماً حسب موضع العدوى وشدتها',
    max_daily: '1 g/j',
    warn_fr: 'Vérifier les interactions CYP3A4 et le risque d’allongement du QT. Contre-indiquée avec simvastatine/lovastatine et colchicine. Si clairance de la créatinine < 30 mL/min : réduire la dose de moitié et ne pas dépasser 14 jours.',
    warn_ar: 'التحقق من تداخلات CYP3A4 وخطر إطالة QT. يمنع مع سيمفاستاتين/لوفاستاتين والكولشيسين. إذا كانت تصفية الكرياتينين أقل من 30 مل/دقيقة تخفض الجرعة إلى النصف ولا تتجاوز المدة 14 يوماً.',
    ci: { pregnancy_alert: true, renal_alert: true, hepatic_alert: true },
    needs_weight: false,
    ref: 'RCP Clarithromycine 500 mg — eMC, sections 4.2 à 4.5',
  }),
  t('Clarithromycine', 'Infections ORL, respiratoires ou cutanées à germes sensibles chez l’enfant', 'child', {
    dose_fr: '7,5 mg/kg par prise (suspension buvable)', dose_ar: '7.5 مغ/كغ في الجرعة (معلق فموي)',
    freq_fr: '2 fois par jour (toutes les 12 heures)', freq_ar: 'مرتين يومياً (كل 12 ساعة)',
    dur_fr: '5 à 10 jours selon l’infection', dur_ar: 'من 5 إلى 10 أيام حسب العدوى',
    max_daily: '1 g/j (500 mg maximum par prise)',
    warn_fr: 'Réservée à la suspension chez l’enfant de 6 mois à 12 ans. Si clairance de la créatinine < 30 mL/min : 7,5 mg/kg une fois par jour, sans dépasser 14 jours. Vérifier les interactions et le QT.',
    warn_ar: 'يستعمل المعلق للأطفال من 6 أشهر إلى 12 سنة. إذا كانت تصفية الكرياتينين أقل من 30 مل/دقيقة: 7.5 مغ/كغ مرة يومياً دون تجاوز 14 يوماً. التحقق من التداخلات وQT.',
    ci: { pregnancy_alert: false, renal_alert: true, hepatic_alert: true },
    min_age: 0.5,
    max_age: 12,
    needs_weight: true,
    ref: 'RCP Clarithromycine 125 mg/5 mL — eMC, sections 4.2 à 4.5',
  }),

  // Azithromycine
  t('Azithromycine', 'Infections respiratoires, Chlamydia, Angine Streptococcique', 'adult', {
    dose_fr: '1 comprimé (500 mg)', dose_ar: 'قرص واحد (500 مغ)',
    freq_fr: '1 fois par jour à jeun', freq_ar: 'مرة واحدة يومياً على الريق',
    dur_fr: '3 jours (infections respiratoires)', dur_ar: '3 أيام (عدوى تنفسية)',
    max_daily: '500 mg/j',
    warn_fr: 'Risque d\'allongement QT. Interactions avec anticoagulants. Prise à jeun ou 2h après repas.',
    warn_ar: 'خطر إطالة QT. تفاعلات مع مضادات التخثر. يُؤخذ على الريق أو بعد ساعتين من الأكل.',
    ci: { hepatic_alert: true },
    needs_weight: false,
  }),
  t('Azithromycine', 'Infections ORL et pulmonaires enfant', 'child', {
    dose_fr: '10 mg/kg/j (suspension 200 mg/5 mL)', dose_ar: '10 مغ/كغ/يوم (معلق 200 مغ/5 مل)',
    freq_fr: '1 fois par jour à jeun', freq_ar: 'مرة واحدة يومياً على الريق',
    dur_fr: '3 jours', dur_ar: '3 أيام',
    max_daily: '500 mg/j',
    warn_fr: 'À administrer à jeun ou 2h après le repas. Utiliser la seringue doseuse.',
    warn_ar: 'يُعطى على الريق أو بعد ساعتين من الأكل. استخدام المحقنة القياسية.',
    min_age: 0.5,
    needs_weight: true,
  }),

  // Ciprofloxacine
  t('Ciprofloxacine', 'Infections urinaires compliquées, infections digestives', 'adult', {
    dose_fr: '1 comprimé (500 mg)', dose_ar: 'قرص واحد (500 مغ)',
    freq_fr: '2 fois par jour à distance des repas', freq_ar: 'مرتين يومياً بعيداً عن الوجبات',
    dur_fr: '7 à 14 jours selon infection', dur_ar: '7 إلى 14 يوماً حسب العدوى',
    max_daily: '1500 mg/j',
    warn_fr: 'Risque de tendinopathie/rupture tendineuse. Éviter le soleil. Éviter anti-acides à base d\'aluminium.',
    warn_ar: 'خطر اعتلال الأوتار/تمزقها. تجنب أشعة الشمس. تجنب مضادات الحموضة الألومينيوم.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
  }),
  t('Ciprofloxacine', 'Infection urinaire basse non compliquée (IU simple)', 'adult', {
    dose_fr: '1 comprimé (250 mg)', dose_ar: 'قرص واحد (250 مغ)',
    freq_fr: '2 fois par jour', freq_ar: 'مرتين يومياً',
    dur_fr: '3 jours', dur_ar: '3 أيام',
    max_daily: '500 mg/j',
    warn_fr: 'Réserver aux cas avec résistance aux autres antibiotiques. ECBU recommandé avant traitement.',
    warn_ar: 'يُحجز للحالات المقاومة لمضادات حيوية أخرى. تحليل البول قبل العلاج موصى به.',
    ci: { pregnancy_alert: true },
    needs_weight: false,
  }),

  // Métronidazole
  t('Métronidazole', 'Infections anaérobies, Vaginose bactérienne, H. pylori', 'adult', {
    dose_fr: '1 comprimé (500 mg)', dose_ar: 'قرص واحد (500 مغ)',
    freq_fr: '3 fois par jour au cours des repas', freq_ar: '3 مرات يومياً أثناء الوجبات',
    dur_fr: '7 jours', dur_ar: '7 أيام',
    max_daily: '2 g/j',
    warn_fr: 'ALCOOL STRICTEMENT INTERDIT pendant et 48h après (effet antabuse). Goût métallique possible. Éviter en 1er trimestre grossesse.',
    warn_ar: 'الكحول محظور تماماً خلال العلاج وبعد 48 ساعة منه. طعم معدني محتمل. تجنب في الثلث الأول من الحمل.',
    ci: { pregnancy_alert: true },
    needs_weight: false,
  }),
  t('Métronidazole', 'Amibiase, Giardiase chez l\'enfant', 'child', {
    dose_fr: '20 à 30 mg/kg/j en 3 prises', dose_ar: '20 إلى 30 مغ/كغ/يوم في 3 جرعات',
    freq_fr: '3 fois par jour', freq_ar: '3 مرات يومياً',
    dur_fr: '5 à 10 jours', dur_ar: '5 إلى 10 أيام',
    max_daily: '2 g/j',
    warn_fr: 'Alcool interdit. Peut colorer les urines en brun. À prendre avec les repas.',
    warn_ar: 'الكحول محظور. قد يُغيّر لون البول إلى البني. يُؤخذ مع الوجبات.',
    needs_weight: true,
  }),

  // Doxycycline
  t('Doxycycline', 'Chlamydia, Lyme, Paludisme (prophylaxie), Acné sévère', 'adult', {
    dose_fr: '1 gélule (100 mg)', dose_ar: 'كبسولة واحدة (100 مغ)',
    freq_fr: '1 fois par jour (ou 2 fois/j en initiation)', freq_ar: 'مرة واحدة يومياً (أو مرتين في البداية)',
    dur_fr: 'Selon indication (7-14j infections, 12 sem. acné)', dur_ar: 'حسب الحالة (7-14 يوم للعدوى، 12 أسبوع للحب الشباب)',
    max_daily: '200 mg/j',
    warn_fr: 'Prendre assis avec un grand verre d\'eau. Eviter allongement après prise. Photosensibilisation. Contre-indiqué chez enfant < 8 ans et femme enceinte.',
    warn_ar: 'تناوله جالساً مع كوب كبير من الماء. تجنب الاستلقاء بعد الأخذ. حساسية للضوء. يمنع عند الأطفال < 8 سنوات وخلال الحمل.',
    ci: { pregnancy_alert: true },
    min_age: 8,
    needs_weight: false,
  }),

  // Ceftriaxone (injectable)
  t('Ceftriaxone', 'Infections sévères, Méningites bactériennes', 'adult', {
    dose_fr: '1 à 2 g en injection IV ou IM', dose_ar: '1 إلى 2 غ حقناً وريدياً أو عضلياً',
    freq_fr: '1 fois par jour (2 g/j si méningite)', freq_ar: 'مرة واحدة يومياً (2 غ/يوم للتهاب السحايا)',
    dur_fr: 'Selon infection (5-14 jours)', dur_ar: 'حسب العدوى (5-14 يوم)',
    max_daily: '4 g/j',
    warn_fr: 'Administrer en milieu médical. Garder 30 min sous surveillance après injection IM.',
    warn_ar: 'يُعطى في البيئة الطبية. المراقبة 30 دقيقة بعد الحقن العضلي.',
    needs_weight: false,
  }),
  t('Ceftriaxone', 'Infections sévères pédiatriques', 'child', {
    dose_fr: '50 à 100 mg/kg/j IV ou IM', dose_ar: '50 إلى 100 مغ/كغ/يوم وريدياً أو عضلياً',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Selon infection (5-14 jours)', dur_ar: 'حسب العدوى (5-14 يوم)',
    max_daily: '4 g/j',
    needs_weight: true,
  }),

  // Fluconazole
  t('Fluconazole', 'Candidose vaginale, Candidémie, Muguet', 'adult', {
    dose_fr: '1 gélule (150 mg) — candidose vaginale: dose unique', dose_ar: 'كبسولة واحدة (150 مغ) — داء المبيضات المهبلي: جرعة واحدة',
    freq_fr: '1 fois (dose unique pour vaginose) ou 1 fois/j pour infections systémiques', freq_ar: 'مرة واحدة (جرعة فردية للتهاب المهبل) أو مرة يومياً للعدوى الجهازية',
    dur_fr: 'Dose unique (candidose vaginale), 7-14j (autres)', dur_ar: 'جرعة واحدة (داء مبيضات مهبلي)، 7-14 يوم (أخرى)',
    max_daily: '400 mg/j',
    warn_fr: 'Interactions médicamenteuses importantes (anticoagulants, statines). Surveiller les transaminases si traitement prolongé.',
    warn_ar: 'تفاعلات دوائية مهمة (مضادات التخثر، الستاتينات). مراقبة إنزيمات الكبد في العلاج الطويل.',
    ci: { pregnancy_alert: true, hepatic_alert: true },
    needs_weight: false,
  }),

  // Aciclovir
  t('Aciclovir', 'Zona, Herpès génital primaire', 'adult', {
    dose_fr: '1 comprimé (400 à 800 mg)', dose_ar: 'قرص واحد (400 إلى 800 مغ)',
    freq_fr: '5 fois par jour pendant les premiers jours', freq_ar: '5 مرات يومياً في الأيام الأولى',
    dur_fr: '5 à 7 jours (herpès), 7-10 jours (zona)', dur_ar: '5 إلى 7 أيام (هرپس)، 7-10 أيام (هربس نطاقي)',
    max_daily: '4 g/j',
    warn_fr: 'Hydratation correcte indispensable (risque néphrotoxicité). Commencer le plus tôt possible.',
    warn_ar: 'الترطيب الكافي ضروري (خطر تأثير سام على الكلى). البداية في أقرب وقت ممكن.',
    ci: { renal_alert: true },
    needs_weight: false,
  }),

  // Chloroquine
  t('Chloroquine', 'Paludisme non compliqué, Lupus, Polyarthrite rhumatoïde', 'adult', {
    dose_fr: '1 à 2 comprimés (250 à 500 mg)', dose_ar: 'قرص إلى قرصين (250 إلى 500 مغ)',
    freq_fr: '1 fois par semaine (prophylaxie) ou selon schéma curatif', freq_ar: 'مرة في الأسبوع (وقاية) أو حسب خطة العلاج',
    dur_fr: 'Variable selon indication', dur_ar: 'متغير حسب الحالة',
    warn_fr: 'Surveillance ophtalmologique annuelle si traitement long cours (rétinopathie). Surveiller ECG.',
    warn_ar: 'مراقبة العيون سنوياً في العلاج الطويل (اعتلال الشبكية). مراقبة تخطيط القلب.',
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. APPAREIL DIGESTIF ET METABOLISME
  // ═══════════════════════════════════════════════════════════════════════════

  // Métformine
  t('Metformine', 'Diabète de type 2 — initiation', 'adult', {
    dose_fr: '1 comprimé (500 à 850 mg)', dose_ar: 'قرص واحد (500 إلى 850 مغ)',
    freq_fr: '2 à 3 fois par jour au cours des repas', freq_ar: 'مرتين إلى 3 مرات يومياً أثناء الوجبات',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '3 g/j',
    warn_fr: 'Débuter à faible dose et augmenter progressivement pour limiter les effets digestifs. Arrêter si DFG < 30 mL/min. Risque d\'acidose lactique rare.',
    warn_ar: 'ابدأ بجرعة منخفضة وزدها تدريجياً للحد من الآثار الهضمية. أوقف إذا كان DFG < 30 مل/دقيقة. خطر نادر لحماض اللاكتيك.',
    ci: { renal_alert: true, hepatic_alert: true },
    needs_weight: false,
  }),
  t('Metformine', 'Diabète de type 2 — dose maximale', 'adult', {
    dose_fr: '2 comprimés (1000 mg)', dose_ar: 'قرصان (1000 مغ)',
    freq_fr: '2 fois par jour au cours des repas', freq_ar: 'مرتين يومياً أثناء الوجبات',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '3 g/j',
    warn_fr: 'Contrôle HbA1c tous les 3 mois. Arrêter 48h avant injection de produit de contraste iodé.',
    warn_ar: 'مراقبة HbA1c كل 3 أشهر. إيقاف العلاج 48 ساعة قبل حقن مادة التباين اليودية.',
    ci: { renal_alert: true },
    needs_weight: false,
  }),
  t('Metformine', 'Diabète de type 2 — personne âgée', 'elderly', {
    dose_fr: '1 comprimé (500 à 850 mg)', dose_ar: 'قرص واحد (500 إلى 850 مغ)',
    freq_fr: '1 à 2 fois par jour', freq_ar: 'مرة إلى مرتين يومياً',
    dur_fr: 'Traitement au long cours avec réévaluation régulière', dur_ar: 'علاج طويل الأمد مع إعادة تقييم منتظمة',
    max_daily: '2 g/j (prudence)',
    warn_fr: 'Surveiller régulièrement la fonction rénale (adaptation si DFG < 45). Risque de déshydratation en été.',
    warn_ar: 'مراقبة وظائف الكلى بانتظام (تعديل إذا DFG < 45). خطر الجفاف في الصيف.',
    ci: { renal_alert: true },
    needs_weight: false,
  }),

  // Glibenclamide
  t('Glibenclamide', 'Diabète de type 2 (non contrôlé par régime + metformine)', 'adult', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)',
    freq_fr: '1 à 2 fois par jour au cours des repas', freq_ar: 'مرة إلى مرتين يومياً أثناء الوجبات',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '20 mg/j',
    warn_fr: 'Risque d\'hypoglycémie sévère, surtout chez le sujet âgé. Contrôler glycémie régulièrement. Éviter alcool.',
    warn_ar: 'خطر انخفاض حاد لسكر الدم، خاصة عند كبار السن. مراقبة السكر بانتظام. تجنب الكحول.',
    ci: { renal_alert: true, hepatic_alert: true },
    needs_weight: false,
  }),

  // Oméprazole
  t('Oméprazole', 'Ulcère gastroduodénal, RGO, Éradication H. pylori', 'adult', {
    dose_fr: '1 gélule (20 mg)', dose_ar: 'كبسولة واحدة (20 مغ)',
    freq_fr: '1 fois par jour à jeun (le matin)', freq_ar: 'مرة واحدة يومياً على الريق (صباحاً)',
    dur_fr: '4 à 8 semaines (ulcère), au long cours si RGO sévère', dur_ar: '4 إلى 8 أسابيع (قرحة)، طويل الأمد في الارتجاع الحاد',
    max_daily: '40 mg/j',
    warn_fr: 'Avaler entière sans croquer. Réévaluer régulièrement la nécessité. Risque d\'hypoMg et d\'infections digestives si long cours.',
    warn_ar: 'ابتلع كاملاً دون مضغ. إعادة تقييم الحاجة بانتظام. خطر نقص المغنيسيوم والعدوى الهضمية في العلاج الطويل.',
    needs_weight: false,
  }),
  t('Oméprazole', 'Prophylaxie ulcère sous AINS/corticoïdes', 'adult', {
    dose_fr: '1 gélule (20 mg)', dose_ar: 'كبسولة واحدة (20 مغ)',
    freq_fr: '1 fois par jour, pendant la durée du traitement AINS', freq_ar: 'مرة واحدة يومياً طوال فترة العلاج بمضادات الالتهاب',
    dur_fr: 'Durée du traitement par AINS/corticoïdes', dur_ar: 'طول فترة العلاج بمضادات الالتهاب أو الكورتيزون',
    needs_weight: false,
  }),
  t('Oméprazole', 'Reflux gastro-œsophagien chez l\'enfant (> 1 an)', 'child', {
    dose_fr: '0.5 à 1 mg/kg/j (max 20 mg)', dose_ar: '0.5 إلى 1 مغ/كغ/يوم (أقصى 20 مغ)',
    freq_fr: '1 fois par jour, à jeun', freq_ar: 'مرة واحدة يومياً، على الريق',
    dur_fr: '4 à 8 semaines', dur_ar: '4 إلى 8 أسابيع',
    max_daily: '20 mg/j',
    min_age: 1,
    needs_weight: true,
  }),

  // Pantoprazole
  t('Pantoprazole', 'Ulcère gastroduodénal, RGO', 'adult', {
    dose_fr: '1 comprimé (40 mg)', dose_ar: 'قرص واحد (40 مغ)',
    freq_fr: '1 fois par jour à jeun', freq_ar: 'مرة واحدة يومياً على الريق',
    dur_fr: '4 à 8 semaines', dur_ar: '4 إلى 8 أسابيع',
    max_daily: '80 mg/j',
    warn_fr: 'Ne pas écraser ni croquer. Avaler entier avec un peu d\'eau.',
    warn_ar: 'لا تكسر ولا تمضغ. ابتلعه كاملاً مع قليل من الماء.',
    needs_weight: false,
  }),

  // Dompéridone
  t('Dompéridone', 'Nausées, Vomissements, Gastroparésie', 'adult', {
    dose_fr: '1 comprimé (10 mg)', dose_ar: 'قرص واحد (10 مغ)',
    freq_fr: '3 fois par jour avant les repas', freq_ar: '3 مرات يومياً قبل الوجبات',
    dur_fr: 'Maximum 7 jours (traitement court)', dur_ar: '7 أيام كحد أقصى (علاج قصير)',
    max_daily: '30 mg/j',
    warn_fr: 'Traitement de courte durée uniquement. Risque cardiaque à forte dose ou traitement prolongé (allongement QT). À éviter si antécédent cardiaque.',
    warn_ar: 'علاج قصير الأمد فقط. خطر قلبي بجرعة مرتفعة أو علاج طويل (إطالة QT). تجنبه عند وجود تاريخ قلبي.',
    ci: { hepatic_alert: true },
    needs_weight: false,
  }),
  t('Dompéridone', 'Nausées et vomissements chez l\'enfant', 'child', {
    dose_fr: '0.25 mg/kg par prise', dose_ar: '0.25 مغ/كغ لكل جرعة',
    freq_fr: '3 fois par jour avant les repas', freq_ar: '3 مرات يومياً قبل الوجبات',
    dur_fr: 'Maximum 3 à 7 jours', dur_ar: '3 إلى 7 أيام كحد أقصى',
    max_daily: '0.75 mg/kg/j (max 30 mg/j)',
    warn_fr: 'Ne pas dépasser la durée recommandée. Utiliser la forme liquide adaptée au poids.',
    warn_ar: 'لا تتجاوز المدة الموصى بها. استخدام الشكل السائل المناسب للوزن.',
    needs_weight: true,
  }),

  // Ranitidine → remplacé mais toujours en liste
  t('Ranitidine', 'Ulcère gastroduodénal, Pyrosis (si IPP non disponible)', 'adult', {
    dose_fr: '1 comprimé (150 mg)', dose_ar: 'قرص واحد (150 مغ)',
    freq_fr: '2 fois par jour matin et soir', freq_ar: 'مرتين يومياً صباحاً ومساءً',
    dur_fr: '4 à 8 semaines', dur_ar: '4 إلى 8 أسابيع',
    max_daily: '300 mg/j',
    warn_fr: 'Deuxième intention si IPP disponible. Peut masquer une infection à H. pylori.',
    warn_ar: 'خط ثانٍ إذا توفرت مثبطات المضخة. قد يُخفي عدوى H. pylori.',
    needs_weight: false,
  }),

  // Lactulose
  t('Lactulose', 'Constipation, Encéphalopathie hépatique', 'adult', {
    dose_fr: '15 à 30 mL de solution', dose_ar: '15 إلى 30 مل من المحلول',
    freq_fr: '2 fois par jour (laxatif), 3-4 fois/j (encéphalopathie)', freq_ar: 'مرتين يومياً (ملين)، 3-4 مرات/يوم (اعتلال دماغي)',
    dur_fr: 'Variable', dur_ar: 'متغير',
    warn_fr: 'Flatulences et ballonnements fréquents au début. Diluer dans un verre d\'eau.',
    warn_ar: 'انتفاخات وغازات متكررة في البداية. تخفيف في كوب من الماء.',
    needs_weight: false,
  }),
  t('Lactulose', 'Constipation de l\'enfant', 'child', {
    dose_fr: '1 à 3 mL/kg/j', dose_ar: '1 إلى 3 مل/كغ/يوم',
    freq_fr: '1 à 2 fois par jour', freq_ar: 'مرة إلى مرتين يومياً',
    dur_fr: 'Selon réponse clinique', dur_ar: 'حسب الاستجابة السريرية',
    needs_weight: true,
  }),

  // Loperamide
  t('Lopéramide', 'Diarrhée aiguë', 'adult', {
    dose_fr: '2 gélules (4 mg) en dose initiale, puis 1 gélule (2 mg) après chaque selle molle', dose_ar: 'كبسولتان (4 مغ) كجرعة أولى، ثم كبسولة (2 مغ) بعد كل إسهال',
    freq_fr: 'Selon les selles', freq_ar: 'حسب الإسهال',
    dur_fr: 'Maximum 2 jours (ne pas prolonger sans avis médical)', dur_ar: 'يومان كحد أقصى (لا تطل دون استشارة طبية)',
    max_daily: '16 mg/j',
    warn_fr: 'Ne pas utiliser si fièvre > 38.5°C, sang dans les selles, ou diarrhée d\'origine infectieuse grave. Bien s\'hydrater.',
    warn_ar: 'لا تستخدم إذا كانت الحرارة > 38.5°C، أو دم في البراز، أو إسهال من منشأ جرثومي حاد. الترطيب الكافي.',
    min_age: 12,
    needs_weight: false,
  }),

  // Phloroglucinol
  t('Phloroglucinol', 'Spasmes gastro-intestinaux, Coliques hépatiques/biliaires, Dysménorrhées', 'adult', {
    dose_fr: '1 à 2 comprimés (80 à 160 mg)', dose_ar: 'قرص إلى قرصين (80 إلى 160 مغ)',
    freq_fr: 'Jusqu\'à 6 comprimés par jour si besoin', freq_ar: 'حتى 6 أقراص يومياً عند الحاجة',
    dur_fr: '3 à 5 jours', dur_ar: '3 إلى 5 أيام',
    max_daily: '480 mg/j',
    needs_weight: false,
  }),
  t('Phloroglucinol', 'Spasmes digestifs chez l\'enfant', 'child', {
    dose_fr: '1 comprimé (80 mg) 2 à 3 fois par jour', dose_ar: 'قرص واحد (80 مغ) 2 إلى 3 مرات يومياً',
    freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً',
    dur_fr: '3 jours', dur_ar: '3 أيام',
    min_age: 6,
    needs_weight: false,
  }),

  // Ondansétron
  t('Ondansétron', 'Nausées et vomissements post-chimiothérapie, post-opératoires', 'adult', {
    dose_fr: '1 comprimé (8 mg) ou 4 mg IV', dose_ar: 'قرص واحد (8 مغ) أو 4 مغ وريدياً',
    freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً',
    dur_fr: '1 à 2 jours post-chimio', dur_ar: '1 إلى 2 يوم بعد العلاج الكيميائي',
    max_daily: '32 mg/j',
    warn_fr: 'Risque d\'allongement QT. Attention si hypokaliémie ou hypomagnésémie.',
    warn_ar: 'خطر إطالة QT. الحذر في حالة نقص البوتاسيوم أو المغنيسيوم.',
    ci: { hepatic_alert: true },
    needs_weight: false,
  }),

  // Siméthicone
  t('Siméticone', 'Ballonnements, Flatulences, Météorisme', 'adult', {
    dose_fr: '1 à 2 comprimés (80 à 160 mg)', dose_ar: 'قرص إلى قرصين (80 إلى 160 مغ)',
    freq_fr: '3 fois par jour après les repas et au coucher', freq_ar: '3 مرات يومياً بعد الوجبات وعند النوم',
    dur_fr: 'Traitement court', dur_ar: 'علاج قصير',
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SYSTEME RESPIRATOIRE
  // ═══════════════════════════════════════════════════════════════════════════

  // Salbutamol
  t('Salbutamol', 'Crise d\'asthme, Bronchospasme', 'adult', {
    dose_fr: '2 bouffées (200 mcg)', dose_ar: 'شهيقتان (200 ميكروغرام)',
    freq_fr: 'À la demande lors des crises (max 8 bouffées/j)', freq_ar: 'عند الحاجة أثناء الأزمات (أقصى 8 شهيقات/يوم)',
    dur_fr: 'Traitement de la crise', dur_ar: 'علاج الأزمة',
    warn_fr: 'Usage à la demande uniquement. Si > 2 crises/semaine, ajouter traitement de fond. Agiter avant usage.',
    warn_ar: 'استخدام عند الحاجة فقط. إذا > أزمتان/أسبوع، أضف علاجاً للوقاية. رج قبل الاستخدام.',
    needs_weight: false,
  }),
  t('Salbutamol', 'Asthme pédiatrique — crise légère à modérée', 'child', {
    dose_fr: '2 à 4 bouffées selon gravité (avec chambre d\'inhalation)', dose_ar: '2 إلى 4 شهيقات حسب الشدة (مع الحجرة)',
    freq_fr: 'Toutes les 20 min pendant 1h si besoin en crise sévère', freq_ar: 'كل 20 دقيقة لمدة ساعة عند الحاجة في الأزمة الشديدة',
    dur_fr: 'Traitement de la crise', dur_ar: 'علاج الأزمة',
    warn_fr: 'Toujours utiliser la chambre d\'inhalation chez l\'enfant < 6 ans. En cas de crise sévère, consulter en urgence.',
    warn_ar: 'استخدام الحجرة دائماً عند الأطفال < 6 سنوات. في حالة الأزمة الشديدة، استشارة طارئة.',
    needs_weight: false,
  }),

  // Béclométasone
  t('Béclométasone', 'Asthme — traitement de fond', 'adult', {
    dose_fr: '2 bouffées (200 mcg)', dose_ar: 'شهيقتان (200 ميكروغرام)',
    freq_fr: '2 fois par jour matin et soir', freq_ar: 'مرتين يومياً صباحاً ومساءً',
    dur_fr: 'Traitement au long cours (min 3 mois)', dur_ar: 'علاج طويل الأمد (3 أشهر على الأقل)',
    warn_fr: 'Se rincer la bouche après chaque prise (prévention candidose buccale). Ne pas arrêter brutalement.',
    warn_ar: 'شطف الفم بعد كل جرعة (وقاية من داء المبيضات الفموي). لا توقف فجأة.',
    needs_weight: false,
  }),
  t('Béclométasone', 'Asthme — traitement de fond enfant', 'child', {
    dose_fr: '1 à 2 bouffées (100 à 200 mcg)', dose_ar: 'شهيقة إلى شهيقتين (100 إلى 200 ميكروغرام)',
    freq_fr: '2 fois par jour', freq_ar: 'مرتين يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Utiliser chambre d\'inhalation. Surveiller la croissance. Se rincer la bouche.',
    warn_ar: 'استخدام الحجرة. مراقبة النمو. شطف الفم.',
    min_age: 4,
    needs_weight: false,
  }),

  // Montélukast
  t('Montélukast', 'Asthme persistant léger, Rhinite allergique', 'adult', {
    dose_fr: '1 comprimé (10 mg)', dose_ar: 'قرص واحد (10 مغ)',
    freq_fr: '1 fois par jour le soir', freq_ar: 'مرة واحدة يومياً مساءً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Surveillance des changements d\'humeur, anxiété, pensées suicidaires (effet rare de classe).',
    warn_ar: 'مراقبة تغييرات المزاج والقلق وأفكار الانتحار (أثر نادر للعلاج).',
    ci: { pregnancy_alert: false },
    needs_weight: false,
  }),
  t('Montélukast', 'Asthme persistant léger chez l\'enfant', 'child', {
    dose_fr: '1 comprimé (4 mg, granulés) pour < 6 ans; 5 mg pour 6-14 ans', dose_ar: 'قرص واحد (4 مغ، حبيبات) لما دون 6 سنوات؛ 5 مغ للأعمار 6-14',
    freq_fr: '1 fois par jour le soir', freq_ar: 'مرة واحدة يومياً مساءً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    min_age: 2,
    needs_weight: false,
  }),

  // Cétirizine
  t('Cétirizine', 'Rhinite allergique saisonnière, Urticaire, Allergies', 'adult', {
    dose_fr: '1 comprimé (10 mg)', dose_ar: 'قرص واحد (10 مغ)',
    freq_fr: '1 fois par jour, de préférence le soir', freq_ar: 'مرة واحدة يومياً، ويُفضل مساءً',
    dur_fr: 'Selon saison allergique ou symptômes (min 4 semaines)', dur_ar: 'حسب موسم الحساسية أو الأعراض (4 أسابيع على الأقل)',
    warn_fr: 'Peut provoquer somnolence. Prudence si conduite. Réduire dose si insuffisance rénale.',
    warn_ar: 'قد يسبب النعاس. الحذر عند القيادة. تخفيض الجرعة في القصور الكلوي.',
    ci: { renal_alert: true },
    needs_weight: false,
  }),
  t('Cétirizine', 'Rhinite allergique et urticaire chez l\'enfant (≥ 2 ans)', 'child', {
    dose_fr: '2.5 à 5 mg (solution 1 mg/mL)', dose_ar: '2.5 إلى 5 مغ (محلول 1 مغ/مل)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Selon symptômes', dur_ar: 'حسب الأعراض',
    min_age: 2,
    needs_weight: true,
  }),

  // Loratadine
  t('Loratadine', 'Rhinite allergique, Urticaire', 'adult', {
    dose_fr: '1 comprimé (10 mg)', dose_ar: 'قرص واحد (10 مغ)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Selon saison ou symptômes', dur_ar: 'حسب الموسم أو الأعراض',
    warn_fr: 'Antihistaminique non sédatif. Peut être pris à n\'importe quel moment de la journée.',
    warn_ar: 'مضاد هيستامين غير منوّم. يمكن تناوله في أي وقت من اليوم.',
    ci: { hepatic_alert: true },
    needs_weight: false,
  }),

  // Ambroxol
  t('Ambroxol', 'Bronchite, Sécrétions épaisses, Toux productive', 'adult', {
    dose_fr: '1 à 2 comprimés (30 à 60 mg)', dose_ar: 'قرص إلى قرصين (30 إلى 60 مغ)',
    freq_fr: '3 fois par jour pendant les premiers jours, puis 2 fois/j', freq_ar: '3 مرات يومياً في الأيام الأولى، ثم مرتين يومياً',
    dur_fr: '5 à 7 jours', dur_ar: '5 إلى 7 أيام',
    max_daily: '90 mg/j (3 premiers jours)',
    warn_fr: 'Bien s\'hydrater pour fluidifier les sécrétions. Efficacité améliorée si bonne hydratation.',
    warn_ar: 'شرب كميات كافية من الماء لتسييل الإفرازات. الفعالية تتحسن مع الترطيب الجيد.',
    needs_weight: false,
  }),
  t('Ambroxol', 'Sécrétions bronchiques épaisses chez l\'enfant', 'child', {
    dose_fr: '1.2 à 1.6 mg/kg/j (sirop)', dose_ar: '1.2 إلى 1.6 مغ/كغ/يوم (شراب)',
    freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً',
    dur_fr: '5 à 7 jours', dur_ar: '5 إلى 7 أيام',
    needs_weight: true,
  }),

  // Prednisolone (systémique)
  t('Prednisolone', 'Crise d\'asthme sévère, Exacerbation BPCO', 'adult', {
    dose_fr: '40 à 60 mg', dose_ar: '40 إلى 60 مغ',
    freq_fr: '1 fois par jour le matin', freq_ar: 'مرة واحدة يومياً في الصباح',
    dur_fr: '5 à 7 jours (cure courte)', dur_ar: '5 إلى 7 أيام (علاج قصير)',
    max_daily: '60 mg/j',
    warn_fr: 'Pas besoin de sevrage si < 7 jours. Surveiller glycémie, tension, risque infectieux.',
    warn_ar: 'لا حاجة للتوقف التدريجي إذا < 7 أيام. مراقبة السكر والضغط وخطر العدوى.',
    ci: { pregnancy_alert: false },
    needs_weight: false,
  }),

  // Cromoglycate de sodium (rhinite, asthme)
  t('Cromoglycate de sodium', 'Rhinite allergique, Asthme allergique léger — prévention', 'adult', {
    dose_fr: '1 vaporisation nasale par narine', dose_ar: 'رشة واحدة في كل منخر',
    freq_fr: '4 à 6 fois par jour', freq_ar: '4 إلى 6 مرات يومياً',
    dur_fr: 'Tout au long de la saison allergique', dur_ar: 'طوال موسم الحساسية',
    warn_fr: 'Traitement préventif uniquement — sans effet sur la crise établie. Début d\'action progressif.',
    warn_ar: 'علاج وقائي فقط — بدون أثر على الأزمة القائمة. مفعوله تدريجي.',
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. MUSCLE ET SQUELETTE
  // ═══════════════════════════════════════════════════════════════════════════

  // Kétoprofène
  t('Kétoprofène', 'Rhumatismes, Douleurs articulaires et musculaires', 'adult', {
    dose_fr: '1 comprimé (100 mg)', dose_ar: 'قرص واحد (100 مغ)',
    freq_fr: '2 fois par jour au milieu des repas', freq_ar: 'مرتين يومياً وسط الوجبات',
    dur_fr: '5 jours', dur_ar: '5 أيام',
    max_daily: '200 mg/j',
    warn_fr: 'Prendre impérativement avec un repas et un grand verre d\'eau. CONTRE-INDIQUÉ dès le 6ème mois de grossesse.',
    warn_ar: 'يجب تناوله مع وجبة وكوب كبير من الماء. يُمنع تماماً ابتداءً من الشهر السادس للحمل.',
    ci: { pregnancy_alert: true, renal_alert: true },
    needs_weight: false,
  }),

  // Méthocarbamol
  t('Méthocarbamol', 'Contractures musculaires douloureuses, Torticolis, Lombalgie', 'adult', {
    dose_fr: '3 comprimés (1.5 g) en initiation, puis 2 comprimés (1 g)', dose_ar: '3 أقراص (1.5 غ) في البداية، ثم قرصان (1 غ)',
    freq_fr: '3 à 4 fois par jour', freq_ar: '3 إلى 4 مرات يومياً',
    dur_fr: '3 à 5 jours', dur_ar: '3 إلى 5 أيام',
    max_daily: '6 g/j',
    warn_fr: 'Somnolence possible. Ne pas conduire. Alcool déconseillé.',
    warn_ar: 'نعاس محتمل. تجنب القيادة. يُنصح بتجنب الكحول.',
    ci: { renal_alert: true, hepatic_alert: true },
    needs_weight: false,
  }),

  // Colchicine
  t('Colchicine', 'Goutte aiguë, Péricardite', 'adult', {
    dose_fr: '1 mg en dose initiale, puis 0.5 mg après 1 heure', dose_ar: '1 مغ كجرعة أولى، ثم 0.5 مغ بعد ساعة',
    freq_fr: 'Dose initiale puis réduction progressive', freq_ar: 'جرعة أولى ثم تخفيض تدريجي',
    dur_fr: 'Crise: 3 à 5 jours. Prévention: traitement long cours', dur_ar: 'الأزمة: 3 إلى 5 أيام. الوقاية: علاج طويل الأمد',
    max_daily: '3 mg/j (jour 1), puis 1.5 mg/j',
    warn_fr: 'Risque de myopathie et toxicité digestive. Interactions sérieuses avec clarithromycine, ciclosporine.',
    warn_ar: 'خطر اعتلال العضلات وسمية هضمية. تفاعلات خطيرة مع كلاريثروميسين وسيكلوسبورين.',
    ci: { renal_alert: true, hepatic_alert: true },
    needs_weight: false,
  }),

  // Allopurinol
  t('Allopurinol', 'Hyperuricémie, Goutte chronique, Lithiase urique', 'adult', {
    dose_fr: '1 comprimé (100 à 300 mg)', dose_ar: 'قرص واحد (100 إلى 300 مغ)',
    freq_fr: '1 fois par jour après le repas', freq_ar: 'مرة واحدة يومياً بعد الأكل',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '800 mg/j (selon uricémie)',
    warn_fr: 'Ne pas démarrer pendant une crise de goutte aiguë. Initier la colchicine ou un AINS en prophylaxie les 3 premiers mois. Surveillance de la créatinine.',
    warn_ar: 'لا تبدأ خلال أزمة نقرس حادة. استخدم الكولشيسين أو مضادات الالتهاب للوقاية في الأشهر الثلاثة الأولى. مراقبة الكرياتينين.',
    ci: { renal_alert: true },
    needs_weight: false,
  }),

  // Hydroxychloroquine
  t('Hydroxychloroquine', 'Lupus, Polyarthrite rhumatoïde, Paludisme', 'adult', {
    dose_fr: '1 à 2 comprimés (200 à 400 mg)', dose_ar: 'قرص إلى قرصين (200 إلى 400 مغ)',
    freq_fr: '1 à 2 fois par jour au cours des repas', freq_ar: 'مرة إلى مرتين يومياً أثناء الوجبات',
    dur_fr: 'Traitement au long cours (min 6 mois pour effet rhumatologique)', dur_ar: 'علاج طويل الأمد (6 أشهر على الأقل للأثر الروماتيزمي)',
    max_daily: '400 mg/j',
    warn_fr: 'Surveillance ophtalmologique annuelle obligatoire (rétinopathie). Effet thérapeutique après 2-3 mois.',
    warn_ar: 'مراقبة عيون سنوية إلزامية (اعتلال الشبكية). الأثر العلاجي بعد 2-3 أشهر.',
    needs_weight: false,
  }),

  // Méthylprednisolone
  t('Méthylprednisolone', 'Poussée inflammatoire rhumatismale, Allergie sévère', 'adult', {
    dose_fr: '16 à 32 mg/j en 2 à 3 prises', dose_ar: '16 إلى 32 مغ/يوم في 2 إلى 3 جرعات',
    freq_fr: 'Le matin de préférence (rythme circadien)', freq_ar: 'ويُفضل في الصباح (إيقاع الساعة البيولوجية)',
    dur_fr: 'Selon réponse clinique, à diminuer progressivement', dur_ar: 'حسب الاستجابة السريرية، مع تخفيض تدريجي',
    warn_fr: 'Ne jamais arrêter brutalement si traitement long cours. Surveiller glycémie, TA, poids, immunodépression.',
    warn_ar: 'لا توقف فجأة في العلاج الطويل. مراقبة السكر والضغط والوزن ونقص المناعة.',
    ci: { pregnancy_alert: false },
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. HORMONES SYSTEMIQUES
  // ═══════════════════════════════════════════════════════════════════════════

  // Lévothyroxine
  t('Lévothyroxine', 'Hypothyroïdie', 'adult', {
    dose_fr: '50 à 100 mcg (débuter à 25-50 mcg chez la personne âgée)', dose_ar: '50 إلى 100 ميكروغرام (ابدأ بـ 25-50 ميكروغرام عند كبار السن)',
    freq_fr: '1 fois par jour à jeun, 30 min avant le petit-déjeuner', freq_ar: 'مرة واحدة يومياً على الريق، 30 دقيقة قبل الفطور',
    dur_fr: 'Traitement au long cours à vie', dur_ar: 'علاج طويل الأمد مدى الحياة',
    warn_fr: 'Contrôle TSH à 6-8 semaines puis tous les 6-12 mois. Ne pas changer de marque sans avis médical. Nombreuses interactions (anti-acides, calcium).',
    warn_ar: 'مراقبة TSH بعد 6-8 أسابيع ثم كل 6-12 شهراً. لا تغيير الماركة دون استشارة طبية. تفاعلات كثيرة (مضادات الحموضة، الكالسيوم).',
    needs_weight: false,
  }),
  t('Lévothyroxine', 'Hypothyroïdie congénitale (nouveau-né/nourrisson)', 'child', {
    dose_fr: '10 à 15 mcg/kg/j', dose_ar: '10 إلى 15 ميكروغرام/كغ/يوم',
    freq_fr: '1 fois par jour à jeun', freq_ar: 'مرة واحدة يومياً على الريق',
    dur_fr: 'Traitement à vie', dur_ar: 'علاج مدى الحياة',
    warn_fr: 'Contrôle TSH très rapproché en pédiatrie (toutes les 4-8 semaines les premières années). Crucial pour le développement cérébral.',
    warn_ar: 'مراقبة TSH متكررة جداً عند الأطفال (كل 4-8 أسابيع في السنوات الأولى). ضروري للتطور الدماغي.',
    needs_weight: true,
  }),
  t('Lévothyroxine', 'Hypothyroïdie (personne âgée)', 'elderly', {
    dose_fr: '25 mcg/j en initiation', dose_ar: '25 ميكروغرام/يوم كبداية',
    freq_fr: '1 fois par jour à jeun', freq_ar: 'مرة واحدة يومياً على الريق',
    dur_fr: 'Traitement à vie, augmentation très progressive', dur_ar: 'علاج مدى الحياة، زيادة تدريجية جداً',
    warn_fr: 'Initiation très prudente chez le sujet âgé et le coronarien. Augmenter par paliers de 25 mcg toutes les 4-8 semaines.',
    warn_ar: 'بداية حذرة جداً عند كبار السن ومرضى القلب. زيادة بـ 25 ميكروغرام كل 4-8 أسابيع.',
    needs_weight: false,
  }),

  // Prednisolone / Prednisone
  t('Prednisolone', 'Maladies inflammatoires chroniques (polyarthrite, lupus, etc.)', 'adult', {
    dose_fr: '1 mg/kg/j en cure courte initiale, puis dégressif', dose_ar: '1 مغ/كغ/يوم كبداية ثم تخفيض تدريجي',
    freq_fr: '1 fois par jour le matin', freq_ar: 'مرة واحدة يومياً في الصباح',
    dur_fr: 'Variable selon réponse, toujours réduire progressivement', dur_ar: 'متغير حسب الاستجابة، دائماً تخفيض تدريجي',
    max_daily: '1 mg/kg/j (max 60 mg/j)',
    warn_fr: 'Risque infectieux, ostéoporose, hypertension, diabète cortisonique. Supplémenter en calcium + vit D si long cours.',
    warn_ar: 'خطر العدوى، هشاشة العظام، ارتفاع الضغط، سكري كورتيزوني. تكملة بالكالسيوم وفيت D في العلاج الطويل.',
    needs_weight: true,
  }),
  t('Prednisolone', 'Syndromes inflammatoires chez l\'enfant (néphrotique, croup)', 'child', {
    dose_fr: '1 à 2 mg/kg/j', dose_ar: '1 إلى 2 مغ/كغ/يوم',
    freq_fr: '1 à 2 fois par jour (matin de préférence)', freq_ar: 'مرة إلى مرتين يومياً (ويُفضل الصباح)',
    dur_fr: 'Selon indication (cure courte 3-5j pour laryngite, 4-8 sem pour syndrome néphrotique)', dur_ar: 'حسب الحالة (علاج قصير 3-5 أيام للتهاب الحنجرة، 4-8 أسابيع للمتلازمة الكلوية)',
    max_daily: '60 mg/j',
    warn_fr: 'Surveiller le poids, la croissance et la pression artérielle. Sevrage progressif si > 7 jours.',
    warn_ar: 'مراقبة الوزن والنمو وضغط الدم. توقف تدريجي إذا > 7 أيام.',
    needs_weight: true,
  }),

  // Hydrocortisone
  t('Hydrocortisone', 'Insuffisance surrénale, Maladie d\'Addison', 'adult', {
    dose_fr: '15 à 25 mg/j en 2 à 3 prises', dose_ar: '15 إلى 25 مغ/يوم في 2 إلى 3 جرعات',
    freq_fr: '2/3 le matin, 1/3 l\'après-midi', freq_ar: 'الثلثان صباحاً، والثلث بعد الظهر',
    dur_fr: 'Traitement à vie (substitution)', dur_ar: 'علاج مدى الحياة (تعويضي)',
    warn_fr: 'DOUBLER la dose en cas de fièvre/infection/stress. Porter une carte signalant la corticothérapie. Ne jamais interrompre.',
    warn_ar: 'مضاعفة الجرعة عند الحمى/العدوى/الإجهاد. حمل بطاقة تشير إلى العلاج بالكورتيزون. لا توقف أبداً.',
    needs_weight: false,
  }),

  // Insuline (Rappel template générique)
  t('Insuline (Isophane NPH)', 'Diabète de type 1, Diabète de type 2 déséquilibré', 'adult', {
    dose_fr: 'Selon prescription individuelle (titration)', dose_ar: 'حسب الوصفة الفردية (معايرة)',
    freq_fr: '1 à 2 injections sous-cutanées par jour (schéma basal)', freq_ar: 'حقنة إلى حقنتين تحت الجلد يومياً (خطة قاعدية)',
    dur_fr: 'Traitement continu', dur_ar: 'علاج مستمر',
    warn_fr: 'Rotation des sites d\'injection. Surveiller glycémie capillaire. Connaitre les signes d\'hypoglycémie. Conserver au réfrigérateur.',
    warn_ar: 'تبادل مناطق الحقن. مراقبة سكر الدم الشعري. معرفة علامات انخفاض السكر. الحفظ في الثلاجة.',
    needs_weight: true,
    needs_dx: true,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. SANG ET ORGANES HEMATOPOIETIQUES
  // ═══════════════════════════════════════════════════════════════════════════

  // Warfarine
  t('Warfarine', 'FA, Prévention thromboembolique, Prothèse valvulaire', 'adult', {
    dose_fr: 'Dose individuelle selon INR (habituellement 2 à 10 mg/j)', dose_ar: 'جرعة فردية حسب مستوى INR (عادةً 2 إلى 10 مغ/يوم)',
    freq_fr: '1 fois par jour à heure fixe', freq_ar: 'مرة واحدة يومياً في وقت ثابت',
    dur_fr: 'Traitement au long cours ou durée définie', dur_ar: 'علاج طويل الأمد أو مدة محددة',
    warn_fr: 'INTERACTIONS NOMBREUSES ET CRITIQUES. Surveiller INR régulièrement (cible 2-3 pour FA; 2.5-3.5 pour valve mécanique). Alimentation riche en vit K à éviter. Informer tous les professionnels de santé.',
    warn_ar: 'تفاعلات دوائية كثيرة وحرجة. مراقبة INR بانتظام. تجنب الأطعمة الغنية بفيت K. إعلام جميع المختصين الصحيين.',
    ci: { pregnancy_alert: true, hepatic_alert: true },
    needs_weight: false,
    needs_dx: true,
  }),

  // Héparine de bas poids moléculaire
  t('Énoxaparine', 'Thrombose veineuse profonde, Embolie pulmonaire, Prévention TVP', 'adult', {
    dose_fr: '1 mg/kg en injection sous-cutanée (curatif)', dose_ar: '1 مغ/كغ حقناً تحت الجلد (علاجي)',
    freq_fr: 'Toutes les 12 heures (curatif) ou 1 fois/j (prophylaxie)', freq_ar: 'كل 12 ساعة (علاجي) أو مرة واحدة يومياً (وقائي)',
    dur_fr: '5 à 10 jours (relais AVK), ou long cours (si AVK contre-indiqué)', dur_ar: '5 إلى 10 أيام (انتقال للمضادات الفيتامينية)، أو طويل الأمد',
    warn_fr: 'Surveiller plaquettes (risque TIH). Surveillance anti-Xa si obésité ou insuffisance rénale. Rotation des sites.',
    warn_ar: 'مراقبة الصفائح الدموية (خطر TIH). مراقبة Anti-Xa في البدانة والقصور الكلوي. تبادل مناطق الحقن.',
    ci: { renal_alert: true },
    needs_weight: true,
  }),

  // Acide folique
  t('Acide folique', 'Prévention des malformations du tube neural (grossesse)', 'pregnant', {
    dose_fr: '1 comprimé (0.4 mg) en prévention ou 5 mg si carence', dose_ar: 'قرص واحد (0.4 مغ) وقاية، أو 5 مغ عند العوز',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Au moins 4 semaines avant la conception jusqu\'à la fin du 1er trimestre', dur_ar: '4 أسابيع على الأقل قبل الحمل حتى نهاية الثلث الأول',
    warn_fr: 'ESSENTIEL en péri-conception. 5 mg/j si antécédent de spina bifida ou traitement antiépileptique.',
    warn_ar: 'ضروري في فترة الحمل. 5 مغ/يوم عند تاريخ سنفا بيفيدا أو العلاج المضاد للصرع.',
    needs_weight: false,
  }),
  t('Acide folique', 'Carence en folates, Anémie mégaloblastique', 'adult', {
    dose_fr: '1 à 5 mg/j selon sévérité', dose_ar: '1 إلى 5 مغ/يوم حسب الشدة',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: '4 mois minimum', dur_ar: '4 أشهر على الأقل',
    needs_weight: false,
  }),

  // Fer
  t('Sulfate ferreux', 'Anémie ferriprive', 'adult', {
    dose_fr: '1 à 2 comprimés (80 à 160 mg de fer élémentaire)', dose_ar: 'قرص إلى قرصين (80 إلى 160 مغ من الحديد الأولي)',
    freq_fr: '1 à 2 fois par jour à jeun ou entre les repas', freq_ar: 'مرة إلى مرتين يومياً على الريق أو بين الوجبات',
    dur_fr: '3 à 6 mois (après correction de l\'Hb, continuer 3 mois pour reconstituer les réserves)', dur_ar: '3 إلى 6 أشهر (بعد تصحيح Hb، مواصلة 3 أشهر لاستعادة المخزون)',
    warn_fr: 'Peut colorer les selles en noir. Risque de constipation. Prendre avec de la vitamine C pour améliorer l\'absorption. Éviter anti-acides et thé.',
    warn_ar: 'قد يُلوّن البراز بالأسود. خطر إمساك. تناوله مع فيتامين C لتحسين الامتصاص. تجنب مضادات الحموضة والشاي.',
    needs_weight: false,
  }),
  t('Sulfate ferreux', 'Anémie ferriprive chez l\'enfant', 'child', {
    dose_fr: '3 à 6 mg/kg/j de fer élémentaire (sirop ou solution)', dose_ar: '3 إلى 6 مغ/كغ/يوم من الحديد الأولي (شراب أو محلول)',
    freq_fr: '2 à 3 fois par jour entre les repas', freq_ar: 'مرتين إلى 3 مرات يومياً بين الوجبات',
    dur_fr: '3 à 6 mois', dur_ar: '3 إلى 6 أشهر',
    needs_weight: true,
  }),

  // Vitamine B12
  t('Cyanocobalamine (Vit B12)', 'Anémie de Biermer, Carence en B12', 'adult', {
    dose_fr: '1 mg IM (injection intramusculaire)', dose_ar: '1 مغ عضلياً',
    freq_fr: 'J1 à J7: quotidien; puis 1x/semaine pendant 1 mois; puis 1x/mois à vie', freq_ar: 'اليوم 1-7: يومياً؛ ثم مرة أسبوعياً لمدة شهر؛ ثم مرة شهرياً مدى الحياة',
    dur_fr: 'Traitement à vie si anémie de Biermer', dur_ar: 'علاج مدى الحياة في فقر الدم الضار',
    warn_fr: 'Chez le patient végétalien strict: traitement per os (1 mg/j) peut suffire si absorption intestinale intacte.',
    warn_ar: 'عند النباتي الصارم: العلاج الفموي (1 مغ/يوم) قد يكفي إذا كان الامتصاص المعوي سليماً.',
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. ORGANES SENSORIELS (Ophtalmologie)
  // ═══════════════════════════════════════════════════════════════════════════

  // Timolol (glaucome)
  t('Timolol', 'Glaucome à angle ouvert, Hypertonie oculaire', 'adult', {
    dose_fr: '1 goutte de solution à 0.5 %', dose_ar: 'قطرة واحدة من محلول 0.5 %',
    freq_fr: '2 fois par jour dans l\'œil atteint', freq_ar: 'مرتين يومياً في العين المصابة',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Fermer les yeux 5 min après et comprimer le canal lacrymal pour réduire l\'absorption systémique. Contre-indiqué si asthme ou bradycardie.',
    warn_ar: 'غمض العينين 5 دقائق وضغط قناة الدمع لتقليل الامتصاص الجهازي. يمنع في حالة الربو أو بطء القلب.',
    ci: { pregnancy_alert: false },
    needs_weight: false,
  }),

  // Tobramycine collyre
  t('Tobramycine', 'Conjonctivite bactérienne, Kératite superficielle', 'adult', {
    dose_fr: '1 à 2 gouttes de collyre', dose_ar: 'قطرة إلى قطرتان من محلول قطرات العين',
    freq_fr: 'Toutes les 4 heures (phase aiguë), réduire progressivement', freq_ar: 'كل 4 ساعات (المرحلة الحادة)، تخفيض تدريجي',
    dur_fr: '7 à 10 jours', dur_ar: '7 إلى 10 أيام',
    warn_fr: 'Ne pas toucher l\'embout du flacon avec les doigts ou l\'œil. Jeter le flacon 4 semaines après ouverture.',
    warn_ar: 'لا تلمس رأس الزجاجة بالأصابع أو العين. تخلص من الزجاجة 4 أسابيع بعد الفتح.',
    needs_weight: false,
  }),
  t('Tobramycine', 'Conjonctivite bactérienne chez l\'enfant', 'child', {
    dose_fr: '1 goutte de collyre', dose_ar: 'قطرة واحدة',
    freq_fr: 'Toutes les 4 à 6 heures', freq_ar: 'كل 4 إلى 6 ساعات',
    dur_fr: '7 jours', dur_ar: '7 أيام',
    needs_weight: false,
  }),

  // Dexaméthasone collyre
  t('Dexaméthasone', 'Uvéite, Inflammation oculaire post-chirurgicale', 'adult', {
    dose_fr: '1 à 2 gouttes de collyre', dose_ar: 'قطرة إلى قطرتان',
    freq_fr: '4 à 6 fois par jour en phase aiguë', freq_ar: '4 إلى 6 مرات يومياً في المرحلة الحادة',
    dur_fr: '7 à 14 jours, à réduire progressivement', dur_ar: '7 إلى 14 يوماً، مع تخفيض تدريجي',
    warn_fr: 'Usage uniquement sous surveillance ophtalmologique. Surveiller pression intraoculaire.',
    warn_ar: 'استخدام تحت مراقبة طب العيون فقط. مراقبة ضغط العين.',
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. MEDICAMENTS DERMATOLOGIQUES
  // ═══════════════════════════════════════════════════════════════════════════

  // Bétaméthasone crème
  t('Bétaméthasone', 'Eczéma, Dermatite atopique, Psoriasis cutané', 'adult', {
    dose_fr: 'Application fine (crème ou pommade 0.05 ou 0.1%)', dose_ar: 'طبقة رقيقة (كريم أو مرهم 0.05 أو 0.1%)',
    freq_fr: '1 à 2 fois par jour sur les zones affectées', freq_ar: 'مرة إلى مرتين يومياً على المناطق المصابة',
    dur_fr: 'Maximum 2 à 4 semaines en continu (réduire ensuite)', dur_ar: 'أقصى 2 إلى 4 أسابيع باستمرار (ثم التخفيض)',
    warn_fr: 'Éviter le visage, les plis et les organes génitaux. Ne pas occlure. Risque d\'atrophie cutanée si usage prolongé.',
    warn_ar: 'تجنب الوجه والثنيات والأعضاء التناسلية. لا تغطي بضمادة. خطر ضمور الجلد عند الاستخدام الطويل.',
    needs_weight: false,
  }),

  // Clotrimazole topique
  t('Clotrimazole', 'Dermatophytoses, Intertrigo, Candidose cutanée', 'adult', {
    dose_fr: 'Application fine de crème à 1%', dose_ar: 'طبقة رقيقة من الكريم 1%',
    freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً',
    dur_fr: '2 à 4 semaines selon infection', dur_ar: '2 إلى 4 أسابيع حسب العدوى',
    warn_fr: 'Continuer 1 semaine après disparition des signes. Éviter les vêtements synthétiques serrés.',
    warn_ar: 'مواصلة أسبوعاً بعد اختفاء العلامات. تجنب الملابس الاصطناعية الضيقة.',
    needs_weight: false,
  }),

  // Aciclovir topique
  t('Aciclovir (topique)', 'Herpès labial (bouton de fièvre)', 'adult', {
    dose_fr: 'Application de crème à 5% (pea-size) sur la lésion', dose_ar: 'تطبيق كريم 5% (بحجم حبة البازلاء) على الآفة',
    freq_fr: '5 fois par jour (toutes les 4h pendant les heures de veille)', freq_ar: '5 مرات يومياً (كل 4 ساعات أثناء الاستيقاظ)',
    dur_fr: '5 jours', dur_ar: '5 أيام',
    warn_fr: 'Efficace si appliqué dès les premiers symptômes (picotements). Se laver les mains avant et après.',
    warn_ar: 'فعال إذا طُبِّق عند أول الأعراض (وخز). غسل اليدين قبل وبعد التطبيق.',
    needs_weight: false,
  }),

  // Mupirocine
  t('Mupirocine', 'Impétigo, Infections bactériennes cutanées superficielles', 'adult', {
    dose_fr: 'Application de pommade à 2%', dose_ar: 'تطبيق مرهم 2%',
    freq_fr: '3 fois par jour sur les lésions', freq_ar: '3 مرات يومياً على الآفات',
    dur_fr: '5 à 10 jours', dur_ar: '5 إلى 10 أيام',
    warn_fr: 'Couvrir avec un pansement si nécessaire. Éviter le contact avec les yeux.',
    warn_ar: 'تغطية بضمادة إذا لزم. تجنب التلامس مع العينين.',
    needs_weight: false,
  }),
  t('Mupirocine', 'Impétigo chez l\'enfant', 'child', {
    dose_fr: 'Application fine de pommade 2%', dose_ar: 'طبقة رقيقة من مرهم 2%',
    freq_fr: '3 fois par jour', freq_ar: '3 مرات يومياً',
    dur_fr: '7 jours', dur_ar: '7 أيام',
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. SYSTEME GENITO-URINAIRE ET HORMONES SEXUELLES
  // ═══════════════════════════════════════════════════════════════════════════

  // Tamsulosine
  t('Tamsulosine', 'Hypertrophie bénigne de prostate (HBP), dysurie', 'adult', {
    dose_fr: '1 gélule (0.4 mg)', dose_ar: 'كبسولة واحدة (0.4 مغ)',
    freq_fr: '1 fois par jour après le petit-déjeuner', freq_ar: 'مرة واحدة يومياً بعد الفطور',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Risque d\'hypotension orthostatique, surtout en début de traitement. Se lever lentement. Risque d\'intraoperative floppy iris syndrome si chirurgie oculaire prévue.',
    warn_ar: 'خطر انخفاض الضغط عند الوقوف، خاصة في بداية العلاج. انهض ببطء. خطر متلازمة قزحية العمليات إذا كانت جراحة العين مخططة.',
    min_age: 18,
    needs_weight: false,
  }),

  // Finastéride
  t('Finastéride', 'Hypertrophie bénigne de la prostate (HBP)', 'adult', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: 'Traitement au long cours (au moins 6 mois avant réévaluation)', dur_ar: 'علاج طويل الأمد (6 أشهر على الأقل قبل إعادة التقييم)',
    warn_fr: 'Peut réduire le PSA de 50% — tenir compte pour le suivi du PSA. Dysfonction sexuelle possible. Tératogène pour le fœtus mâle (femmes enceintes ne pas manipuler les comprimés).',
    warn_ar: 'قد يخفض PSA بنسبة 50% — يُراعى في متابعة PSA. اضطراب جنسي محتمل. سام للجنين الذكر (تجنب الحوامل لمس الأقراص).',
    min_age: 18,
    needs_weight: false,
  }),

  // Oxybutynine
  t('Oxybutynine', 'Hyperactivité vésicale, Incontinence urinaire d\'urgence', 'adult', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)',
    freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً',
    dur_fr: 'Traitement au long cours, réévaluer après 4 semaines', dur_ar: 'علاج طويل الأمد، إعادة تقييم بعد 4 أسابيع',
    max_daily: '15 mg/j',
    warn_fr: 'Effets anticholinergiques: sécheresse buccale, constipation, rétention urinaire, vision floue. Réduire dose chez sujet âgé.',
    warn_ar: 'آثار مضادة للكولين: جفاف الفم، إمساك، احتباس بول، ضبابية الرؤية. تخفيض الجرعة عند كبار السن.',
    min_age: 18,
    needs_weight: false,
  }),

  // Contraceptifs oraux
  t('Éthinylestradiol + Lévonorgestrel', 'Contraception orale combinée', 'adult', {
    dose_fr: '1 comprimé par jour', dose_ar: 'قرص واحد يومياً',
    freq_fr: 'À heure fixe, sans interruption (21j actifs + 7j placebo selon type)', freq_ar: 'في وقت ثابت، بدون انقطاع (21 يوم فعّال + 7 أيام دواء وهمي حسب النوع)',
    dur_fr: 'Traitement continu selon besoin de contraception', dur_ar: 'علاج مستمر حسب الحاجة لمنع الحمل',
    warn_fr: 'Contre-indiqué si antécédent de TVP/EP, thrombophilie, migraine avec aura, tabagisme > 35 ans. Informer médecin si voyage longue durée.',
    warn_ar: 'يمنع في حالة تاريخ جلطة وريدية، تجلط دموي وراثي، صداع نصفي مع أورة، تدخين فوق 35 سنة.',
    ci: { pregnancy_alert: true },
    min_age: 15,
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. ANTIPARASITAIRES
  // ═══════════════════════════════════════════════════════════════════════════

  // Albendazole
  t('Albendazole', 'Oxyurose, Ascaridose, Ankylostomiase', 'adult', {
    dose_fr: '1 comprimé (400 mg) dose unique', dose_ar: 'قرص واحد (400 مغ) جرعة واحدة',
    freq_fr: 'Dose unique (ou 3 jours si ankylostomiase)', freq_ar: 'جرعة واحدة (أو 3 أيام في حالة الأنكيلوستوما)',
    dur_fr: 'Dose unique (à renouveler après 2 semaines pour oxyurose)', dur_ar: 'جرعة واحدة (تُكرَّر بعد أسبوعين في الأوكسيور)',
    warn_fr: 'Traiter en même temps tous les membres du foyer (oxyurose). Mesures d\'hygiène strictes (ongles, sous-vêtements).',
    warn_ar: 'علاج جميع أفراد الأسرة في نفس الوقت (الأوكسيور). تدابير نظافة صارمة (أظافر، ملابس داخلية).',
    ci: { pregnancy_alert: true },
    needs_weight: false,
  }),
  t('Albendazole', 'Parasitoses chez l\'enfant (oxyurose, ascaris)', 'child', {
    dose_fr: '200 mg (< 2 ans) ou 400 mg (≥ 2 ans), dose unique', dose_ar: '200 مغ (< 2 سنة) أو 400 مغ (≥ 2 سنة)، جرعة واحدة',
    freq_fr: 'Dose unique, à renouveler à J14', freq_ar: 'جرعة واحدة، تُكرَّر في اليوم 14',
    dur_fr: 'Dose unique (renouveler à J14)', dur_ar: 'جرعة واحدة (تكرار في اليوم 14)',
    min_age: 1,
    needs_weight: false,
  }),

  // Métronidazole (parasitaires)
  t('Métronidazole', 'Trichomoniase, Vaginose bactérienne, Giardiase', 'adult', {
    dose_fr: '2 g en dose unique (trichomoniase) ou 500 mg 3x/j (autres)', dose_ar: '2 غ في جرعة واحدة (داء المشعرات) أو 500 مغ 3 مرات/يوم (غيره)',
    freq_fr: 'Dose unique ou 3 fois par jour selon indication', freq_ar: 'جرعة واحدة أو 3 مرات يومياً حسب الحالة',
    dur_fr: 'Dose unique (trichomoniase) ou 5-7j (giardiase, VB)', dur_ar: 'جرعة واحدة (مشعرات) أو 5-7 أيام (جيارديا، VB)',
    warn_fr: 'Alcool STRICTEMENT INTERDIT pendant et 48h après. Traiter le partenaire simultanément pour trichomoniase.',
    warn_ar: 'الكحول محظور تماماً خلال العلاج وبعد 48 ساعة. علاج الشريك في نفس الوقت للمشعرات.',
    ci: { pregnancy_alert: true },
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. ANTINEOPLASIQUES (à titre indicatif — toujours en protocole spécialisé)
  // ═══════════════════════════════════════════════════════════════════════════

  t('Tamoxifène', 'Cancer du sein hormono-dépendant (adjuvant, curatif)', 'adult', {
    dose_fr: '1 comprimé (20 mg)', dose_ar: 'قرص واحد (20 مغ)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: '5 à 10 ans selon recommandation oncologique', dur_ar: '5 إلى 10 سنوات حسب توصيات الأورام',
    warn_fr: 'Risque de cancer de l\'endomètre — consultation gynécologique annuelle. Risque thromboembolique. Contre-indiqué en grossesse.',
    warn_ar: 'خطر سرطان الرحم — استشارة نسائية سنوية. خطر جلطات. يمنع في الحمل.',
    ci: { pregnancy_alert: true },
    min_age: 18,
    needs_weight: false,
    needs_dx: true,
    ref: 'Protocoles oncologiques INCA / ESMO',
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. DIVERS — médicaments très courants en Tunisie
  // ═══════════════════════════════════════════════════════════════════════════

  // Vitamine D
  t('Cholécalciférol (Vitamine D3)', 'Carence en vitamine D, Rachitisme, Ostéoporose', 'adult', {
    dose_fr: '1 ampoule (100 000 UI)', dose_ar: 'أمبولة واحدة (100 000 وحدة دولية)',
    freq_fr: '1 fois par mois à tous les 3 mois selon bilan', freq_ar: 'مرة شهرياً إلى مرة كل 3 أشهر حسب التحاليل',
    dur_fr: 'Variable selon bilan sanguin (25-OH Vit D)', dur_ar: 'متغير حسب تحاليل الدم (25-OH Vit D)',
    warn_fr: 'Contrôle taux sérique (25-OH VitD) avant et après traitement. Surdosage possible.',
    warn_ar: 'مراقبة المستوى في الدم (25-OH VitD) قبل العلاج وبعده. الجرعة الزائدة ممكنة.',
    needs_weight: false,
  }),
  t('Cholécalciférol (Vitamine D3)', 'Rachitisme et prévention carence chez le nourrisson', 'child', {
    dose_fr: '400 à 1000 UI/j (gouttes) ou 200 000 UI/trimestre', dose_ar: '400 إلى 1000 وحدة دولية/يوم (قطرات) أو 200 000 وحدة دولية كل 3 أشهر',
    freq_fr: '1 fois par jour (si quotidien) ou tous les 3 mois', freq_ar: 'مرة يومياً (إذا يومياً) أو كل 3 أشهر',
    dur_fr: 'Les 2 premières années de vie (prévention), plus si carence', dur_ar: 'السنتان الأولتان (وقاية)، أطول عند العوز',
    needs_weight: false,
    min_age: 0,
  }),

  // Calcium
  t('Calcium (carbonate de calcium)', 'Ostéoporose (en association avec VitD), Hypocalcémie', 'adult', {
    dose_fr: '1 comprimé (1000 mg de calcium élémentaire)', dose_ar: 'قرص واحد (1000 مغ من الكالسيوم الأولي)',
    freq_fr: '1 fois par jour au cours du repas', freq_ar: 'مرة واحدة يومياً أثناء الأكل',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Éviter de prendre en même temps que lévothyroxine, fer, antibiotiques (espacer de 2h). Risque rénal si doses élevées.',
    warn_ar: 'تجنب أخذه مع ليفوثيروكسين والحديد والمضادات الحيوية (تباعد بساعتين). خطر كلوي بجرعات مرتفعة.',
    needs_weight: false,
  }),

  // Magnésium
  t('Magnésium', 'Carence en magnésium, Crampes musculaires, Fatigue', 'adult', {
    dose_fr: '1 à 2 gélules (100 à 300 mg de Mg élémentaire)', dose_ar: 'كبسولة إلى كبسولتان (100 إلى 300 مغ من المغنيسيوم الأولي)',
    freq_fr: '1 à 2 fois par jour au cours des repas', freq_ar: 'مرة إلى مرتين يومياً أثناء الوجبات',
    dur_fr: '1 à 2 mois', dur_ar: 'شهر إلى شهرين',
    warn_fr: 'Peut provoquer des diarrhées si forte dose. Réduire chez l\'insuffisant rénal.',
    warn_ar: 'قد يسبب إسهالاً بجرعة مرتفعة. تخفيض عند القصور الكلوي.',
    ci: { renal_alert: true },
    needs_weight: false,
  }),

  // Zinc
  t('Zinc', 'Carence en zinc, Immunostimulation, Diarrhée aiguë (pédiatrie)', 'adult', {
    dose_fr: '1 comprimé (15 à 30 mg de Zn élémentaire)', dose_ar: 'قرص واحد (15 إلى 30 مغ من الزنك الأولي)',
    freq_fr: '1 fois par jour, loin des repas ou entre les repas', freq_ar: 'مرة واحدة يومياً، بعيداً عن الوجبات أو بينها',
    dur_fr: '2 à 4 semaines', dur_ar: 'أسبوعان إلى 4 أسابيع',
    warn_fr: 'Espacement avec fer et calcium (2h). Peut provoquer nausées si pris à jeun.',
    warn_ar: 'تباعد مع الحديد والكالسيوم (ساعتان). قد يسبب غثياناً إذا أُخذ على الريق.',
    needs_weight: false,
  }),
  t('Zinc', 'Diarrhée aiguë chez l\'enfant (≥ 6 mois)', 'child', {
    dose_fr: '10 mg/j (< 5 ans) ou 20 mg/j (≥ 5 ans)', dose_ar: '10 مغ/يوم (< 5 سنوات) أو 20 مغ/يوم (≥ 5 سنوات)',
    freq_fr: '1 fois par jour', freq_ar: 'مرة واحدة يومياً',
    dur_fr: '10 à 14 jours (en complément de la réhydratation)', dur_ar: '10 إلى 14 يوماً (إضافة إلى إعادة الترطيب)',
    warn_fr: 'Toujours associer à la SRO (solution de réhydratation orale).',
    warn_ar: 'يُدمج دائماً مع محاليل الإماهة الفموية.',
    min_age: 0.5,
    needs_weight: false,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. EXTENSION PRIORITAIRE — pratique ambulatoire tunisienne
  // Tous ces modèles restent en statut draft jusqu'à validation clinique locale.
  // ═══════════════════════════════════════════════════════════════════════════

  t('Esoméprazole', 'Reflux gastro-œsophagien et œsophagite', 'adult', {
    dose_fr: '1 comprimé ou gélule gastro-résistante (20 mg)', dose_ar: 'قرص أو كبسولة مقاومة للمعدة (20 مغ)',
    freq_fr: '1 fois par jour, 30 minutes avant le repas', freq_ar: 'مرة يومياً، 30 دقيقة قبل الأكل',
    dur_fr: '4 semaines, à réévaluer (4 à 8 semaines si œsophagite)', dur_ar: '4 أسابيع مع إعادة التقييم (4 إلى 8 أسابيع عند التهاب المريء)',
    max_daily: '40 mg/j hors indication spécialisée',
    warn_fr: 'Réévaluer toute utilisation prolongée. Rechercher une carence en magnésium/B12 et le risque infectieux si traitement chronique.',
    warn_ar: 'إعادة تقييم الاستعمال المطول. مراقبة نقص المغنيسيوم وفيتامين B12 وخطر العدوى عند العلاج المزمن.',
    needs_weight: false, needs_dx: true,
    ref: 'RCP Esoméprazole — EMA/eMC, section 4.2',
  }),

  t('Glimepiride', 'Diabète de type 2 insuffisamment contrôlé par mesures hygiéno-diététiques', 'adult', {
    dose_fr: '1 comprimé (1 mg) en initiation', dose_ar: 'قرص واحد (1 مغ) كجرعة بداية',
    freq_fr: '1 fois par jour juste avant ou pendant le premier repas principal', freq_ar: 'مرة يومياً قبل أو أثناء أول وجبة رئيسية',
    dur_fr: 'Traitement au long cours, titration selon glycémie', dur_ar: 'علاج طويل الأمد، تعدل الجرعة حسب سكر الدم',
    max_daily: '6 mg/j',
    warn_fr: 'Risque d’hypoglycémie. Ne pas sauter de repas. Prudence chez le sujet âgé et en insuffisance rénale ou hépatique.',
    warn_ar: 'خطر هبوط سكر الدم. عدم تفويت الوجبات. الحذر لدى المسنين وعند القصور الكلوي أو الكبدي.',
    ci: { renal_alert: true, hepatic_alert: true, pregnancy_alert: true },
    needs_weight: false, needs_dx: true,
    ref: 'RCP Glimepiride — eMC, section 4.2',
  }),

  t('Gliclazide', 'Diabète de type 2 — forme à libération modifiée 30 mg', 'adult', {
    dose_fr: '1 comprimé LP (30 mg) en initiation', dose_ar: 'قرص ممتد المفعول (30 مغ) كجرعة بداية',
    freq_fr: '1 fois par jour au petit-déjeuner', freq_ar: 'مرة يومياً مع فطور الصباح',
    dur_fr: 'Traitement au long cours, titration progressive', dur_ar: 'علاج طويل الأمد مع زيادة تدريجية',
    max_daily: '120 mg/j pour la forme LP',
    warn_fr: 'Valable uniquement pour la forme LP 30 mg. Risque d’hypoglycémie; avaler entier et ne pas sauter le repas.',
    warn_ar: 'خاص فقط بالشكل ممتد المفعول 30 مغ. خطر هبوط السكر؛ يبلع كاملاً ولا تفوت الوجبة.',
    ci: { renal_alert: true, hepatic_alert: true, pregnancy_alert: true },
    needs_weight: false, needs_dx: true,
    ref: 'RCP Gliclazide LP 30 mg — eMC, section 4.2',
  }),

  t('Sitagliptine', 'Diabète de type 2', 'adult', {
    dose_fr: '1 comprimé (100 mg)', dose_ar: 'قرص واحد (100 مغ)',
    freq_fr: '1 fois par jour, avec ou sans repas', freq_ar: 'مرة يومياً مع أو بدون طعام',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    max_daily: '100 mg/j',
    warn_fr: 'Adapter à la fonction rénale (50 mg/j ou 25 mg/j selon DFG). Suspendre et évaluer si suspicion de pancréatite.',
    warn_ar: 'تعديل الجرعة حسب وظائف الكلى (50 أو 25 مغ/يوم). يوقف ويقيّم عند الاشتباه في التهاب البنكرياس.',
    ci: { renal_alert: true, pregnancy_alert: true },
    needs_weight: false, needs_dx: true,
    ref: 'RCP Sitagliptine — EMA, section 4.2',
  }),

  t('Acarbose', 'Diabète de type 2 avec hyperglycémie post-prandiale', 'adult', {
    dose_fr: '1 comprimé (50 mg) en initiation', dose_ar: 'قرص واحد (50 مغ) كجرعة بداية',
    freq_fr: '3 fois par jour avec la première bouchée de chaque repas', freq_ar: '3 مرات يومياً مع أول لقمة من كل وجبة',
    dur_fr: 'Traitement au long cours, augmentation progressive', dur_ar: 'علاج طويل الأمد مع زيادة تدريجية',
    max_daily: '300 mg/j',
    warn_fr: 'Augmenter progressivement pour limiter flatulences et diarrhée. Une hypoglycémie associée doit être corrigée par glucose, pas saccharose.',
    warn_ar: 'زيادة الجرعة تدريجياً لتقليل الغازات والإسهال. يعالج هبوط السكر بالغلوكوز وليس السكروز.',
    ci: { renal_alert: true, hepatic_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Acarbose — eMC, section 4.2',
  }),

  t('Rosuvastatine', 'Hypercholestérolémie et prévention cardiovasculaire', 'adult', {
    dose_fr: '1 comprimé (5 à 10 mg) en initiation', dose_ar: 'قرص واحد (5 إلى 10 مغ) كجرعة بداية',
    freq_fr: '1 fois par jour, à heure fixe', freq_ar: 'مرة يومياً في وقت ثابت',
    dur_fr: 'Traitement au long cours avec contrôle lipidique', dur_ar: 'علاج طويل الأمد مع مراقبة الدهون',
    max_daily: '40 mg/j uniquement sous surveillance spécialisée',
    warn_fr: 'Contrôler transaminases; signaler douleurs ou faiblesse musculaire. Adapter en insuffisance rénale et éviter pendant grossesse/allaitement.',
    warn_ar: 'مراقبة إنزيمات الكبد والإبلاغ عن ألم أو ضعف عضلي. تعديلها في القصور الكلوي وتجنبها أثناء الحمل والرضاعة.',
    ci: { pregnancy_alert: true, renal_alert: true, hepatic_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Rosuvastatine — EMA/eMC, section 4.2',
  }),

  t('Irbésartan', 'Hypertension artérielle', 'adult', {
    dose_fr: '1 comprimé (150 mg)', dose_ar: 'قرص واحد (150 مغ)', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد', max_daily: '300 mg/j',
    warn_fr: 'Contrôler pression artérielle, créatinine et kaliémie. Contre-indiqué pendant la grossesse.',
    warn_ar: 'مراقبة الضغط والكرياتينين والبوتاسيوم. يمنع أثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Irbésartan — EMA, section 4.2',
  }),

  t('Valsartan', 'Hypertension artérielle', 'adult', {
    dose_fr: '1 comprimé (80 mg)', dose_ar: 'قرص واحد (80 مغ)', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد', max_daily: '320 mg/j pour l’HTA',
    warn_fr: 'Contrôler pression artérielle, créatinine et kaliémie. Contre-indiqué pendant la grossesse.',
    warn_ar: 'مراقبة الضغط والكرياتينين والبوتاسيوم. يمنع أثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Valsartan — EMA, section 4.2',
  }),

  t('Captopril', 'Hypertension artérielle', 'adult', {
    dose_fr: '1 comprimé (25 mg) en initiation', dose_ar: 'قرص واحد (25 مغ) كجرعة بداية',
    freq_fr: '2 fois par jour, 1 heure avant les repas', freq_ar: 'مرتين يومياً، ساعة قبل الطعام',
    dur_fr: 'Traitement au long cours, titration selon réponse', dur_ar: 'علاج طويل الأمد وتعديل حسب الاستجابة', max_daily: '150 mg/j',
    warn_fr: 'Contrôler créatinine et kaliémie. Risque de toux et d’angiœdème. Contre-indiqué pendant la grossesse.',
    warn_ar: 'مراقبة الكرياتينين والبوتاسيوم. خطر السعال والوذمة الوعائية. يمنع أثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Captopril — eMC, section 4.2',
  }),

  t('Candésartan cilexétil', 'Hypertension artérielle', 'adult', {
    dose_fr: '1 comprimé (8 mg)', dose_ar: 'قرص واحد (8 مغ)', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد', max_daily: '32 mg/j',
    warn_fr: 'Contrôler pression artérielle, créatinine et kaliémie. Contre-indiqué pendant la grossesse.',
    warn_ar: 'مراقبة الضغط والكرياتينين والبوتاسيوم. يمنع أثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Candésartan cilexétil — EMA/eMC, section 4.2',
  }),

  t('Spironolactone', 'Insuffisance cardiaque avec fraction d’éjection réduite ou œdèmes', 'adult', {
    dose_fr: '1 comprimé (25 mg)', dose_ar: 'قرص واحد (25 مغ)', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً',
    dur_fr: 'Traitement au long cours sous surveillance biologique', dur_ar: 'علاج طويل الأمد مع مراقبة التحاليل', max_daily: '50 mg/j dans l’insuffisance cardiaque',
    warn_fr: 'Contrôler kaliémie et fonction rénale avant traitement, après 1 semaine puis régulièrement. Risque d’hyperkaliémie.',
    warn_ar: 'مراقبة البوتاسيوم ووظائف الكلى قبل العلاج وبعد أسبوع ثم دورياً. خطر ارتفاع البوتاسيوم.',
    ci: { renal_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Spironolactone — eMC, section 4.2',
  }),

  t('Indapamide', 'Hypertension artérielle — forme LP 1,5 mg', 'adult', {
    dose_fr: '1 comprimé LP (1,5 mg)', dose_ar: 'قرص ممتد المفعول (1.5 مغ)', freq_fr: '1 fois par jour le matin', freq_ar: 'مرة يومياً صباحاً',
    dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد', max_daily: '1,5 mg/j pour la forme LP',
    warn_fr: 'Valable pour la forme LP. Contrôler sodium, potassium, fonction rénale et uricémie.',
    warn_ar: 'خاص بالشكل ممتد المفعول. مراقبة الصوديوم والبوتاسيوم ووظائف الكلى وحمض اليوريك.',
    ci: { renal_alert: true, hepatic_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Indapamide LP — eMC, section 4.2',
  }),

  t('Famotidine', 'Reflux gastro-œsophagien ou ulcère gastro-duodénal', 'adult', {
    dose_fr: '1 comprimé (20 mg)', dose_ar: 'قرص واحد (20 مغ)', freq_fr: '2 fois par jour', freq_ar: 'مرتين يومياً',
    dur_fr: '4 à 8 semaines selon indication', dur_ar: '4 إلى 8 أسابيع حسب الحالة', max_daily: '40 mg/j en usage courant',
    warn_fr: 'Réduire la dose ou espacer les prises en insuffisance rénale.', warn_ar: 'تخفيض الجرعة أو تباعدها عند القصور الكلوي.',
    ci: { renal_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Famotidine — eMC, section 4.2',
  }),

  t('Desloratadine', 'Rhinite allergique et urticaire', 'adult', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً',
    dur_fr: 'Selon durée des symptômes, à réévaluer', dur_ar: 'حسب مدة الأعراض مع إعادة التقييم', max_daily: '5 mg/j',
    warn_fr: 'Prudence en insuffisance rénale sévère. Une somnolence reste possible.', warn_ar: 'الحذر في القصور الكلوي الشديد. قد يحدث النعاس.',
    ci: { renal_alert: true }, needs_weight: false,
    ref: 'RCP Desloratadine — EMA, section 4.2',
  }),

  t('Lévocétirizine', 'Rhinite allergique et urticaire', 'adult', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)', freq_fr: '1 fois par jour le soir', freq_ar: 'مرة يومياً مساءً',
    dur_fr: 'Selon durée des symptômes, à réévaluer', dur_ar: 'حسب مدة الأعراض مع إعادة التقييم', max_daily: '5 mg/j',
    warn_fr: 'Adapter à la fonction rénale. Risque de somnolence; éviter alcool et conduite si affecté.', warn_ar: 'تعديلها حسب وظائف الكلى. خطر النعاس؛ تجنب الكحول والقيادة عند التأثر.',
    ci: { renal_alert: true }, needs_weight: false,
    ref: 'RCP Lévocétirizine — EMA/eMC, section 4.2',
  }),

  t('Budésonide', 'Asthme persistant — poudre ou aérosol inhalé', 'adult', {
    dose_fr: '200 à 400 microgrammes par inhalation selon le dispositif', dose_ar: '200 إلى 400 ميكروغرام بالاستنشاق حسب الجهاز',
    freq_fr: '2 fois par jour', freq_ar: 'مرتين يومياً', dur_fr: 'Traitement de fond continu, palier à réévaluer', dur_ar: 'علاج وقائي مستمر مع إعادة تقييم المرحلة',
    warn_fr: 'La dose dépend du dispositif. Rincer la bouche après chaque prise. Ne traite pas la crise aiguë.', warn_ar: 'تعتمد الجرعة على الجهاز. مضمضة الفم بعد كل جرعة. لا يعالج النوبة الحادة.',
    needs_weight: false, needs_dx: true,
    ref: 'RCP Budésonide inhalé — EMA/eMC, section 4.2',
  }),

  t('Fluticasone', 'Rhinite allergique — spray nasal 50 microgrammes/dose', 'adult', {
    dose_fr: '2 pulvérisations dans chaque narine', dose_ar: 'بختان في كل فتحة أنف', freq_fr: '1 fois par jour, puis réduire à la dose minimale efficace', freq_ar: 'مرة يومياً ثم التخفيض لأقل جرعة فعالة',
    dur_fr: 'Pendant la période symptomatique', dur_ar: 'خلال فترة الأعراض', max_daily: '200 microgrammes/j pour le spray 50 microgrammes/dose',
    warn_fr: 'Vérifier la présentation et la concentration. Orienter le jet à l’opposé de la cloison nasale.', warn_ar: 'التحقق من الشكل والتركيز. توجيه الرش بعيداً عن الحاجز الأنفي.',
    needs_weight: false,
    ref: 'RCP Fluticasone nasale — eMC, section 4.2',
  }),

  t('Mométasone', 'Rhinite allergique — spray nasal 50 microgrammes/dose', 'adult', {
    dose_fr: '2 pulvérisations dans chaque narine', dose_ar: 'بختان في كل فتحة أنف', freq_fr: '1 fois par jour, puis réduire à la dose minimale efficace', freq_ar: 'مرة يومياً ثم التخفيض لأقل جرعة فعالة',
    dur_fr: 'Pendant la période symptomatique', dur_ar: 'خلال فترة الأعراض', max_daily: '200 microgrammes/j',
    warn_fr: 'Vérifier la concentration. Orienter le jet à l’opposé de la cloison; surveiller épistaxis et irritation.', warn_ar: 'التحقق من التركيز. توجيه الرش بعيداً عن الحاجز ومراقبة الرعاف والتهيج.',
    needs_weight: false,
    ref: 'RCP Mométasone nasale — EMA/eMC, section 4.2',
  }),

  t('Acide fusidique', 'Infection cutanée bactérienne localisée sensible', 'adult', {
    dose_fr: 'Appliquer une fine couche sur la zone atteinte', dose_ar: 'وضع طبقة رقيقة على المنطقة المصابة', freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً',
    dur_fr: '5 à 7 jours, réévaluation si absence d’amélioration', dur_ar: '5 إلى 7 أيام مع إعادة التقييم إذا لم يحدث تحسن',
    warn_fr: 'Réserver aux infections localisées documentées ou très probables. Éviter les traitements prolongés pour limiter la résistance.', warn_ar: 'يقتصر على العدوى الموضعية المؤكدة أو المرجحة. تجنب العلاج المطول للحد من المقاومة.',
    needs_weight: false, needs_dx: true,
    ref: 'RCP Acide fusidique topique — eMC, sections 4.1–4.2',
  }),

  t('Terbinafine', 'Dermatophytie cutanée étendue nécessitant une voie orale', 'adult', {
    dose_fr: '1 comprimé (250 mg)', dose_ar: 'قرص واحد (250 مغ)', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً',
    dur_fr: '2 à 4 semaines selon localisation; onychomycose: protocole distinct', dur_ar: '2 إلى 4 أسابيع حسب الموضع؛ فطريات الأظافر لها بروتوكول منفصل', max_daily: '250 mg/j',
    warn_fr: 'Confirmer l’indication mycologique. Contrôler la fonction hépatique avant traitement; arrêter si signes d’atteinte hépatique.', warn_ar: 'تأكيد التشخيص الفطري. فحص وظائف الكبد قبل العلاج وإيقافه عند علامات أذية كبدية.',
    ci: { hepatic_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Terbinafine 250 mg — eMC, section 4.2',
  }),

  t('Éconazole nitrate', 'Mycose cutanée superficielle', 'adult', {
    dose_fr: 'Appliquer une fine couche sur peau propre et sèche', dose_ar: 'وضع طبقة رقيقة على جلد نظيف وجاف', freq_fr: '2 fois par jour', freq_ar: 'مرتين يومياً',
    dur_fr: '2 à 4 semaines selon localisation', dur_ar: '2 إلى 4 أسابيع حسب الموضع',
    warn_fr: 'Poursuivre quelques jours après disparition clinique selon le RCP. Réévaluer si échec ou irritation importante.', warn_ar: 'الاستمرار بضعة أيام بعد زوال الأعراض حسب النشرة. إعادة التقييم عند الفشل أو التهيج الشديد.',
    needs_weight: false, needs_dx: true,
    ref: 'RCP Éconazole topique — eMC, section 4.2',
  }),

  t('Célécoxib', 'Douleur arthrosique chez l’adulte sans contre-indication cardiovasculaire', 'adult', {
    dose_fr: '1 gélule (100 mg)', dose_ar: 'كبسولة واحدة (100 مغ)', freq_fr: '2 fois par jour, ou 200 mg une fois par jour', freq_ar: 'مرتين يومياً، أو 200 مغ مرة واحدة يومياً',
    dur_fr: 'Durée la plus courte possible, réévaluation rapide', dur_ar: 'أقصر مدة ممكنة مع إعادة تقييم سريعة', max_daily: '400 mg/j',
    warn_fr: 'Utiliser la dose minimale efficace. Risques cardiovasculaire, digestif et rénal; éviter avec un autre AINS et pendant la grossesse.', warn_ar: 'استعمال أقل جرعة فعالة. مخاطر قلبية وهضمية وكلوية؛ تجنب مشاركته مع مضاد التهاب آخر وأثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true, hepatic_alert: true }, needs_weight: false, needs_dx: true,
    ref: 'RCP Célécoxib — EMA/eMC, section 4.2',
  }),

  t('Trimebutine', 'Troubles fonctionnels intestinaux symptomatiques', 'adult', {
    dose_fr: '1 comprimé (100 à 200 mg selon présentation)', dose_ar: 'قرص واحد (100 إلى 200 مغ حسب الشكل)', freq_fr: '3 fois par jour avant les repas', freq_ar: '3 مرات يومياً قبل الوجبات',
    dur_fr: 'Traitement court, à réévaluer', dur_ar: 'علاج قصير مع إعادة التقييم', max_daily: '600 mg/j',
    warn_fr: 'Traitement symptomatique uniquement. Rechercher un signe d’alarme digestif avant renouvellement.', warn_ar: 'علاج للأعراض فقط. البحث عن علامات إنذار هضمية قبل التجديد.',
    needs_weight: false, needs_dx: true,
    ref: 'RCP Trimébutine — section 4.2',
  }),

  t('Polyéthylène glycol', 'Constipation fonctionnelle', 'adult', {
    dose_fr: '1 sachet (en général 10 à 17 g selon présentation)', dose_ar: 'كيس واحد (عادة 10 إلى 17 غ حسب الشكل)', freq_fr: '1 fois par jour, à ajuster selon réponse', freq_ar: 'مرة يومياً وتعدل حسب الاستجابة',
    dur_fr: 'Quelques jours à quelques semaines avec réévaluation', dur_ar: 'عدة أيام إلى أسابيع مع إعادة التقييم',
    warn_fr: 'Vérifier le dosage du sachet et maintenir une hydratation suffisante. Écarter une occlusion en cas de douleur ou vomissements.', warn_ar: 'التحقق من جرعة الكيس والحفاظ على الترطيب. استبعاد الانسداد عند الألم أو القيء.',
    needs_weight: false,
    ref: 'RCP Macrogol/Polyéthylène glycol — eMC, section 4.2',
  }),

  // Anti-infectieux prioritaires — indication et durée toujours à confirmer.
  t('Céfuroxime', 'Infection ORL ou respiratoire documentée/suspectée sensible — forme axétil orale', 'adult', {
    dose_fr: '1 comprimé (250 mg; 500 mg si infection sévère selon RCP)', dose_ar: 'قرص واحد (250 مغ؛ 500 مغ في العدوى الشديدة حسب النشرة)',
    freq_fr: '2 fois par jour après les repas', freq_ar: 'مرتين يومياً بعد الطعام', dur_fr: '5 à 10 jours selon foyer et recommandations', dur_ar: '5 إلى 10 أيام حسب موضع العدوى والتوصيات',
    max_daily: '1 g/j', warn_fr: 'Vérifier allergie aux bêta-lactamines, indication, fonction rénale et écologie locale. Ne concerne pas la forme injectable.', warn_ar: 'التحقق من حساسية البيتا لاكتام والاستطباب ووظائف الكلى والمقاومة المحلية. لا يخص الشكل الحقني.',
    ci: { renal_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Céfuroxime axétil — eMC, section 4.2',
  }),

  t('Céfixime', 'Infection bactérienne à germe sensible lorsque la céfixime est indiquée', 'adult', {
    dose_fr: '400 mg par jour', dose_ar: '400 مغ يومياً', freq_fr: '1 fois par jour ou 200 mg toutes les 12 heures', freq_ar: 'مرة يومياً أو 200 مغ كل 12 ساعة',
    dur_fr: 'Selon foyer et recommandations locales', dur_ar: 'حسب موضع العدوى والتوصيات المحلية', max_daily: '400 mg/j',
    warn_fr: 'Confirmer l’indication; adapter à la fonction rénale. Vérifier allergie aux céphalosporines/pénicillines et risque de colite à C. difficile.', warn_ar: 'تأكيد الاستطباب وتعديل الجرعة حسب الكلى. التحقق من الحساسية وخطر التهاب القولون بالمطثية العسيرة.',
    ci: { renal_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Céfixime — eMC, section 4.2',
  }),

  t('Céfadroxil', 'Infection cutanée, ORL ou urinaire à germe sensible', 'adult', {
    dose_fr: '1 g par jour', dose_ar: '1 غ يومياً', freq_fr: '1 fois par jour ou 500 mg toutes les 12 heures', freq_ar: 'مرة يومياً أو 500 مغ كل 12 ساعة',
    dur_fr: 'Selon foyer; au moins 10 jours si infection à streptocoque A', dur_ar: 'حسب موضع العدوى؛ 10 أيام على الأقل عند العقديات A', max_daily: '2 g/j selon indication',
    warn_fr: 'Adapter à la fonction rénale. Vérifier allergie aux bêta-lactamines et documentation microbiologique.', warn_ar: 'تعديل الجرعة حسب الكلى والتحقق من حساسية البيتا لاكتام والزرع الجرثومي.',
    ci: { renal_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Céfadroxil — eMC, section 4.2',
  }),

  t('Cefpodoxime', 'Infection ORL ou respiratoire à germe sensible — forme orale', 'adult', {
    dose_fr: '1 comprimé (100 à 200 mg selon indication)', dose_ar: 'قرص واحد (100 إلى 200 مغ حسب الاستطباب)', freq_fr: '2 fois par jour au cours des repas', freq_ar: 'مرتين يومياً أثناء الطعام',
    dur_fr: '5 à 10 jours selon foyer', dur_ar: '5 إلى 10 أيام حسب موضع العدوى', max_daily: '400 mg/j en usage courant',
    warn_fr: 'Confirmer indication et sensibilité; adapter à la fonction rénale. Vérifier allergie aux bêta-lactamines.', warn_ar: 'تأكيد الاستطباب والحساسية وتعديل الجرعة حسب الكلى والتحقق من حساسية البيتا لاكتام.',
    ci: { renal_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Cefpodoxime proxétil — eMC, section 4.2',
  }),

  t('Cotrimoxazole', 'Infection à germe sensible justifiant triméthoprime-sulfaméthoxazole', 'adult', {
    dose_fr: '1 comprimé forte dose (160 mg/800 mg)', dose_ar: 'قرص قوي واحد (160 مغ/800 مغ)', freq_fr: '2 fois par jour après les repas', freq_ar: 'مرتين يومياً بعد الطعام',
    dur_fr: 'Selon indication et documentation microbiologique', dur_ar: 'حسب الاستطباب والزرع الجرثومي',
    warn_fr: 'Adapter à la fonction rénale. Risques d’hyperkaliémie, cytopénie et réaction cutanée grave; interactions avec AVK, méthotrexate et IEC/ARA2.', warn_ar: 'تعديلها حسب الكلى. خطر ارتفاع البوتاسيوم ونقص خلايا الدم وتفاعلات جلدية خطيرة؛ تداخلات مع مضادات التخثر والميثوتركسات وأدوية الضغط.',
    ci: { renal_alert: true, hepatic_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Cotrimoxazole — eMC, sections 4.2–4.5',
  }),

  t('Valaciclovir', 'Zona chez l’adulte immunocompétent', 'adult', {
    dose_fr: '1 g', dose_ar: '1 غ', freq_fr: '3 fois par jour', freq_ar: '3 مرات يومياً', dur_fr: '7 jours, débuter le plus tôt possible', dur_ar: '7 أيام، يبدأ بأسرع وقت ممكن', max_daily: '3 g/j',
    warn_fr: 'Hydratation suffisante et adaptation rénale obligatoire. Les schémas herpès génital/labial sont différents.', warn_ar: 'ترطيب كافٍ وتعديل إلزامي حسب الكلى. نظم الهربس التناسلي أو الشفوي مختلفة.',
    ci: { renal_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Valaciclovir — eMC, section 4.2',
  }),

  t('Spiramycine', 'Infection à germe sensible lorsque la spiramycine est recommandée', 'adult', {
    dose_fr: '3 millions UI', dose_ar: '3 ملايين وحدة دولية', freq_fr: '2 à 3 fois par jour', freq_ar: 'مرتين إلى 3 مرات يومياً', dur_fr: 'Selon foyer et recommandations', dur_ar: 'حسب موضع العدوى والتوصيات',
    warn_fr: 'Ne pas appliquer ce modèle à la toxoplasmose gravidique, qui relève d’un protocole spécialisé. Vérifier QT et interactions.', warn_ar: 'لا يطبق هذا النموذج على داء المقوسات أثناء الحمل فهو يتطلب بروتوكولاً متخصصاً. التحقق من QT والتداخلات.',
    ci: { hepatic_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Spiramycine — section 4.2',
  }),

  t('Lévofloxacine', 'Infection bactérienne documentée lorsque les alternatives usuelles sont inappropriées', 'adult', {
    dose_fr: '1 comprimé (500 mg)', dose_ar: 'قرص واحد (500 مغ)', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً', dur_fr: 'Selon foyer, antibiogramme et recommandations', dur_ar: 'حسب موضع العدوى والمضاد الحيوي والتوصيات', max_daily: '500 mg/j en usage courant',
    warn_fr: 'Réserver aux indications justifiées. Adapter à la fonction rénale. Arrêter si douleur tendineuse, neuropathie ou effet neuropsychiatrique; risques QT et anévrisme.', warn_ar: 'يقتصر على الاستطبابات المبررة ويعدل حسب الكلى. يوقف عند ألم الأوتار أو الاعتلال العصبي أو أعراض نفسية؛ مخاطر QT وتمدد الأوعية.',
    ci: { renal_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Lévofloxacine — EMA/eMC, sections 4.2–4.4',
  }),

  t('Oseltamivir', 'Traitement d’une grippe suspectée ou confirmée, début idéalement dans les 48 heures', 'adult', {
    dose_fr: '1 gélule (75 mg)', dose_ar: 'كبسولة واحدة (75 مغ)', freq_fr: '2 fois par jour', freq_ar: 'مرتين يومياً', dur_fr: '5 jours', dur_ar: '5 أيام', max_daily: '150 mg/j',
    warn_fr: 'Adapter à la fonction rénale. Le bénéfice dépend du délai, du terrain et de la circulation virale; surveiller effets neuropsychiatriques rares.', warn_ar: 'تعديل الجرعة حسب الكلى. تعتمد الفائدة على سرعة البدء وحالة المريض وانتشار الفيروس؛ مراقبة آثار نفسية عصبية نادرة.',
    ci: { renal_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Oseltamivir — EMA, section 4.2',
  }),

  // Haut risque — indication explicite, titration et surveillance obligatoires.
  t('Prégabaline', 'Douleur neuropathique périphérique ou centrale', 'adult', {
    dose_fr: '75 mg', dose_ar: '75 مغ', freq_fr: '2 fois par jour en initiation', freq_ar: 'مرتين يومياً كجرعة بداية',
    dur_fr: 'Réévaluation précoce; arrêt progressif sur au moins 1 semaine', dur_ar: 'إعادة تقييم مبكرة؛ الإيقاف تدريجياً خلال أسبوع على الأقل', max_daily: '600 mg/j uniquement après titration',
    warn_fr: 'Adapter strictement à la clairance rénale. Risques de somnolence, chutes, œdèmes, dépendance et dépression respiratoire avec opioïdes.', warn_ar: 'تعديل صارم حسب تصفية الكلى. مخاطر النعاس والسقوط والوذمة والاعتماد وتثبيط التنفس مع الأفيونات.',
    ci: { renal_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Prégabaline — EMA, sections 4.2–4.4',
  }),

  t('Escitalopram', 'Épisode dépressif majeur chez l’adulte', 'adult', {
    dose_fr: '1 comprimé (10 mg)', dose_ar: 'قرص واحد (10 مغ)', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً',
    dur_fr: 'Réévaluation à 2–4 semaines; poursuivre au moins 6 mois après rémission selon situation', dur_ar: 'إعادة التقييم بعد 2–4 أسابيع والاستمرار 6 أشهر على الأقل بعد التحسن حسب الحالة', max_daily: '20 mg/j',
    warn_fr: 'Surveiller risque suicidaire initial, syndrome sérotoninergique, hyponatrémie et QT. Arrêt progressif; dose réduite chez le sujet âgé ou insuffisant hépatique.', warn_ar: 'مراقبة خطر الانتحار في البداية ومتلازمة السيروتونين ونقص الصوديوم وQT. الإيقاف تدريجي وخفض الجرعة للمسن أو القصور الكبدي.',
    ci: { hepatic_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Escitalopram — EMA/eMC, sections 4.2–4.4',
  }),

  t('Olanzapine', 'Schizophrénie — initiation adulte', 'adult', {
    dose_fr: '5 à 10 mg', dose_ar: '5 إلى 10 مغ', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً',
    dur_fr: 'Selon évaluation psychiatrique spécialisée', dur_ar: 'حسب تقييم اختصاصي الطب النفسي', max_daily: '20 mg/j',
    warn_fr: 'Prescription psychiatrique avec surveillance poids/IMC, glycémie, lipides, tension et symptômes extrapyramidaux. Prudence sédation et QT.', warn_ar: 'وصفة نفسية مع مراقبة الوزن والسكر والدهون والضغط والأعراض خارج الهرمية. الحذر من النعاس وQT.',
    ci: { hepatic_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Olanzapine — EMA, sections 4.2–4.4',
  }),

  t('Risperidone', 'Schizophrénie — initiation adulte', 'adult', {
    dose_fr: '2 mg le premier jour, puis titration individualisée', dose_ar: '2 مغ في اليوم الأول ثم زيادة فردية', freq_fr: '1 à 2 prises par jour selon tolérance', freq_ar: 'مرة إلى مرتين يومياً حسب التحمل',
    dur_fr: 'Selon évaluation psychiatrique spécialisée', dur_ar: 'حسب تقييم اختصاصي الطب النفسي', max_daily: '6 mg/j en pratique courante sans justification spécialisée',
    warn_fr: 'Surveiller prolactine, poids, métabolisme, hypotension, symptômes extrapyramidaux et QT. Réduire en insuffisance rénale/hépatique.', warn_ar: 'مراقبة البرولاكتين والوزن والاستقلاب والضغط والأعراض خارج الهرمية وQT. تخفيض الجرعة في القصور الكلوي أو الكبدي.',
    ci: { renal_alert: true, hepatic_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Rispéridone — EMA, sections 4.2–4.4',
  }),

  t('Quétiapine', 'Schizophrénie — comprimé à libération immédiate, titration initiale', 'adult', {
    dose_fr: 'J1: 50 mg; J2: 100 mg; J3: 200 mg; J4: 300 mg', dose_ar: 'اليوم 1: 50 مغ؛ اليوم 2: 100 مغ؛ اليوم 3: 200 مغ؛ اليوم 4: 300 مغ',
    freq_fr: 'Dose quotidienne répartie en 2 prises; ajuster ensuite', freq_ar: 'تقسم الجرعة اليومية على مرتين ثم تعدل',
    dur_fr: 'Selon évaluation psychiatrique; ne pas transposer à la forme LP', dur_ar: 'حسب التقييم النفسي؛ لا يطبق على الشكل ممتد المفعول', max_daily: '750 mg/j pour cette indication selon RCP',
    warn_fr: 'Schéma réservé à la forme immédiate et à la schizophrénie. Surveiller sédation, hypotension, poids, glycémie, lipides et QT.', warn_ar: 'خاص بالشكل الفوري والفصام. مراقبة النعاس والضغط والوزن والسكر والدهون وQT.',
    ci: { hepatic_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Quétiapine libération immédiate — EMA/eMC, section 4.2',
  }),

  t('Lamotrigine', 'Épilepsie — rappel de titration sécurisée', 'adult', {
    dose_fr: 'Titration obligatoire selon association au valproate ou aux inducteurs enzymatiques', dose_ar: 'زيادة تدريجية إلزامية حسب المشاركة مع الفالبروات أو محفزات الإنزيمات',
    freq_fr: 'Ne pas appliquer de dose fixe sans vérifier les co-traitements', freq_ar: 'لا تطبق جرعة ثابتة قبل التحقق من الأدوية المصاحبة',
    dur_fr: 'Traitement spécialisé au long cours', dur_ar: 'علاج تخصصي طويل الأمد',
    warn_fr: 'RISQUE DE RASH GRAVE/Stevens-Johnson si titration trop rapide. Vérifier impérativement valproate, inducteurs enzymatiques et reprise après interruption.', warn_ar: 'خطر طفح جلدي خطير/ستيفنز جونسون عند الزيادة السريعة. يجب التحقق من الفالبروات ومحفزات الإنزيم وإعادة البدء بعد الانقطاع.',
    ci: { hepatic_alert: true, renal_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Lamotrigine — EMA, section 4.2; schéma dépendant des co-traitements',
  }),

  t('Gabapentine', 'Douleur neuropathique périphérique — titration adulte', 'adult', {
    dose_fr: 'J1: 300 mg; J2: 300 mg 2 fois/j; J3: 300 mg 3 fois/j', dose_ar: 'اليوم 1: 300 مغ؛ اليوم 2: 300 مغ مرتين؛ اليوم 3: 300 مغ 3 مرات',
    freq_fr: 'Puis ajuster progressivement selon efficacité et tolérance', freq_ar: 'ثم تعدل تدريجياً حسب الفعالية والتحمل', dur_fr: 'Réévaluation précoce; arrêt progressif', dur_ar: 'إعادة تقييم مبكرة وإيقاف تدريجي', max_daily: '3600 mg/j après titration spécialisée',
    warn_fr: 'Adapter strictement à la fonction rénale. Risque de somnolence, chutes et dépression respiratoire avec opioïdes.', warn_ar: 'تعديل صارم حسب الكلى. خطر النعاس والسقوط وتثبيط التنفس مع الأفيونات.',
    ci: { renal_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Gabapentine — eMC, sections 4.2–4.4',
  }),

  t('Rivaroxaban', 'Prévention de l’AVC dans la fibrillation atriale non valvulaire', 'adult', {
    dose_fr: '1 comprimé (20 mg)', dose_ar: 'قرص واحد (20 مغ)', freq_fr: '1 fois par jour au cours d’un repas', freq_ar: 'مرة يومياً أثناء الطعام', dur_fr: 'Traitement au long cours selon balance bénéfice/risque', dur_ar: 'علاج طويل الأمد حسب موازنة الفائدة والمخاطر', max_daily: '20 mg/j pour cette indication',
    warn_fr: 'Ce schéma ne s’applique pas à la TVP/EP. Calculer la clairance rénale; 15 mg/j si critères du RCP. Vérifier saignement, interactions et fonction hépatique.', warn_ar: 'لا يطبق على الخثار الوريدي أو الصمة الرئوية. حساب تصفية الكلى؛ 15 مغ/يوم حسب معايير النشرة. مراقبة النزيف والتداخلات والكبد.',
    ci: { renal_alert: true, hepatic_alert: true, pregnancy_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Rivaroxaban — EMA, section 4.2 (FANV)',
  }),

  t('Apixaban', 'Prévention de l’AVC dans la fibrillation atriale non valvulaire', 'adult', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)', freq_fr: '2 fois par jour', freq_ar: 'مرتين يومياً', dur_fr: 'Traitement au long cours selon balance bénéfice/risque', dur_ar: 'علاج طويل الأمد حسب موازنة الفائدة والمخاطر', max_daily: '10 mg/j pour cette indication',
    warn_fr: 'Réduire à 2,5 mg 2 fois/j si au moins 2 critères: âge ≥80 ans, poids ≤60 kg, créatinine ≥1,5 mg/dL. Ce schéma ne s’applique pas à la TVP/EP.', warn_ar: 'تخفض إلى 2.5 مغ مرتين إذا توفر معياران: العمر ≥80، الوزن ≤60 كغ، الكرياتينين ≥1.5 مغ/دل. لا يطبق على الخثار أو الصمة.',
    ci: { renal_alert: true, hepatic_alert: true, pregnancy_alert: true }, needs_weight: true, needs_dx: true, ref: 'RCP Apixaban — EMA, section 4.2 (FANV)',
  }),

  t('Insuline glargine', 'Diabète de type 2 — initiation d’une insuline basale', 'adult', {
    dose_fr: '10 unités ou 0,1 à 0,2 unité/kg en initiation', dose_ar: '10 وحدات أو 0.1 إلى 0.2 وحدة/كغ كجرعة بداية', freq_fr: '1 fois par jour à heure fixe, titration selon glycémies', freq_ar: 'مرة يومياً في وقت ثابت مع التعديل حسب السكر',
    dur_fr: 'Traitement individualisé au long cours', dur_ar: 'علاج فردي طويل الأمد',
    warn_fr: 'La dose doit être personnalisée et titrée. Vérifier dispositif et concentration (U100/U300), technique d’injection, hypoglycémies et objectifs glycémiques.', warn_ar: 'يجب تخصيص الجرعة وتعديلها. التحقق من الجهاز والتركيز وتقنية الحقن وهبوط السكر والأهداف.',
    ci: { renal_alert: true, hepatic_alert: true }, needs_weight: true, needs_dx: true, ref: 'RCP Insuline glargine — EMA; initiation à individualiser',
  }),

  t('Donepezil', 'Traitement symptomatique de la maladie d’Alzheimer légère à modérément sévère', 'elderly', {
    dose_fr: '1 comprimé (5 mg)', dose_ar: 'قرص واحد (5 مغ)', freq_fr: '1 fois par jour le soir', freq_ar: 'مرة يومياً مساءً',
    dur_fr: 'Au moins 1 mois avant éventuelle augmentation à 10 mg; réévaluation régulière', dur_ar: 'شهر على الأقل قبل الزيادة المحتملة إلى 10 مغ مع إعادة تقييم دورية', max_daily: '10 mg/j',
    warn_fr: 'Diagnostic spécialisé. Surveiller bradycardie, syncope, poids, effets digestifs et interactions anticholinergiques.', warn_ar: 'تشخيص اختصاصي. مراقبة بطء القلب والإغماء والوزن والآثار الهضمية والتداخلات المضادة للكولين.',
    ci: { hepatic_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Donépézil — EMA/eMC, section 4.2',
  }),

  t('Mésalazine', 'Rectocolite hémorragique active légère à modérée — forme orale', 'adult', {
    dose_fr: '2,4 g par jour (dose et prises selon formulation)', dose_ar: '2.4 غ يومياً (الجرعة والتقسيم حسب الشكل)', freq_fr: '1 à 3 prises selon la spécialité', freq_ar: 'مرة إلى 3 مرات حسب المستحضر',
    dur_fr: 'Selon protocole gastro-entérologique et réponse', dur_ar: 'حسب بروتوكول أمراض الجهاز الهضمي والاستجابة',
    warn_fr: 'Ne pas transposer entre formulations gastro-résistantes/libération prolongée. Contrôler fonction rénale, NFS et bilan hépatique.', warn_ar: 'لا تبدل بين الأشكال المقاومة للمعدة أو ممتدة المفعول. مراقبة الكلى وتعداد الدم والكبد.',
    ci: { renal_alert: true, hepatic_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Mésalazine orale — formulation à vérifier, section 4.2',
  }),

  // Associations antihypertensives à dose fixe — seulement après stabilisation/titration des composants.
  t('Irbésartan + Hydrochlorothiazide', 'Hypertension non contrôlée par irbésartan ou hydrochlorothiazide seul', 'adult', {
    dose_fr: '1 comprimé correspondant à la dose de substitution choisie', dose_ar: 'قرص واحد بالتركيبة البديلة المختارة', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً', dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Choisir le dosage selon les doses déjà titrées. Contrôler pression, sodium, potassium, créatinine et uricémie. Contre-indiqué pendant la grossesse.', warn_ar: 'اختيار التركيز حسب الجرعات المضبوطة. مراقبة الضغط والصوديوم والبوتاسيوم والكرياتينين وحمض اليوريك. يمنع أثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true, hepatic_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Irbésartan/Hydrochlorothiazide — EMA',
  }),
  t('Amlodipine + Valsartan', 'Hypertension nécessitant une association fixe après titration', 'adult', {
    dose_fr: '1 comprimé au dosage correspondant aux composants déjà titrés', dose_ar: 'قرص واحد بالتركيز الموافق للمكونات المضبوطة', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً', dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Ne pas initier sans titration des composants. Contrôler pression, œdèmes, créatinine et potassium. Contre-indiqué pendant la grossesse.', warn_ar: 'لا يبدأ دون ضبط المكونات. مراقبة الضغط والوذمة والكرياتينين والبوتاسيوم. يمنع أثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Amlodipine/Valsartan — EMA',
  }),
  t('Valsartan + Hydrochlorothiazide', 'Hypertension non contrôlée par un composant seul', 'adult', {
    dose_fr: '1 comprimé au dosage de substitution approprié', dose_ar: 'قرص واحد بالتركيز البديل المناسب', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً', dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Après titration des composants. Contrôler pression, sodium, potassium, créatinine et uricémie. Contre-indiqué pendant la grossesse.', warn_ar: 'بعد ضبط المكونات. مراقبة الضغط والصوديوم والبوتاسيوم والكرياتينين وحمض اليوريك. يمنع أثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true, hepatic_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Valsartan/Hydrochlorothiazide — EMA',
  }),
  t('Irbésartan + Amlodipine', 'Hypertension nécessitant une association fixe après titration', 'adult', {
    dose_fr: '1 comprimé au dosage correspondant aux composants déjà titrés', dose_ar: 'قرص واحد بالتركيز الموافق للمكونات المضبوطة', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً', dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Ne pas initier sans titration des composants. Contrôler pression, œdèmes, créatinine et potassium. Contre-indiqué pendant la grossesse.', warn_ar: 'لا يبدأ دون ضبط المكونات. مراقبة الضغط والوذمة والكرياتينين والبوتاسيوم. يمنع أثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Irbésartan/Amlodipine — dosage de substitution',
  }),
  t('Candésartan cilexétil + Hydrochlorothiazide', 'Hypertension non contrôlée par candésartan seul', 'adult', {
    dose_fr: '1 comprimé au dosage de substitution approprié', dose_ar: 'قرص واحد بالتركيز البديل المناسب', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً', dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Après titration. Contrôler pression, sodium, potassium, créatinine et uricémie. Contre-indiqué pendant la grossesse.', warn_ar: 'بعد ضبط الجرعة. مراقبة الضغط والصوديوم والبوتاسيوم والكرياتينين وحمض اليوريك. يمنع أثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true, hepatic_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Candésartan/Hydrochlorothiazide — EMA/eMC',
  }),
  t('Losartan + Hydrochlorothiazide', 'Hypertension non contrôlée par losartan seul', 'adult', {
    dose_fr: '1 comprimé (habituellement 50 mg/12,5 mg) après titration', dose_ar: 'قرص واحد (عادة 50 مغ/12.5 مغ) بعد ضبط الجرعة', freq_fr: '1 fois par jour', freq_ar: 'مرة يومياً', dur_fr: 'Traitement au long cours', dur_ar: 'علاج طويل الأمد',
    warn_fr: 'Contrôler pression, sodium, potassium, créatinine et uricémie. Contre-indiqué pendant la grossesse.', warn_ar: 'مراقبة الضغط والصوديوم والبوتاسيوم والكرياتينين وحمض اليوريك. يمنع أثناء الحمل.',
    ci: { pregnancy_alert: true, renal_alert: true, hepatic_alert: true }, needs_weight: false, needs_dx: true, ref: 'RCP Losartan/Hydrochlorothiazide — EMA/eMC',
  }),

];

// ─── Output ────────────────────────────────────────────────────────────────────
const OUTPUT = path.join(__dirname, '..', 'src', 'dosage_templates.json');
fs.writeFileSync(OUTPUT, JSON.stringify(templates, null, 2), 'utf-8');

// Stats
const byGroup = {};
const byClass = {};
templates.forEach(t => {
  byGroup[t.patient_group] = (byGroup[t.patient_group] || 0) + 1;
  const cls = (t.dci_name || '').split(' ')[0];
});

console.log('=== Templates générés: ' + templates.length + ' ===');
console.log('Groupes patients:');
Object.entries(byGroup).sort((a, b) => b[1] - a[1]).forEach(([g, c]) => console.log('  ' + String(c).padStart(4) + ' - ' + g));
console.log('Fichier: ' + OUTPUT);
