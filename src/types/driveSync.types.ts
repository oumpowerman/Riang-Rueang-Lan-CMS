export type DriveSyncMode = 'DELTA' | 'FULL';

export interface DriveSyncRecord {
  folderId: string;
  folderName: string;
  lastSyncTimestamp: string; // ISO 8601 string, e.g. "2026-10-30T04:40:00.000Z"
  lastSyncVideoCount: number;
  totalClipsInFolder: number;
  updatedAt: string; // ISO 8601 string
  updatedBy?: string;
}
