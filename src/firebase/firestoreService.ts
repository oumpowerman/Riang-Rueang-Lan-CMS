import {
  collection,
  doc,
  setDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import { Footage } from '../types/footage.types';
import { RawSource } from '../types/source.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../types/tag.types';
import { Episode } from '../types/episode.types';
import { DriveSyncRecord } from '../types/driveSync.types';
import {
  SupabaseConnectionConfig,
  SupabaseRowDraftOverride,
} from '../types/supabaseSync.types';
import { INITIAL_CATEGORY_GROUPS } from '../services/seedData';

// Modular helpers & error handling
import {
  MAX_BATCH_OPERATIONS,
  BatchChunkProgress,
  BatchWriteOp,
  isBatchWriteInProgress,
  onBatchWriteComplete,
  withBatchWriteLock,
  commitOperationsInChunks,
  sanitizeForFirestore,
  normalizeCategoryTag,
} from './firestoreBatchUtils';

import {
  createSafeSnapshotErrorHandler,
  isQuotaExhaustedError,
  getIsFirestoreQuotaExhausted,
  subscribeFirestoreQuotaChange,
  markFirestoreQuotaExhausted,
} from './firestoreErrorHandling';

import {
  subscribeSupabaseConfig,
  saveSupabaseConfigToCloud,
  subscribeSupabaseRowDrafts,
  saveSupabaseRowDraftsToCloud,
} from './firestoreSupabaseSync';

import {
  GoogleDriveAuthPayload,
  getDriveSyncRecord,
  saveDriveSyncRecord,
  deleteDriveSyncRecord,
  subscribeDriveSyncRecord,
  getAllDriveSyncRecords,
  subscribeGoogleDriveAuth,
  saveGoogleDriveAuthToCloud,
} from './firestoreDriveSync';

import {
  seedInitialDatabase,
  clearAllClipsFromCloud,
  clearAllCategoriesFromCloud,
  restoreCategoriesToCloud,
} from './firestoreAdminOps';

import {
  CLIENT_INSTANCE_ID,
  CLOCK_SKEW_BUFFER_MS,
  type DeletedTombstoneRecord,
  type SyncCollectionKey,
  type SyncPulseMetadata,
  broadcastForceSyncToAllDevices,
  emitSyncPulse,
  extractDeletedIdsSince,
  fetchArchiveSummaryStatsOnce,
  registerOnPulseEmitted,
  subtractClockSkewBuffer,
  updateCachedSyncPulse,
} from './firestoreSyncPulse';

import {
  type OutboxFlushResult,
  type OutboxQueueSnapshot,
  clearOutboxQueue,
  flushOutboxQueue,
  initOutboxAutoRetry,
  reloadOutboxFromStorage,
  subscribeOutboxState,
} from './firestoreOutboxQueue';

import {
  fetchSettingsOnce,
  saveCategoryGroup,
  deleteCategoryGroup,
  saveCategory,
  batchSaveCategories,
  deleteCategory,
  batchDeleteCategories,
  saveSource,
  batchSaveSources,
  deleteSource,
  saveFootage,
  batchSaveFootages,
  deleteFootage,
  batchDeleteFootages,
  saveEpisode,
  batchSaveEpisodes,
  deleteEpisode,
  saveSettings,
} from './firestoreCrudOps';

// Re-export modular types and utilities
export {
  MAX_BATCH_OPERATIONS,
  type BatchChunkProgress,
  type BatchWriteOp,
  isBatchWriteInProgress,
  onBatchWriteComplete,
  withBatchWriteLock,
  commitOperationsInChunks,
  sanitizeForFirestore,
  normalizeCategoryTag,
  createSafeSnapshotErrorHandler,
  isQuotaExhaustedError,
  getIsFirestoreQuotaExhausted,
  subscribeFirestoreQuotaChange,
  markFirestoreQuotaExhausted,
  type GoogleDriveAuthPayload,
  subscribeSupabaseConfig,
  saveSupabaseConfigToCloud,
  subscribeSupabaseRowDrafts,
  saveSupabaseRowDraftsToCloud,
  getDriveSyncRecord,
  saveDriveSyncRecord,
  deleteDriveSyncRecord,
  subscribeDriveSyncRecord,
  getAllDriveSyncRecords,
  subscribeGoogleDriveAuth,
  saveGoogleDriveAuthToCloud,
  seedInitialDatabase,
  clearAllClipsFromCloud,
  clearAllCategoriesFromCloud,
  restoreCategoriesToCloud,
  CLIENT_INSTANCE_ID,
  CLOCK_SKEW_BUFFER_MS,
  type DeletedTombstoneRecord,
  type SyncCollectionKey,
  type SyncPulseMetadata,
  broadcastForceSyncToAllDevices,
  emitSyncPulse,
  extractDeletedIdsSince,
  fetchArchiveSummaryStatsOnce,
  registerOnPulseEmitted,
  subtractClockSkewBuffer,
  updateCachedSyncPulse,
  type OutboxFlushResult,
  type OutboxQueueSnapshot,
  clearOutboxQueue,
  flushOutboxQueue,
  initOutboxAutoRetry,
  reloadOutboxFromStorage,
  subscribeOutboxState,
};

export interface ServerCollectionCounts {
  totalEpisodes: number;
  totalFootage: number;
  totalSources: number;
  totalCategories?: number;
  fetchedAt: string;
}

export interface ArchiveSummaryStats extends SyncPulseMetadata {
  totalEpisodes: number;
  completeEpisodesCount: number;
  incompleteEpisodesCount: number;
  incompleteFootageEpisodesCount: number;
  distinctSeriesCount: number;
  totalFootage: number;
  usedFootageCount: number;
  readyFootageCount: number;
  newFootageCount: number;
  coolingFootageCount: number;
  untaggedFootageCount: number;
  missingDriveCount: number;
  totalSources: number;
  updatedAt: string;
}

export const firestoreService = {
  // Batch lock & progress
  isBatchWriteInProgress,
  onBatchWriteComplete,
  withBatchWriteLock,

  // ==========================================
  // REALTIME SUBSCRIPTIONS (SAFE ERROR HANDLED)
  // ==========================================

  subscribeCategoryGroups(
    onUpdate: (groups: CategoryGroup[]) => void,
    onError?: (err: Error) => void
  ) {
    const colRef = collection(db, 'category_groups');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: CategoryGroup[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as CategoryGroup);
        });
        list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
        onUpdate(list);
      },
      createSafeSnapshotErrorHandler('category_groups', onError)
    );
  },

  subscribeCategories(
    onUpdate: (categories: CategoryTag[]) => void,
    onError?: (err: Error) => void
  ) {
    const colRef = collection(db, 'categories');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: CategoryTag[] = [];
        snapshot.forEach((d) => {
          list.push(normalizeCategoryTag(d.data() as CategoryTag));
        });
        onUpdate(list);
      },
      createSafeSnapshotErrorHandler('categories', onError)
    );
  },

  subscribeSources(
    onUpdate: (sources: RawSource[]) => void,
    onError?: (err: Error) => void
  ) {
    const colRef = collection(db, 'sources');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: RawSource[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as RawSource);
        });
        onUpdate(list);
      },
      createSafeSnapshotErrorHandler('sources', onError)
    );
  },

  subscribeFootages(
    onUpdate: (footages: Footage[]) => void,
    onError?: (err: Error) => void
  ) {
    const colRef = collection(db, 'footages');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Footage[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Footage);
        });
        onUpdate(list);
      },
      createSafeSnapshotErrorHandler('footages', onError)
    );
  },

  /**
   * Two-Stage Progressive Loader for Footages (10,000+ row support):
   * Stage 1: Fetches an initial window (first 300 docs) immediately if local cache is empty
   * Stage 2: Streams the complete collection + live delta updates in the background.
   */
  /**
   * Smart Delta Queries (Query ONLY changed documents since last sync, saving 99.9% read quota)
   */
  async fetchFootagesDelta(sinceIso?: string): Promise<Footage[]> {
    try {
      const colRef = collection(db, 'footages');
      const q = sinceIso
        ? query(colRef, where('updatedAt', '>', sinceIso))
        : colRef;
      const snap = await getDocs(q);
      const list: Footage[] = [];
      snap.forEach((d) => list.push(d.data() as Footage));
      return list;
    } catch (err) {
      if (isQuotaExhaustedError(err)) markFirestoreQuotaExhausted(true);
      console.warn('fetchFootagesDelta warning:', err);
      return [];
    }
  },

  async fetchEpisodesDelta(sinceIso?: string): Promise<Episode[]> {
    try {
      const colRef = collection(db, 'episodes');
      const q = sinceIso
        ? query(colRef, where('updatedAt', '>', sinceIso))
        : colRef;
      const snap = await getDocs(q);
      const list: Episode[] = [];
      snap.forEach((d) => list.push(d.data() as Episode));
      return list;
    } catch (err) {
      if (isQuotaExhaustedError(err)) markFirestoreQuotaExhausted(true);
      console.warn('fetchEpisodesDelta warning:', err);
      return [];
    }
  },

  async fetchSourcesDelta(sinceIso?: string): Promise<RawSource[]> {
    try {
      const colRef = collection(db, 'sources');
      const q = sinceIso
        ? query(colRef, where('updatedAt', '>', sinceIso))
        : colRef;
      const snap = await getDocs(q);
      const list: RawSource[] = [];
      snap.forEach((d) => list.push(d.data() as RawSource));
      return list;
    } catch (err) {
      if (isQuotaExhaustedError(err)) markFirestoreQuotaExhausted(true);
      console.warn('fetchSourcesDelta warning:', err);
      return [];
    }
  },

  async fetchCategoriesDelta(sinceIso?: string): Promise<CategoryTag[]> {
    try {
      const colRef = collection(db, 'categories');
      const q = sinceIso
        ? query(colRef, where('updatedAt', '>', sinceIso))
        : colRef;
      const snap = await getDocs(q);
      const list: CategoryTag[] = [];
      snap.forEach((d) => list.push(normalizeCategoryTag(d.data() as CategoryTag)));
      return list;
    } catch (err) {
      if (isQuotaExhaustedError(err)) markFirestoreQuotaExhausted(true);
      console.warn('fetchCategoriesDelta warning:', err);
      return [];
    }
  },

  async fetchCategoryGroupsDelta(sinceIso?: string): Promise<CategoryGroup[]> {
    try {
      const colRef = collection(db, 'category_groups');
      const q = sinceIso
        ? query(colRef, where('updatedAt', '>', sinceIso))
        : colRef;
      const snap = await getDocs(q);
      const list: CategoryGroup[] = [];
      snap.forEach((d) => list.push(d.data() as CategoryGroup));
      list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      return list;
    } catch (err) {
      if (isQuotaExhaustedError(err)) markFirestoreQuotaExhausted(true);
      console.warn('fetchCategoryGroupsDelta warning:', err);
      return [];
    }
  },

  subscribeFootagesProgressive(
    _hasLocalCache: () => boolean,
    _onFirstWindow: (footages: Footage[]) => void,
    onFullSnapshot: (footages: Footage[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    let cancelled = false;
    const colRef = collection(db, 'footages');

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (cancelled) return;
        const list: Footage[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Footage);
        });
        onFullSnapshot(list);
      },
      createSafeSnapshotErrorHandler('footages_progressive', onError)
    );

    return () => {
      cancelled = true;
      unsub();
    };
  },

  subscribeEpisodes(
    onUpdate: (episodes: Episode[]) => void,
    onError?: (err: Error) => void
  ) {
    const colRef = collection(db, 'episodes');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Episode[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Episode);
        });
        onUpdate(list);
      },
      createSafeSnapshotErrorHandler('episodes', onError)
    );
  },

  subscribeEpisodesProgressive(
    _hasLocalCache: () => boolean,
    _onFirstWindow: (episodes: Episode[]) => void,
    onFullSnapshot: (episodes: Episode[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    let cancelled = false;
    const colRef = collection(db, 'episodes');

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (cancelled) return;
        const list: Episode[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Episode);
        });
        onFullSnapshot(list);
      },
      createSafeSnapshotErrorHandler('episodes_progressive', onError)
    );

    return () => {
      cancelled = true;
      unsub();
    };
  },

  /**
   * Fast Server-Side Row Counts using Firestore getCountFromServer()
   */
  async fetchServerCollectionCounts(): Promise<ServerCollectionCounts | null> {
    try {
      const [epCountSnap, ftCountSnap, srcCountSnap, catCountSnap] = await Promise.all([
        getCountFromServer(collection(db, 'episodes')),
        getCountFromServer(collection(db, 'footages')),
        getCountFromServer(collection(db, 'sources')),
        getCountFromServer(collection(db, 'categories')),
      ]);
      return {
        totalEpisodes: epCountSnap.data().count,
        totalFootage: ftCountSnap.data().count,
        totalSources: srcCountSnap.data().count,
        totalCategories: catCountSnap.data().count,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (isQuotaExhaustedError(err)) {
        markFirestoreQuotaExhausted(true);
      }
      return null;
    }
  },

  subscribeArchiveSummaryStats(
    onUpdate: (stats: ArchiveSummaryStats | null) => void,
    onError?: (err: Error) => void
  ): () => void {
    const docRef = doc(db, 'system_settings', 'archive_summary_stats');
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          onUpdate(null);
        } else {
          onUpdate(snap.data() as ArchiveSummaryStats);
        }
      },
      createSafeSnapshotErrorHandler('archive_summary_stats', onError)
    );
  },

  async saveArchiveSummaryStats(stats: ArchiveSummaryStats): Promise<void> {
    try {
      const docRef = doc(db, 'system_settings', 'archive_summary_stats');
      await setDoc(
        docRef,
        sanitizeForFirestore({
          ...stats,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    } catch (err) {
      console.warn('Failed to save archive_summary_stats:', err);
    }
  },

  subscribeSettings(
    onUpdate: (settings: SystemSettings) => void,
    onError?: (err: Error) => void
  ) {
    const docRef = doc(db, 'system_settings', 'global_rules');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as SystemSettings);
        }
      },
      createSafeSnapshotErrorHandler('settings', onError)
    );
  },

  // ==========================================
  // CRUD OPERATIONS (WITH OFFLINE OUTBOX QUEUE)
  // ==========================================
  broadcastForceSyncToAllDevices,
  fetchArchiveSummaryStatsOnce: () =>
    fetchArchiveSummaryStatsOnce<ArchiveSummaryStats>(),
  fetchSettingsOnce,
  saveCategoryGroup,
  deleteCategoryGroup,
  saveCategory,
  batchSaveCategories,
  deleteCategory,
  batchDeleteCategories,
  saveSource,
  batchSaveSources,
  deleteSource,
  saveFootage,
  batchSaveFootages,
  deleteFootage,
  batchDeleteFootages,
  saveEpisode,
  batchSaveEpisodes,
  deleteEpisode,
  saveSettings,

  // Admin & Seed delegates
  seedInitialDatabase,
  clearAllClipsFromCloud,
  clearAllCategoriesFromCloud,
  restoreCategoriesToCloud,

  // Google Drive Delta Sync delegates
  getDriveSyncRecord,
  saveDriveSyncRecord,
  deleteDriveSyncRecord,
  subscribeDriveSyncRecord,
  getAllDriveSyncRecords,

  // Supabase delegates
  subscribeSupabaseConfig,
  saveSupabaseConfigToCloud,
  subscribeSupabaseRowDrafts,
  saveSupabaseRowDraftsToCloud,

  // Google Drive Auth delegates
  subscribeGoogleDriveAuth,
  saveGoogleDriveAuthToCloud,
};
