import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from './config';
import { DriveSyncRecord } from '../types/driveSync.types';
import { sanitizeForFirestore } from './firestoreBatchUtils';
import { createSafeSnapshotErrorHandler } from './firestoreErrorHandling';

export interface GoogleDriveAuthPayload {
  token: string;
  expiresAt: number;
  connectedEmail?: string;
  updatedAt?: string;
}

export async function getDriveSyncRecord(
  folderId: string
): Promise<DriveSyncRecord | null> {
  try {
    const snap = await getDoc(doc(db, 'drive_sync_records', folderId));
    if (!snap.exists()) return null;
    return snap.data() as DriveSyncRecord;
  } catch (err) {
    console.warn('Failed to fetch DriveSyncRecord for folder:', folderId, err);
    return null;
  }
}

export async function saveDriveSyncRecord(record: DriveSyncRecord): Promise<void> {
  try {
    const cleanData = sanitizeForFirestore({
      ...record,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'drive_sync_records', record.folderId), cleanData, {
      merge: true,
    });
  } catch (err) {
    console.warn('Failed to save DriveSyncRecord:', record.folderId, err);
  }
}

export async function deleteDriveSyncRecord(folderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'drive_sync_records', folderId));
  } catch (err) {
    console.warn('Failed to delete DriveSyncRecord:', folderId, err);
  }
}

export function subscribeDriveSyncRecord(
  folderId: string,
  callback: (record: DriveSyncRecord | null) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(
    doc(db, 'drive_sync_records', folderId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback(snap.data() as DriveSyncRecord);
      }
    },
    createSafeSnapshotErrorHandler(`drive_sync_records/${folderId}`, onError)
  );
}

export async function getAllDriveSyncRecords(): Promise<DriveSyncRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'drive_sync_records'));
    const list: DriveSyncRecord[] = [];
    snap.forEach((d) => {
      const data = d.data() as DriveSyncRecord;
      if (data && data.folderId) {
        list.push(data);
      }
    });
    return list;
  } catch (err) {
    console.warn('Failed to fetch all DriveSyncRecords:', err);
    return [];
  }
}

export function subscribeGoogleDriveAuth(
  onUpdate: (authData: GoogleDriveAuthPayload | null) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, 'system_settings', 'google_drive_auth');
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        const data = snap.data() as {
          token?: string;
          expiresAt?: number;
          connectedEmail?: string;
          updatedAt?: string;
        };
        if (data && data.token && typeof data.expiresAt === 'number') {
          onUpdate({
            token: data.token,
            expiresAt: data.expiresAt,
            connectedEmail: data.connectedEmail,
            updatedAt: data.updatedAt,
          });
        } else {
          onUpdate(null);
        }
      }
    },
    createSafeSnapshotErrorHandler('system_settings/google_drive_auth', onError)
  );
}

export async function saveGoogleDriveAuthToCloud(authData: {
  token: string | null;
  expiresAt: number;
  connectedEmail?: string;
}): Promise<void> {
  try {
    const docRef = doc(db, 'system_settings', 'google_drive_auth');
    await setDoc(
      docRef,
      sanitizeForFirestore({
        token: authData.token || '',
        expiresAt: authData.expiresAt || 0,
        connectedEmail: authData.connectedEmail || '',
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.warn('Failed to save Google Drive auth token to Cloud:', err);
  }
}
