import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Patient, Prescription, PrescriptionItem, DoctorConfig } from '../types';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'doctor' | 'secretary';
  doctorUid: string;
  createdAt: string;
}

/**
 * Utility to fail closed when the security profile cannot be loaded.
 * The underlying Firestore request may still finish, but no role is inferred locally.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 15000, errorMessage: string = "La connexion à la base de données sécurisée a expiré. Veuillez réessayer."): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ]);
}

export async function setupUserAndGetProfile(uid: string, email: string): Promise<UserProfile> {
  const lowercaseEmail = email.toLowerCase().trim();
  const defaultDoctorConfig: DoctorConfig = {
    name_fr: 'Cabinet Médical',
    name_ar: 'العيادة الطبية',
    specialty_fr: 'Médecin Généraliste',
    specialty_ar: 'طب عام',
    order_number: 'TN-2026-0000',
    address_fr: 'Tunis, Tunisie',
    address_ar: 'تونس، تونس',
    phone: '+216 71 000 000',
    show_automatic_stamp: true,
    website: ''
  };

  const userDocRef = doc(db, 'users', uid);
  const userSnap = await withTimeout(getDoc(userDocRef));
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  // New invitation collection, with a compatibility read for invitations created
  // by older versions under users/email:<address>.
  const invitationRef = doc(db, 'secretaryInvitations', lowercaseEmail);
  const legacyInvitationRef = doc(db, 'users', `email:${lowercaseEmail}`);
  const [invitationSnap, legacyInvitationSnap] = await withTimeout(Promise.all([
    getDoc(invitationRef),
    getDoc(legacyInvitationRef)
  ]));
  const invitation = invitationSnap.exists()
    ? invitationSnap.data()
    : legacyInvitationSnap.exists()
      ? legacyInvitationSnap.data()
      : null;

  const profile: UserProfile = invitation
    ? {
        uid,
        email: lowercaseEmail,
        role: 'secretary',
        doctorUid: invitation.doctorUid,
        createdAt: new Date().toISOString()
      }
    : {
        uid,
        email: lowercaseEmail,
        role: 'doctor',
        doctorUid: uid,
        createdAt: new Date().toISOString()
      };

  if (invitation) {
    const batch = writeBatch(db);
    batch.set(userDocRef, profile);
    batch.delete(invitationSnap.exists() ? invitationRef : legacyInvitationRef);
    await withTimeout(batch.commit());
    return profile;
  }

  await withTimeout(setDoc(userDocRef, profile));
  const configDocRef = doc(db, 'doctorConfigs', uid);
  const configSnap = await withTimeout(getDoc(configDocRef));
  if (!configSnap.exists()) {
    await withTimeout(setDoc(configDocRef, defaultDoctorConfig));
  }

  return profile;
}

/**
 * Get doctor configuration
 */
export async function fetchDoctorConfig(doctorUid: string): Promise<DoctorConfig | null> {
  const path = `doctorConfigs/${doctorUid}`;
  try {
    const snap = await getDoc(doc(db, 'doctorConfigs', doctorUid));
    if (snap.exists()) {
      return snap.data() as DoctorConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}

/**
 * Save doctor configuration
 */
export async function saveDoctorConfig(doctorUid: string, config: DoctorConfig): Promise<void> {
  const path = `doctorConfigs/${doctorUid}`;
  try {
    await setDoc(doc(db, 'doctorConfigs', doctorUid), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Create a one-time secretary invitation. The secretary claims it by signing in
 * or registering with the exact email address; doctors never choose passwords.
 */
export async function createSecretaryAccount(doctorUid: string, email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const path = `secretaryInvitations/${normalizedEmail}`;
  try {
    await setDoc(doc(db, 'secretaryInvitations', normalizedEmail), {
      email: normalizedEmail,
      role: 'secretary',
      doctorUid,
      createdAt: new Date().toISOString()
    });
    return `invite:${normalizedEmail}`;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * List all secretaries linked to a doctor
 */
export async function fetchSecretaries(doctorUid: string): Promise<UserProfile[]> {
  const path = 'users';
  try {
    // 1. Fetch linked profiles with actual uids
    const q = query(collection(db, 'users'), where('doctorUid', '==', doctorUid), where('role', '==', 'secretary'));
    const snap = await getDocs(q);
    const list: UserProfile[] = [];
    snap.forEach((d) => {
      // Older releases stored pending invitations in this collection.
      if (!d.id.startsWith('email:')) {
        list.push(d.data() as UserProfile);
      }
    });

    // 2. Fetch pending invitations from the dedicated collection.
    const invitationQuery = query(collection(db, 'secretaryInvitations'), where('doctorUid', '==', doctorUid));
    const invitationSnap = await getDocs(invitationQuery);
    invitationSnap.forEach((d) => {
      const data = d.data();
      list.push({
        uid: `invite:${d.id}`,
        email: data.email,
        role: 'secretary',
        doctorUid: data.doctorUid,
        createdAt: data.createdAt
      });
    });

    // 3. Keep legacy invitations visible until they are claimed or revoked.
    const pendingQuery = query(collection(db, 'users'), where('doctorUid', '==', doctorUid));
    const pendingSnap = await getDocs(pendingQuery);
    pendingSnap.forEach((d) => {
      const id = d.id;
      if (id.startsWith('email:')) {
        const data = d.data();
        list.push({
          uid: id, // Use email:xxx as uid placeholder
          email: data.email,
          role: 'secretary',
          doctorUid: data.doctorUid,
          createdAt: data.createdAt
        });
      }
    });

    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

/**
 * Delete a secretary profile or invitation
 */
export async function deleteSecretaryProfile(id: string): Promise<void> {
  const isInvitation = id.startsWith('invite:');
  const documentId = isInvitation ? id.slice('invite:'.length) : id;
  const collectionName = isInvitation ? 'secretaryInvitations' : 'users';
  const path = `${collectionName}/${documentId}`;
  try {
    await deleteDoc(doc(db, collectionName, documentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Patients Operations
 */
export async function savePatientToFirestore(patient: Patient, doctorUid: string): Promise<void> {
  const path = `patients/${patient.id}`;
  try {
    await setDoc(doc(db, 'patients', patient.id), {
      ...patient,
      doctorUid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deletePatientFromFirestore(patientId: string): Promise<void> {
  const path = `patients/${patientId}`;
  try {
    await deleteDoc(doc(db, 'patients', patientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

function withoutUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Persist the prescription and every line in one atomic batch. This is the only
 * write path for prescription contents so that a signed document cannot end up
 * with partially-written or subsequently mutable lines.
 */
export async function savePrescriptionBundleToFirestore(
  prescription: Prescription,
  items: PrescriptionItem[],
  doctorUid: string
): Promise<{ prescription: Prescription; items: PrescriptionItem[] }> {
  const path = `prescriptions/${prescription.id}`;
  try {
    const existingItemsQuery = query(
      collection(db, 'prescriptionItems'),
      where('prescription_id', '==', prescription.id)
    );
    const existingItems = await getDocs(existingItemsQuery);
    const nextItemIds = new Set(items.map((item) => item.id));
    const deletedItemIds = existingItems.docs
      .filter((itemDoc) => !nextItemIds.has(itemDoc.id))
      .map((itemDoc) => itemDoc.id);

    if (1 + items.length + deletedItemIds.length > 450) {
      throw new Error("L'ordonnance contient trop de lignes pour une écriture atomique.");
    }

    const normalizedPrescription = withoutUndefined({
      ...prescription,
      doctorUid,
      doctor_id: doctorUid
    }) as Prescription & { doctorUid: string };
    const normalizedItems = items.map((item) => withoutUndefined({
      ...item,
      doctorUid,
      prescription_id: prescription.id
    })) as Array<PrescriptionItem & { doctorUid: string }>;

    const batch = writeBatch(db);
    for (const itemId of deletedItemIds) {
      batch.delete(doc(db, 'prescriptionItems', itemId));
    }
    for (const item of normalizedItems) {
      batch.set(doc(db, 'prescriptionItems', item.id), item);
    }
    batch.set(doc(db, 'prescriptions', prescription.id), normalizedPrescription);
    await batch.commit();

    return {
      prescription: normalizedPrescription,
      items: normalizedItems
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Delete a user's entire account, including their profile, config, and clinic data (patients, draft prescriptions).
 * Finally, attempts to delete their Firebase Authentication record.
 */
export async function deleteUserAccount(uid: string, role: 'doctor' | 'secretary'): Promise<void> {
  // 1. If user is a doctor, delete their clinic data
  if (role === 'doctor') {
    // Delete doctor config
    try {
      await deleteDoc(doc(db, 'doctorConfigs', uid));
    } catch (err) {
      console.warn("Could not delete doctor config:", err);
    }

    // Delete patients
    try {
      const patientsQuery = query(collection(db, 'patients'), where('doctorUid', '==', uid));
      const patientsSnap = await getDocs(patientsQuery);
      const deletePromises: Promise<void>[] = [];
      patientsSnap.forEach((patientDoc) => {
        deletePromises.push(deleteDoc(doc(db, 'patients', patientDoc.id)));
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn("Could not delete patients:", err);
    }

    // Delete draft/cancelled lines before their parent prescriptions. Signed
    // prescriptions and their lines are retained as immutable medical records.
    try {
      const prescriptionsQuery = query(collection(db, 'prescriptions'), where('doctorUid', '==', uid));
      const prescriptionsSnap = await getDocs(prescriptionsQuery);
      const editablePrescriptionIds = new Set<string>();
      prescriptionsSnap.forEach((prescriptionDoc) => {
        const data = prescriptionDoc.data();
        if (data.status !== 'signed') {
          editablePrescriptionIds.add(prescriptionDoc.id);
        }
      });

      const itemsQuery = query(collection(db, 'prescriptionItems'), where('doctorUid', '==', uid));
      const itemsSnap = await getDocs(itemsQuery);
      const itemDeletePromises: Promise<void>[] = [];
      itemsSnap.forEach((itemDoc) => {
        if (editablePrescriptionIds.has(itemDoc.data().prescription_id)) {
          itemDeletePromises.push(deleteDoc(doc(db, 'prescriptionItems', itemDoc.id)));
        }
      });
      await Promise.all(itemDeletePromises);

      const prescriptionDeletePromises = [...editablePrescriptionIds].map((prescriptionId) =>
        deleteDoc(doc(db, 'prescriptions', prescriptionId))
      );
      await Promise.all(prescriptionDeletePromises);
    } catch (err) {
      console.warn("Could not delete editable prescriptions and their items:", err);
    }
  }

  // 2. Delete the primary User Profile in Firestore
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }

  // 3. Delete the user from Firebase Authentication
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === uid) {
    try {
      await currentUser.delete();
    } catch (error: any) {
      console.error("Firebase Auth user deletion failed:", error);
      // Re-throw if it requires recent login so we can handle it in the UI
      if (error && (error.code === 'auth/requires-recent-login' || error.message?.includes('requires-recent-login'))) {
        throw new Error('REQUIRES_RECENT_LOGIN');
      }
      throw error;
    }
  }
}

