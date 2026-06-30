const fs = require('fs');
const path = require('path');

// 1. Definition of Pharmacological Classes
// Each class maps to a list of typical DCI substrings (normalized: lowercase, no accents)
const PHARMA_CLASSES = {
  '@CLASS:AINS': [
    'ibuprofene',
    'ketoprofene',
    'diclofenac',
    'naproxene',
    'piroxicam',
    'meloxicam',
    'celecoxib',
    'acide niflumique',
    'acide acetylsalicylique', // Aspirin at anti-inflammatory doses
    'aceclofenac',
    'flurbiprofene'
  ],
  '@CLASS:DIURETIQUES_ANSE': [
    'furosemide',
    'bumetanide'
  ],
  '@CLASS:DIURETIQUES_THIAZIDIQUES': [
    'hydrochlorothiazide',
    'indapamide'
  ],
  '@CLASS:ANTICOAGULANTS_ORAUX': [
    'warfarine',
    'acenocoumarol',
    'fluindione',
    'apixaban',
    'rivaroxaban',
    'dabigatran'
  ],
  '@CLASS:ANTIAGREGANTS_PLAQUETTAIRES': [
    'acide acetylsalicylique', // Aspirin at antiplatelet doses
    'clopidogrel',
    'ticagrelor',
    'prasugrel'
  ],
  '@CLASS:OPIOIDES': [
    'tramadol',
    'codeine',
    'morphine',
    'fentanyl',
    'oxycodone',
    'buprenorphine',
    'methadone'
  ],
  '@CLASS:BENZODIAZEPINES': [
    'alprazolam',
    'bromazepam',
    'clonazepam',
    'diazepam',
    'lorazepam',
    'prazepam',
    'clorazepate',
    'midazolam'
  ],
  '@CLASS:DERIVES_NITRES': [
    'trinitrine',
    'isosorbide' // dinitrate/mononitrate
  ],
  '@CLASS:INHIBITEURS_PDE5': [
    'sildenafil',
    'tadalafil',
    'vardenafil'
  ],
  '@CLASS:IEC_SARTANS': [
    'captopril',
    'enalapril',
    'lisinopril',
    'perindopril',
    'ramipril',
    'losartan',
    'valsartan',
    'candesartan',
    'irbesartan',
    'telmisartan'
  ],
  '@CLASS:ISRS_IRSNA': [ // Antidepressants (SSRI/SNRI)
    'fluoxetine',
    'sertraline',
    'paroxetine',
    'citalopram',
    'escitalopram',
    'venlafaxine',
    'duloxetine'
  ]
};

// 2. Definition of Rules Matrix
// Rules can refer to a class using @CLASS: or to a specific normalized DCI.
const INTERACTION_RULES = [
  // NSAIDs (AINS)
  {
    id: 'int-class-1',
    substanceA: '@CLASS:AINS',
    substanceB: '@CLASS:DIURETIQUES_ANSE',
    severity: 'warning',
    title_fr: 'AINS + Diurétique de l\'anse',
    title_ar: 'مضاد التهاب + مدر للبول (عروة)',
    description_fr: "Risque d'insuffisance rénale aiguë par réduction de la filtration glomérulaire. Diminution de l'effet diurétique. Assurer une hydratation adéquate et surveiller la fonction rénale.",
    description_ar: "خطر حدوث قصور كلوي حاد. تراجع مفعول مدر البول. يرجى ضمان ترطيب مناسب ومراقبة وظائف الكلى."
  },
  {
    id: 'int-class-2',
    substanceA: '@CLASS:AINS',
    substanceB: '@CLASS:DIURETIQUES_THIAZIDIQUES',
    severity: 'warning',
    title_fr: 'AINS + Diurétique thiazidique',
    title_ar: 'مضاد التهاب + مدر للبول (ثيازيد)',
    description_fr: "Risque d'insuffisance rénale aiguë et diminution de l'effet antihypertenseur. Surveiller la tension et la fonction rénale.",
    description_ar: "خطر حدوث قصور كلوي حاد وانخفاض مفعول خفض ضغط الدم. راقب الضغط ووظائف الكلى."
  },
  {
    id: 'int-class-3',
    substanceA: '@CLASS:AINS',
    substanceB: '@CLASS:AINS',
    severity: 'critical',
    title_fr: 'Multi-prescription d\'AINS',
    title_ar: 'تعدد مضادات الالتهاب غير الستيروئيدية',
    description_fr: "Association déconseillée de deux AINS : Augmentation majeure du risque d'ulcère gastroduodénal et d'hémorragie digestive sévère, sans bénéfice thérapeutique supplémentaire.",
    description_ar: "لا ينصح بالجمع بين مضادين للالتهاب: زيادة كبيرة في خطر الإصابة بقرحة المعدة والنزيف المعوي الحاد."
  },
  {
    id: 'int-class-4',
    substanceA: '@CLASS:ANTICOAGULANTS_ORAUX',
    substanceB: '@CLASS:ANTIAGREGANTS_PLAQUETTAIRES',
    severity: 'critical',
    title_fr: 'Anticoagulant + Antiagrégant',
    title_ar: 'مضاد تخثر + مضاد صفائح',
    description_fr: "Risque hémorragique majeur. Augmentation très significative des saignements gastro-intestinaux et intracrâniens. Association à n'utiliser que sur avis spécialisé (ex: post-stenting).",
    description_ar: "خطر نزيف حاد جداً. يجب استخدامه فقط بناءً على نصيحة أخصائي (مثل بعد تركيب دعامة)."
  },
  {
    id: 'int-class-5',
    substanceA: '@CLASS:ANTICOAGULANTS_ORAUX',
    substanceB: '@CLASS:AINS',
    severity: 'critical',
    title_fr: 'Anticoagulant + AINS',
    title_ar: 'مضاد تخثر + مضاد التهاب',
    description_fr: "Association contre-indiquée : Majoration très importante du risque d'hémorragie par agression de la muqueuse digestive et inhibition plaquettaire. Utiliser le paracétamol.",
    description_ar: "ممنوع الجمع بينهما: زيادة هائلة في خطر النزيف. يفضل استخدام الباراسيتامول لتسكين الألم."
  },
  {
    id: 'int-class-6',
    substanceA: '@CLASS:BENZODIAZEPINES',
    substanceB: '@CLASS:OPIOIDES',
    severity: 'critical',
    title_fr: 'Benzodiazépine + Opioïde',
    title_ar: 'بنزوديازيبين + أفيوني',
    description_fr: "Association à haut risque : Risque majeur de dépression respiratoire sévère, de sédation profonde, de coma et de décès. Limiter les doses et la durée au strict minimum.",
    description_ar: "مزيج عالي الخطورة: خطر كبير لحدوث فشل تنفسي حاد، خمول شديد، غيبوبة أو الوفاة."
  },
  {
    id: 'int-class-7',
    substanceA: '@CLASS:DERIVES_NITRES',
    substanceB: '@CLASS:INHIBITEURS_PDE5',
    severity: 'critical',
    title_fr: 'Dérivé nitré + Inhibiteur PDE5',
    title_ar: 'مشتقات النترات + مثبطات PDE5',
    description_fr: "Contre-indication absolue : Risque d'hypotension artérielle sévère, brutale et potentiellement mortelle. Ne jamais associer ces substances.",
    description_ar: "ممنوع تماماً: خطر حدوث انخفاض حاد ومفاجئ في ضغط الدم قد يهدد الحياة."
  },
  {
    id: 'int-class-8',
    substanceA: '@CLASS:AINS',
    substanceB: 'methotrexate',
    severity: 'critical',
    title_fr: 'AINS + Méthotrexate',
    title_ar: 'مضاد التهاب + ميثوتريكسات',
    description_fr: "Toxicité accrue du Méthotrexate : Les AINS diminuent fortement son excrétion rénale, entraînant un risque de toxicité hématologique et rénale sévère, potentiellement mortelle.",
    description_ar: "زيادة سمية الميثوتريكسات: خطر سمية دموية وكلية شديدة قد تكون قاتلة."
  },
  {
    id: 'int-class-9',
    substanceA: '@CLASS:DIURETIQUES_ANSE',
    substanceB: 'metformine',
    severity: 'warning',
    title_fr: 'Diurétique de l\'anse + Metformine',
    title_ar: 'مدر للبول (عروة) + ميتفورمين',
    description_fr: "Risque d'acidose lactique provoqué par une éventuelle insuffisance rénale fonctionnelle liée au diurétique. Arrêter la Metformine en cas de déshydratation.",
    description_ar: "خطر الإصابة بالحماض اللبني. يجب إيقاف الميتفورمين مؤقتاً في حالة الجفاف."
  },
  {
    id: 'int-class-10',
    substanceA: '@CLASS:IEC_SARTANS',
    substanceB: '@CLASS:AINS',
    severity: 'warning',
    title_fr: 'IEC/Sartan + AINS',
    title_ar: 'مثبط الإنزيم المحول للأنجيوتنسين / سارتان + مضاد التهاب',
    description_fr: "Risque d'insuffisance rénale aiguë (particulièrement chez le patient âgé ou déshydraté) et diminution de l'effet antihypertenseur.",
    description_ar: "خطر القصور الكلوي الحاد (خاصة عند كبار السن) وانخفاض فعالية خفض الضغط."
  },
  {
    id: 'int-class-11',
    substanceA: '@CLASS:ISRS_IRSNA',
    substanceB: '@CLASS:AINS',
    severity: 'warning',
    title_fr: 'Antidépresseur (ISRS/IRSNA) + AINS',
    title_ar: 'مضاد اكتئاب + مضاد التهاب',
    description_fr: "Majoration du risque de saignement, en particulier d'hémorragie gastro-intestinale.",
    description_ar: "زيادة خطر النزيف، خاصة النزيف المعدي المعوي."
  },
  {
    id: 'int-class-12',
    substanceA: '@CLASS:ISRS_IRSNA',
    substanceB: '@CLASS:ANTICOAGULANTS_ORAUX',
    severity: 'warning',
    title_fr: 'Antidépresseur (ISRS/IRSNA) + Anticoagulant',
    title_ar: 'مضاد اكتئاب + مضاد تخثر',
    description_fr: "Augmentation du risque hémorragique. Surveillance clinique et biologique (INR) accrue recommandée.",
    description_ar: "زيادة خطر النزيف. يوصى بزيادة المراقبة السريرية والبيولوجية."
  },
  {
    id: 'int-class-13',
    substanceA: 'lithium',
    substanceB: '@CLASS:AINS',
    severity: 'critical',
    title_fr: 'Lithium + AINS',
    title_ar: 'ليثيوم + مضاد التهاب',
    description_fr: "Augmentation de la lithiémie pouvant atteindre des valeurs toxiques par diminution de l'excrétion rénale du lithium. Éviter cette association.",
    description_ar: "زيادة مستويات الليثيوم في الدم إلى قيم سامة بسبب انخفاض إفرازه الكلوي. تجنب هذا المزيج."
  },
  {
    id: 'int-class-14',
    substanceA: 'lithium',
    substanceB: '@CLASS:DIURETIQUES_THIAZIDIQUES',
    severity: 'critical',
    title_fr: 'Lithium + Diurétique thiazidique',
    title_ar: 'ليثيوم + مدر للبول (ثيازيد)',
    description_fr: "Risque de surdosage en lithium. Diurétiques à éviter ou surveiller la lithiémie de très près.",
    description_ar: "خطر الجرعة الزائدة من الليثيوم. يجب تجنب مدرات البول أو مراقبة الليثيوم عن كثب."
  }
];

function generate() {
  const outputPath = path.join(__dirname, '..', 'src', 'drug_interactions.json');

  const outputData = {
    classes: PHARMA_CLASSES,
    rules: INTERACTION_RULES
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`[OK] Generated interactions rules at ${outputPath}`);
  console.log(`- ${Object.keys(PHARMA_CLASSES).length} Pharmacological classes defined`);
  console.log(`- ${INTERACTION_RULES.length} Rules generated`);
}

generate();
