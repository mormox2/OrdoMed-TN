/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_MEDICINES } from './data';

export interface DrugInteractionRule {
  id: string;
  substanceA: string; // Lowercase, normalized, e.g., "furosemide"
  substanceB: string; // Lowercase, normalized, e.g., "ketoprofene"
  severity: 'critical' | 'warning' | 'info';
  title_fr: string;
  title_ar: string;
  description_fr: string;
  description_ar: string;
}

// Normalize DCI name for comparison (remove accents, space, make lowercase, simplify plural/terms)
export function normalizeSubstanceName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Keep alphanumeric only
    .trim();
}

// Split compound DCI strings (e.g. "Amoxicilline + Acide clavulanique" -> ["amoxicilline", "acide clavulanique"])
export function splitCompoundSubstances(dciString?: string): string[] {
  if (!dciString) return [];
  return dciString
    .split(/[\++/,\s&]+/) // Split by +, /, comma, and spaces
    .map(part => part.trim())
    .filter(part => part.length > 2) // Filter out short parts
    .map(part => normalizeSubstanceName(part));
}

export const DRUG_INTERACTIONS: DrugInteractionRule[] = [
  {
    id: 'int-1',
    substanceA: 'furosemide',
    substanceB: 'ketoprofene',
    severity: 'warning',
    title_fr: 'AINS + Diurétique (Lasilix + Profenid)',
    title_ar: 'مضاد التهاب + مدر للبول',
    description_fr: "Risque d'insuffisance rénale aiguë par réduction de la filtration glomérulaire (notamment en cas de déshydratation). Diminution de l'effet diurétique du Lasilix. Veillez à maintenir une hydratation adéquate et à surveiller la fonction rénale.",
    description_ar: "خطر حدوث قصور كلوي حاد بسبب انخفاض تصفية الكلى (خاصة في حالة الجفاف). تراجع مفعول لازيليكس كمدر للبول. يرجى الحفاظ على ترطيب كاف ومراقبة وظائف الكلى."
  },
  {
    id: 'int-2',
    substanceA: 'furosemide',
    substanceB: 'diclofenac',
    severity: 'warning',
    title_fr: 'AINS + Diurétique (Lasilix + Artotec)',
    title_ar: 'مضاد التهاب + مدر للبول',
    description_fr: "Risque d'insuffisance rénale aiguë par réduction de la filtration glomérulaire. Diminution de l'effet diurétique du Lasilix. Assurer une hydratation adéquate et surveiller l'urée/créatinine.",
    description_ar: "خطر حدوث قصور كلوي حاد بسبب انخفاض تصفية الكلى. تراجع مفعول لازيليكس كمدر للبول. يرجى ضمان ترطيب مناسب ومراقبة اليوريا والكراتينين."
  },
  {
    id: 'int-3',
    substanceA: 'ketoprofene',
    substanceB: 'diclofenac',
    severity: 'critical',
    title_fr: 'Multi-prescription d\'AINS (Profenid + Artotec)',
    title_ar: 'تعدد مضادات الالتهاب غير الستيروئيدية',
    description_fr: "Association déconseillée de deux anti-inflammatoires non stéroïdiens (AINS) : Augmentation majeure du risque d'ulcère gastroduodénal et d'hémorragie digestive sévère, sans aucun bénéfice thérapeutique supplémentaire.",
    description_ar: "لا ينصح بالجمع بين مضادين للالتهاب غير ستيروئيديين: زيادة كبيرة في خطر الإصابة بقرحة المعدة والنزيف المعوي الحاد، دون أي فائدة علاجية إضافية."
  },
  {
    id: 'int-4',
    substanceA: 'alprazolam',
    substanceB: 'tramadol',
    severity: 'critical',
    title_fr: 'Benzodiazépine + Opioïde (Xanax + Tramadol)',
    title_ar: 'بنزوديازيبين + أفيوني',
    description_fr: "Association à haut risque : Risque majeur de dépression respiratoire sévère, de sédation profonde, de coma et de décès. Limiter les doses et la durée au strict minimum si l'association est inévitable.",
    description_ar: "مزيج عالي الخطورة: خطر كبير لحدوث فشل تنفسي حاد، خمول شديد، غيبوبة أو الوفاة. يرجى تقليل الجرعات والمدة إلى الحد الأدنى إذا كان الجمع ضرورياً."
  },
  {
    id: 'int-5',
    substanceA: 'alprazolam',
    substanceB: 'codeine',
    severity: 'critical',
    title_fr: 'Benzodiazépine + Opioïde (Xanax + Codeine)',
    title_ar: 'بنزوديازيبين + أفيوني',
    description_fr: "Association à haut risque : Risque accru de dépression respiratoire, de somnolence extrême et de coma. À éviter ou à surveiller de très près.",
    description_ar: "مزيج عالي الخطورة: زيادة خطر تثبيط الجهاز التنفسي والنعاس الشديد والغيبوبة. ينصح بتجنبه أو المراقبة اللصيقة."
  },
  {
    id: 'int-6',
    substanceA: 'sildenafil',
    substanceB: 'trinitrine',
    severity: 'critical',
    title_fr: 'Dérivé nitré + Inhibiteur PDE5 (Sildenafil + Trinitrine)',
    title_ar: 'مشتقات النترات + سيلدينافيل',
    description_fr: "Contre-indication absolue : Risque d'hypotension artérielle sévère, brutale et potentiellement mortelle. Ne jamais associer ces substances.",
    description_ar: "ممنوع تماماً: خطر حدوث انخفاض حاد ومفاجئ في ضغط الدم قد يهدد الحياة. لا تقم بالجمع بينهما أبداً."
  },
  {
    id: 'int-7',
    substanceA: 'sildenafil',
    substanceB: 'isosorbide',
    severity: 'critical',
    title_fr: 'Dérivé nitré + Inhibiteur PDE5 (Sildenafil + Isosorbide)',
    title_ar: 'مشتقات النترات + سيلدينافيل',
    description_fr: "Contre-indication absolue : Risque d'hypotension systémique sévère, incontrôlable et potentiellement fatale. Association strictement interdite.",
    description_ar: "ممنوع تماماً: خطر حدوث انخفاض شديد وغير منضبط في ضغط الدم قد يؤدي للوفاة. يمنع الجمع بينهما قطعياً."
  },
  {
    id: 'int-8',
    substanceA: 'furosemide',
    substanceB: 'metformine',
    severity: 'warning',
    title_fr: 'Diurétique + Metformine (Lasilix + Glucophage)',
    title_ar: 'مدر للبول + ميتفورمين',
    description_fr: "Risque d'acidose lactique provoqué par une éventuelle insuffisance rénale fonctionnelle liée au diurétique (Lasilix). Arrêter la Metformine temporairement en cas de déshydratation ou d'insuffisance rénale aiguë.",
    description_ar: "خطر الإصابة بالحماض اللبني (Lactic Acidosis) نتيجة قصور كلوي وظيفي محتمل بسبب مدر البول. يجب إيقاف الميتفورمين مؤقتاً في حالة الجفاف أو القصور الكلوي."
  },
  {
    id: 'int-9',
    substanceA: 'warfarin',
    substanceB: 'aspirin',
    severity: 'critical',
    title_fr: 'Anticoagulant + Antiagrégant (Warfarine + Aspirine)',
    title_ar: 'مضاد تخثر + مضاد صفائح',
    description_fr: "Risque hémorragique majeur. Augmentation très significative des saignements gastro-intestinaux et intracrâniens. Surveillance biologique étroite (INR) indispensable si l'association est absolument requise.",
    description_ar: "خطر نزيف حاد: زيادة كبيرة في نزيف الجهاز الهضمي والنزيف الدماغي. مراقبة بيولوجية دقيقة (INR) ضرورية للغاية إذا كان الجمع ضرورياً."
  },
  {
    id: 'int-10',
    substanceA: 'warfarin',
    substanceB: 'ketoprofene',
    severity: 'critical',
    title_fr: 'Anticoagulant + AINS (Warfarine + Profenid)',
    title_ar: 'مضاد تخثر + مضاد التهاب',
    description_fr: "Association contre-indiquée : Majoration très importante du risque d'hémorragie par agression de la muqueuse digestive par l'AINS et inhibition de l'agrégation plaquettaire. Utiliser le paracétamol pour la douleur.",
    description_ar: "ممنوع الجمع بينهما: زيادة هائلة في خطر النزيف نتيجة تأثير مضاد الالتهاب على غشاء المعدة وتثبيط الصفائح الدموية. يفضل استخدام الباراسيتامول لتسكين الألم."
  },
  {
    id: 'int-11',
    substanceA: 'warfarin',
    substanceB: 'diclofenac',
    severity: 'critical',
    title_fr: 'Anticoagulant + AINS (Warfarine + Artotec)',
    title_ar: 'مضاد تخثر + مضاد التهاب',
    description_fr: "Association déconseillée : Risque hémorragique très élevé dû à l'effet antiagrégant plaquettaire et ulcérogène du Diclofénac associé à l'effet anticoagulant de la Warfarine.",
    description_ar: "لا ينصح بالجمع بينهما: خطر نزيف مرتفع جداً بسبب تأثير ديكلوفينات المضاد للصفائح والمسبب للقرحة مع تأثير مضاد التخثر للوارفارين."
  },
  {
    id: 'int-12',
    substanceA: 'methotrexate',
    substanceB: 'ketoprofene',
    severity: 'critical',
    title_fr: 'Méthotrexate + AINS (Methotrexate + Profenid)',
    title_ar: 'ميثوتريكسات + مضاد التهاب',
    description_fr: "Toxicité accrue du Méthotrexate : Les AINS diminuent fortement l'excrétion rénale du Méthotrexate, entraînant un risque de toxicité hématologique (pancytopénie) et rénale sévère, potentiellement mortelle.",
    description_ar: "زيادة سمية الميثوتريكسات: تقلل مضادات الالتهاب بشدة من طرح الميثوتريكسات عبر الكلى، مما يؤدي إلى خطر سمية دموية وكلية شديدة قد تكون قاتلة."
  },
  {
    id: 'int-13',
    substanceA: 'acénocoumarol',
    substanceB: 'aspirine',
    severity: 'critical',
    title_fr: 'Anticoagulant + Antiagrégant (Sintrom + Aspirine)',
    title_ar: 'مضاد تخثر + مضاد صفائح',
    description_fr: "Risque d'hémorragie sévère par majoration de l'effet anticoagulant. Association contre-indiquée.",
    description_ar: "خطر حدوث نزيف حاد بسبب زيادة مفعول مضاد التخثر."
  }
];

function getLevenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function isFuzzyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  // If one is substring of the other, definitely a match
  if (a.includes(b) || b.includes(a)) return true;
  
  const dist = getLevenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  
  if (maxLen <= 3) {
    return dist === 0;
  } else if (maxLen <= 5) {
    return dist <= 1;
  } else if (maxLen <= 8) {
    return dist <= 2;
  } else {
    // For longer words, allow up to 3 typos or up to 25% edit distance
    return dist <= 3 || (dist / maxLen) <= 0.25;
  }
}

// Check if a DCI or brand belongs to a specific allergy class/group
export function isDciInAllergyClass(dciNorm: string, allergyNorm: string): boolean {
  // 1. Penicillins & Beta-lactamines class
  const penicillins = [
    'amoxicilline',
    'ampicilline',
    'cloxacilline',
    'oxacilline',
    'phenoxymethylpenicilline',
    'penicilline',
    'piperacilline',
    'augmentin'
  ];
  
  const isAllergyPenicillin = allergyNorm.includes('penicil') || 
                              allergyNorm.includes('betalactam') || 
                              allergyNorm.includes('beta-lactam');
                              
  const isDciPenicillin = penicillins.some(p => dciNorm.includes(p) || p.includes(dciNorm));
  
  if (isAllergyPenicillin && isDciPenicillin) {
    return true;
  }

  // Cross match amoxicilline directly with penicilline
  if (allergyNorm === 'amoxicilline' && dciNorm.includes('penicil')) {
    return true;
  }
  if (dciNorm === 'amoxicilline' && allergyNorm.includes('penicil')) {
    return true;
  }

  // 2. Sulfamides / Sulfonamides class
  const isAllergySulfamide = allergyNorm.includes('sulfam') || allergyNorm.includes('sulfonam');
  const isDciSulfamide = dciNorm.includes('sulfam') || dciNorm.includes('sulfonam');
  if (isAllergySulfamide && isDciSulfamide) {
    return true;
  }

  // 3. AINS (Anti-inflammatoires non stéroïdiens) class
  const isAllergyAins = allergyNorm === 'ains' || 
                        allergyNorm.includes('antiinflam') || 
                        allergyNorm.includes('anti-inflam') ||
                        allergyNorm.includes('nsaid');
                        
  const ainsSubstances = [
    'ketoprofene',
    'diclofenac',
    'ibuprofene',
    'aspirine',
    'aspirin',
    'acide niflumique',
    'piroxicam',
    'naproxene',
    'meloxicam',
    'celecoxib'
  ];
  const isDciAins = ainsSubstances.some(sub => dciNorm.includes(sub) || sub.includes(dciNorm));
  
  if (isAllergyAins && isDciAins) {
    return true;
  }

  return false;
}

// Helper to check if a patient is allergic to a specific medicine (including checking each active sub-substance!)
export function checkMedicineAllergies(
  medicineName: string,
  dciName: string | undefined,
  patientAllergies: string[]
): { isAllergic: boolean; matchedAllergen: string } {
  if (!patientAllergies || patientAllergies.length === 0) {
    return { isAllergic: false, matchedAllergen: '' };
  }

  // Clean brand name from suffixes like "(Hors Base)" or "(En cours)"
  let cleanBrand = medicineName
    .replace(/\(hors base\)/gi, '')
    .replace(/\(en cours\)/gi, '')
    .trim();

  // Extract the first word or main name before strengths/forms, e.g., "CLAMOXYL 500MG" -> "CLAMOXYL"
  const brandWordMatch = cleanBrand.match(/^([A-Za-z0-9éèàâûîôäëïöüç]+)/i);
  const brandWord = brandWordMatch ? brandWordMatch[1] : cleanBrand;

  let resolvedDci = dciName;
  if (!resolvedDci && cleanBrand) {
    // Search the catalog for a medicine that matches this brand word
    const matchedMed = INITIAL_MEDICINES.find(
      (m) =>
        normalizeSubstanceName(m.name_brand) === normalizeSubstanceName(brandWord) ||
        normalizeSubstanceName(m.name_brand).startsWith(normalizeSubstanceName(brandWord)) ||
        normalizeSubstanceName(brandWord).startsWith(normalizeSubstanceName(m.name_brand))
    );
    if (matchedMed) {
      resolvedDci = matchedMed.dci_name;
    }
  }

  const brandNorm = normalizeSubstanceName(cleanBrand);
  const individualSubstances = splitCompoundSubstances(resolvedDci);

  for (const allergy of patientAllergies) {
    const allergyNorm = normalizeSubstanceName(allergy);
    if (!allergyNorm) continue;

    // Check brand name allergy (with fuzzy matching or class match)
    if (isFuzzyMatch(brandNorm, allergyNorm) || isDciInAllergyClass(brandNorm, allergyNorm)) {
      return { isAllergic: true, matchedAllergen: allergy };
    }

    // Check brand word match directly
    const brandWordNorm = normalizeSubstanceName(brandWord);
    if (isFuzzyMatch(brandWordNorm, allergyNorm) || isDciInAllergyClass(brandWordNorm, allergyNorm)) {
      return { isAllergic: true, matchedAllergen: allergy };
    }

    // Check individual DCI substances (with fuzzy matching or class match)
    for (const sub of individualSubstances) {
      if (isFuzzyMatch(sub, allergyNorm) || isDciInAllergyClass(sub, allergyNorm)) {
        return { isAllergic: true, matchedAllergen: allergy };
      }
    }
  }

  return { isAllergic: false, matchedAllergen: '' };
}

export interface DetectedInteraction {
  ruleId: string;
  substanceA: string;
  substanceB: string;
  severity: 'critical' | 'warning' | 'info';
  title_fr: string;
  title_ar: string;
  description_fr: string;
  description_ar: string;
  medicineALabel: string;
  medicineBLabel: string;
}

// Check all current items on prescription for drug-drug interactions
export function checkDrugInteractions(
  items: { id: string; medicine_label: string; dci_name?: string }[]
): DetectedInteraction[] {
  const interactions: DetectedInteraction[] = [];
  if (items.length < 2) return interactions;

  // Track comparisons to prevent duplicating A+B and B+A
  const processedPairs = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const itemA = items[i];
      const itemB = items[j];

      const substancesA = splitCompoundSubstances(itemA.dci_name || itemA.medicine_label);
      const substancesB = splitCompoundSubstances(itemB.dci_name || itemB.medicine_label);

      // Compare each active substance in A with each active substance in B
      for (const subA of substancesA) {
        for (const subB of substancesB) {
          // Find matching rule
          const matchedRule = DRUG_INTERACTIONS.find(rule => {
            const ruleA_norm = normalizeSubstanceName(rule.substanceA);
            const ruleB_norm = normalizeSubstanceName(rule.substanceB);
            return (ruleA_norm === subA && ruleB_norm === subB) ||
                   (ruleA_norm === subB && ruleB_norm === subA);
          });

          if (matchedRule) {
            const pairKey = [itemA.id, itemB.id, matchedRule.id].sort().join('-');
            if (!processedPairs.has(pairKey)) {
              processedPairs.add(pairKey);
              interactions.push({
                ruleId: matchedRule.id,
                substanceA: matchedRule.substanceA,
                substanceB: matchedRule.substanceB,
                severity: matchedRule.severity,
                title_fr: matchedRule.title_fr,
                title_ar: matchedRule.title_ar,
                description_fr: matchedRule.description_fr,
                description_ar: matchedRule.description_ar,
                medicineALabel: itemA.medicine_label,
                medicineBLabel: itemB.medicine_label
              });
            }
          }
        }
      }
    }
  }

  return interactions;
}

// Find therapeutic overlaps (same active ingredient across different items)
export interface DetectedOverlap {
  substance: string;
  medicineALabel: string;
  medicineBLabel: string;
}

export function checkTherapeuticOverlaps(
  items: { id: string; medicine_label: string; dci_name?: string }[]
): DetectedOverlap[] {
  const overlaps: DetectedOverlap[] = [];
  if (items.length < 2) return overlaps;

  const processedOverlaps = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const itemA = items[i];
      const itemB = items[j];

      const substancesA = splitCompoundSubstances(itemA.dci_name || itemA.medicine_label);
      const substancesB = splitCompoundSubstances(itemB.dci_name || itemB.medicine_label);

      // Find common active ingredients
      for (const subA of substancesA) {
        if (substancesB.includes(subA)) {
          const overlapKey = [itemA.id, itemB.id, subA].sort().join('-');
          if (!processedOverlaps.has(overlapKey)) {
            processedOverlaps.add(overlapKey);
            
            // Format name nicely (capitalized)
            const capSubstance = subA.charAt(0).toUpperCase() + subA.slice(1);
            overlaps.push({
              substance: capSubstance,
              medicineALabel: itemA.medicine_label,
              medicineBLabel: itemB.medicine_label
            });
          }
        }
      }
    }
  }

  return overlaps;
}
