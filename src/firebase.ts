import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import localConfig from '../firebase-applet-config.json';

// Support production override via Vercel / Netlify environment variables
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || localConfig.appId,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId || "(default)"
};

const app = initializeApp(firebaseConfig);

// CRITICAL: We use initializeFirestore with experimentalForceLongPolling to prevent infinite hangs
// in restricted networks, sandboxed iframes (like AI Studio preview), or strict browser/adblock settings.
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

export const dbFirestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, dbId);

export const db = dbFirestore; // Maintain both exports just in case
export const auth = getAuth();

/**
 * Creates a secondary user in Firebase Auth without disrupting the current signed-in user.
 * This is useful for doctors creating secretary accounts from inside the applet.
 */
export async function createSecondaryUser(email: string, password: string): Promise<string> {
  const tempAppName = `SecondaryHelper-${Math.random().toString(36).substring(7)}`;
  const secondaryApp = initializeApp(firebaseConfig, tempAppName);
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;
    // Sign out from the secondary instance to clear state
    await secondarySignOut(secondaryAuth);
    return uid;
  } finally {
    // Delete the secondary app to clean up listeners and state
    try {
      await deleteApp(secondaryApp);
    } catch (e) {
      console.warn("Could not clean up secondary app:", e);
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
