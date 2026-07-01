import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { DosageTemplate, Patient } from '../src/types';
import { calculatePatientAge, evaluateTemplateForPatient } from '../src/services/clinicalTemplateEvaluator';

const now = new Date('2026-07-01T12:00:00.000Z');
const patient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 'patient-1', name_first: 'Test', name_last: 'Patient', birth_date: '1986-07-01', gender: 'F', allergies: [], ...overrides,
});
const template = (overrides: Partial<DosageTemplate> = {}): DosageTemplate => ({
  id: 'tpl-1', indication: 'Test', patient_group: 'adult', dose_text_fr: '1 comprimé', dose_text_ar: '', frequency_text_fr: '1/j', frequency_text_ar: '', duration_text_fr: '5 jours', duration_text_ar: '', validation_status: 'validated', created_at: now.toISOString(), updated_at: now.toISOString(), ...overrides,
});

describe('clinical template evaluator', () => {
  test('calculates age at the birthday boundary', () => {
    assert.equal(calculatePatientAge('2000-07-01', now), 26);
    assert.equal(calculatePatientAge('2000-07-02', now), 25);
  });

  test('requires weight for every patient group when configured', () => {
    const result = evaluateTemplateForPatient(template({ requires_weight: true }), patient(), now);
    assert.equal(result.status, 'missing_data');
    assert.equal(result.issues[0].code, 'weight_missing');
  });

  test('keeps legacy renal flags advisory', () => {
    const result = evaluateTemplateForPatient(template({ contraindication_flags: { renal_alert: true } }), patient({ renal_status: 'severe' }), now);
    assert.equal(result.status, 'caution');
    assert.equal(result.issues[0].code, 'renal_legacy');
  });

  test('blocks an approved pregnancy rule', () => {
    const result = evaluateTemplateForPatient(template({
      clinical_review_status: 'approved',
      clinical_rules: { pregnancy: { action: 'blocked', message_fr: 'Contre-indiqué pendant la grossesse.' } },
    }), patient({ pregnancy_status: 'pregnant' }), now);
    assert.equal(result.status, 'blocked');
  });

  test('requires pregnancy status when a structured rule applies', () => {
    const result = evaluateTemplateForPatient(template({
      clinical_review_status: 'approved',
      clinical_rules: { pregnancy: { action: 'blocked', message_fr: 'Contre-indiqué pendant la grossesse.' } },
    }), patient({ pregnancy_status: 'unknown' }), now);
    assert.equal(result.status, 'missing_data');
  });

  test('downgrades an unapproved blocking rule to caution', () => {
    const result = evaluateTemplateForPatient(template({
      clinical_review_status: 'draft',
      clinical_rules: { pregnancy: { action: 'blocked', message_fr: 'Contre-indiqué pendant la grossesse.' } },
    }), patient({ pregnancy_status: 'pregnant' }), now);
    assert.equal(result.status, 'caution');
  });

  test('uses eGFR thresholds and exposes the dose adjustment', () => {
    const result = evaluateTemplateForPatient(template({
      clinical_review_status: 'approved',
      clinical_rules: { renal: [{ action: 'adjust', egfr_below: 30, message_fr: 'Réduire la dose.', dose_override_fr: '1/2 comprimé par jour' }] },
    }), patient({ renal_status: 'severe', egfr: 20 }), now);
    assert.equal(result.status, 'caution');
    assert.equal(result.issues[0].suggested_adjustment_fr, '1/2 comprimé par jour');
  });

  test('requires eGFR when renal rules need it', () => {
    const result = evaluateTemplateForPatient(template({ clinical_rules: { renal: [{ action: 'caution', egfr_below: 60, message_fr: 'Surveiller.' }] } }), patient({ renal_status: 'moderate' }), now);
    assert.equal(result.status, 'missing_data');
  });

  test('requires hepatic status when hepatic rules are configured', () => {
    const result = evaluateTemplateForPatient(template({ clinical_rules: { hepatic: [{ action: 'caution', severity: 'severe', message_fr: 'Surveiller.' }] } }), patient({ hepatic_status: 'unknown' }), now);
    assert.equal(result.status, 'missing_data');
  });
});
