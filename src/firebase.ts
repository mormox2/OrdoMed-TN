import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import localConfig from '../firebase-applet-config.json';
// In Vite, environment variables must be accessed explicitly so they are replaced at build time.
// Do NOT use dynamic keys or abstraction functions for import.meta.env.
const overrideProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const isOverrideProject = overrideProjectId && overrideProjectId !== localConfig.projectId;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: overrideProjectId || localConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (isOverrideProject ? "(default)" : (localConfig.firestoreDatabaseId || "(default)"))
};

// CRITICAL HARDCODED FALLBACK: If running on Vercel/production under this project,
// we must enforce the correct Firestore database ID to avoid "Database 'default' not found" errors.
if (
  firebaseConfig.projectId === "winter-quota-8dzmz" &&
  (!firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === "(default)")
) {
  firebaseConfig.firestoreDatabaseId = "ai-studio-ordomedtn-93a17686-f027-44cd-9c80-8667280e1fdd";
}

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
