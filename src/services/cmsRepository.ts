import { Episode } from '../types/episode.types';
import { Footage } from '../types/footage.types';
import { RawSource } from '../types/source.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../types/tag.types';
import {
  INITIAL_CATEGORY_GROUPS,
  INITIAL_SETTINGS,
  INITIAL_TAGS,
  STAGING_CATEGORY_GROUP,
  STAGING_CATEGORY_TAG,
  STAGING_GROUP_ID,
  STAGING_TAG_ID,
} from './seedData';

const STORAGE_KEYS = {
  GROUPS: 'rrl_cms_category_groups_v1',
  TAGS: 'rrl_cms_tags_v2_e2e',
  SOURCES: 'rrl_cms_sources_v2_e2e',
  FOOTAGE: 'rrl_cms_footage_v2_e2e',
  EPISODES: 'rrl_cms_episodes_v2_e2e',
  SETTINGS: 'rrl_cms_settings_v2_e2e',
  PRODUCTION_CLEAN_SLATE: 'rrl_cms_production_clean_slate_v1',
  CLOUD_CLIPS_WIPED: 'rrl_cms_cloud_clips_wiped_v1',
  CATEGORIES_WIPED: 'rrl_cms_categories_wiped_v1',
  DELETED_TAG_IDS: 'rrl_cms_deleted_tag_ids_v1',
  DELETED_GROUP_IDS: 'rrl_cms_deleted_group_ids_v1',
};

/**
 * Enterprise Repository Pattern for Riang-Rueang-Lan CMS (v2 E2E Schema - Production Clean Slate)
 */
export const cmsRepository = {
  /**
   * Ensures a one-time immediate wipe of demo clips in localStorage when switching to production mode,
   * while preserving 3-tier categories and system settings.
   */
  ensureProductionCleanSlate(): boolean {
    try {
      const alreadyCleared = localStorage.getItem(STORAGE_KEYS.PRODUCTION_CLEAN_SLATE) === 'true';
      if (!alreadyCleared) {
        localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.FOOTAGE, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.EPISODES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.PRODUCTION_CLEAN_SLATE, 'true');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  hasWipedCloudClips(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.CLOUD_CLIPS_WIPED) === 'true';
    } catch {
      return false;
    }
  },

  markCloudClipsWiped(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLOUD_CLIPS_WIPED, 'true');
    } catch {
      // ignore storage errors
    }
  },

  isCategoriesWiped(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.CATEGORIES_WIPED) === 'true';
    } catch {
      return false;
    }
  },

  setCategoriesWiped(wiped: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES_WIPED, wiped ? 'true' : 'false');
    } catch {
      // ignore storage errors
    }
  },

  getDeletedTagIds(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DELETED_TAG_IDS);
      if (!raw) return new Set();
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set();
    }
  },

  markTagIdsDeleted(tagIds: string[]): void {
    try {
      const current = this.getDeletedTagIds();
      tagIds.forEach((id) => current.add(id));
      localStorage.setItem(STORAGE_KEYS.DELETED_TAG_IDS, JSON.stringify(Array.from(current)));
    } catch {
      // ignore storage errors
    }
  },

  clearDeletedTagIds(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.DELETED_TAG_IDS);
    } catch {
      // ignore storage errors
    }
  },

  getDeletedGroupIds(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DELETED_GROUP_IDS);
      if (!raw) return new Set();
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set();
    }
  },

  markGroupIdsDeleted(groupIds: string[]): void {
    try {
      const current = this.getDeletedGroupIds();
      groupIds.forEach((id) => current.add(id));
      localStorage.setItem(STORAGE_KEYS.DELETED_GROUP_IDS, JSON.stringify(Array.from(current)));
    } catch {
      // ignore storage errors
    }
  },

  clearDeletedGroupIds(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.DELETED_GROUP_IDS);
    } catch {
      // ignore storage errors
    }
  },

  /**
   * Normalizes and repairs a list of CategoryTags so tier, parentId, and groupId are always intact.
   */
  normalizeAndRepairTags(rawTags: CategoryTag[], includeMissingSeeds: boolean): CategoryTag[] {
    const deletedIds = this.getDeletedTagIds();

    // 1. Migrate existing tags if missing tier
    const migratedTier = rawTags
      .filter((t) => t && t.id && !deletedIds.has(t.id))
      .map((t) => {
        if (!t.tier) {
          if (t.id === 'TAG-0003') {
            return {
              ...t,
              name: t.name || 'พี่แจ๊ส ชวนชื่น',
              tier: 2 as const,
              parentId: 'TAG-0004',
              entityType: t.entityType || ('PERSON' as const),
            };
          }
          return {
            ...t,
            tier: (t.parentId ? 2 : 1) as 1 | 2,
            parentId: t.parentId || null,
          };
        }
        return {
          ...t,
          tier: (t.tier === 2 || !!t.parentId ? 2 : 1) as 1 | 2,
          parentId: t.tier === 2 || !!t.parentId ? t.parentId || null : null,
        };
      });

    // 2. Deduplicate by id
    const seenIds = new Set<string>();
    const deduped: CategoryTag[] = [];
    for (const t of migratedTier) {
      if (seenIds.has(t.id)) continue;
      seenIds.add(t.id);
      deduped.push(t);
    }

    // 3. Always ensure system staging category is present (unless all categories are wiped)
    if (!this.isCategoriesWiped() && !seenIds.has(STAGING_TAG_ID)) {
      seenIds.add(STAGING_TAG_ID);
      deduped.unshift({ ...STAGING_CATEGORY_TAG });
    }

    // 3b. Merge missing Tier 1/2 seed tags if not intentionally wiped/deleted
    if (includeMissingSeeds && !this.isCategoriesWiped()) {
      for (const seed of INITIAL_TAGS) {
        if (!seenIds.has(seed.id) && !deletedIds.has(seed.id)) {
          seenIds.add(seed.id);
          deduped.push({ ...seed });
        }
      }
    }

    // 4. Ensure any Tier 2 subcategory whose parent Tier 1 category is missing (and wasn't deleted)
    // gets its parent Tier 1 category restored if it's a known seed category
    const seedLookup = new Map(INITIAL_TAGS.map((s) => [s.id, s]));
    for (const t of [...deduped]) {
      if (t.tier === 2 && t.parentId && !seenIds.has(t.parentId) && !deletedIds.has(t.parentId)) {
        const parentSeed = seedLookup.get(t.parentId);
        if (parentSeed) {
          seenIds.add(parentSeed.id);
          deduped.unshift({ ...parentSeed });
        }
      }
    }

    // 5. Backfill groupId for Tier 1 and Tier 2 tags
    const parentGroupMap: Record<string, string> = {};
    for (const t of deduped) {
      if (t.tier === 1 || !t.parentId) {
        parentGroupMap[t.id] = t.groupId || `GRP-${t.groupType || 'GENERAL'}`;
      }
    }

    return deduped.map((t) => {
      const expectedGroupId =
        t.groupId ||
        (t.parentId ? parentGroupMap[t.parentId] : undefined) ||
        `GRP-${t.groupType || 'GENERAL'}`;
      return t.groupId === expectedGroupId ? t : { ...t, groupId: expectedGroupId };
    });
  },

  /**
   * Reconciles a cloud snapshot of CategoryTags with current local CategoryTags so that
   * partial cloud snapshots (e.g. when editing a single Tier 3 item while Firestore lacked the rest)
   * never wipe out Tier 2 or Tier 3 items.
   */
  reconcileTagsWithHierarchy(
    cloudTags: CategoryTag[],
    localTags: CategoryTag[]
  ): { tags: CategoryTag[]; needsCloudRepair: boolean } {
    if (this.isCategoriesWiped() && cloudTags.length === 0) {
      return { tags: [], needsCloudRepair: false };
    }

    const deletedIds = this.getDeletedTagIds();
    const mergedMap = new Map<string, CategoryTag>();

    // Start with local tags (excluding explicitly deleted ones)
    for (const lt of localTags) {
      if (!deletedIds.has(lt.id)) {
        mergedMap.set(lt.id, lt);
      }
    }

    // Overlay cloud tags (cloud updates win for matching IDs, while preserving tier/parentId if cloud lacked them)
    for (const ct of cloudTags) {
      if (deletedIds.has(ct.id)) continue;
      const existing = mergedMap.get(ct.id);
      if (existing) {
        const resolvedTier: 1 | 2 = ct.tier || existing.tier || (ct.parentId || existing.parentId ? 2 : 1);
        const resolvedParentId =
          resolvedTier === 2 ? ct.parentId ?? existing.parentId ?? null : null;
        mergedMap.set(ct.id, {
          ...existing,
          ...ct,
          tier: resolvedTier,
          parentId: resolvedParentId,
          groupId: ct.groupId || existing.groupId,
        });
      } else {
        mergedMap.set(ct.id, ct);
      }
    }

    const repaired = this.normalizeAndRepairTags(
      Array.from(mergedMap.values()),
      !this.isCategoriesWiped()
    );

    const cloudIdSet = new Set(cloudTags.map((c) => c.id));
    const needsCloudRepair = repaired.some((r) => !cloudIdSet.has(r.id));

    return {
      tags: repaired,
      needsCloudRepair,
    };
  },

  reconcileCategoryGroups(
    cloudGroups: CategoryGroup[],
    localGroups: CategoryGroup[]
  ): { groups: CategoryGroup[]; needsCloudRepair: boolean } {
    if (this.isCategoriesWiped() && cloudGroups.length === 0) {
      return { groups: [], needsCloudRepair: false };
    }

    const deletedGroupIds = this.getDeletedGroupIds();
    const mergedMap = new Map<string, CategoryGroup>();

    for (const lg of localGroups) {
      if (!deletedGroupIds.has(lg.id)) {
        mergedMap.set(lg.id, lg);
      }
    }

    for (const cg of cloudGroups) {
      if (deletedGroupIds.has(cg.id)) continue;
      const existing = mergedMap.get(cg.id);
      mergedMap.set(cg.id, existing ? { ...existing, ...cg } : cg);
    }

    if (!this.isCategoriesWiped()) {
      if (!mergedMap.has(STAGING_GROUP_ID)) {
        mergedMap.set(STAGING_GROUP_ID, { ...STAGING_CATEGORY_GROUP });
      }
      for (const seedGrp of INITIAL_CATEGORY_GROUPS) {
        if (!mergedMap.has(seedGrp.id) && !deletedGroupIds.has(seedGrp.id)) {
          mergedMap.set(seedGrp.id, { ...seedGrp });
        }
      }
    }

    const groups = Array.from(mergedMap.values()).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const cloudIdSet = new Set(cloudGroups.map((g) => g.id));
    const needsCloudRepair = groups.some((g) => !cloudIdSet.has(g.id));

    return {
      groups,
      needsCloudRepair,
    };
  },

  getTags(): CategoryTag[] {
    try {
      if (this.isCategoriesWiped()) {
        return [];
      }
      const raw = localStorage.getItem(STORAGE_KEYS.TAGS);
      if (!raw) {
        const initial = this.normalizeAndRepairTags(INITIAL_TAGS, true);
        localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(initial));
        return initial;
      }
      const parsed: CategoryTag[] = JSON.parse(raw);
      const repaired = this.normalizeAndRepairTags(parsed, true);
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(repaired));
      return repaired;
    } catch {
      return INITIAL_TAGS;
    }
  },

  saveTags(tags: CategoryTag[]): void {
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  },

  getSources(): RawSource[] {
    this.ensureProductionCleanSlate();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SOURCES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify([]));
        return [];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSources(sources: RawSource[]): void {
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(sources));
  },

  getFootage(): Footage[] {
    this.ensureProductionCleanSlate();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FOOTAGE);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.FOOTAGE, JSON.stringify([]));
        return [];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveFootage(footage: Footage[]): void {
    localStorage.setItem(STORAGE_KEYS.FOOTAGE, JSON.stringify(footage));
  },

  getEpisodes(): Episode[] {
    this.ensureProductionCleanSlate();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EPISODES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.EPISODES, JSON.stringify([]));
        return [];
      }
      const parsed: Episode[] = JSON.parse(raw);
      let needsSave = false;
      const tagLookup = new Map(INITIAL_TAGS.map((t) => [t.id, t]));
      const migrated = parsed.map((ep) => {
        if (!ep.categoryGroupId) {
          needsSave = true;
          const tag = tagLookup.get(ep.mainCategoryTagId);
          const groupId = tag?.groupId || (tag ? `GRP-${tag.groupType}` : 'GRP-THEME');
          return {
            ...ep,
            categoryGroupId: groupId,
          };
        }
        return ep;
      });
      if (needsSave) {
        localStorage.setItem(STORAGE_KEYS.EPISODES, JSON.stringify(migrated));
      }
      return migrated;
    } catch {
      return [];
    }
  },

  saveEpisodes(episodes: Episode[]): void {
    localStorage.setItem(STORAGE_KEYS.EPISODES, JSON.stringify(episodes));
  },

  getSettings(): SystemSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        return INITIAL_SETTINGS;
      }
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_SETTINGS,
        ...parsed,
      };
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: SystemSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getCategoryGroups(): CategoryGroup[] {
    try {
      if (this.isCategoriesWiped()) {
        return [];
      }
      const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(INITIAL_CATEGORY_GROUPS));
        return INITIAL_CATEGORY_GROUPS;
      }
      const parsed: CategoryGroup[] = JSON.parse(raw);
      if (parsed.length === 0) {
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(INITIAL_CATEGORY_GROUPS));
        return INITIAL_CATEGORY_GROUPS;
      }
      const { groups: reconciled } = this.reconcileCategoryGroups(parsed, INITIAL_CATEGORY_GROUPS);
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(reconciled));
      return reconciled;
    } catch {
      return INITIAL_CATEGORY_GROUPS;
    }
  },

  saveCategoryGroups(groups: CategoryGroup[]): void {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  },

  wipeAllCategories(): void {
    this.setCategoriesWiped(true);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify([]));
  },

  restoreDefaultCategories(): {
    categoryGroups: CategoryGroup[];
    tags: CategoryTag[];
  } {
    this.setCategoriesWiped(false);
    this.clearDeletedTagIds();
    this.clearDeletedGroupIds();
    const groups = INITIAL_CATEGORY_GROUPS.map((g) => ({ ...g }));
    const tags = INITIAL_TAGS.map((t) => ({ ...t }));
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
    return {
      categoryGroups: groups,
      tags,
    };
  },

  clearAllClips(): void {
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FOOTAGE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EPISODES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_CLEAN_SLATE, 'true');
  },

  resetToSeedData(): {
    categoryGroups: CategoryGroup[];
    tags: CategoryTag[];
    sources: RawSource[];
    footage: Footage[];
    episodes: Episode[];
    settings: SystemSettings;
  } {
    const { categoryGroups, tags } = this.restoreDefaultCategories();
    const currentSettings = this.getSettings();
    this.clearAllClips();
    return {
      categoryGroups,
      tags,
      sources: [],
      footage: [],
      episodes: [],
      settings: currentSettings,
    };
  },
};
