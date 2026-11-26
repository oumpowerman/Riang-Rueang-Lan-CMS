import React from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { cmsRepository } from '../../services/cmsRepository';
import {
  isStagingGroupId,
  isStagingTagId,
  normalizeFootageTags,
} from '../../services/seedData';
import { Episode } from '../../types/episode.types';
import { Footage } from '../../types/footage.types';
import { RawSource } from '../../types/source.types';
import {
  CategoryGroup,
  CategoryTag,
  CategoryTier,
  DEFAULT_TIER_SUBCATEGORIES,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
  EntitySubtype,
  SystemSettings,
  TagGroupType,
  TierSubCategoriesConfig,
} from '../../types/tag.types';
import { getReferenceTodayDate } from '../../utils/cooldownCalculator';
import { generateNextId } from '../../utils/fileNameGenerator';
import {
  findDuplicateTagConflict,
  normalizeTagCompareKey,
} from '../../utils/tagDeduplicator';
import {
  DATA_DICTIONARY_SUBCATEGORIES,
  resolveTagByDataDictionary,
  stripForbiddenHumorSuffixes,
} from '../../utils/tagDictionaryRules';
import { useCMSTagBatchActions } from './useCMSTagBatchActions';

interface UseCMSCategoryActionsParams {
  categoryGroups: CategoryGroup[];
  setCategoryGroups: React.Dispatch<React.SetStateAction<CategoryGroup[]>>;
  tags: CategoryTag[];
  setTags: React.Dispatch<React.SetStateAction<CategoryTag[]>>;
  tagMap: Record<string, CategoryTag>;
  footage: Footage[];
  setFootage: React.Dispatch<React.SetStateAction<Footage[]>>;
  sources: RawSource[];
  setSources: React.Dispatch<React.SetStateAction<RawSource[]>>;
  episodes: Episode[];
  setEpisodes: React.Dispatch<React.SetStateAction<Episode[]>>;
  setSelectedTagFilter: React.Dispatch<React.SetStateAction<string[]>>;
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

function getTierKey(tier: CategoryTier): keyof TierSubCategoriesConfig {
  if (tier === 2) return 'tier2';
  if (tier === 3) return 'tier3';
  return 'tier1';
}

function getDefaultSubCategoryForTier(tier: CategoryTier): string {
  if (tier === 2) return DEFAULT_TIER_SUBCATEGORIES.tier2[0];
  if (tier === 3) return DEFAULT_TIER_SUBCATEGORIES.tier3[0];
  return DEFAULT_TIER_SUBCATEGORIES.tier1[0];
}

export function useCMSCategoryActions({
  categoryGroups,
  setCategoryGroups,
  tags,
  setTags,
  tagMap,
  footage,
  setFootage,
  sources,
  setSources,
  episodes,
  setEpisodes,
  setSelectedTagFilter,
  settings,
  setSettings,
}: UseCMSCategoryActionsParams) {
  // Category Group CRUD (Legacy compatibility)
  const createCategoryGroup = (
    name: string,
    icon = '📁',
    color = 'indigo',
    description = ''
  ): CategoryGroup => {
    cmsRepository.setCategoriesWiped(false);
    const trimmed = name.trim();
    const newGroup: CategoryGroup = {
      id: generateNextId('GRP', categoryGroups.map((g) => g.id)),
      name: trimmed,
      icon: icon || '📁',
      color: color || 'indigo',
      description: description.trim(),
      order: categoryGroups.length + 1,
      createdAt: getReferenceTodayDate(),
    };
    const next = [...categoryGroups, newGroup];
    setCategoryGroups(next);
    cmsRepository.saveCategoryGroups(next);
    firestoreService
      .saveCategoryGroup(newGroup)
      .catch((err) => console.warn('Firestore saveCategoryGroup error:', err));
    return newGroup;
  };

  const updateCategoryGroup = (id: string, updates: Partial<Omit<CategoryGroup, 'id'>>) => {
    const target = categoryGroups.find((g) => g.id === id);
    if (!target) return;
    const updated: CategoryGroup = { ...target, ...updates };
    const next = categoryGroups.map((g) => (g.id === id ? updated : g));
    setCategoryGroups(next);
    cmsRepository.saveCategoryGroups(next);
    firestoreService
      .saveCategoryGroup(updated)
      .catch((err) => console.warn('Firestore updateCategoryGroup error:', err));
  };

  const deleteCategoryGroup = (id: string) => {
    if (isStagingGroupId(id)) return;
    cmsRepository.markGroupIdsDeleted([id]);
    const next = categoryGroups.filter((g) => g.id !== id);
    setCategoryGroups(next);
    cmsRepository.saveCategoryGroups(next);
    firestoreService
      .deleteCategoryGroup(id)
      .catch((err) => console.warn('Firestore deleteCategoryGroup error:', err));
  };

  const wipeAllCategories = () => {
    setCategoryGroups([]);
    setTags([]);
    cmsRepository.wipeAllCategories();
    firestoreService
      .clearAllCategoriesFromCloud()
      .catch((err) => console.warn('Firestore clearAllCategoriesFromCloud error:', err));
  };

  const restoreDefaultCategories = () => {
    const fresh = cmsRepository.restoreDefaultCategories();
    setCategoryGroups(fresh.categoryGroups);
    setTags(fresh.tags);
    updateSettings({
      tierSubCategories: DATA_DICTIONARY_SUBCATEGORIES,
    });
    firestoreService
      .restoreCategoriesToCloud(fresh.categoryGroups, fresh.tags)
      .catch((err) => console.warn('Firestore restoreCategoriesToCloud error:', err));
  };

  const updateSettings = (updates: Partial<SystemSettings>) => {
    const nextSettings = { ...settings, ...updates };
    setSettings(nextSettings);
    cmsRepository.saveSettings(nextSettings);
    firestoreService
      .saveSettings(nextSettings)
      .catch((err) => console.warn('Firestore updateSettings error:', err));
  };

  // Sub-category Management per Tier (Tier 1, Tier 2, Tier 3)
  const addTierSubCategory = (tier: CategoryTier, subCategoryName: string) => {
    const trimmed = subCategoryName.trim();
    if (!trimmed) return;
    const currentConfig = settings.tierSubCategories || DEFAULT_TIER_SUBCATEGORIES;
    const key = getTierKey(tier);
    const list = currentConfig[key] || [];
    if (list.includes(trimmed)) return;
    updateSettings({
      tierSubCategories: {
        ...currentConfig,
        [key]: [...list, trimmed],
      },
    });
  };

  const renameTierSubCategory = async (
    tier: CategoryTier,
    oldSubCategoryName: string,
    newSubCategoryName: string
  ) => {
    const oldTrimmed = oldSubCategoryName.trim();
    const newTrimmed = newSubCategoryName.trim();
    if (!oldTrimmed || !newTrimmed || oldTrimmed === newTrimmed) return;

    const currentConfig = settings.tierSubCategories || DEFAULT_TIER_SUBCATEGORIES;
    const key = getTierKey(tier);
    const list = currentConfig[key] || [];
    const nextList = list.includes(oldTrimmed)
      ? list.map((item) => (item === oldTrimmed ? newTrimmed : item))
      : [...list, newTrimmed];

    updateSettings({
      tierSubCategories: {
        ...currentConfig,
        [key]: Array.from(new Set(nextList)),
      },
    });

    const changedTags: CategoryTag[] = [];
    const nextTags = tags.map((t) => {
      if (isStagingTagId(t.id)) return t;
      const tSub = (t.subCategory || DEFAULT_UNCLASSIFIED_SUBCATEGORY).trim();
      if (t.tier === tier && tSub === oldTrimmed) {
        const updated: CategoryTag = {
          ...t,
          subCategory: newTrimmed,
        };
        changedTags.push(updated);
        return updated;
      }
      return t;
    });

    if (changedTags.length > 0) {
      setTags(nextTags);
      cmsRepository.saveTags(nextTags);
      try {
        await firestoreService.batchSaveCategories(changedTags);
      } catch (err) {
        console.warn('Firestore renameTierSubCategory error:', err);
      }
    }
  };

  const deleteTierSubCategory = async (tier: CategoryTier, subCategoryName: string) => {
    const trimmed = subCategoryName.trim();
    if (!trimmed || trimmed === DEFAULT_UNCLASSIFIED_SUBCATEGORY) return;

    const currentConfig = settings.tierSubCategories || DEFAULT_TIER_SUBCATEGORIES;
    const key = getTierKey(tier);
    const list = (currentConfig[key] || []).filter((item) => item !== trimmed);
    const fallbackSub =
      tier === 1
        ? DEFAULT_UNCLASSIFIED_SUBCATEGORY
        : list[0] || getDefaultSubCategoryForTier(tier);

    updateSettings({
      tierSubCategories: {
        ...currentConfig,
        [key]: list.length > 0 ? list : [fallbackSub],
      },
    });

    const changedTags: CategoryTag[] = [];
    const nextTags = tags.map((t) => {
      if (isStagingTagId(t.id)) return t;
      const tSub = (t.subCategory || DEFAULT_UNCLASSIFIED_SUBCATEGORY).trim();
      if (t.tier === tier && tSub === trimmed) {
        const updated: CategoryTag = {
          ...t,
          tier: tier === 1 ? 1 : tier,
          subCategory: fallbackSub,
        };
        changedTags.push(updated);
        return updated;
      }
      return t;
    });

    if (changedTags.length > 0) {
      setTags(nextTags);
      cmsRepository.saveTags(nextTags);
      try {
        await firestoreService.batchSaveCategories(changedTags);
      } catch (err) {
        console.warn('Firestore deleteTierSubCategory error:', err);
      }
    }
  };

  // Tag CRUD (Supports Tier 1, Tier 2, Tier 3 + subCategory + Data Dictionary Rule Enforcement)
  const createTag = (
    name: string,
    groupType: TagGroupType = 'THEME',
    color = 'blue',
    description = '',
    tier: CategoryTier = 1,
    _parentId: string | null = null,
    entityType?: EntitySubtype,
    groupId?: string,
    subCategory?: string
  ): CategoryTag => {
    cmsRepository.setCategoriesWiped(false);
    const preferredTier: CategoryTier =
      tier === 1 || tier === 2 || tier === 3 ? tier : 1;

    // Enforce Rule 2 (strip ฮา / ฮาๆ / สุดฮา) and Dictionary Synonym Resolution
    const resolvedList = resolveTagByDataDictionary(
      name,
      preferredTier,
      subCategory
    );
    const primaryResolved = resolvedList[0];
    const finalName =
      primaryResolved?.name ||
      stripForbiddenHumorSuffixes(name).cleanedName ||
      name.trim().replace(/^#+/, '').trim();

    const finalKey = normalizeTagCompareKey(finalName);
    const existing = tags.find(
      (t) =>
        !isStagingTagId(t.id) &&
        normalizeTagCompareKey(t.name) === finalKey
    );
    if (existing) return existing;

    const conflict = findDuplicateTagConflict(name, tags);
    if (conflict) return conflict.conflictingTag;

    const resolvedTier: CategoryTier = primaryResolved?.dictionarySpecId
      ? primaryResolved.tier
      : preferredTier;
    const resolvedSubCategory = primaryResolved?.dictionarySpecId
      ? primaryResolved.subCategory
      : (subCategory && subCategory.trim()) ||
        getDefaultSubCategoryForTier(resolvedTier);
    const resolvedColor = primaryResolved?.dictionarySpecId
      ? primaryResolved.color
      : color;
    const resolvedDescription =
      description.trim() || primaryResolved?.description || '';
    const resolvedGroupId = groupId || `GRP-${groupType || 'GENERAL'}`;
    const defaultEntity: EntitySubtype =
      entityType ||
      primaryResolved?.entityType ||
      (resolvedTier === 3 ? 'PERSON' : resolvedTier === 2 ? 'ACTION' : 'TOPIC');

    // Ensure the subCategory is registered in settings
    addTierSubCategory(resolvedTier, resolvedSubCategory);

    const newTag: CategoryTag = {
      id: generateNextId('TAG', tags.map((t) => t.id)),
      name: finalName,
      color: resolvedColor,
      groupType,
      groupId: resolvedGroupId,
      description: resolvedDescription,
      createdAt: getReferenceTodayDate(),
      tier: resolvedTier,
      subCategory: resolvedSubCategory,
      parentId: null,
      entityType: defaultEntity,
    };
    const next = [...tags, newTag];
    setTags(next);
    cmsRepository.saveTags(next);
    firestoreService
      .saveCategory(newTag)
      .catch((err) => console.warn('Firestore saveCategory error:', err));
    return newTag;
  };

  const createSubcategory = (
    parentId: string,
    name: string,
    entityType: EntitySubtype = 'PERSON',
    color = 'amber',
    description = ''
  ): CategoryTag => {
    const parent = tagMap[parentId];
    const targetTier: CategoryTier = entityType === 'PERSON' ? 3 : 2;
    const targetSub =
      targetTier === 3
        ? DEFAULT_TIER_SUBCATEGORIES.tier3[0]
        : DEFAULT_TIER_SUBCATEGORIES.tier2[0];
    return createTag(
      name,
      parent ? parent.groupType : 'PERSON',
      color || (parent ? parent.color : 'amber'),
      description,
      targetTier,
      null,
      entityType,
      parent?.groupId,
      targetSub
    );
  };

  const updateTag = (
    id: string,
    updates: Partial<Omit<CategoryTag, 'id'>>
  ): { ok: boolean; error?: string } => {
    const target = tags.find((t) => t.id === id);
    if (!target) return { ok: false, error: 'ไม่พบแท็กที่ต้องการแก้ไข' };

    const sanitizedName =
      updates.name !== undefined
        ? stripForbiddenHumorSuffixes(updates.name).cleanedName ||
          updates.name.trim().replace(/^#+/, '').trim()
        : target.name;

    if (updates.name !== undefined) {
      const conflict = findDuplicateTagConflict(sanitizedName, tags, id);
      if (conflict) {
        return { ok: false, error: conflict.message };
      }
    }

    const resolvedTier: CategoryTier =
      updates.tier === 1 || updates.tier === 2 || updates.tier === 3
        ? updates.tier
        : target.tier || 1;
    const resolvedSubCategory =
      updates.subCategory !== undefined
        ? updates.subCategory.trim() || getDefaultSubCategoryForTier(resolvedTier)
        : target.subCategory || getDefaultSubCategoryForTier(resolvedTier);
    const resolvedGroupId =
      updates.groupId || target.groupId || `GRP-${target.groupType || 'GENERAL'}`;

    const updated: CategoryTag = {
      ...target,
      ...updates,
      name: sanitizedName,
      tier: resolvedTier,
      subCategory: resolvedSubCategory,
      parentId: null,
      groupId: resolvedGroupId,
    };

    const next = tags.map((t) => (t.id === id ? updated : t));
    setTags(next);
    cmsRepository.saveTags(next);

    firestoreService
      .saveCategory(updated)
      .catch((err) => console.warn('Firestore updateTag error:', err));

    return { ok: true };
  };

  const deleteTag = (id: string) => {
    if (isStagingTagId(id)) return;
    const removedIds: string[] = [id];

    cmsRepository.markTagIdsDeleted(removedIds);
    const nextTags = tags.filter((t) => t.id !== id);
    setTags(nextTags);
    cmsRepository.saveTags(nextTags);

    removedIds.forEach((rid) => {
      firestoreService
        .deleteCategory(rid)
        .catch((err) => console.warn('Firestore deleteTag error:', err));
    });

    const updatedFootages: Footage[] = [];
    const nextFootage = footage.map((ft) => {
      if (!ft.tags.some((tid) => removedIds.includes(tid))) return ft;
      const updatedFt: Footage = {
        ...ft,
        tags: normalizeFootageTags(ft.tags.filter((tid) => !removedIds.includes(tid))),
      };
      updatedFootages.push(updatedFt);
      return updatedFt;
    });
    setFootage(nextFootage);
    if (updatedFootages.length > 0) {
      firestoreService
        .batchSaveFootages(updatedFootages)
        .catch((err) => console.warn('Firestore update footages on deleteTag error:', err));
    }

    const updatedSources: RawSource[] = [];
    const nextSources = sources.map((src) => {
      if (!src.tags.some((tid) => removedIds.includes(tid))) return src;
      const updatedSrc: RawSource = {
        ...src,
        tags: src.tags.filter((tid) => !removedIds.includes(tid)),
      };
      updatedSources.push(updatedSrc);
      return updatedSrc;
    });
    setSources(nextSources);
    if (updatedSources.length > 0) {
      firestoreService
        .batchSaveSources(updatedSources)
        .catch((err) => console.warn('Firestore update sources on deleteTag error:', err));
    }

    setSelectedTagFilter((prev) => prev.filter((tid) => !removedIds.includes(tid)));
  };

  const batchDeleteTags = async (
    tagIds: string[],
    onProgress?: (progress: import('../../firebase/firestoreService').BatchChunkProgress) => void
  ): Promise<{ deletedCount: number; updatedFootagesCount: number }> => {
    const rawIds = Array.from(new Set(tagIds.filter((id) => Boolean(id) && !isStagingTagId(id))));
    if (rawIds.length === 0) return { deletedCount: 0, updatedFootagesCount: 0 };

    const allRemovedIds = new Set<string>(rawIds);
    const removedList = Array.from(allRemovedIds);
    cmsRepository.markTagIdsDeleted(removedList);

    const nextTags = tags.filter((t) => !allRemovedIds.has(t.id));
    setTags(nextTags);
    cmsRepository.saveTags(nextTags);

    const updatedFootages: Footage[] = [];
    const nextFootage = footage.map((ft) => {
      if (!ft.tags.some((tid) => allRemovedIds.has(tid))) return ft;
      const updatedFt: Footage = {
        ...ft,
        tags: normalizeFootageTags(ft.tags.filter((tid) => !allRemovedIds.has(tid))),
      };
      updatedFootages.push(updatedFt);
      return updatedFt;
    });

    if (updatedFootages.length > 0) {
      setFootage(nextFootage);
      cmsRepository.saveFootage(nextFootage);
    }

    const updatedSources: RawSource[] = [];
    const nextSources = sources.map((src) => {
      if (!src.tags.some((tid) => allRemovedIds.has(tid))) return src;
      const updatedSrc: RawSource = {
        ...src,
        tags: src.tags.filter((tid) => !allRemovedIds.has(tid)),
      };
      updatedSources.push(updatedSrc);
      return updatedSrc;
    });

    if (updatedSources.length > 0) {
      setSources(nextSources);
      cmsRepository.saveSources(nextSources);
    }

    setSelectedTagFilter((prev) => prev.filter((tid) => !allRemovedIds.has(tid)));

    try {
      await firestoreService.withBatchWriteLock(async () => {
        await firestoreService.batchDeleteCategories(removedList, onProgress);
        if (updatedFootages.length > 0) {
          await firestoreService.batchSaveFootages(updatedFootages);
        }
        if (updatedSources.length > 0) {
          await firestoreService.batchSaveSources(updatedSources);
        }
      });
    } catch (err) {
      console.warn('Firestore batchDeleteTags error:', err);
    }

    return {
      deletedCount: removedList.length,
      updatedFootagesCount: updatedFootages.length,
    };
  };

  const batchActions = useCMSTagBatchActions({
    categoryGroups,
    tags,
    setTags,
    footage,
    setFootage,
    sources,
    setSources,
    episodes,
    setEpisodes,
    setSelectedTagFilter,
    settings,
    addTierSubCategory,
    updateSettings,
  });

  return {
    createCategoryGroup,
    updateCategoryGroup,
    deleteCategoryGroup,
    wipeAllCategories,
    restoreDefaultCategories,
    createTag,
    createSubcategory,
    addTierSubCategory,
    renameTierSubCategory,
    deleteTierSubCategory,
    ...batchActions,
    updateTag,
    deleteTag,
    batchDeleteTags,
    updateSettings,
  };
}
