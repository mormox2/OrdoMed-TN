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
import { db, auth, handleFirestoreError, OperationType, createSecondaryUser } from '../firebase';
import { Patient, Prescription, PrescriptionItem, DoctorConfig } from '../types';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'doctor' | 'secretary';
  doctorUid: string;
  createdAt: string;
}

/**
 * Handle initial user setup when they log in.
 */
export async function setupUserAndGetProfile(uid: string, email: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', uid);
  const emailDocRef = doc(db, 'users', `email:${email.toLowerCase()}`);

  const lowercaseEmail = email.toLowerCase().trim();

  // Explicit doctor override for dmossaab@gmail.com
  if (lowercaseEmail === 'dmossaab@gmail.com') {
    const profile: UserProfile = {
      uid,
      email: lowercaseEmail,
      role: 'doctor',
      doctorUid: uid,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(userDocRef, profile);
      await deleteDoc(emailDocRef);
    } catch (e) {
      console.warn("Could not delete secondary invitation for dmossaab@gmail.com:", e);
    }
    
    // Ensure default doctor configuration exists
    const configDocRef = doc(db, 'doctorConfigs', uid);
    const configSnap = await getDoc(configDocRef);
    if (!configSnap.exists()) {
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
      await setDoc(configDocRef, defaultDoctorConfig);
    }
    return profile;
  }

  try {
    // 1. Check if UID doc exists
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    // 2. Check if a pre-registered secretary email doc exists
    const emailSnap = await getDoc(emailDocRef);
    if (emailSnap.exists()) {
      const emailData = emailSnap.data();
      const profile: UserProfile = {
        uid,
        email: email.toLowerCase(),
        role: 'secretary',
        doctorUid: emailData.doctorUid,
        createdAt: new Date().toISOString()
      };

      // Create actual user document
      await setDoc(userDocRef, profile);
      // Delete the temporary email invitation doc
      await deleteDoc(emailDocRef);

      return profile;
    }

    // 3. New User -> Default to Doctor
    const newProfile: UserProfile = {
      uid,
      email: email.toLowerCase(),
      role: 'doctor',
      doctorUid: uid,
      createdAt: new Date().toISOString()
    };

    await setDoc(userDocRef, newProfile);

    // Also initialize default doctor config if it doesn't exist
    const configDocRef = doc(db, 'doctorConfigs', uid);
    const configSnap = await getDoc(configDocRef);
    if (!configSnap.exists()) {
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
      await setDoc(configDocRef, defaultDoctorConfig);
    }

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    throw error;
  }
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
 * Create a secretary invitation/account by registering their email (either via password or Google auth)
 */
export async function createSecretaryAccount(doctorUid: string, email: string, password?: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  
  if (password && password.trim().length >= 6) {
    const path = `users/email:${normalizedEmail}`;
    try {
      // 1. Create the Firebase Authentication user using our secondary app instance
      const uid = await createSecondaryUser(normalizedEmail, password.trim());
      
      // 2. Directly create the active UserProfile in Firestore
      const profile: UserProfile = {
        uid,
        email: normalizedEmail,
        role: 'secretary',
        doctorUid,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', uid), profile);
      return uid;
    } catch (error) {
      console.error('Error creating secondary auth user:', error);
      throw error;
    }
  } else {
    // Standard Google auth invitation
    const path = `users/email:${normalizedEmail}`;
    try {
      await setDoc(doc(db, 'users', `email:${normalizedEmail}`), {
        email: normalizedEmail,
        role: 'secretary',
        doctorUid,
        createdAt: new Date().toISOString()
      });
      return `email:${normalizedEmail}`;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
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
      list.push(d.data() as UserProfile);
    });

    // 2. Fetch pending email invitations
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
  const path = `users/${id}`;
  try {
    await deleteDoc(doc(db, 'users', id));
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

/**
 * Prescriptions Operations (Doctor Only)
 */
export async function savePrescriptionToFirestore(prescription: Prescription, doctorUid: string): Promise<void> {
  const path = `prescriptions/${prescription.id}`;
  try {
    await setDoc(doc(db, 'prescriptions', prescription.id), {
      ...prescription,
      doctorUid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deletePrescriptionFromFirestore(prescriptionId: string): Promise<void> {
  const path = `prescriptions/${prescriptionId}`;
  try {
    await deleteDoc(doc(db, 'prescriptions', prescriptionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Prescription Items Operations (Doctor Only)
 */
export async function savePrescriptionItemToFirestore(item: PrescriptionItem, doctorUid: string): Promise<void> {
  const path = `prescriptionItems/${item.id}`;
  try {
    await setDoc(doc(db, 'prescriptionItems', item.id), {
      ...item,
      doctorUid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deletePrescriptionItemFromFirestore(itemId: string): Promise<void> {
  const path = `prescriptionItems/${itemId}`;
  try {
    await deleteDoc(doc(db, 'prescriptionItems', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}
