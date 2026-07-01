import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { DosageTemplate, Medicine } from '../src/types';
import {
  findMatchingDosageTemplates,
  normalizeDciName,
} from '../src/utils/dosageTemplates';

test('normalizes accents, case, spaces and DCI separators', () => {
  assert.equal(normalizeDciName('  Amoxicilline + Acide clavulanique  '), 'amoxicilline acide clavulanique');
  assert.equal(normalizeDciName('AMOXICILLINE+ACIDE CLAVULANIQUE'), 'amoxicilline acide clavulanique');
  assert.equal(normalizeDciName('Clarithromycine'), 'clarithromycine');
  assert.equal(normalizeDciName('IBUPROFEN'), normalizeDciName('Ibuprofène'));
  assert.equal(normalizeDciName('ONDANSETRONE'), normalizeDciName('Ondansétron'));
  assert.equal(normalizeDciName('SUMATRIPTANE'), normalizeDciName('Sumatriptan'));
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

test('generates every approved priority DCI', () => {
  const generatedTemplates = JSON.parse(
    readFileSync(new URL('../src/dosage_templates.json', import.meta.url), 'utf8'),
  ) as DosageTemplate[];
  const generatedDcis = new Set(generatedTemplates.map((template) => normalizeDciName(template.dci_name)));
  const priorityDcis = [
    'Esoméprazole', 'Glimepiride', 'Gliclazide', 'Sitagliptine', 'Acarbose',
    'Rosuvastatine', 'Irbésartan', 'Valsartan', 'Captopril', 'Candésartan cilexétil',
    'Spironolactone', 'Indapamide', 'Famotidine', 'Desloratadine', 'Lévocétirizine',
    'Budésonide', 'Fluticasone', 'Mométasone', 'Acide fusidique', 'Terbinafine',
    'Éconazole nitrate', 'Célécoxib', 'Trimebutine', 'Polyéthylène glycol',
    'Céfuroxime', 'Céfixime', 'Céfadroxil', 'Cefpodoxime', 'Cotrimoxazole',
    'Valaciclovir', 'Spiramycine', 'Lévofloxacine', 'Oseltamivir', 'Prégabaline',
    'Escitalopram', 'Olanzapine', 'Risperidone', 'Quétiapine', 'Lamotrigine',
    'Gabapentine', 'Rivaroxaban', 'Apixaban', 'Insuline glargine', 'Donepezil',
    'Mésalazine', 'Irbésartan + Hydrochlorothiazide', 'Amlodipine + Valsartan',
    'Valsartan + Hydrochlorothiazide', 'Irbésartan + Amlodipine',
    'Candésartan cilexétil + Hydrochlorothiazide', 'Losartan + Hydrochlorothiazide',
  ];

  for (const dci of priorityDcis) {
    assert.ok(generatedDcis.has(normalizeDciName(dci)), `Missing generated template for ${dci}`);
  }
});
