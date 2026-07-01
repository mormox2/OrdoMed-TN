import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { withoutUndefined } from '../src/utils/firestoreData';

describe('Firestore data normalization', () => {
  test('removes optional undefined patient fields, including nested values', () => {
    const patient = withoutUndefined({
      id: 'pat-test',
      name_first: 'Test',
      egfr: undefined,
      child_pugh: undefined,
      current_medications: [
        { id: 'cm-test', medicine_label: 'Paracétamol', dci_name: undefined },
      ],
    });

    assert.deepEqual(patient, {
      id: 'pat-test',
      name_first: 'Test',
      current_medications: [
        { id: 'cm-test', medicine_label: 'Paracétamol' },
      ],
    });
  });
});
