import { Episode } from '../types/episode.types';
import { Footage } from '../types/footage.types';
import { RawSource } from '../types/source.types';
import {
  CategoryGroup,
  CategoryTag,
  CategoryTier,
  DEFAULT_TIER_SUBCATEGORIES,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
  SystemSettings,
} from '../types/tag.types';
import {
  INITIAL_CATEGORY_GROUPS,
  INITIAL_SETTINGS,
  INITIAL_TAGS,
  isStagingTagId,
  STAGING_CATEGORY_GROUP,
  STAGING_CATEGORY_TAG,
  STAGING_GROUP_ID,
  STAGING_TAG_ID,
} from './seedData';
import { normalizeLegacySubCategory } from '../utils/reorganizeTagsToDictionary';

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
 * Normalizes a single CategoryTag into the 3-Tier Independent Faceted Tag schema.
 * Any existing tag that has not yet been assigned a 3-Tier `subCategory` is placed
 * in Tier 1 under `รอคัดแยก` (`parentId: null`) so the team can drag/batch-move it freely.
 */
export function normalizeSingle3TierTag(t: CategoryTag): CategoryTag {
  if (t.id === STAGING_TAG_ID || t.id === 'cat_staging') {
    return {
      ...t,
      name: t.name === 'พื้นที่พักรอจัดหมวดหมู่' ? 'ไม่มีหมวดหมู่' : t.name,
      tier: 1,
      parentId: null,
      groupId: t.groupId || STAGING_GROUP_ID,
    };
  }

  const hasExplicitSubCategory =
    typeof t.subCategory === 'string' && t.subCategory.trim().length > 0;

  if (!hasExplicitSubCategory) {
    return {
      ...t,
      tier: 1,
      subCategory: DEFAULT_UNCLASSIFIED_SUBCATEGORY,
      parentId: null,
      groupId: t.groupId || `GRP-${t.groupType || 'GENERAL'}`,
    };
  }

  const validTier: CategoryTier =
    t.tier === 1 || t.tier === 2 || t.tier === 3 ? t.tier : 1;

  return {
    ...t,
    tier: validTier,
    subCategory: normalizeLegacySubCategory(validTier, t.subCategory),
    parentId: null,
    groupId: t.groupId || `GRP-${t.groupType || 'GENERAL'}`,
  };
}

/**
 * Enterprise Repository Pattern for Riang-Rueang-Lan CMS (v3 3-Tier Faceted Tag Schema)
 */
export const cmsRepository = {
  /**
   * Safe production state check — never wipes user clips automatically on startup.
   */
  ensureProductionCleanSlate(): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTION_CLEAN_SLATE, 'true');
      localStorage.setItem(STORAGE_KEYS.CLOUD_CLIPS_WIPED, 'true');
      return false;
    } catch {
      return false;
    }
  },

  hasWipedCloudClips(): boolean {
    return true;
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
   * Normalizes and repairs a list of CategoryTags into the 3-Tier Independent Tag System.
   */
  normalizeAndRepairTags(rawTags: CategoryTag[], includeMissingSeeds: boolean): CategoryTag[] {
    const deletedIds = this.getDeletedTagIds();

    // 1. Migrate existing tags into 3-Tier independent schema (legacy tags without subCategory go to Tier 1 'รอคัดแยก')
    const migratedTier = rawTags
      .filter((t) => t && t.id && !deletedIds.has(t.id))
      .map((t) => normalizeSingle3TierTag(t));

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
      deduped.unshift(normalizeSingle3TierTag({ ...STAGING_CATEGORY_TAG }));
    }

    // 3b. Merge missing seed tags if not intentionally wiped/deleted
    if (includeMissingSeeds && !this.isCategoriesWiped()) {
      for (const seed of INITIAL_TAGS) {
        if (!seenIds.has(seed.id) && !deletedIds.has(seed.id)) {
          seenIds.add(seed.id);
          deduped.push(normalizeSingle3TierTag({ ...seed }));
        }
      }
    }

    return deduped;
  },

  /**
   * Reconciles a cloud snapshot of CategoryTags with current local CategoryTags.
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

    for (const lt of localTags) {
      if (!deletedIds.has(lt.id)) {
        mergedMap.set(lt.id, normalizeSingle3TierTag(lt));
      }
    }

    for (const ct of cloudTags) {
      if (deletedIds.has(ct.id)) continue;
      const existing = mergedMap.get(ct.id);
      if (existing) {
        mergedMap.set(
          ct.id,
          normalizeSingle3TierTag({
            ...existing,
            ...ct,
            subCategory: ct.subCategory ?? existing.subCategory,
          })
        );
      } else {
        mergedMap.set(ct.id, normalizeSingle3TierTag(ct));
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
      const repaired = this.normalizeAndRepairTags(parsed, false);
      if (repaired.filter((t) => !isStagingTagId(t.id)).length === 0) {
        const initial = this.normalizeAndRepairTags(INITIAL_TAGS, true);
        localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(initial));
        return initial;
      }
      return repaired;
    } catch {
      return this.normalizeAndRepairTags(INITIAL_TAGS, true);
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
      const catCountMap: Record<string, number> = {};

      const migrated = parsed.map((ep) => {
        let changed = false;
        let catGrpId = ep.categoryGroupId;
        if (!catGrpId) {
          changed = true;
          const tag = tagLookup.get(ep.mainCategoryTagId);
          catGrpId = tag?.groupId || (tag ? `GRP-${tag.groupType}` : 'GRP-THEME');
        }

        let catEpNo = ep.categoryEpisodeNo;
        if (!catEpNo) {
          changed = true;
          const currentCount = (catCountMap[ep.mainCategoryTagId] || 0) + 1;
          catCountMap[ep.mainCategoryTagId] = currentCount;
          catEpNo = currentCount;
        } else {
          catCountMap[ep.mainCategoryTagId] = Math.max(
            catCountMap[ep.mainCategoryTagId] || 0,
            catEpNo
          );
        }

        if (changed) {
          needsSave = true;
          return {
            ...ep,
            categoryGroupId: catGrpId,
            categoryEpisodeNo: catEpNo,
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
      return parsed;
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
