import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './config';
import { Footage } from '../types/footage.types';
import { RawSource } from '../types/source.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../types/tag.types';
import { Episode } from '../types/episode.types';
import { INITIAL_CATEGORY_GROUPS } from '../services/seedData';

/**
 * Firestore WriteBatch hard limit is 500 operations.
 * We use 400 per chunk so bulk Google Drive imports (300–2,000+ videos/sources/tags)
 * commit reliably without ever hitting the 500-op WriteBatch limit or flooding individual requests.
 */
const MAX_BATCH_OPERATIONS = 400;

interface BatchWriteOp {
  type: 'set' | 'delete';
  ref: DocumentReference;
  data?: Record<string, unknown>;
}

async function commitOperationsInChunks(operations: BatchWriteOp[]): Promise<void> {
  if (operations.length === 0) return;
  for (let i = 0; i < operations.length; i += MAX_BATCH_OPERATIONS) {
    const chunk = operations.slice(i, i + MAX_BATCH_OPERATIONS);
    const batch = writeBatch(db);
    for (const op of chunk) {
      if (op.type === 'set' && op.data) {
        batch.set(op.ref, op.data, { merge: true });
      } else if (op.type === 'delete') {
        batch.delete(op.ref);
      }
    }
    await batch.commit();
  }
}

function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (Object.prototype.toString.call(data) === '[object Object]' && data.constructor === Object) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

function normalizeCategoryTag(raw: CategoryTag): CategoryTag {
  const tier: 1 | 2 = raw.tier === 2 || !!raw.parentId ? 2 : 1;
  return {
    ...raw,
    tier,
    parentId: tier === 2 ? raw.parentId || null : null,
  };
}

export const firestoreService = {
  // ==========================================
  // REALTIME SUBSCRIPTIONS
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
      onError
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
      onError
    );
  },

  subscribeSources(onUpdate: (sources: RawSource[]) => void, onError?: (err: Error) => void) {
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
      onError
    );
  },

  subscribeFootages(onUpdate: (footages: Footage[]) => void, onError?: (err: Error) => void) {
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
      onError
    );
  },

  subscribeEpisodes(onUpdate: (episodes: Episode[]) => void, onError?: (err: Error) => void) {
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
      onError
    );
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
      onError
    );
  },

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  // Category Group CRUD (Tier 0)
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

  // Category Tag CRUD (Tier 1 & Tier 2)
  async saveCategory(category: CategoryTag) {
    const docRef = doc(db, 'categories', category.id);
    const normalized = normalizeCategoryTag(category);
    await setDoc(
      docRef,
      sanitizeForFirestore({ ...normalized, updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  },

  async batchSaveCategories(categories: CategoryTag[]) {
    if (!categories.length) return;
    const now = new Date().toISOString();
    const ops: BatchWriteOp[] = categories.map((cat) => {
      const normalized = normalizeCategoryTag(cat);
      return {
        type: 'set',
        ref: doc(db, 'categories', cat.id),
        data: sanitizeForFirestore({ ...normalized, updatedAt: now }) as unknown as Record<
          string,
          unknown
        >,
      };
    });
    await commitOperationsInChunks(ops);
  },

  async deleteCategory(categoryId: string) {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
  },

  // Source CRUD (Flow B 1:N Livestream Sources SRC-XXXX)
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

  async batchSaveSources(sources: RawSource[]) {
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
    await commitOperationsInChunks(ops);
  },

  async deleteSource(sourceId: string) {
    const docRef = doc(db, 'sources', sourceId);
    await deleteDoc(docRef);
  },

  // Footage CRUD
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

  async batchSaveFootages(footages: Footage[]) {
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
    await commitOperationsInChunks(ops);
  },

  async deleteFootage(footageId: string) {
    const docRef = doc(db, 'footages', footageId);
    await deleteDoc(docRef);
  },

  async batchDeleteFootages(footageIds: string[]) {
    if (!footageIds.length) return;
    const ops: BatchWriteOp[] = footageIds.map((id) => ({
      type: 'delete',
      ref: doc(db, 'footages', id),
    }));
    await commitOperationsInChunks(ops);
  },

  // Episode CRUD
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

  async deleteEpisode(episodeId: string) {
    const docRef = doc(db, 'episodes', episodeId);
    await deleteDoc(docRef);
  },

  // System Settings CRUD
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

  // ==========================================
  // 1-CLICK BATCH SEED INITIAL DATA (CHUNKED FOR 500+ ITEMS)
  // ==========================================
  async seedInitialDatabase(
    categories: CategoryTag[],
    footages: Footage[],
    episodes: Episode[],
    settings: SystemSettings,
    categoryGroups: CategoryGroup[] = INITIAL_CATEGORY_GROUPS,
    sources: RawSource[] = []
  ) {
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

    // Seed Category Groups (Tier 0)
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

    // Seed Categories (Tier 1 & Tier 2)
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

    // Seed Sources (Flow B 1:N SRC-XXXX)
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
    console.info(
      `Successfully synced ${categoryGroups.length} category groups, ${categories.length} categories, ${sources.length} sources, ${footages.length} footages, and ${episodes.length} episodes to Firestore!`
    );
  },

  // ==========================================
  // CLEAR ALL CLIPS (PRODUCTION CLEAN SLATE)
  // ==========================================
  async clearAllClipsFromCloud(): Promise<void> {
    const [sourcesSnap, footagesSnap, episodesSnap] = await Promise.all([
      getDocs(collection(db, 'sources')),
      getDocs(collection(db, 'footages')),
      getDocs(collection(db, 'episodes')),
    ]);

    if (sourcesSnap.empty && footagesSnap.empty && episodesSnap.empty) {
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

    await commitOperationsInChunks(ops);
    console.info(
      `Cleared ${sourcesSnap.size} sources, ${footagesSnap.size} footages, and ${episodesSnap.size} episodes from Firestore while keeping categories and settings intact.`
    );
  },

  async clearAllCategoriesFromCloud(): Promise<void> {
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
  },

  async restoreCategoriesToCloud(
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
  },
};
