import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Footage } from '../types/footage.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../types/tag.types';
import { Episode } from '../types/episode.types';
import { INITIAL_CATEGORY_GROUPS } from '../services/seedData';

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

  subscribeCategoryGroups(onUpdate: (groups: CategoryGroup[]) => void, onError?: (err: Error) => void) {
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

  subscribeCategories(onUpdate: (categories: CategoryTag[]) => void, onError?: (err: Error) => void) {
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

  subscribeSettings(onUpdate: (settings: SystemSettings) => void, onError?: (err: Error) => void) {
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

  async deleteCategory(categoryId: string) {
    const docRef = doc(db, 'categories', categoryId);
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

  async deleteFootage(footageId: string) {
    const docRef = doc(db, 'footages', footageId);
    await deleteDoc(docRef);
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
  // 1-CLICK BATCH SEED INITIAL DATA
  // ==========================================
  async seedInitialDatabase(
    categories: CategoryTag[],
    footages: Footage[],
    episodes: Episode[],
    settings: SystemSettings,
    categoryGroups: CategoryGroup[] = INITIAL_CATEGORY_GROUPS
  ) {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    // Save settings
    const settingsDocRef = doc(db, 'system_settings', 'global_rules');
    batch.set(settingsDocRef, sanitizeForFirestore({ ...settings, updatedAt: now }));

    // Seed Category Groups (Tier 0)
    for (const grp of categoryGroups) {
      const ref = doc(db, 'category_groups', grp.id);
      batch.set(ref, sanitizeForFirestore({ ...grp, updatedAt: now }));
    }

    // Seed Categories (Tier 1 & Tier 2)
    for (const cat of categories) {
      const ref = doc(db, 'categories', cat.id);
      const normalized = normalizeCategoryTag(cat);
      batch.set(ref, sanitizeForFirestore({ ...normalized, updatedAt: now }));
    }

    // Seed Footages
    for (const ft of footages) {
      const ref = doc(db, 'footages', ft.id);
      batch.set(ref, sanitizeForFirestore({ ...ft, updatedAt: now }));
    }

    // Seed Episodes
    for (const ep of episodes) {
      const ref = doc(db, 'episodes', ep.id);
      batch.set(ref, sanitizeForFirestore({ ...ep, updatedAt: now }));
    }

    await batch.commit();
    console.info(
      `Successfully seeded ${categoryGroups.length} category groups, ${categories.length} categories, ${footages.length} footages, and ${episodes.length} episodes to Firestore!`
    );
  },

  // ==========================================
  // CLEAR ALL CLIPS (PRODUCTION CLEAN SLATE)
  // ==========================================
  async clearAllClipsFromCloud(): Promise<void> {
    const [footagesSnap, episodesSnap] = await Promise.all([
      getDocs(collection(db, 'footages')),
      getDocs(collection(db, 'episodes')),
    ]);

    if (footagesSnap.empty && episodesSnap.empty) {
      return;
    }

    const batch = writeBatch(db);
    footagesSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    episodesSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    console.info(
      `Cleared ${footagesSnap.size} footages and ${episodesSnap.size} episodes from Firestore while keeping categories and settings intact.`
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

    const batch = writeBatch(db);
    groupsSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    categoriesSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
  },

  async restoreCategoriesToCloud(
    categoryGroups: CategoryGroup[],
    categories: CategoryTag[]
  ): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const grp of categoryGroups) {
      const ref = doc(db, 'category_groups', grp.id);
      batch.set(ref, sanitizeForFirestore({ ...grp, updatedAt: now }));
    }

    for (const cat of categories) {
      const ref = doc(db, 'categories', cat.id);
      const normalized = normalizeCategoryTag(cat);
      batch.set(ref, sanitizeForFirestore({ ...normalized, updatedAt: now }));
    }

    await batch.commit();
  },
};
