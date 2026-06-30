import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-ordomed';
let testEnv;

const profile = (uid, email, role = 'doctor', doctorUid = uid) => ({
  uid,
  email,
  role,
  doctorUid,
  createdAt: '2026-06-28T12:00:00.000Z',
});

const patient = (id, doctorUid) => ({
  id,
  doctorUid,
  name_first: 'Test',
  name_last: 'Patient',
  birth_date: '1990-01-01',
  gender: 'F',
  allergies: [],
});

const prescription = (id, doctorUid, status = 'draft', doctorId = doctorUid) => ({
  id,
  doctorUid,
  patient_id: `patient-${doctorUid}`,
  doctor_id: doctorId,
  prescription_number: `ORD-2026-${id}`,
  prescription_date: '2026-06-28',
  print_language_mode: 'bilingual',
  status,
  created_at: '2026-06-28T12:00:00.000Z',
  updated_at: '2026-06-28T12:00:00.000Z',
  ...(status === 'signed' ? { signed_at: '2026-06-28T12:00:00.000Z' } : {}),
  patient_name: 'PATIENT Test',
  patient_age_str: '36 ans',
  patient_gender: 'F',
  patient_allergies: [],
});

const item = (id, prescriptionId, doctorUid, dosage = '1 comprimé') => ({
  id,
  doctorUid,
  prescription_id: prescriptionId,
  line_order: 1,
  medicine_label: 'Médicament test',
  dosage,
  frequency: '1 fois par jour',
  duration: '5 jours',
  quantity: '1 boîte',
  is_suggestion_used: false,
  doctor_modified_suggestion: false,
  created_at: '2026-06-28T12:00:00.000Z',
  updated_at: '2026-06-28T12:00:00.000Z',
});

function dbFor(uid, email) {
  return testEnv.authenticatedContext(uid, { email }).firestore();
}

async function seed(callback) {
  await testEnv.withSecurityRulesDisabled(async (context) => callback(context.firestore()));
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

describe('tenant and role isolation', () => {
  test('new doctors can self-register but cannot create secretary profiles directly', async () => {
    const doctorDb = dbFor('doctor-a', 'doctor-a@example.com');
    await assertSucceeds(setDoc(
      doc(doctorDb, 'users', 'doctor-a'),
      profile('doctor-a', 'doctor-a@example.com')
    ));
    await assertFails(setDoc(
      doc(doctorDb, 'users', 'secretary-a'),
      profile('secretary-a', 'secretary@example.com', 'secretary', 'doctor-a')
    ));
  });

  test('a user cannot rewrite doctorUid to enter another clinic', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'attacker'), profile('attacker', 'attacker@example.com'));
      await setDoc(doc(db, 'users', 'doctor-b'), profile('doctor-b', 'doctor-b@example.com'));
      await setDoc(doc(db, 'patients', 'patient-doctor-b'), patient('patient-doctor-b', 'doctor-b'));
    });

    const attackerDb = dbFor('attacker', 'attacker@example.com');
    await assertFails(setDoc(
      doc(attackerDb, 'users', 'attacker'),
      profile('attacker', 'attacker@example.com', 'secretary', 'doctor-b')
    ));
    await assertFails(getDoc(doc(attackerDb, 'patients', 'patient-doctor-b')));
  });

  test('a secretary can manage patients but cannot read prescriptions', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'doctor-a'), profile('doctor-a', 'doctor-a@example.com'));
      await setDoc(doc(db, 'users', 'secretary-a'), profile('secretary-a', 'secretary@example.com', 'secretary', 'doctor-a'));
      await setDoc(doc(db, 'patients', 'patient-doctor-a'), patient('patient-doctor-a', 'doctor-a'));
      await setDoc(doc(db, 'prescriptions', 'rx-a'), prescription('rx-a', 'doctor-a'));
    });

    const secretaryDb = dbFor('secretary-a', 'secretary@example.com');
    await assertSucceeds(getDoc(doc(secretaryDb, 'patients', 'patient-doctor-a')));
    await assertFails(getDoc(doc(secretaryDb, 'prescriptions', 'rx-a')));
  });

  test('a Google invitation is claimed atomically by the matching email', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'doctor-a'), profile('doctor-a', 'doctor-a@example.com'));
    });

    const doctorDb = dbFor('doctor-a', 'doctor-a@example.com');
    await assertSucceeds(setDoc(doc(doctorDb, 'secretaryInvitations', 'secretary@example.com'), {
      email: 'secretary@example.com',
      role: 'secretary',
      doctorUid: 'doctor-a',
      createdAt: '2026-06-28T12:00:00.000Z',
    }));

    const secretaryDb = dbFor('secretary-a', 'secretary@example.com');
    const batch = writeBatch(secretaryDb);
    batch.set(
      doc(secretaryDb, 'users', 'secretary-a'),
      profile('secretary-a', 'secretary@example.com', 'secretary', 'doctor-a')
    );
    batch.delete(doc(secretaryDb, 'secretaryInvitations', 'secretary@example.com'));
    await assertSucceeds(batch.commit());
  });
});

describe('signed prescription integrity', () => {
  test('signed prescription items cannot be changed or deleted', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'doctor-a'), profile('doctor-a', 'doctor-a@example.com'));
      await setDoc(doc(db, 'patients', 'patient-doctor-a'), patient('patient-doctor-a', 'doctor-a'));
      await setDoc(doc(db, 'prescriptions', 'rx-signed'), prescription('rx-signed', 'doctor-a', 'signed'));
      await setDoc(doc(db, 'prescriptionItems', 'item-signed'), item('item-signed', 'rx-signed', 'doctor-a'));
    });

    const doctorDb = dbFor('doctor-a', 'doctor-a@example.com');
    await assertFails(setDoc(
      doc(doctorDb, 'prescriptionItems', 'item-signed'),
      item('item-signed', 'rx-signed', 'doctor-a', 'Dose modifiée')
    ));
    await assertFails(deleteDoc(doc(doctorDb, 'prescriptionItems', 'item-signed')));
  });

  test('a draft and its lines can be finalized in one atomic batch', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'doctor-a'), profile('doctor-a', 'doctor-a@example.com'));
      await setDoc(doc(db, 'patients', 'patient-doctor-a'), patient('patient-doctor-a', 'doctor-a'));
      await setDoc(doc(db, 'prescriptions', 'rx-draft'), prescription('rx-draft', 'doctor-a'));
      await setDoc(doc(db, 'prescriptionItems', 'item-draft'), item('item-draft', 'rx-draft', 'doctor-a'));
    });

    const doctorDb = dbFor('doctor-a', 'doctor-a@example.com');
    const batch = writeBatch(doctorDb);
    batch.set(
      doc(doctorDb, 'prescriptionItems', 'item-draft'),
      item('item-draft', 'rx-draft', 'doctor-a', 'Dose finale')
    );
    batch.set(
      doc(doctorDb, 'prescriptions', 'rx-draft'),
      prescription('rx-draft', 'doctor-a', 'signed')
    );
    await assertSucceeds(batch.commit());
  });

  test('legacy draft doctor_id is normalized once during finalization', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'doctor-a'), profile('doctor-a', 'doctor-a@example.com'));
      await setDoc(doc(db, 'patients', 'patient-doctor-a'), patient('patient-doctor-a', 'doctor-a'));
      await setDoc(doc(db, 'prescriptions', 'rx-legacy'), prescription('rx-legacy', 'doctor-a', 'draft', 'doc-current'));
      await setDoc(doc(db, 'prescriptionItems', 'item-legacy'), item('item-legacy', 'rx-legacy', 'doctor-a'));
    });

    const doctorDb = dbFor('doctor-a', 'doctor-a@example.com');
    const batch = writeBatch(doctorDb);
    batch.set(
      doc(doctorDb, 'prescriptionItems', 'item-legacy'),
      item('item-legacy', 'rx-legacy', 'doctor-a', 'Dose finale')
    );
    batch.set(
      doc(doctorDb, 'prescriptions', 'rx-legacy'),
      prescription('rx-legacy', 'doctor-a', 'signed')
    );
    await assertSucceeds(batch.commit());
  });
});

describe('audit events', () => {
  test('audit events are append-only and actor-bound', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'doctor-a'), profile('doctor-a', 'doctor-a@example.com'));
    });
    const doctorDb = dbFor('doctor-a', 'doctor-a@example.com');
    const auditRef = doc(doctorDb, 'auditLogs', 'audit-1');
    await assertSucceeds(setDoc(auditRef, {
      id: 'audit-1',
      actor_id: 'doctor-a',
      doctor_uid: 'doctor-a',
      action: 'UPDATE_PATIENT',
      entity_type: 'PATIENT',
      entity_id: 'patient-doctor-a',
      created_at: serverTimestamp(),
    }));
    await assertFails(deleteDoc(auditRef));
  });
});

describe('security_spec Dirty Dozen', () => {
  test('all documented privilege-escalation payloads are denied', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'doctor-a'), profile('doctor-a', 'doctor-a@example.com'));
      await setDoc(doc(db, 'users', 'doctor-b'), profile('doctor-b', 'doctor-b@example.com'));
      await setDoc(doc(db, 'users', 'secretary-a'), profile('secretary-a', 'secretary@example.com', 'secretary', 'doctor-a'));
      await setDoc(doc(db, 'doctorConfigs', 'doctor-b'), {
        name_fr: 'Cabinet B',
        name_ar: 'عيادة ب',
        specialty_fr: 'Médecine générale',
        specialty_ar: 'طب عام',
        order_number: 'B-1',
        address_fr: 'Tunis',
        address_ar: 'تونس',
        phone: '+21600000000',
      });
      await setDoc(doc(db, 'patients', 'patient-doctor-a'), patient('patient-doctor-a', 'doctor-a'));
      await setDoc(doc(db, 'patients', 'patient-doctor-b'), patient('patient-doctor-b', 'doctor-b'));
      await setDoc(doc(db, 'prescriptions', 'rx-signed'), prescription('rx-signed', 'doctor-a', 'signed'));
    });

    const doctorA = dbFor('doctor-a', 'doctor-a@example.com');
    const secretaryA = dbFor('secretary-a', 'secretary@example.com');
    const anonymous = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(doctorA, 'doctorConfigs', 'doctor-b')));
    await assertFails(setDoc(doc(secretaryA, 'prescriptions', 'secretary-rx'), prescription('secretary-rx', 'doctor-a')));
    await assertFails(setDoc(doc(secretaryA, 'patients', 'foreign-patient'), patient('foreign-patient', 'doctor-b')));
    await assertFails(setDoc(doc(anonymous, 'users', 'anonymous'), profile('anonymous', 'anonymous@example.com')));
    await assertFails(setDoc(doc(doctorA, 'users', 'doctor-a'), profile('doctor-a', 'doctor-a@example.com', 'secretary', 'doctor-b')));
    await assertFails(setDoc(doc(doctorA, 'patients', 'patient-doctor-b'), {
      ...patient('patient-doctor-b', 'doctor-b'),
      name_first: 'Compromis',
    }));
    await assertFails(setDoc(doc(doctorA, 'prescriptionItems', 'orphan-item'), item('orphan-item', 'missing-rx', 'doctor-a')));
    await assertFails(setDoc(doc(doctorA, 'prescriptions', 'rx-signed'), {
      ...prescription('rx-signed', 'doctor-a', 'signed'),
      notes_private: 'Modification interdite',
    }));
    await assertFails(deleteDoc(doc(doctorA, 'prescriptions', 'rx-signed')));
    await assertFails(setDoc(doc(doctorA, 'patients', 'oversized-patient'), {
      ...patient('oversized-patient', 'doctor-a'),
      name_first: 'x'.repeat(1024),
    }));
    await assertFails(setDoc(
      doc(doctorA, 'users', 'victim-uid'),
      profile('victim-uid', 'victim@example.com', 'secretary', 'doctor-a')
    ));
    await assertFails(getDocs(collection(anonymous, 'users')));
  });
});
