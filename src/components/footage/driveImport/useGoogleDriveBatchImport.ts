import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCMS } from '../../../context/CMSContext';
import { defaultGoogleDriveApiKey } from '../../../firebase/config';
import { firestoreService } from '../../../firebase/firestoreService';
import {
  DiscoveredDriveVideo,
  extractGoogleDriveFileId,
  extractGoogleDriveFolderId,
  RecursiveScanResult,
  scanGoogleDriveFolderRecursive,
  ScanProgressUpdate,
} from '../../../services/driveScannerService';
import { DriveSyncMode, DriveSyncRecord } from '../../../types/driveSync.types';
import {
  isStagingGroupId,
  isStagingTagId,
  STAGING_TAG_ID,
} from '../../../services/seedData';
import { CategoryTag } from '../../../types/tag.types';
import { cleanFootageTitle } from '../../../utils/fileNameGenerator';
import {
  ReconciledCategoryResult,
  reconcileSubfolder,
} from '../../../utils/tagReconciler';
import {
  DriveCategoryStrategy,
  DriveClipIdPrefix,
  DriveImportMode,
  DriveImportSuccessSummary,
  ParsedPastedItem,
  SelectedRoutingSummary,
} from './driveImport.types';

export const useGoogleDriveBatchImport = () => {
  const {
    isGoogleDriveBatchModalOpen,
    setIsGoogleDriveBatchModalOpen,
    batchAddDirectFootage,
    batchAddTags,
    tags,
    categoryGroups,
    computedFootage,
    setActiveTab,
    setSelectedTagFilter,
    settings,
  } = useCMS();

  const {
    currentUser,
    signInWithGoogle,
    driveAccessToken,
    isGoogleDriveConnected,
  } = useAuth();

  // Mode: RECURSIVE (Enterprise Scan) vs PASTE (Manual Text)
  const [activeImportMode, setActiveImportMode] = useState<DriveImportMode>('RECURSIVE');
  const [folderUrl, setFolderUrl] = useState(settings.driveRootFolderUrl || '');
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('DRIVE_API_KEY') || defaultGoogleDriveApiKey || ''
  );
  const [isApiKeyExpanded, setIsApiKeyExpanded] = useState(false);
  const [maxDepth, setMaxDepth] = useState<number>(10);
  const [idPrefix, setIdPrefix] = useState<DriveClipIdPrefix>('CLP');

  // Google Drive Delta Sync State (Server-Side ModifiedTime + Firestore Sync History)
  const [syncMode, setSyncMode] = useState<DriveSyncMode>('DELTA');
  const [folderSyncRecord, setFolderSyncRecord] = useState<DriveSyncRecord | null>(null);
  const [isLoadingSyncRecord, setIsLoadingSyncRecord] = useState<boolean>(false);

  // Auto-fetch Firestore Sync Record whenever folderUrl or modal state changes
  useEffect(() => {
    if (!isGoogleDriveBatchModalOpen) return;
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
  }, [folderUrl, isGoogleDriveBatchModalOpen]);

  // Category Assignment Strategy State
  const [categoryStrategy, setCategoryStrategy] = useState<DriveCategoryStrategy>(
    'SUBFOLDER_TO_CATEGORY'
  );

  // Optional: Which Tier 0 Group newly created Subfolder categories should be placed under
  const nonStagingGroups = useMemo(
    () => categoryGroups.filter((g) => !isStagingGroupId(g.id)),
    [categoryGroups]
  );
  const [targetGroupIdForNewTags, setTargetGroupIdForNewTags] = useState<string>('GRP-THEME');

  // Per-subfolder override set: subfolders inside this set will be routed to Staging Area even in SUBFOLDER_TO_CATEGORY mode
  const [stagedSubfolders, setStagedSubfolders] = useState<Set<string>>(new Set());

  // Pasted mode target tag (defaults to STAGING_TAG_ID)
  const [pasteTargetTagId, setPasteTargetTagId] = useState<string>(STAGING_TAG_ID);

  // Pre-index existing clips in CMS for fast O(1) deduplication (clean titles + Drive File IDs)
  const existingClipKeys = useMemo(() => {
    const titles = new Set<string>();
    const fileIds = new Set<string>();

    computedFootage.forEach((f) => {
      if (f.title) {
        titles.add(cleanFootageTitle(f.title).toLowerCase().trim());
        titles.add(f.title.toLowerCase().trim());
      }
      if (f.driveFileUrl) {
        const extracted = extractGoogleDriveFileId(f.driveFileUrl);
        if (extracted) fileIds.add(extracted);
      }
      if (f.originalUrl) {
        const extracted = extractGoogleDriveFileId(f.originalUrl);
        if (extracted) fileIds.add(extracted);
      }
    });

    return { titles, fileIds };
  }, [computedFootage]);

  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgressUpdate | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<RecursiveScanResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Selection & Filtering State
  // Incremental scan: hide duplicate clips by default to save DOM/memory and highlight only new items
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('ALL');
  const [previewSearch, setPreviewSearch] = useState('');

  // Pasted mode fallback state
  const [pastedText, setPastedText] = useState('');

  // Execution & Progress State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccessData, setImportSuccessData] =
    useState<DriveImportSuccessSummary | null>(null);

  // Handle Save API Key
  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    if (val.trim()) {
      localStorage.setItem('DRIVE_API_KEY', val.trim());
    } else {
      localStorage.removeItem('DRIVE_API_KEY');
    }
  };

  // Switch strategy to SUBFOLDER_TO_CATEGORY and reset staged subfolder overrides
  const handleSelectSubfolderStrategy = () => {
    setCategoryStrategy('SUBFOLDER_TO_CATEGORY');
    setStagedSubfolders(new Set());
  };

  // Switch strategy to ALL_TO_STAGING
  const handleSelectAllToStagingStrategy = () => {
    setCategoryStrategy('ALL_TO_STAGING');
  };

  // Helper: Check if a specific subfolder is routed to Staging Area
  const isFolderRoutedToStaging = (folderName: string): boolean => {
    if (categoryStrategy === 'ALL_TO_STAGING') return true;
    return stagedSubfolders.has(folderName);
  };

  // Toggle a single subfolder between Category Mapping and Staging Area
  const handleToggleSubfolderStaging = (folderName: string) => {
    if (categoryStrategy === 'ALL_TO_STAGING') {
      // Switch to custom subfolder mode with all OTHER folders staged except this one
      if (scanResult) {
        const allFolders = Array.from(
          new Set(scanResult.videos.map((v) => v.parentFolderName || scanResult.rootFolderName))
        );
        const nextStaged = new Set(allFolders.filter((f) => f !== folderName));
        setStagedSubfolders(nextStaged);
        setCategoryStrategy('SUBFOLDER_TO_CATEGORY');
      }
      return;
    }

    setStagedSubfolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderName)) {
        next.delete(folderName);
      } else {
        next.add(folderName);
      }
      return next;
    });
  };

  // 1. Reconcile Categories for Discovered Videos
  const { folderCategoryMap, activeNewTagsToCreate } = useMemo(() => {
    if (!scanResult || scanResult.videos.length === 0) {
      return {
        folderCategoryMap: new Map<string, ReconciledCategoryResult>(),
        activeNewTagsToCreate: [] as CategoryTag[],
      };
    }

    const map = new Map<string, ReconciledCategoryResult>();
    const inMemoryNewTags: CategoryTag[] = [];

    // Group distinct immediate parent folders
    const distinctFolderNames = Array.from(
      new Set(scanResult.videos.map((v) => v.parentFolderName || scanResult.rootFolderName))
    );

    distinctFolderNames.forEach((folderName) => {
      const reconciled = reconcileSubfolder(
        folderName,
        tags,
        categoryGroups,
        inMemoryNewTags,
        targetGroupIdForNewTags
      );
      map.set(folderName, reconciled);
      if (reconciled.isNew) {
        inMemoryNewTags.push(reconciled.tag);
      }
    });

    // Only create new tags for subfolders that are NOT routed to Staging Area
    // and have at least one selected video
    const activeFoldersWithSelectedVideos = new Set(
      scanResult.videos
        .filter((v) => selectedVideoIds.has(v.id))
        .map((v) => v.parentFolderName || scanResult.rootFolderName)
    );

    const activeNewTagsMap = new Map<string, CategoryTag>();
    distinctFolderNames.forEach((folderName) => {
      if (categoryStrategy === 'ALL_TO_STAGING' || stagedSubfolders.has(folderName)) {
        return;
      }
      if (!activeFoldersWithSelectedVideos.has(folderName)) {
        return;
      }
      const reconciled = map.get(folderName);
      if (reconciled && reconciled.isNew) {
        activeNewTagsMap.set(reconciled.tag.id, reconciled.tag);
      }
    });

    return {
      folderCategoryMap: map,
      activeNewTagsToCreate: Array.from(activeNewTagsMap.values()),
    };
  }, [
    scanResult,
    tags,
    categoryGroups,
    targetGroupIdForNewTags,
    categoryStrategy,
    stagedSubfolders,
    selectedVideoIds,
  ]);

  // Quick helper to route ONLY newly-discovered (unmatched) folders to Staging while keeping existing matched categories
  const handleStageOnlyUnmatchedFolders = () => {
    if (!scanResult) return;
    setCategoryStrategy('SUBFOLDER_TO_CATEGORY');
    const unmatchedFolders = new Set<string>();
    folderCategoryMap.forEach((reconciled, folderName) => {
      if (reconciled.isNew) {
        unmatchedFolders.add(folderName);
      }
    });
    setStagedSubfolders(unmatchedFolders);
  };

  // 2. Start Recursive Scan
  const handleStartScan = async () => {
    const extractedId = extractGoogleDriveFolderId(folderUrl);
    if (!extractedId) {
      setScanError('กรุณาระบุลิงก์โฟลเดอร์ Google Drive หรือ Folder ID ที่ถูกต้อง');
      return;
    }

    if (!driveAccessToken && !apiKey.trim()) {
      setScanError('กรุณาเข้าสู่ระบบด้วย Google หรือกรอก Google Drive API Key สำรองก่อนเริ่มสแกน');
      return;
    }

    setScanError(null);
    setIsScanning(true);
    setScanResult(null);
    setStagedSubfolders(new Set());
    setScanProgress({
      foldersScanned: 0,
      foldersPending: 1,
      videosFound: 0,
      currentFolder: 'กำลังเตรียมการเชื่อมต่อ...',
      currentDepth: 0,
    });

    abortControllerRef.current = new AbortController();

    try {
      // Determine whether to apply Delta Sync timestamp filter from Firestore sync record
      const effectiveSinceModifiedTime =
        syncMode === 'DELTA' && folderSyncRecord?.lastSyncTimestamp
          ? folderSyncRecord.lastSyncTimestamp
          : null;

      const result = await scanGoogleDriveFolderRecursive({
        folderUrlOrId: extractedId,
        accessToken: driveAccessToken,
        apiKey: apiKey.trim() || undefined,
        maxDepth,
        sinceModifiedTime: effectiveSinceModifiedTime,
        existingClipKeys,
        onProgress: (prog) => {
          setScanProgress(prog);
        },
        signal: abortControllerRef.current.signal,
      });

      setScanResult(result);
      setHideDuplicates(true);
      // Auto-select ONLY newly discovered clips by default (skip duplicates)
      const newVideoIds = result.videos.filter((v) => !v.isDuplicate).map((v) => v.id);
      setSelectedVideoIds(new Set(newVideoIds));
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Scan error:', err);
        setScanError(err.message || 'เกิดข้อผิดพลาดในการสแกน Google Drive');
      }
    } finally {
      setIsScanning(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsScanning(false);
  };

  // 3. Selection Handlers & Actions
  const handleToggleSelectAll = (filteredVideos: DiscoveredDriveVideo[]) => {
    const isAllSelected = filteredVideos.length > 0 && filteredVideos.every((v) => selectedVideoIds.has(v.id));
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (isAllSelected) {
        filteredVideos.forEach((v) => next.delete(v.id));
      } else {
        filteredVideos.forEach((v) => next.add(v.id));
      }
      return next;
    });
  };

  const handleToggleOne = (id: string) => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleHideDuplicates = () => {
    setHideDuplicates((prev) => !prev);
  };

  const handleSelectOnlyNew = () => {
    if (!scanResult) return;
    const newVideoIds = scanResult.videos.filter((v) => !v.isDuplicate).map((v) => v.id);
    setSelectedVideoIds(new Set(newVideoIds));
  };

  const handleSelectAllVideos = () => {
    if (!scanResult) return;
    setSelectedVideoIds(new Set(scanResult.videos.map((v) => v.id)));
  };

  const handleDeselectAllVideos = () => {
    setSelectedVideoIds(new Set());
  };

  // Filtered Discovered Videos in Preview (omits duplicates when hideDuplicates is true to maximize DOM speed)
  const displayedVideos = useMemo(() => {
    if (!scanResult) return [];
    let list = scanResult.videos;

    if (hideDuplicates) {
      list = list.filter((v) => !v.isDuplicate);
    }

    if (selectedFolderFilter !== 'ALL') {
      list = list.filter((v) => v.parentFolderName === selectedFolderFilter);
    }

    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.cleanTitle.toLowerCase().includes(q) ||
          v.parentFolderName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [scanResult, hideDuplicates, selectedFolderFilter, previewSearch]);

  // Summary counts of selected videos going to Staging vs Categories
  const selectedRoutingSummary: SelectedRoutingSummary = useMemo(() => {
    if (!scanResult) return { toStaging: 0, toCategory: 0 };
    let toStaging = 0;
    let toCategory = 0;
    scanResult.videos.forEach((v) => {
      if (!selectedVideoIds.has(v.id)) return;
      const folderName = v.parentFolderName || scanResult.rootFolderName;
      if (categoryStrategy === 'ALL_TO_STAGING' || stagedSubfolders.has(folderName)) {
        toStaging += 1;
      } else {
        toCategory += 1;
      }
    });
    return { toStaging, toCategory };
  }, [scanResult, selectedVideoIds, categoryStrategy, stagedSubfolders]);

  // 4. Pasted fallback parsing
  const parsedPastedItems: ParsedPastedItem[] = useMemo(() => {
    if (activeImportMode !== 'PASTE') return [];
    const lines = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line, idx) => {
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
      const driveUrl = urlMatch ? urlMatch[1] : '';
      let remainingText = line.replace(driveUrl, '').trim();

      if (!remainingText && driveUrl) {
        remainingText = `คลิปจากไดรฟ์_ลำดับ_${idx + 1}`;
      } else if (!remainingText) {
        remainingText = line;
      }

      const cleanTitle = cleanFootageTitle(remainingText);
      return {
        id: `paste-item-${idx}`,
        title: cleanTitle,
        driveFileUrl: driveUrl || `https://drive.google.com/file/d/paste-${idx + 1}/view`,
        cleanFileName: `${cleanTitle}.mp4`,
      };
    });
  }, [activeImportMode, pastedText]);

  // 5. Execute Batch Import
  const handleExecuteImport = async () => {
    setIsImporting(true);
    setImportProgress(10);

    try {
      if (activeImportMode === 'RECURSIVE') {
        if (!scanResult) return;
        const targetVideos = scanResult.videos.filter((v) => selectedVideoIds.has(v.id));
        if (targetVideos.length === 0) return;

        // Step A: Create any new CategoryTags for non-staged subfolders
        if (activeNewTagsToCreate.length > 0) {
          batchAddTags(activeNewTagsToCreate);
        }
        setImportProgress(35);

        let stagedCount = 0;
        let categorizedCount = 0;

        // Step B: Build Footage Payload based on selected Category Strategy & per-folder overrides
        const payloadItems = targetVideos.map((item) => {
          const folderName = item.parentFolderName || scanResult.rootFolderName;
          const isStaged = isFolderRoutedToStaging(folderName);
          const reconciled = folderCategoryMap.get(folderName);

          const assignedTagId = isStaged
            ? STAGING_TAG_ID
            : reconciled
            ? reconciled.tagId
            : STAGING_TAG_ID;

          if (assignedTagId === STAGING_TAG_ID) {
            stagedCount += 1;
          } else {
            categorizedCount += 1;
          }

          return {
            title: item.cleanTitle,
            driveFileUrl: item.webViewLink,
            originalUrl: item.webViewLink,
            thumbnailUrl: item.thumbnailUrl,
            tags: [assignedTagId],
            mascotNotes: isStaged
              ? `พักรอจัดหมวดหมู่ (จากโฟลเดอร์ "${folderName}")`
              : `นำเข้าจากโฟลเดอร์ "${folderName}"`,
            durationSec: item.durationSec || 25,
          };
        });

        setImportProgress(65);
        const added = batchAddDirectFootage(payloadItems, idPrefix);
        setImportProgress(100);

        // Update Centralized Firestore Sync Record for this Google Drive folder
        const nowIso = new Date().toISOString();
        const updatedRecord: DriveSyncRecord = {
          folderId: scanResult.rootFolderId,
          folderName: scanResult.rootFolderName,
          lastSyncTimestamp: nowIso,
          lastSyncVideoCount: added.length,
          totalClipsInFolder: (folderSyncRecord?.totalClipsInFolder || 0) + added.length,
          updatedAt: nowIso,
          updatedBy: currentUser?.email || 'authenticated-user',
        };

        firestoreService
          .saveDriveSyncRecord(updatedRecord)
          .then(() => {
            setFolderSyncRecord(updatedRecord);
          })
          .catch((err) => {
            console.warn('Failed to update DriveSyncRecord in Firestore:', err);
          });

        setImportSuccessData({
          totalImported: added.length,
          stagedCount,
          categorizedCount,
          newTagsCreated: activeNewTagsToCreate.length,
          createdTagNames: activeNewTagsToCreate.map((t) => t.name),
          skippedDuplicatesCount: scanResult.totalDuplicates,
        });
      } else {
        // Mode PASTE
        if (parsedPastedItems.length === 0) return;
        const isStaged = isStagingTagId(pasteTargetTagId);
        const payload = parsedPastedItems.map((item) => ({
          title: item.title,
          driveFileUrl: item.driveFileUrl,
          originalUrl: item.driveFileUrl,
          tags: [pasteTargetTagId],
          mascotNotes: isStaged
            ? 'นำเข้าแบบข้อความ (พักรอจัดหมวดหมู่)'
            : 'นำเข้าแบบข้อความพร้อมระบุหมวดหมู่',
          durationSec: 25,
        }));

        const added = batchAddDirectFootage(payload, idPrefix);
        setImportProgress(100);
        setImportSuccessData({
          totalImported: added.length,
          stagedCount: isStaged ? added.length : 0,
          categorizedCount: isStaged ? 0 : added.length,
          newTagsCreated: 0,
          createdTagNames: [],
        });
      }
    } catch (err) {
      console.error('Execute import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (isScanning && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGoogleDriveBatchModalOpen(false);
    setImportSuccessData(null);
    setScanResult(null);
    setStagedSubfolders(new Set());
  };

  const handleGoToLibrary = (filterTagId: string = 'ALL') => {
    handleClose();
    setSelectedTagFilter(filterTagId === 'ALL' ? [] : [filterTagId]);
    setActiveTab('FOOTAGE_LIBRARY');
  };

  const selectableMainCategories = useMemo(
    () => tags.filter((t) => (t.tier === 1 || (!t.parentId && !t.tier)) && !isStagingTagId(t.id)),
    [tags]
  );

  return {
    // Modal & Auth
    isGoogleDriveBatchModalOpen,
    currentUser,
    signInWithGoogle,
    isGoogleDriveConnected,
    computedFootageCount: computedFootage.length,

    // Mode & Prefix
    activeImportMode,
    setActiveImportMode,
    idPrefix,
    setIdPrefix,

    // Folder & API Key
    folderUrl,
    setFolderUrl,
    apiKey,
    handleSaveApiKey,
    isApiKeyExpanded,
    setIsApiKeyExpanded,
    maxDepth,
    setMaxDepth,

    // Google Drive Delta Sync (Timestamp & Firestore)
    syncMode,
    setSyncMode,
    folderSyncRecord,
    isLoadingSyncRecord,

    // Category Strategy & Subfolder Staging
    categoryStrategy,
    handleSelectSubfolderStrategy,
    handleSelectAllToStagingStrategy,
    nonStagingGroups,
    targetGroupIdForNewTags,
    setTargetGroupIdForNewTags,
    isFolderRoutedToStaging,
    handleToggleSubfolderStaging,
    handleStageOnlyUnmatchedFolders,
    folderCategoryMap,
    activeNewTagsToCreate,
    selectedRoutingSummary,

    // Scanning
    isScanning,
    scanProgress,
    scanError,
    scanResult,
    handleStartScan,
    handleCancelScan,

    // Video Table Selection & Filtering
    selectedVideoIds,
    handleToggleSelectAll,
    handleToggleOne,
    selectedFolderFilter,
    setSelectedFolderFilter,
    previewSearch,
    setPreviewSearch,
    displayedVideos,

    // Incremental Deduplication State & Controls
    hideDuplicates,
    handleToggleHideDuplicates,
    handleSelectOnlyNew,
    handleSelectAllVideos,
    handleDeselectAllVideos,

    // Manual Paste Mode
    pasteTargetTagId,
    setPasteTargetTagId,
    pastedText,
    setPastedText,
    parsedPastedItems,
    selectableMainCategories,

    // Execution & Navigation
    isImporting,
    importProgress,
    importSuccessData,
    handleExecuteImport,
    handleClose,
    handleGoToLibrary,
  };
};
