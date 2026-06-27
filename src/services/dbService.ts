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
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 8000, errorMessage: string = "La connexion à la base de données sécurisée a expiré. Veuillez rafraîchir la page."): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ]);
}

/**
 * Handle initial user setup when they log in.
 */
export async function setupUserAndGetProfile(uid: string, email: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', uid);
  const emailDocRef = doc(db, 'users', `email:${email.toLowerCase()}`);

  const lowercaseEmail = email.toLowerCase().trim();

  try {
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
        await withTimeout(setDoc(userDocRef, profile), 8000, "La configuration du profil a expiré.");
        await withTimeout(deleteDoc(emailDocRef), 8000, "La configuration de l'invitation a expiré.");
      } catch (e) {
        console.warn("Could not delete secondary invitation for dmossaab@gmail.com:", e);
      }
      
      // Ensure default doctor configuration exists
      const configDocRef = doc(db, 'doctorConfigs', uid);
      const configSnap = await withTimeout(getDoc(configDocRef), 8000, "Le chargement de la configuration du médecin a expiré.");
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
        await withTimeout(setDoc(configDocRef, defaultDoctorConfig), 8000, "L'initialisation de la configuration du médecin a expiré.");
      }
      return profile;
    }

    // 1. Check if UID doc exists
    const userSnap = await withTimeout(getDoc(userDocRef), 8000, "Le chargement du profil utilisateur a expiré.");
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    // 2. Check if a pre-registered secretary email doc exists (only if email is valid and looks like an email)
    const normalizedEmail = email.toLowerCase().trim();
    let isSecretaryInvitation = false;
    let emailSnap = null;

    // Direct check of signup flag to bypass secretary matching and force doctor role
    let isSigningUpAsDoctor = false;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        if (sessionStorage.getItem('is_signing_up_as_doctor') === 'true') {
          isSigningUpAsDoctor = true;
          sessionStorage.removeItem('is_signing_up_as_doctor');
        }
      }
    } catch (e) {
      // Safe fallback
    }

    if (!isSigningUpAsDoctor && normalizedEmail && normalizedEmail.includes('@') && normalizedEmail !== uid) {
      try {
        emailSnap = await withTimeout(getDoc(emailDocRef), 5000, "La vérification d'invitation secrétariat a expiré.");
        if (emailSnap && emailSnap.exists()) {
          isSecretaryInvitation = true;
        }
      } catch (e) {
        console.warn("Notice: Check for secretary email invitation restricted by Firestore rules (safe to ignore for doctors):", e);
      }
    }

    if (isSecretaryInvitation && emailSnap && emailSnap.exists()) {
      const emailData = emailSnap.data();
      const profile: UserProfile = {
        uid,
        email: normalizedEmail,
        role: 'secretary',
        doctorUid: emailData.doctorUid,
        createdAt: new Date().toISOString()
      };

      // Create actual user document
      await withTimeout(setDoc(userDocRef, profile), 8000, "La création du profil secrétariat a expiré.");
      // Delete the temporary email invitation doc
      await withTimeout(deleteDoc(emailDocRef), 8000, "La suppression de l'invitation a expiré.");

      return profile;
    }

    // 3. New User -> Default to Doctor
    const newProfile: UserProfile = {
      uid,
      email: normalizedEmail || `doctor_${uid.substring(0, 5)}@example.com`,
      role: 'doctor',
      doctorUid: uid,
      createdAt: new Date().toISOString()
    };

    await withTimeout(setDoc(userDocRef, newProfile), 8000, "La création du profil médecin a expiré.");

    // Also initialize default doctor config if it doesn't exist
    const configDocRef = doc(db, 'doctorConfigs', uid);
    const configSnap = await withTimeout(getDoc(configDocRef), 8000, "La vérification de configuration a expiré.");
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
      await withTimeout(setDoc(configDocRef, defaultDoctorConfig), 8000, "La création de configuration médecin a expiré.");
    }

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    throw error;
  }
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

