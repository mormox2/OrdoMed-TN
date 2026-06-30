import test from 'node:test';
import assert from 'node:assert/strict';
import type { DosageTemplate, Medicine } from '../src/types';
import {
  findMatchingDosageTemplates,
  normalizeDciName,
} from '../src/utils/dosageTemplates';

test('normalizes accents, case, spaces and DCI separators', () => {
  assert.equal(normalizeDciName('  Amoxicilline + Acide clavulanique  '), 'amoxicilline acide clavulanique');
  assert.equal(normalizeDciName('AMOXICILLINE+ACIDE CLAVULANIQUE'), 'amoxicilline acide clavulanique');
  assert.equal(normalizeDciName('Clarithromycine'), 'clarithromycine');
});

test('matches a template to catalogue DCI variants', () => {
  const medicine = {
    id: 'amm-test',
    dci_name: 'AMOXICILLINE+ACIDE CLAVULANIQUE',
  } as Medicine;
  const templates = [{
    id: 'dt-test',
    dci_name: 'Amoxicilline + Acide clavulanique',
  }] as DosageTemplate[];

  assert.deepEqual(findMatchingDosageTemplates(medicine, templates), templates);
});
