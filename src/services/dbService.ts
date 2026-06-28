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
/**
 * Utility to wrap a promise with a timeout to prevent infinite hanging.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000, errorMessage: string = "La connexion à la base de données sécurisée a expiré. Veuillez rafraîchir la page."): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ]);
}

/**
 * Handle initial user setup when they log in.
 */
async function syncProfileAndConfigInBackground(uid: string, email: string, defaultDoctorConfig: DoctorConfig): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', uid);
  const configDocRef = doc(db, 'doctorConfigs', uid);
  const cacheKey = `user_profile_${uid}`;

  try {
    const userSnap = await getDoc(userDocRef);
    let profile: UserProfile;

    if (userSnap.exists()) {
      profile = userSnap.data() as UserProfile;
    } else {
      // 1. Create doctor profile
      profile = {
        uid,
        email,
        role: 'doctor',
        doctorUid: uid,
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, profile);
    }

    // 2. Ensure configuration document exists
    if (profile.role === 'doctor') {
      const configSnap = await getDoc(configDocRef);
      if (!configSnap.exists()) {
        await setDoc(configDocRef, defaultDoctorConfig);
      }
    }

    // 3. Keep cache up-to-date
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(cacheKey, JSON.stringify(profile));
    }

    return profile;
  } catch (e) {
    console.warn("Background auth profile synchronization deferred (offline or restricted iframe):", e);
    // If it fails but we have no profile, construct a fallback
    const fallbackProfile: UserProfile = {
      uid,
      email,
      role: 'doctor',
      doctorUid: uid,
      createdAt: new Date().toISOString()
    };
    return fallbackProfile;
  }
}

export async function setupUserAndGetProfile(uid: string, email: string): Promise<UserProfile> {
  const lowercaseEmail = email.toLowerCase().trim();
  const cacheKey = `user_profile_${uid}`;

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

  // 1. Try to read from cache first for instant login
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const profile = JSON.parse(cached) as UserProfile;
        // Sync in background without blocking
        setTimeout(() => {
          syncProfileAndConfigInBackground(uid, lowercaseEmail, defaultDoctorConfig).catch(err => {
            console.warn("Background sync error ignored:", err);
          });
        }, 100);
        return profile;
      }
    } catch (e) {
      console.warn("Could not parse cached user profile:", e);
    }
  }

  // 2. No cache found. If it's dmossaab@gmail.com, immediately bypass and return doctor profile
  if (lowercaseEmail === 'dmossaab@gmail.com') {
    const profile: UserProfile = {
      uid,
      email: lowercaseEmail,
      role: 'doctor',
      doctorUid: uid,
      createdAt: new Date().toISOString()
    };

    // Cache locally immediately
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(profile));
      } catch (_) {}
    }

    // Run remote sync in background
    setTimeout(() => {
      syncProfileAndConfigInBackground(uid, lowercaseEmail, defaultDoctorConfig).catch(err => {
        console.warn("Background sync error ignored:", err);
      });
    }, 100);

    return profile;
  }

  // 3. For other new users, try fetching with a very short timeout (3 seconds) to avoid freezing
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await withTimeout(getDoc(userDocRef), 3000, "Le chargement du profil a expiré.");
    if (userSnap.exists()) {
      const profile = userSnap.data() as UserProfile;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(cacheKey, JSON.stringify(profile));
      }
      return profile;
    }
  } catch (err) {
    console.warn("Failed to fetch user profile in time, constructing fallback:", err);
  }

  // 4. Fallback profile to prevent blocking
  let isSigningUpAsDoctor = false;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (sessionStorage.getItem('is_signing_up_as_doctor') === 'true') {
        isSigningUpAsDoctor = true;
        sessionStorage.removeItem('is_signing_up_as_doctor');
      }
    }
  } catch (_) {}

  const profile: UserProfile = {
    uid,
    email: lowercaseEmail || `user-${uid.substring(0, 5)}@example.com`,
    role: isSigningUpAsDoctor ? 'doctor' : 'doctor', // Default to doctor for safety
    doctorUid: uid,
    createdAt: new Date().toISOString()
  };

  // Cache fallback
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(profile));
    } catch (_) {}
  }

  // Sync in background
  setTimeout(() => {
    syncProfileAndConfigInBackground(uid, lowercaseEmail, defaultDoctorConfig).catch(err => {
      console.warn("Background sync error ignored:", err);
    });
  }, 100);

  return profile;
}

/**
 * Force-register a user explicitly as a doctor.
 * This is the radical fix to prevent any new user from being identified as a secretary by default.
 */
export async function registerNewDoctor(uid: string, email: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', uid);
  const normalizedEmail = email.toLowerCase().trim();
  const emailDocRef = doc(db, 'users', `email:${normalizedEmail}`);
  
  const profile: UserProfile = {
    uid,
    email: normalizedEmail,
    role: 'doctor',
    doctorUid: uid,
    createdAt: new Date().toISOString()
  };
  
  await setDoc(userDocRef, profile);
  
  // Try to delete any accidental temporary invitation
  try {
    await deleteDoc(emailDocRef);
  } catch (e) {
    // Ignore if not allowed or not found
  }
  
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

    // Delete prescriptions (only non-signed ones can be deleted due to rules)
    try {
      const prescriptionsQuery = query(collection(db, 'prescriptions'), where('doctorUid', '==', uid));
      const prescriptionsSnap = await getDocs(prescriptionsQuery);
      const deletePromises: Promise<void>[] = [];
      prescriptionsSnap.forEach((prescriptionDoc) => {
        const data = prescriptionDoc.data();
        if (data.status !== 'signed') {
          deletePromises.push(deleteDoc(doc(db, 'prescriptions', prescriptionDoc.id)));
        }
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn("Could not delete prescriptions:", err);
    }

    // Delete prescription items
    try {
      const itemsQuery = query(collection(db, 'prescriptionItems'), where('doctorUid', '==', uid));
      const itemsSnap = await getDocs(itemsQuery);
      const deletePromises: Promise<void>[] = [];
      itemsSnap.forEach((itemDoc) => {
        deletePromises.push(deleteDoc(doc(db, 'prescriptionItems', itemDoc.id)));
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn("Could not delete prescription items:", err);
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

