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

  const batchDeleteTags = async (
    tagIds: string[],
    onProgress?: (progress: import('../../firebase/firestoreService').BatchChunkProgress) => void
  ): Promise<{ deletedCount: number; updatedFootagesCount: number }> => {
    const rawIds = Array.from(new Set(tagIds.filter((id) => Boolean(id) && !isStagingTagId(id))));
    if (rawIds.length === 0) return { deletedCount: 0, updatedFootagesCount: 0 };

    // Include any children subcategories if a parent tag is in the list
    const allRemovedIds = new Set<string>(rawIds);
    tags.forEach((t) => {
      if (t.parentId && allRemovedIds.has(t.parentId)) {
        allRemovedIds.add(t.id);
      }
    });

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

  const updateSettings = (updates: Partial<SystemSettings>) => {
    const nextSettings = { ...settings, ...updates };
    setSettings(nextSettings);
    cmsRepository.saveSettings(nextSettings);
    firestoreService
      .saveSettings(nextSettings)
      .catch((err) => console.warn('Firestore updateSettings error:', err));
  };

  const [lastTagReorgUndoRecord, setLastTagReorgUndoRecord] =
    React.useState<import('./cms.types').TagReorgUndoRecord | null>(null);

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

  const batchMoveOrReparentTags = async (
    tagIdsToMove: string[],
    destination: import('./cms.types').BatchTagMoveDestination,
    onChunkProgress?: (progress: import('../../firebase/firestoreService').BatchChunkProgress) => void
  ): Promise<{
    movedCount: number;
    updatedClipsCount: number;
    summaryText: string;
  }> => {
    const cleanIds = Array.from(
      new Set(tagIdsToMove.filter((id) => Boolean(id) && !isStagingTagId(id)))
    );
    if (cleanIds.length === 0) {
      return { movedCount: 0, updatedClipsCount: 0, summaryText: '' };
    }

    if (destination.mode === 'MOVE_TO_GROUP') {
      const targetGroup = categoryGroups.find(
        (g) => g.id === destination.targetGroupId
      );
      if (!targetGroup || isStagingGroupId(targetGroup.id)) {
        return { movedCount: 0, updatedClipsCount: 0, summaryText: '' };
      }

      const moveSet = new Set(cleanIds);
      const targetGroupType: TagGroupType =
        (targetGroup.id.replace('GRP-', '') as TagGroupType) || 'GENERAL';

      const previousTags: CategoryTag[] = [];
      const changedTags: CategoryTag[] = [];

      const nextTags = tags.map((t) => {
        if (moveSet.has(t.id)) {
          previousTags.push(t);
          const updated: CategoryTag = {
            ...t,
            tier: 1,
            parentId: null,
            groupId: targetGroup.id,
            groupType: targetGroupType,
          };
          changedTags.push(updated);
          return updated;
        }
        // Also move any existing Tier 2 children of the moved Tier 1 tags into the new groupId
        if (t.tier === 2 && t.parentId && moveSet.has(t.parentId)) {
          previousTags.push(t);
          const updatedChild: CategoryTag = {
            ...t,
            groupId: targetGroup.id,
            groupType: targetGroupType,
          };
          changedTags.push(updatedChild);
          return updatedChild;
        }
        return t;
      });

      if (changedTags.length === 0) {
        return { movedCount: 0, updatedClipsCount: 0, summaryText: '' };
      }

      setTags(nextTags);
      cmsRepository.saveTags(nextTags);

      const summaryText = `ย้าย ${moveSet.size} แท็ก ➔ มิติ "${targetGroup.name}" (แท็กหลัก)`;
      setLastTagReorgUndoRecord({
        id: `UNDO-TAG-${Date.now()}`,
        summaryText,
        previousTags,
        previousFootages: [],
        timestamp: Date.now(),
      });

      try {
        await firestoreService.withBatchWriteLock(async () => {
          await firestoreService.batchSaveCategories(changedTags, onChunkProgress);
        });
      } catch (err) {
        console.warn('Firestore batchMoveOrReparentTags (MOVE_TO_GROUP) error:', err);
      }

      return {
        movedCount: moveSet.size,
        updatedClipsCount: 0,
        summaryText,
      };
    }

    // Mode: MOVE_TO_PARENT_TAG (Convert/Move tags to Tier 2 Subcategories under targetParentTagId)
    const parentTag = tags.find(
      (t) =>
        t.id === destination.targetParentTagId &&
        !isStagingTagId(t.id) &&
        (t.tier === 1 || !t.parentId)
    );
    if (!parentTag) {
      return { movedCount: 0, updatedClipsCount: 0, summaryText: '' };
    }

    const validMoveIds = cleanIds.filter((id) => id !== parentTag.id);
    if (validMoveIds.length === 0) {
      return { movedCount: 0, updatedClipsCount: 0, summaryText: '' };
    }

    const moveSet = new Set(validMoveIds);
    const parentGroupId =
      parentTag.groupId || `GRP-${parentTag.groupType || 'GENERAL'}`;
    const parentGroupType: TagGroupType = parentTag.groupType || 'GENERAL';

    const previousTags: CategoryTag[] = [];
    const changedTags: CategoryTag[] = [];
    const allSubtagIdsUnderParent = new Set<string>();

    const nextTags = tags.map((t) => {
      if (moveSet.has(t.id)) {
        previousTags.push(t);
        const updated: CategoryTag = {
          ...t,
          tier: 2,
          parentId: parentTag.id,
          groupId: parentGroupId,
          groupType: parentGroupType,
          entityType: destination.entityType || t.entityType || 'TOPIC',
          color: t.color || parentTag.color || 'blue',
        };
        changedTags.push(updated);
        allSubtagIdsUnderParent.add(updated.id);
        return updated;
      }
      // If a moved Tier 1 tag previously had its own Tier 2 children, re-parent those children to parentTag as well
      if (t.tier === 2 && t.parentId && moveSet.has(t.parentId)) {
        previousTags.push(t);
        const updatedChild: CategoryTag = {
          ...t,
          tier: 2,
          parentId: parentTag.id,
          groupId: parentGroupId,
          groupType: parentGroupType,
        };
        changedTags.push(updatedChild);
        allSubtagIdsUnderParent.add(updatedChild.id);
        return updatedChild;
      }
      return t;
    });

    // Ensure all Footage items carrying any of the moved subtags also include parentTag.id
    const previousFootages: Footage[] = [];
    const updatedFootages: Footage[] = [];

    const nextFootage = footage.map((ft) => {
      const hasMovedSubtag = ft.tags.some((tid) =>
        allSubtagIdsUnderParent.has(tid)
      );
      if (!hasMovedSubtag || ft.tags.includes(parentTag.id)) {
        return ft;
      }
      previousFootages.push(ft);
      const updatedFt: Footage = {
        ...ft,
        tags: normalizeFootageTags([...ft.tags, parentTag.id]),
      };
      updatedFootages.push(updatedFt);
      return updatedFt;
    });

    setTags(nextTags);
    cmsRepository.saveTags(nextTags);

    if (updatedFootages.length > 0) {
      setFootage(nextFootage);
      cmsRepository.saveFootage(nextFootage);
    }

    const summaryText = `ย้าย ${moveSet.size} แท็ก ➔ เป็นแท็กย่อยใต้ "#${parentTag.name}"${
      updatedFootages.length > 0 ? ` (เชื่อมโยง ${updatedFootages.length} คลิป)` : ''
    }`;

    setLastTagReorgUndoRecord({
      id: `UNDO-TAG-${Date.now()}`,
      summaryText,
      previousTags,
      previousFootages,
      timestamp: Date.now(),
    });

    try {
      await firestoreService.withBatchWriteLock(async () => {
        await firestoreService.batchSaveCategories(changedTags, onChunkProgress);
        if (updatedFootages.length > 0) {
          await firestoreService.batchSaveFootages(updatedFootages, onChunkProgress);
        }
      });
    } catch (err) {
      console.warn('Firestore batchMoveOrReparentTags (MOVE_TO_PARENT_TAG) error:', err);
    }

    return {
      movedCount: moveSet.size,
      updatedClipsCount: updatedFootages.length,
      summaryText,
    };
  };

  const batchUpdateTagsMetadata = async (
    tagIds: string[],
    updates: { color?: string; entityType?: EntitySubtype },
    onChunkProgress?: (progress: import('../../firebase/firestoreService').BatchChunkProgress) => void
  ): Promise<{ updatedCount: number; summaryText: string }> => {
    const cleanIds = Array.from(
      new Set(tagIds.filter((id) => Boolean(id) && !isStagingTagId(id)))
    );
    if (cleanIds.length === 0 || (!updates.color && !updates.entityType)) {
      return { updatedCount: 0, summaryText: '' };
    }

    const updateSet = new Set(cleanIds);
    const previousTags: CategoryTag[] = [];
    const changedTags: CategoryTag[] = [];

    const nextTags = tags.map((t) => {
      if (!updateSet.has(t.id)) return t;
      previousTags.push(t);
      const updated: CategoryTag = {
        ...t,
        ...(updates.color ? { color: updates.color } : {}),
        ...(updates.entityType ? { entityType: updates.entityType } : {}),
      };
      changedTags.push(updated);
      return updated;
    });

    if (changedTags.length === 0) {
      return { updatedCount: 0, summaryText: '' };
    }

    setTags(nextTags);
    cmsRepository.saveTags(nextTags);

    const summaryParts: string[] = [];
    if (updates.color) summaryParts.push(`โทนสี (${updates.color})`);
    if (updates.entityType) summaryParts.push(`ประเภท (${updates.entityType})`);
    const summaryText = `อัปเดต ${ summaryParts.join(' & ') } จำนวน ${changedTags.length} แท็ก`;

    setLastTagReorgUndoRecord({
      id: `UNDO-META-${Date.now()}`,
      summaryText,
      previousTags,
      previousFootages: [],
      timestamp: Date.now(),
    });

    try {
      await firestoreService.withBatchWriteLock(async () => {
        await firestoreService.batchSaveCategories(changedTags, onChunkProgress);
      });
    } catch (err) {
      console.warn('Firestore batchUpdateTagsMetadata error:', err);
    }

    return {
      updatedCount: changedTags.length,
      summaryText,
    };
  };

  const undoLastTagReorg = async (): Promise<void> => {
    if (!lastTagReorgUndoRecord) return;
    const record = lastTagReorgUndoRecord;
    setLastTagReorgUndoRecord(null);

    const prevTagMap = new Map(record.previousTags.map((t) => [t.id, t]));
    const nextTags = tags.map((t) => prevTagMap.get(t.id) || t);
    setTags(nextTags);
    cmsRepository.saveTags(nextTags);

    let nextFootage = footage;
    if (record.previousFootages.length > 0) {
      const prevFtMap = new Map(record.previousFootages.map((f) => [f.id, f]));
      nextFootage = footage.map((f) => prevFtMap.get(f.id) || f);
      setFootage(nextFootage);
      cmsRepository.saveFootage(nextFootage);
    }

    try {
      await firestoreService.withBatchWriteLock(async () => {
        if (record.previousTags.length > 0) {
          await firestoreService.batchSaveCategories(record.previousTags);
        }
        if (record.previousFootages.length > 0) {
          await firestoreService.batchSaveFootages(record.previousFootages);
        }
      });
    } catch (err) {
      console.warn('Firestore undoLastTagReorg error:', err);
    }
  };

  const dismissTagReorgUndoRecord = () => {
    setLastTagReorgUndoRecord(null);
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
    batchMoveOrReparentTags,
    batchUpdateTagsMetadata,
    lastTagReorgUndoRecord,
    undoLastTagReorg,
    dismissTagReorgUndoRecord,
    updateTag,
    deleteTag,
    batchDeleteTags,
    updateSettings,
  };
}
