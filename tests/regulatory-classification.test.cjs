const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeTableau,
  requiresSpecialPrescription,
} = require('../scripts/regulatory-classification.cjs');

test('normalizes regulatory table values', () => {
  assert.equal(normalizeTableau(' b '), 'B');
  assert.equal(normalizeTableau(null), '');
});

test('only Tableau B is classified as requiring the special controlled prescription', () => {
  assert.equal(requiresSpecialPrescription('B'), true);
  assert.equal(requiresSpecialPrescription('A'), false);
  assert.equal(requiresSpecialPrescription('C'), false);
  assert.equal(requiresSpecialPrescription('O'), false);
  assert.equal(requiresSpecialPrescription(''), false);
});

test('Liste I antibiotics are not classified as psychotropics or narcotics', () => {
  for (const dci of ['AMOXICILLINE', 'CLARITHROMYCINE']) {
    assert.equal(
      requiresSpecialPrescription('A'),
      false,
      `${dci} must remain a regular Liste I medicine`,
    );
  }
});
