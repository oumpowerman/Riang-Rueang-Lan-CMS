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
import { emitSyncPulse } from './firestoreSyncPulse';

export async function seedInitialDatabase(
  categories: CategoryTag[],
  footages: Footage[],
  episodes: Episode[],
  settings: SystemSettings,
  categoryGroups: CategoryGroup[] = INITIAL_CATEGORY_GROUPS,
  sources: RawSource[] = []
): Promise<void> {
  const now = new Date().toISOString();
  const ops: BatchWriteOp[] = [];

  // Save settings
  ops.push({
    type: 'set',
    ref: doc(db, 'system_settings', 'global_rules'),
    data: sanitizeForFirestore({ ...settings, updatedAt: now }) as unknown as Record<
      string,
      unknown
    >,
  });

  // Seed Category Groups
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

  // Seed Categories
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

  // Seed Sources
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

  // Seed Footages
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

  // Seed Episodes
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
