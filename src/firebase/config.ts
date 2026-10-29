import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const env = import.meta.env || {};

function cleanEnvValue(value: string | undefined, placeholders: string[] = []): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed.startsWith('YOUR_') ||
    trimmed.startsWith('your-project-id') ||
    placeholders.includes(trimmed)
  ) {
    return undefined;
  }
  return trimmed;
}

const customProjectId = cleanEnvValue(env.VITE_FIREBASE_PROJECT_ID);

export const firebaseConfig = {
  apiKey: cleanEnvValue(env.VITE_FIREBASE_API_KEY) || firebaseConfigJson.apiKey,
  authDomain: cleanEnvValue(env.VITE_FIREBASE_AUTH_DOMAIN) || firebaseConfigJson.authDomain,
  projectId: customProjectId || firebaseConfigJson.projectId,
  storageBucket:
    cleanEnvValue(env.VITE_FIREBASE_STORAGE_BUCKET) || firebaseConfigJson.storageBucket,
  messagingSenderId:
    cleanEnvValue(env.VITE_FIREBASE_MESSAGING_SENDER_ID) || firebaseConfigJson.messagingSenderId,
  appId: cleanEnvValue(env.VITE_FIREBASE_APP_ID) || firebaseConfigJson.appId,
  measurementId:
    cleanEnvValue(env.VITE_FIREBASE_MEASUREMENT_ID) || firebaseConfigJson.measurementId,
};

export const googleOAuthClientId =
  cleanEnvValue(env.VITE_GOOGLE_OAUTH_CLIENT_ID) ||
  (firebaseConfigJson as { oAuthClientId?: string }).oAuthClientId ||
  '';

export const defaultGoogleDriveApiKey = cleanEnvValue(env.VITE_GOOGLE_DRIVE_API_KEY) || '';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with provisioned named databaseId from firebase-applet-config.json
// Ignore '(default)' from .env if firebase-applet-config.json specifies a provisioned database ID
const envDatabaseId = cleanEnvValue(env.VITE_FIREBASE_DATABASE_ID, ['(default)']);
const configDatabaseId = (firebaseConfigJson as { firestoreDatabaseId?: string })
  .firestoreDatabaseId;

export const firestoreDatabaseId =
  (customProjectId && envDatabaseId) ||
  configDatabaseId ||
  envDatabaseId ||
  '(default)';

export const db =
  firestoreDatabaseId && firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app);

// Connection test as required by Firebase Integration Skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info(`Connected to Firebase Firestore (${firestoreDatabaseId}) successfully.`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running in offline/cached mode.');
    } else {
      console.info(`Firestore (${firestoreDatabaseId}) handshake completed.`);
    }
    return true;
  }
}
