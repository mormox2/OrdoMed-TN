import { Medicine } from '../types';

export function normalizeMedicationSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function compact(value: string): string {
  return value.replace(/\s+/g, '');
}

function allowedTypoCount(length: number): number {
  if (length < 4) return 0;
  if (length <= 6) return 1;
  return 2;
}

function boundedLevenshtein(left: string, right: string, limit: number): number {
  if (Math.abs(left.length - right.length) > limit) return limit + 1;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    const current = [leftIndex];
    let rowMinimum = current[0];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const distance = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
      current[rightIndex] = distance;
      rowMinimum = Math.min(rowMinimum, distance);
    }

    if (rowMinimum > limit) return limit + 1;
    previous = current;
  }

  return previous[right.length];
}

function fuzzyTokenDistance(queryToken: string, candidateTokens: string[]): number | null {
  const limit = allowedTypoCount(queryToken.length);
  if (limit === 0) return null;

  let bestDistance = limit + 1;
  for (const candidateToken of candidateTokens) {
    if (candidateToken.startsWith(queryToken) || candidateToken.includes(queryToken)) return 0;
    const distance = boundedLevenshtein(queryToken, candidateToken, limit);
    bestDistance = Math.min(bestDistance, distance);
  }

  return bestDistance <= limit ? bestDistance : null;
}

function scoreField(normalizedQuery: string, rawField: string | undefined): number | null {
  if (!rawField) return null;
  const field = normalizeMedicationSearch(rawField);
  if (!field) return null;

  if (field === normalizedQuery) return 0;
  if (field.startsWith(normalizedQuery)) return 2;
  if (field.includes(normalizedQuery)) return 4;

  const compactQuery = compact(normalizedQuery);
  const compactField = compact(field);
  if (compactField === compactQuery) return 1;
  if (compactField.startsWith(compactQuery)) return 3;
  if (compactField.includes(compactQuery)) return 5;

  const queryTokens = normalizedQuery.split(' ');
  const fieldTokens = field.split(' ');
  let totalDistance = 0;
  for (const queryToken of queryTokens) {
    const distance = fuzzyTokenDistance(queryToken, fieldTokens);
    if (distance === null) return null;
    totalDistance += distance;
  }

  const extraTokenPenalty = Math.max(0, fieldTokens.length - queryTokens.length);
  return 10 + totalDistance + extraTokenPenalty;
}

export function searchMedicines(medicines: Medicine[], query: string): Medicine[] {
  const normalizedQuery = normalizeMedicationSearch(query);
  if (normalizedQuery.length < 2) return [];

  return medicines
    .map((medicine) => {
      const scores = [
        scoreField(normalizedQuery, medicine.name_brand),
        scoreField(normalizedQuery, medicine.dci_name),
        scoreField(normalizedQuery, medicine.pct_code),
        scoreField(normalizedQuery, medicine.therapeutic_class),
      ].filter((score): score is number => score !== null);

      return scores.length > 0
        ? { medicine, score: Math.min(...scores) }
        : null;
    })
    .filter((result): result is { medicine: Medicine; score: number } => result !== null)
    .sort((left, right) =>
      left.score - right.score || left.medicine.name_brand.localeCompare(right.medicine.name_brand, 'fr')
    )
    .map(({ medicine }) => medicine);
}
