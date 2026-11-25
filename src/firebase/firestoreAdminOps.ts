import { collection, doc, getDocs } from 'firebase/firestore';
import { db } from './config';
import { Footage } from '../types/footage.types';
import { RawSource } from '../types/source.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../types/tag.types';
import { Episode } from '../types/episode.types';
import { INITIAL_CATEGORY_GROUPS } from '../services/seedData';
import {
  BatchWriteOp,
  commitOperationsInChunks,
  normalizeCategoryTag,
  sanitizeForFirestore,
} from './firestoreBatchUtils';
import { CLIENT_INSTANCE_ID, emitSyncPulse } from './firestoreSyncPulse';
import { evaluateEpisodeCompleteness } from '../utils/episodeValidator';

export interface SeedResult {
  upsertedCount: number;
  deletedCount: number;
}

export async function seedInitialDatabase(
  categories: CategoryTag[],
  footages: Footage[],
  episodes: Episode[],
  settings: SystemSettings,
  categoryGroups: CategoryGroup[] = INITIAL_CATEGORY_GROUPS,
  sources: RawSource[] = []
): Promise<SeedResult> {
  const now = new Date().toISOString();
  const ops: BatchWriteOp[] = [];
  let deletedCount = 0;

  // 1. Scan Cloud to identify and purge orphaned documents not present in Machine A
  try {
    const [
      categoriesSnap,
      groupsSnap,
      sourcesSnap,
      footagesSnap,
      episodesSnap,
    ] = await Promise.all([
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'category_groups')),
      getDocs(collection(db, 'sources')),
      getDocs(collection(db, 'footages')),
      getDocs(collection(db, 'episodes')),
    ]);

    const incomingCatIds = new Set(categories.map((c) => c.id));
    const incomingGroupIds = new Set(categoryGroups.map((g) => g.id));
    const incomingSourceIds = new Set(sources.map((s) => s.id));
    const incomingFootageIds = new Set(footages.map((f) => f.id));
    const incomingEpisodeIds = new Set(episodes.map((e) => e.id));

    categoriesSnap.forEach((docSnap) => {
      if (!incomingCatIds.has(docSnap.id)) {
        ops.push({ type: 'delete', ref: docSnap.ref });
        deletedCount++;
      }
    });

    groupsSnap.forEach((docSnap) => {
      if (!incomingGroupIds.has(docSnap.id)) {
        ops.push({ type: 'delete', ref: docSnap.ref });
        deletedCount++;
      }
    });

    sourcesSnap.forEach((docSnap) => {
      if (!incomingSourceIds.has(docSnap.id)) {
        ops.push({ type: 'delete', ref: docSnap.ref });
        deletedCount++;
      }
    });

    footagesSnap.forEach((docSnap) => {
      if (!incomingFootageIds.has(docSnap.id)) {
        ops.push({ type: 'delete', ref: docSnap.ref });
        deletedCount++;
      }
    });

    episodesSnap.forEach((docSnap) => {
      if (!incomingEpisodeIds.has(docSnap.id)) {
        ops.push({ type: 'delete', ref: docSnap.ref });
        deletedCount++;
      }
    });
  } catch (scanErr) {
    console.warn('seedInitialDatabase: scan for orphans warning:', scanErr);
  }

  // 2. Save settings
  ops.push({
    type: 'set',
    ref: doc(db, 'system_settings', 'global_rules'),
    data: sanitizeForFirestore({ ...settings, updatedAt: now }) as unknown as Record<
      string,
      unknown
    >,
  });

  // 3. Seed Category Groups
  for (const grp of categoryGroups) {
    ops.push({
      type: 'set',
      ref: doc(db, 'category_groups', grp.id),
      data: sanitizeForFirestore({ ...grp, updatedAt: now }) as unknown as Record<
        string,
        unknown
      >,
    });
  }

  // 4. Seed Categories
  for (const cat of categories) {
    const normalized = normalizeCategoryTag(cat);
    ops.push({
      type: 'set',
      ref: doc(db, 'categories', cat.id),
      data: sanitizeForFirestore({ ...normalized, updatedAt: now }) as unknown as Record<
        string,
        unknown
      >,
    });
  }

  // 5. Seed Sources
  for (const src of sources) {
    ops.push({
      type: 'set',
      ref: doc(db, 'sources', src.id),
      data: sanitizeForFirestore({ ...src, updatedAt: now }) as unknown as Record<
        string,
        unknown
      >,
    });
  }

  // 6. Seed Footages
  for (const ft of footages) {
    ops.push({
      type: 'set',
      ref: doc(db, 'footages', ft.id),
      data: sanitizeForFirestore({ ...ft, updatedAt: now }) as unknown as Record<
        string,
        unknown
      >,
    });
  }

  // 7. Seed Episodes
  for (const ep of episodes) {
    ops.push({
      type: 'set',
      ref: doc(db, 'episodes', ep.id),
      data: sanitizeForFirestore({ ...ep, updatedAt: now }) as unknown as Record<
        string,
        unknown
      >,
    });
  }

  // 8. Recalibrate and Authoritatively Write archive_summary_stats
  let completeEpisodesCount = 0;
  let incompleteEpisodesCount = 0;
  let incompleteFootageEpisodesCount = 0;
  for (const ep of episodes) {
    const comp = evaluateEpisodeCompleteness(ep);
    if (comp.isComplete) completeEpisodesCount++;
    else incompleteEpisodesCount++;
    if (!comp.hasFullFiveSlots) incompleteFootageEpisodesCount++;
  }

  let untaggedFootageCount = 0;
  let missingDriveCount = 0;
  for (const ft of footages) {
    if (!ft.tags || ft.tags.length === 0) untaggedFootageCount++;
    if (!ft.driveFileUrl) missingDriveCount++;
  }

  const archiveSummaryData = {
    totalEpisodes: episodes.length,
    completeEpisodesCount,
    incompleteEpisodesCount,
    incompleteFootageEpisodesCount,
    distinctSeriesCount: 0,
    totalFootage: footages.length,
    usedFootageCount: 0,
    readyFootageCount: footages.length,
    newFootageCount: footages.length,
    coolingFootageCount: 0,
    untaggedFootageCount,
    missingDriveCount,
    totalSources: sources.length,
    updatedAt: now,
    lastMutationAt: now,
    lastMutationBy: CLIENT_INSTANCE_ID,
    lastMutationType: 'admin:seed',
    collectionVersions: {
      categories: now,
      category_groups: now,
      sources: now,
      footages: now,
      episodes: now,
    },
    recentDeletes: [],
  };

  ops.push({
    type: 'set',
    ref: doc(db, 'system_settings', 'archive_summary_stats'),
    data: sanitizeForFirestore(archiveSummaryData) as unknown as Record<string, unknown>,
    merge: false,
  });

  await commitOperationsInChunks(ops);
  emitSyncPulse({
    upsertedCollections: [
      'footages',
      'episodes',
      'sources',
      'categories',
      'category_groups',
    ],
    mutationType: 'admin:seed',
  });

  const upsertedCount =
    1 +
    categoryGroups.length +
    categories.length +
    sources.length +
    footages.length +
    episodes.length +
    1;

  return { upsertedCount, deletedCount };
}

export async function clearAllClipsFromCloud(): Promise<void> {
  try {
    const [sourcesSnap, footagesSnap, episodesSnap, driveSyncSnap] =
      await Promise.all([
        getDocs(collection(db, 'sources')),
        getDocs(collection(db, 'footages')),
        getDocs(collection(db, 'episodes')),
        getDocs(collection(db, 'drive_sync_records')),
      ]);

    if (
      sourcesSnap.empty &&
      footagesSnap.empty &&
      episodesSnap.empty &&
      driveSyncSnap.empty
    ) {
      return;
    }

    const ops: BatchWriteOp[] = [];
    sourcesSnap.forEach((docSnap) => {
      ops.push({ type: 'delete', ref: docSnap.ref });
    });
    footagesSnap.forEach((docSnap) => {
      ops.push({ type: 'delete', ref: docSnap.ref });
    });
    episodesSnap.forEach((docSnap) => {
      ops.push({ type: 'delete', ref: docSnap.ref });
    });
    driveSyncSnap.forEach((docSnap) => {
      ops.push({ type: 'delete', ref: docSnap.ref });
    });

    await commitOperationsInChunks(ops);
    emitSyncPulse({
      clipsWiped: true,
      mutationType: 'admin:clear_clips',
    });
  } catch (err) {
    console.warn('clearAllClipsFromCloud error:', err);
  }
}

export async function clearAllCategoriesFromCloud(): Promise<void> {
  try {
    const [groupsSnap, categoriesSnap] = await Promise.all([
      getDocs(collection(db, 'category_groups')),
      getDocs(collection(db, 'categories')),
    ]);

    if (groupsSnap.empty && categoriesSnap.empty) {
      return;
    }

    const ops: BatchWriteOp[] = [];
    groupsSnap.forEach((docSnap) => {
      ops.push({ type: 'delete', ref: docSnap.ref });
    });
    categoriesSnap.forEach((docSnap) => {
      ops.push({ type: 'delete', ref: docSnap.ref });
    });

    await commitOperationsInChunks(ops);
    emitSyncPulse({
      categoriesWiped: true,
      mutationType: 'admin:clear_categories',
    });
  } catch (err) {
    console.warn('clearAllCategoriesFromCloud error:', err);
  }
}

export async function restoreCategoriesToCloud(
  categoryGroups: CategoryGroup[],
  categories: CategoryTag[]
): Promise<void> {
  const now = new Date().toISOString();
  const ops: BatchWriteOp[] = [];

  for (const grp of categoryGroups) {
    ops.push({
      type: 'set',
      ref: doc(db, 'category_groups', grp.id),
      data: sanitizeForFirestore({ ...grp, updatedAt: now }) as unknown as Record<
        string,
        unknown
      >,
    });
  }

  for (const cat of categories) {
    const normalized = normalizeCategoryTag(cat);
    ops.push({
      type: 'set',
      ref: doc(db, 'categories', cat.id),
      data: sanitizeForFirestore({ ...normalized, updatedAt: now }) as unknown as Record<
        string,
        unknown
      >,
    });
  }

  await commitOperationsInChunks(ops);
  emitSyncPulse({
    upsertedCollections: ['categories', 'category_groups'],
    mutationType: 'admin:restore_categories',
  });
}
