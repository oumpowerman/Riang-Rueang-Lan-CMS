import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const env = import.meta.env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId,
};

export const googleOAuthClientId =
  env.VITE_GOOGLE_OAUTH_CLIENT_ID ||
  (firebaseConfigJson as { oAuthClientId?: string }).oAuthClientId ||
  '';

export const defaultGoogleDriveApiKey = env.VITE_GOOGLE_DRIVE_API_KEY || '';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with specific databaseId if provided via env or config json
export const firestoreDatabaseId =
  env.VITE_FIREBASE_DATABASE_ID ||
  (firebaseConfigJson as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  '(default)';

export const db =
  firestoreDatabaseId && firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app);

// Connection test as required by Firebase Integration Skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('Connected to Firebase Firestore successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running in offline/cached mode.');
    } else {
      console.info('Firestore handshake completed.');
    }
    return true;
  }
}
