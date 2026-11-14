import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { firestoreService } from '../../../firebase/firestoreService';
import { extractGoogleDriveFolderId } from '../../../services/driveScannerService';
import {
  DriveSyncMode,
  DriveSyncRecord,
  SavedDriveFolderPreset,
} from '../../../types/driveSync.types';
import { SystemSettings } from '../../../types/tag.types';

const LAST_FOLDER_URL_STORAGE_KEY = 'rrl_drive_last_folder_url_v1';
const SAVED_FOLDERS_STORAGE_KEY = 'rrl_drive_saved_folders_v1';

function loadLocalSavedFolders(): SavedDriveFolderPreset[] {
  try {
    const raw = localStorage.getItem(SAVED_FOLDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalSavedFolders(folders: SavedDriveFolderPreset[]): void {
  try {
    localStorage.setItem(SAVED_FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  } catch {
    // ignore storage errors
  }
}

interface UseSavedDriveFoldersParams {
  isModalOpen: boolean;
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
}

export function useSavedDriveFolders({
  isModalOpen,
  settings,
  updateSettings,
}: UseSavedDriveFoldersParams) {
  const [folderUrl, setFolderUrlState] = useState<string>(() => {
    const localUrl = localStorage.getItem(LAST_FOLDER_URL_STORAGE_KEY) || '';
    return settings.driveRootFolderUrl || localUrl || '';
  });

  const [savedFolders, setSavedFolders] = useState<SavedDriveFolderPreset[]>(() => {
    const localList = loadLocalSavedFolders();
    const cloudList = settings.savedDriveFolders || [];
    const map = new Map<string, SavedDriveFolderPreset>();
    [...localList, ...cloudList].forEach((item) => {
      if (item && item.folderId) {
        map.set(item.folderId, item);
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (b.lastUsedAt || '').localeCompare(a.lastUsedAt || '')
    );
  });

  const [syncMode, setSyncMode] = useState<DriveSyncMode>('DELTA');
  const [folderSyncRecord, setFolderSyncRecord] = useState<DriveSyncRecord | null>(null);
  const [isLoadingSyncRecord, setIsLoadingSyncRecord] = useState<boolean>(false);

  const savedFoldersRef = useRef<SavedDriveFolderPreset[]>(savedFolders);
  useEffect(() => {
    savedFoldersRef.current = savedFolders;
  }, [savedFolders]);

  useEffect(() => {
    const cloudUrl = settings.driveRootFolderUrl?.trim() || '';
    const localUrl = localStorage.getItem(LAST_FOLDER_URL_STORAGE_KEY)?.trim() || '';

    setFolderUrlState((prev) => {
      if (prev.trim()) return prev;
      return cloudUrl || localUrl || '';
    });

    if (Array.isArray(settings.savedDriveFolders) && settings.savedDriveFolders.length > 0) {
      setSavedFolders((prev) => {
        const map = new Map<string, SavedDriveFolderPreset>();
        prev.forEach((p) => map.set(p.folderId, p));
        settings.savedDriveFolders?.forEach((c) => {
          if (c && c.folderId) {
            const existing = map.get(c.folderId);
            map.set(c.folderId, existing ? { ...existing, ...c } : c);
          }
        });
        const merged = Array.from(map.values()).sort((a, b) =>
          (b.lastUsedAt || '').localeCompare(a.lastUsedAt || '')
        );
        saveLocalSavedFolders(merged);
        return merged;
      });
    }
  }, [settings.driveRootFolderUrl, settings.savedDriveFolders, isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;

    let isMounted = true;
    firestoreService
      .getAllDriveSyncRecords()
      .then((records) => {
        if (!isMounted || records.length === 0) return;

        const map = new Map<string, SavedDriveFolderPreset>();
        savedFoldersRef.current.forEach((p) => map.set(p.folderId, p));

        records.forEach((rec) => {
          if (!rec.folderId) return;
          const existing = map.get(rec.folderId);
          const builtUrl =
            existing?.folderUrl ||
            `https://drive.google.com/drive/folders/${rec.folderId}`;
          map.set(rec.folderId, {
            folderId: rec.folderId,
            folderUrl: builtUrl,
            folderName:
              existing?.folderName ||
              rec.folderName ||
              `โฟลเดอร์ (${rec.folderId.slice(0, 8)})`,
            lastUsedAt:
              existing?.lastUsedAt ||
              rec.updatedAt ||
              rec.lastSyncTimestamp ||
              new Date().toISOString(),
            lastSyncTimestamp: rec.lastSyncTimestamp,
            totalClipsInFolder: rec.totalClipsInFolder,
          });
        });

        const merged = Array.from(map.values()).sort((a, b) =>
          (b.lastUsedAt || '').localeCompare(a.lastUsedAt || '')
        );

        savedFoldersRef.current = merged;
        saveLocalSavedFolders(merged);
        setSavedFolders(merged);

        if (merged.length > 0) {
          setFolderUrlState((currentUrl) => {
            if (currentUrl.trim()) return currentUrl;
            const bestUrl = merged[0].folderUrl;
            try {
              localStorage.setItem(LAST_FOLDER_URL_STORAGE_KEY, bestUrl);
            } catch {
              // ignore
            }
            return bestUrl;
          });
        }
      })
      .catch((err) => {
        console.warn('Could not fetch all DriveSyncRecords:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isModalOpen]);

  const setFolderUrl = useCallback(
    (newUrl: string) => {
      setFolderUrlState(newUrl);
      const trimmed = newUrl.trim();
      try {
        localStorage.setItem(LAST_FOLDER_URL_STORAGE_KEY, trimmed);
      } catch {
        // ignore storage errors
      }

      const extractedId = extractGoogleDriveFolderId(trimmed);
      if (extractedId && trimmed !== settings.driveRootFolderUrl) {
        updateSettings({ driveRootFolderUrl: trimmed });
      }
    },
    [settings.driveRootFolderUrl, updateSettings]
  );

  const upsertSavedFolderPreset = useCallback(
    (params: {
      folderId: string;
      folderUrl: string;
      folderName?: string;
      lastSyncTimestamp?: string;
      totalClipsInFolder?: number;
    }) => {
      const cleanId = params.folderId.trim();
      if (!cleanId) return;

      const cleanUrl =
        params.folderUrl.trim() ||
        `https://drive.google.com/drive/folders/${cleanId}`;
      const nowIso = new Date().toISOString();

      try {
        localStorage.setItem(LAST_FOLDER_URL_STORAGE_KEY, cleanUrl);
      } catch {
        // ignore
      }

      const prev = savedFoldersRef.current;
      const existing = prev.find((f) => f.folderId === cleanId);
      const resolvedName =
        params.folderName?.trim() ||
        existing?.folderName ||
        `โฟลเดอร์ Google Drive (${cleanId.slice(0, 8)}...)`;

      const updatedPreset: SavedDriveFolderPreset = {
        folderId: cleanId,
        folderUrl: cleanUrl,
        folderName: resolvedName,
        lastUsedAt: nowIso,
        lastSyncTimestamp:
          params.lastSyncTimestamp ?? existing?.lastSyncTimestamp,
        totalClipsInFolder:
          params.totalClipsInFolder ?? existing?.totalClipsInFolder,
      };

      const filtered = prev.filter((f) => f.folderId !== cleanId);
      const nextList = [updatedPreset, ...filtered].slice(0, 20);

      savedFoldersRef.current = nextList;
      saveLocalSavedFolders(nextList);
      setSavedFolders(nextList);

      updateSettings({
        driveRootFolderUrl: cleanUrl,
        savedDriveFolders: nextList,
      });
    },
    [updateSettings]
  );

  const handleRemoveSavedFolder = useCallback(
    (targetFolderId: string) => {
      const prev = savedFoldersRef.current;
      const nextList = prev.filter((f) => f.folderId !== targetFolderId);

      savedFoldersRef.current = nextList;
      saveLocalSavedFolders(nextList);
      setSavedFolders(nextList);

      updateSettings({
        savedDriveFolders: nextList,
      });
    },
    [updateSettings]
  );

  const handleSelectSavedFolder = useCallback(
    (preset: SavedDriveFolderPreset) => {
      setFolderUrlState(preset.folderUrl);
      upsertSavedFolderPreset({
        folderId: preset.folderId,
        folderUrl: preset.folderUrl,
        folderName: preset.folderName,
        lastSyncTimestamp: preset.lastSyncTimestamp,
        totalClipsInFolder: preset.totalClipsInFolder,
      });
    },
    [upsertSavedFolderPreset]
  );

  const handleSaveCurrentFolderPreset = useCallback(
    (customName?: string) => {
      const extractedId = extractGoogleDriveFolderId(folderUrl);
      if (!extractedId) return;
      upsertSavedFolderPreset({
        folderId: extractedId,
        folderUrl,
        folderName:
          customName?.trim() ||
          folderSyncRecord?.folderName ||
          undefined,
        lastSyncTimestamp: folderSyncRecord?.lastSyncTimestamp,
        totalClipsInFolder: folderSyncRecord?.totalClipsInFolder,
      });
    },
    [folderUrl, folderSyncRecord, upsertSavedFolderPreset]
  );

  useEffect(() => {
    if (!isModalOpen) return;
    const extractedId = extractGoogleDriveFolderId(folderUrl);
    if (!extractedId) {
      setFolderSyncRecord(null);
      return;
    }

    let isMounted = true;
    setIsLoadingSyncRecord(true);
    firestoreService
      .getDriveSyncRecord(extractedId)
      .then((record) => {
        if (!isMounted) return;
        setFolderSyncRecord(record);
        if (record?.lastSyncTimestamp) {
          setSyncMode('DELTA');
        } else {
          setSyncMode('FULL');
        }
      })
      .catch((err) => {
        console.warn('Could not load folder sync record:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSyncRecord(false);
      });

    return () => {
      isMounted = false;
    };
  }, [folderUrl, isModalOpen]);

  const activeFolderId = useMemo(
    () => extractGoogleDriveFolderId(folderUrl) || '',
    [folderUrl]
  );

  const handleResetFolderSyncHistory = useCallback(() => {
    const extractedId = extractGoogleDriveFolderId(folderUrl);
    if (!extractedId) return;

    setFolderSyncRecord(null);
    setSyncMode('FULL');

    const prev = savedFoldersRef.current;
    const nextList = prev.map((f) =>
      f.folderId === extractedId
        ? {
            ...f,
            lastSyncTimestamp: undefined,
            totalClipsInFolder: 0,
          }
        : f
    );

    savedFoldersRef.current = nextList;
    saveLocalSavedFolders(nextList);
    setSavedFolders(nextList);
    updateSettings({ savedDriveFolders: nextList });

    firestoreService.deleteDriveSyncRecord(extractedId).catch((err) => {
      console.warn('Could not delete drive sync record:', err);
    });
  }, [folderUrl, updateSettings]);

  const handleSetCustomSyncTimestamp = useCallback(
    (newTimestampIso: string) => {
      const extractedId = extractGoogleDriveFolderId(folderUrl);
      if (!extractedId || !newTimestampIso) return;

      const parsedDate = new Date(newTimestampIso);
      if (isNaN(parsedDate.getTime())) return;

      const isoStr = parsedDate.toISOString();
      const nowIso = new Date().toISOString();
      const existingPreset = savedFoldersRef.current.find(
        (f) => f.folderId === extractedId
      );
      const resolvedFolderName =
        folderSyncRecord?.folderName ||
        existingPreset?.folderName ||
        `โฟลเดอร์ Google Drive (${extractedId.slice(0, 8)}...)`;

      const updatedRecord: DriveSyncRecord = {
        folderId: extractedId,
        folderName: resolvedFolderName,
        lastSyncTimestamp: isoStr,
        lastSyncVideoCount: folderSyncRecord?.lastSyncVideoCount || 0,
        totalClipsInFolder: folderSyncRecord?.totalClipsInFolder || 0,
        updatedAt: nowIso,
        updatedBy: folderSyncRecord?.updatedBy || 'manual-adjustment',
      };

      setFolderSyncRecord(updatedRecord);
      setSyncMode('DELTA');

      upsertSavedFolderPreset({
        folderId: extractedId,
        folderUrl,
        folderName: resolvedFolderName,
        lastSyncTimestamp: isoStr,
        totalClipsInFolder: updatedRecord.totalClipsInFolder,
      });

      firestoreService.saveDriveSyncRecord(updatedRecord).catch((err) => {
        console.warn('Failed to save adjusted DriveSyncRecord:', err);
      });
    },
    [folderUrl, folderSyncRecord, upsertSavedFolderPreset]
  );

  const handleAdjustSyncLookbackDays = useCallback(
    (daysAgo: number) => {
      const safeDays = Math.max(0, Number(daysAgo) || 0);
      const targetTime = new Date(
        Date.now() - safeDays * 24 * 60 * 60 * 1000
      );
      // Set to start of that day (00:00:00) so all files from that day onward are included
      targetTime.setHours(0, 0, 0, 0);
      handleSetCustomSyncTimestamp(targetTime.toISOString());
    },
    [handleSetCustomSyncTimestamp]
  );

  return {
    folderUrl,
    setFolderUrl,
    activeFolderId,
    savedFolders,
    syncMode,
    setSyncMode,
    folderSyncRecord,
    setFolderSyncRecord,
    isLoadingSyncRecord,
    upsertSavedFolderPreset,
    handleRemoveSavedFolder,
    handleSelectSavedFolder,
    handleSaveCurrentFolderPreset,
    handleResetFolderSyncHistory,
    handleAdjustSyncLookbackDays,
    handleSetCustomSyncTimestamp,
  };
}
