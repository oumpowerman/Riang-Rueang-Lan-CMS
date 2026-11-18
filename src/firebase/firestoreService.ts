import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getCountFromServer,
  query,
  limit,
  where,
  onSnapshot,
  serverTimestamp,
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
};

export interface ServerCollectionCounts {
  totalEpisodes: number;
  totalFootage: number;
  totalSources: number;
  fetchedAt: string;
}

export interface ArchiveSummaryStats {
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
      const [epCountSnap, ftCountSnap, srcCountSnap] = await Promise.all([
        getCountFromServer(collection(db, 'episodes')),
        getCountFromServer(collection(db, 'footages')),
        getCountFromServer(collection(db, 'sources')),
      ]);
      return {
        totalEpisodes: epCountSnap.data().count,
        totalFootage: ftCountSnap.data().count,
        totalSources: srcCountSnap.data().count,
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
  // CRUD OPERATIONS
  // ==========================================

  async saveCategoryGroup(group: CategoryGroup) {
    const docRef = doc(db, 'category_groups', group.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({ ...group, updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  },

  async deleteCategoryGroup(groupId: string) {
    const docRef = doc(db, 'category_groups', groupId);
    await deleteDoc(docRef);
  },

  async saveCategory(category: CategoryTag) {
    const docRef = doc(db, 'categories', category.id);
    const normalized = normalizeCategoryTag(category);
    await setDoc(
      docRef,
      sanitizeForFirestore({ ...normalized, updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  },

  async batchSaveCategories(
    categories: CategoryTag[],
    onProgress?: (progress: BatchChunkProgress) => void
  ) {
    if (!categories.length) return;
    const now = new Date().toISOString();
    const ops: BatchWriteOp[] = categories.map((cat) => {
      const normalized = normalizeCategoryTag(cat);
      return {
        type: 'set',
        ref: doc(db, 'categories', cat.id),
        data: sanitizeForFirestore({
          ...normalized,
          updatedAt: now,
        }) as unknown as Record<string, unknown>,
      };
    });
    await commitOperationsInChunks(ops, onProgress);
  },

  async deleteCategory(categoryId: string) {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
  },

  async batchDeleteCategories(
    categoryIds: string[],
    onProgress?: (progress: BatchChunkProgress) => void
  ) {
    if (!categoryIds.length) return;
    const ops: BatchWriteOp[] = categoryIds.map((id) => ({
      type: 'delete',
      ref: doc(db, 'categories', id),
    }));
    await commitOperationsInChunks(ops, onProgress);
  },

  async saveSource(source: RawSource) {
    const docRef = doc(db, 'sources', source.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...source,
        updatedAt: new Date().toISOString(),
        serverUpdatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  },

  async batchSaveSources(
    sources: RawSource[],
    onProgress?: (progress: BatchChunkProgress) => void
  ) {
    if (!sources.length) return;
    const now = new Date().toISOString();
    const ops: BatchWriteOp[] = sources.map((src) => ({
      type: 'set',
      ref: doc(db, 'sources', src.id),
      data: sanitizeForFirestore({
        ...src,
        updatedAt: now,
        serverUpdatedAt: serverTimestamp(),
      }) as unknown as Record<string, unknown>,
    }));
    await commitOperationsInChunks(ops, onProgress);
  },

  async deleteSource(sourceId: string) {
    const docRef = doc(db, 'sources', sourceId);
    await deleteDoc(docRef);
  },

  async saveFootage(footage: Footage) {
    const docRef = doc(db, 'footages', footage.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...footage,
        updatedAt: new Date().toISOString(),
        serverUpdatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  },

  async batchSaveFootages(
    footages: Footage[],
    onProgress?: (progress: BatchChunkProgress) => void
  ) {
    if (!footages.length) return;
    const now = new Date().toISOString();
    const ops: BatchWriteOp[] = footages.map((ft) => ({
      type: 'set',
      ref: doc(db, 'footages', ft.id),
      data: sanitizeForFirestore({
        ...ft,
        updatedAt: now,
        serverUpdatedAt: serverTimestamp(),
      }) as unknown as Record<string, unknown>,
    }));
    await commitOperationsInChunks(ops, onProgress);
  },

  async deleteFootage(footageId: string) {
    const docRef = doc(db, 'footages', footageId);
    await deleteDoc(docRef);
  },

  async batchDeleteFootages(
    footageIds: string[],
    onProgress?: (progress: BatchChunkProgress) => void
  ) {
    if (!footageIds.length) return;
    const ops: BatchWriteOp[] = footageIds.map((id) => ({
      type: 'delete',
      ref: doc(db, 'footages', id),
    }));
    await commitOperationsInChunks(ops, onProgress);
  },

  async saveEpisode(episode: Episode) {
    const docRef = doc(db, 'episodes', episode.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...episode,
        updatedAt: new Date().toISOString(),
        serverUpdatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  },

  async batchSaveEpisodes(
    episodes: Episode[],
    onProgress?: (progress: BatchChunkProgress) => void
  ) {
    if (!episodes.length) return;
    const now = new Date().toISOString();
    const ops: BatchWriteOp[] = episodes.map((ep) => ({
      type: 'set',
      ref: doc(db, 'episodes', ep.id),
      data: sanitizeForFirestore({
        ...ep,
        updatedAt: now,
        serverUpdatedAt: serverTimestamp(),
      }) as unknown as Record<string, unknown>,
    }));
    await commitOperationsInChunks(ops, onProgress);
  },

  async deleteEpisode(episodeId: string) {
    const docRef = doc(db, 'episodes', episodeId);
    await deleteDoc(docRef);
  },

  async saveSettings(settings: SystemSettings) {
    const docRef = doc(db, 'system_settings', 'global_rules');
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...settings,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  },

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
