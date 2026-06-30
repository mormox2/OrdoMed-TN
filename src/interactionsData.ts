/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_MEDICINES } from './data';
import interactionsDb from './drug_interactions.json';

export interface DrugInteractionRule {
  id: string;
  substanceA: string; // Can be a normalized DCI or a class like "@CLASS:AINS"
  substanceB: string;
  severity: 'critical' | 'warning' | 'info';
  title_fr: string;
  title_ar: string;
  description_fr: string;
  description_ar: string;
}

// Ensure the cast since JSON imports are loosely typed
const DRUG_INTERACTIONS = interactionsDb.rules as DrugInteractionRule[];
const PHARMA_CLASSES = interactionsDb.classes as Record<string, string[]>;

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
                        
  const ainsSubstances = PHARMA_CLASSES['@CLASS:AINS'] || [];
  const isDciAins = ainsSubstances.some(sub => dciNorm.includes(normalizeSubstanceName(sub)) || normalizeSubstanceName(sub).includes(dciNorm));
  
  if (isAllergyAins && isDciAins) {
    return true;
  }

  return false;
}

// Helper to check if a patient is allergic to a specific medicine
export function checkMedicineAllergies(
  medicineName: string,
  dciName: string | undefined,
  patientAllergies: string[]
): { isAllergic: boolean; matchedAllergen: string } {
  if (!patientAllergies || patientAllergies.length === 0) {
    return { isAllergic: false, matchedAllergen: '' };
  }

  let cleanBrand = medicineName
    .replace(/\(hors base\)/gi, '')
    .replace(/\(en cours\)/gi, '')
    .trim();

  const brandWordMatch = cleanBrand.match(/^([A-Za-z0-9éèàâûîôäëïöüç]+)/i);
  const brandWord = brandWordMatch ? brandWordMatch[1] : cleanBrand;

  let resolvedDci = dciName;
  if (!resolvedDci && cleanBrand) {
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

    if (isFuzzyMatch(brandNorm, allergyNorm) || isDciInAllergyClass(brandNorm, allergyNorm)) {
      return { isAllergic: true, matchedAllergen: allergy };
    }

    const brandWordNorm = normalizeSubstanceName(brandWord);
    if (isFuzzyMatch(brandWordNorm, allergyNorm) || isDciInAllergyClass(brandWordNorm, allergyNorm)) {
      return { isAllergic: true, matchedAllergen: allergy };
    }

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

// Resolves a DCI into all its applicable pharmacological classes
function getSubstanceClasses(substanceNorm: string): string[] {
  const classes: string[] = [];
  for (const [className, dciList] of Object.entries(PHARMA_CLASSES)) {
    // If the substance includes any of the class members, it belongs to the class
    const isMember = dciList.some(dci => {
      const dciNorm = normalizeSubstanceName(dci);
      return substanceNorm.includes(dciNorm) || dciNorm.includes(substanceNorm);
    });
    if (isMember) {
      classes.push(className);
    }
  }
  return classes;
}

// Checks if a given normalized DCI matches a rule term (which can be a class or a DCI)
function doesSubstanceMatchRuleTerm(substanceNorm: string, ruleTerm: string): boolean {
  if (ruleTerm.startsWith('@CLASS:')) {
    // Check if the substance belongs to this class
    const classes = getSubstanceClasses(substanceNorm);
    return classes.includes(ruleTerm);
  } else {
    // Check string match directly (permissive includes instead of strict equality)
    const ruleTermNorm = normalizeSubstanceName(ruleTerm);
    return substanceNorm.includes(ruleTermNorm) || ruleTermNorm.includes(substanceNorm);
  }
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
          const matchedRules = DRUG_INTERACTIONS.filter(rule => {
            const matchForward = doesSubstanceMatchRuleTerm(subA, rule.substanceA) && 
                                 doesSubstanceMatchRuleTerm(subB, rule.substanceB);
            
            const matchBackward = doesSubstanceMatchRuleTerm(subA, rule.substanceB) && 
                                  doesSubstanceMatchRuleTerm(subB, rule.substanceA);

            return matchForward || matchBackward;
          });

          // Add all matched rules
          for (const matchedRule of matchedRules) {
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
        // Also check with includes to catch slight variations like "diclofenac sodique" vs "diclofenac"
        const overlapsWithB = substancesB.some(subB => subA.includes(subB) || subB.includes(subA));
        
        if (overlapsWithB) {
          const overlapKey = [itemA.id, itemB.id, subA].sort().join('-');
          if (!processedOverlaps.has(overlapKey)) {
            processedOverlaps.add(overlapKey);
            
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
