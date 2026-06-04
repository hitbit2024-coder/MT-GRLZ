import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Embedded Firestore configuration with default values for ease of deployment, plus env overrides.
// Client-side Firebase keys are designed to be public. If secrets rotation is needed, use VITE_ prefix env variables.
const embeddedConfig = {
  apiKey: "AIzaSyA7l1YKXCCRAL6cKv3MxlFj_5UXtKC2Cdk",
  authDomain: "peppy-base-zcf5x.firebaseapp.com",
  projectId: "peppy-base-zcf5x",
  storageBucket: "peppy-base-zcf5x.firebasestorage.app",
  messagingSenderId: "351079010690",
  appId: "1:351079010690:web:88ca17d8cd01566e267f9b",
  firestoreDatabaseId: "ai-studio-72b8f79e-fd4a-4d90-ac3b-88d6df52700a"
};

const activeApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY || embeddedConfig.apiKey;
const activeDatabaseId = (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || embeddedConfig.firestoreDatabaseId;

const activeConfig = {
  ...embeddedConfig,
  apiKey: activeApiKey
};

const app = initializeApp(activeConfig);
export const db = getFirestore(app, activeDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
  };
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

// CRITICAL CONSTRAINT: Test Firestore connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error && error.code === 'permission-denied') {
      console.log("Firestore connection test: Success (Active security rules blocked unauthenticated test key, as expected).");
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client appears to be offline.");
    } else {
      console.debug("Firestore connection status:", error);
    }
  }
}
testConnection();

// Authentication helpers
export async function logInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Auth sign-in error: ", error);
    throw error;
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Auth sign-out error: ", error);
    throw error;
  }
}
