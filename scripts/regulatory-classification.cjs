/**
 * Tunisian AMM regulatory table mapping.
 *
 * DPM terminology:
 *   A = Liste I
 *   B = Stupéfiant
 *   C = Liste II
 *   O = Hors tableaux
 */
function normalizeTableau(tableau) {
  return String(tableau || '').trim().toUpperCase();
}

function requiresSpecialPrescription(tableau) {
  return normalizeTableau(tableau) === 'B';
}

module.exports = {
  normalizeTableau,
  requiresSpecialPrescription,
};
