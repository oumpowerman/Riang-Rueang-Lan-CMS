import React from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { cmsRepository } from '../../services/cmsRepository';
import {
  isStagingGroupId,
  isStagingTagId,
  normalizeFootageTags,
} from '../../services/seedData';
import { Footage } from '../../types/footage.types';
import { RawSource } from '../../types/source.types';
import {
  CategoryGroup,
  CategoryTag,
  CategoryTier,
  EntitySubtype,
  SystemSettings,
  TagGroupType,
} from '../../types/tag.types';
import { getReferenceTodayDate } from '../../utils/cooldownCalculator';
import { generateNextId } from '../../utils/fileNameGenerator';

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
  setSelectedTagFilter: React.Dispatch<React.SetStateAction<string[]>>;
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
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
  setSelectedTagFilter,
  settings,
  setSettings,
}: UseCMSCategoryActionsParams) {
  // Category Group CRUD (Tier 0)
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
    firestoreService
      .restoreCategoriesToCloud(fresh.categoryGroups, fresh.tags)
      .catch((err) => console.warn('Firestore restoreCategoriesToCloud error:', err));
  };

  // Tag & Subcategory CRUD
  const createTag = (
    name: string,
    groupType: TagGroupType = 'THEME',
    color = 'blue',
    description = '',
    tier: CategoryTier = 1,
    parentId: string | null = null,
    entityType?: EntitySubtype,
    groupId?: string
  ): CategoryTag => {
    cmsRepository.setCategoriesWiped(false);
    const trimmed = name.trim();
    const existing = tags.find(
      (t) =>
        t.name.toLowerCase() === trimmed.toLowerCase() &&
        (parentId ? t.parentId === parentId : !t.parentId || t.tier === 1)
    );
    if (existing) return existing;

    const resolvedTier: CategoryTier = tier === 2 || !!parentId ? 2 : 1;
    const parentCat = parentId ? tagMap[parentId] : undefined;
    const resolvedGroupId =
      groupId || parentCat?.groupId || `GRP-${groupType || 'GENERAL'}`;

    const newTag: CategoryTag = {
      id: generateNextId('TAG', tags.map((t) => t.id)),
      name: trimmed,
      color,
      groupType,
      groupId: resolvedGroupId,
      description,
      createdAt: getReferenceTodayDate(),
      tier: resolvedTier,
      parentId: resolvedTier === 2 ? parentId : null,
      ...(resolvedTier === 2 ? { entityType: entityType || 'PERSON' } : {}),
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
    return createTag(
      name,
      parent ? parent.groupType : 'PERSON',
      color || (parent ? parent.color : 'amber'),
      description || `หมวดหมู่ย่อยใต้ ${parent ? parent.name : ''}`,
      2,
      parentId,
      entityType,
      parent?.groupId
    );
  };

  const updateTag = (id: string, updates: Partial<Omit<CategoryTag, 'id'>>) => {
    const target = tags.find((t) => t.id === id);
    if (!target) return;

    const resolvedTier: CategoryTier =
      updates.tier ?? target.tier ?? (updates.parentId || target.parentId ? 2 : 1);
    const resolvedParentId =
      resolvedTier === 2
        ? updates.parentId !== undefined
          ? updates.parentId
          : target.parentId || null
        : null;
    const parentCat = resolvedParentId
      ? tags.find((p) => p.id === resolvedParentId)
      : undefined;
    const resolvedGroupId =
      updates.groupId ||
      target.groupId ||
      parentCat?.groupId ||
      `GRP-${target.groupType || 'GENERAL'}`;

    const updated: CategoryTag = {
      ...target,
      ...updates,
      tier: resolvedTier,
      parentId: resolvedParentId,
      groupId: resolvedGroupId,
    };

    const next = tags.map((t) => (t.id === id ? updated : t));
    setTags(next);
    cmsRepository.saveTags(next);

    if (parentCat) {
      firestoreService
        .saveCategory(parentCat)
        .catch((err) => console.warn('Firestore save parent category error:', err));
    }
    firestoreService
      .saveCategory(updated)
      .catch((err) => console.warn('Firestore updateTag error:', err));
  };

  const deleteTag = (id: string) => {
    if (isStagingTagId(id)) return;
    const removedIds: string[] = [id];
    tags.forEach((t) => {
      if (t.parentId === id && !removedIds.includes(t.id)) {
        removedIds.push(t.id);
      }
    });

    cmsRepository.markTagIdsDeleted(removedIds);
    const nextTags = tags.filter((t) => t.id !== id && t.parentId !== id);
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

  const updateSettings = (updates: Partial<SystemSettings>) => {
    const nextSettings = { ...settings, ...updates };
    setSettings(nextSettings);
    cmsRepository.saveSettings(nextSettings);
    firestoreService
      .saveSettings(nextSettings)
      .catch((err) => console.warn('Firestore updateSettings error:', err));
  };

  const batchAddTags = async (
    newTags: CategoryTag[],
    onChunkProgress?: (progress: import('../../firebase/firestoreService').BatchChunkProgress) => void
  ): Promise<void> => {
    if (!newTags || newTags.length === 0) return;
    cmsRepository.setCategoriesWiped(false);
    setTags((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const filteredNew = newTags.filter((t) => !existingIds.has(t.id));
      const next = [...prev, ...filteredNew];
      cmsRepository.saveTags(next);
      return next;
    });
    try {
      await firestoreService.batchSaveCategories(newTags, onChunkProgress);
    } catch (err) {
      console.warn('Firestore batchAddTags error:', err);
    }
  };

  return {
    createCategoryGroup,
    updateCategoryGroup,
    deleteCategoryGroup,
    wipeAllCategories,
    restoreDefaultCategories,
    createTag,
    createSubcategory,
    batchAddTags,
    updateTag,
    deleteTag,
    updateSettings,
  };
}
