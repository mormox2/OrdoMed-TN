import test from 'node:test';
import assert from 'node:assert/strict';
import type { Medicine } from '../src/types';
import {
  normalizeMedicationSearch,
  searchMedicines,
} from '../src/utils/medicineSearch';

const medicines = [
  { id: '1', name_brand: 'CLAMYCINE', dci_name: 'CLARITHROMYCINE', pct_code: '1001', therapeutic_class: 'Antibactériens' },
  { id: '2', name_brand: 'AMOXI-CLAV', dci_name: 'AMOXICILLINE+ACIDE CLAVULANIQUE', pct_code: '1002', therapeutic_class: 'Antibactériens' },
  { id: '3', name_brand: 'DOLIPRANE', dci_name: 'PARACÉTAMOL', pct_code: '1003', therapeutic_class: 'Analgésiques' },
  { id: '4', name_brand: 'AMOXAL', dci_name: 'AMOXICILLINE', pct_code: '1004', therapeutic_class: 'Antibactériens' },
] as Medicine[];

test('normalizes accents, repeated spaces and separators', () => {
  assert.equal(normalizeMedicationSearch('  Paracétamol  '), 'paracetamol');
  assert.equal(normalizeMedicationSearch('Amoxicilline / Acide-clavulanique'), 'amoxicilline acide clavulanique');
});

test('matches accents, spaces and separators for every medicine field', () => {
  assert.equal(searchMedicines(medicines, 'paracetamol')[0]?.name_brand, 'DOLIPRANE');
  assert.equal(searchMedicines(medicines, 'amoxicilline acide clavulanique')[0]?.name_brand, 'AMOXI-CLAV');
  assert.equal(searchMedicines(medicines, 'clamy cine')[0]?.name_brand, 'CLAMYCINE');
});

test('accepts light typing mistakes without fuzzy matching very short queries', () => {
  assert.equal(searchMedicines(medicines, 'claritromycine')[0]?.name_brand, 'CLAMYCINE');
  assert.equal(searchMedicines(medicines, 'amoxciline')[0]?.name_brand, 'AMOXAL');
  assert.deepEqual(searchMedicines(medicines, 'clx'), []);
});

test('ranks an exact brand match before broader fuzzy matches', () => {
  assert.equal(searchMedicines(medicines, 'clamycine')[0]?.name_brand, 'CLAMYCINE');
});
