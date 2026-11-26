import React from 'react';
import {
  BatchChunkProgress,
  firestoreService,
} from '../../firebase/firestoreService';
import { cmsRepository } from '../../services/cmsRepository';
import { isStagingGroupId, isStagingTagId } from '../../services/seedData';
import { Episode } from '../../types/episode.types';
import { Footage } from '../../types/footage.types';
import { RawSource } from '../../types/source.types';
import {
  CategoryGroup,
  CategoryTag,
  CategoryTier,
  DEFAULT_TIER_SUBCATEGORIES,
  EntitySubtype,
  SystemSettings,
} from '../../types/tag.types';
import { computeDictionaryTagReorganization } from '../../utils/reorganizeTagsToDictionary';
import { computeDuplicateTagMerge } from '../../utils/tagDeduplicator';
import { BatchTagMoveDestination, TagReorgUndoRecord } from './cms.types';

function getDefaultSubCategoryForTier(tier: CategoryTier): string {
  if (tier === 2) return DEFAULT_TIER_SUBCATEGORIES.tier2[0];
  if (tier === 3) return DEFAULT_TIER_SUBCATEGORIES.tier3[0];
  return DEFAULT_TIER_SUBCATEGORIES.tier1[0];
}

interface UseCMSTagBatchActionsParams {
  categoryGroups: CategoryGroup[];
  tags: CategoryTag[];
  setTags: React.Dispatch<React.SetStateAction<CategoryTag[]>>;
  footage: Footage[];
  setFootage: React.Dispatch<React.SetStateAction<Footage[]>>;
  sources: RawSource[];
  setSources: React.Dispatch<React.SetStateAction<RawSource[]>>;
  episodes: Episode[];
  setEpisodes: React.Dispatch<React.SetStateAction<Episode[]>>;
  setSelectedTagFilter: React.Dispatch<React.SetStateAction<string[]>>;
  settings: SystemSettings;
  addTierSubCategory: (tier: CategoryTier, subCategoryName: string) => void;
  updateSettings: (updates: Partial<SystemSettings>) => void;
}

export function useCMSTagBatchActions({
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
}: UseCMSTagBatchActionsParams) {
  const [lastTagReorgUndoRecord, setLastTagReorgUndoRecord] =
    React.useState<TagReorgUndoRecord | null>(null);

  const batchAddTags = async (
    newTags: CategoryTag[],
    onChunkProgress?: (progress: BatchChunkProgress) => void
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
    destination: BatchTagMoveDestination,
    onChunkProgress?: (progress: BatchChunkProgress) => void
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

    if (destination.mode === 'MOVE_TO_TIER_SUBCATEGORY') {
      const targetTier: CategoryTier = destination.targetTier;
      const targetSubCategory =
        destination.targetSubCategory.trim() ||
        getDefaultSubCategoryForTier(targetTier);
      addTierSubCategory(targetTier, targetSubCategory);

      const moveSet = new Set(cleanIds);
      const previousTags: CategoryTag[] = [];
      const changedTags: CategoryTag[] = [];

      const defaultColorForTier =
        targetTier === 1 ? 'blue' : targetTier === 2 ? 'amber' : 'emerald';
      const defaultEntityForTier: EntitySubtype =
        destination.entityType ||
        (targetTier === 3 ? 'PERSON' : targetTier === 2 ? 'ACTION' : 'TOPIC');

      const nextTags = tags.map((t) => {
        if (!moveSet.has(t.id)) return t;
        previousTags.push(t);
        const updated: CategoryTag = {
          ...t,
          tier: targetTier,
          subCategory: targetSubCategory,
          parentId: null,
          color: t.color || defaultColorForTier,
          entityType:
            destination.entityType || t.entityType || defaultEntityForTier,
          groupId:
            targetTier === 3
              ? 'GRP-PERSON'
              : targetTier === 2
              ? 'GRP-ACTION'
              : t.groupId || 'GRP-THEME',
          groupType:
            targetTier === 3
              ? 'PERSON'
              : targetTier === 2
              ? 'ACTION'
              : t.groupType || 'THEME',
        };
        changedTags.push(updated);
        return updated;
      });

      if (changedTags.length === 0) {
        return { movedCount: 0, updatedClipsCount: 0, summaryText: '' };
      }

      setTags(nextTags);
      cmsRepository.saveTags(nextTags);

      const tierLabel =
        targetTier === 1
          ? 'Tier 1 (มิติปลายทาง/หมวดกว้าง)'
          : targetTier === 2
          ? 'Tier 2 (บริบท/สไตล์คลิป)'
          : 'Tier 3 (บุคคลเจาะจง/รายการ)';
      const summaryText = `ย้าย ${changedTags.length} แท็ก ➔ ${tierLabel} · หมวดย่อย "${targetSubCategory}"`;

      setLastTagReorgUndoRecord({
        id: `UNDO-TAG-${Date.now()}`,
        summaryText,
        previousTags,
        previousFootages: [],
        timestamp: Date.now(),
      });

      try {
        await firestoreService.withBatchWriteLock(async () => {
          await firestoreService.batchSaveCategories(
            changedTags,
            onChunkProgress
          );
        });
      } catch (err) {
        console.warn(
          'Firestore batchMoveOrReparentTags (MOVE_TO_TIER_SUBCATEGORY) error:',
          err
        );
      }

      return {
        movedCount: changedTags.length,
        updatedClipsCount: 0,
        summaryText,
      };
    }

    if (destination.mode === 'MOVE_TO_GROUP') {
      const targetGroup = categoryGroups.find(
        (g) => g.id === destination.targetGroupId
      );
      if (!targetGroup || isStagingGroupId(targetGroup.id)) {
        return { movedCount: 0, updatedClipsCount: 0, summaryText: '' };
      }
      return batchMoveOrReparentTags(
        cleanIds,
        {
          mode: 'MOVE_TO_TIER_SUBCATEGORY',
          targetTier: 1,
          targetSubCategory: targetGroup.name,
        },
        onChunkProgress
      );
    }

    // Legacy fallback for MOVE_TO_PARENT_TAG
    const parentTag = tags.find((t) => t.id === destination.targetParentTagId);
    const fallbackSub = parentTag
      ? parentTag.name
      : DEFAULT_TIER_SUBCATEGORIES.tier2[0];
    return batchMoveOrReparentTags(
      cleanIds,
      {
        mode: 'MOVE_TO_TIER_SUBCATEGORY',
        targetTier: 2,
        targetSubCategory: fallbackSub,
        entityType: destination.entityType,
      },
      onChunkProgress
    );
  };

  const batchUpdateTagsMetadata = async (
    tagIds: string[],
    updates: {
      color?: string;
      entityType?: EntitySubtype;
      tier?: CategoryTier;
      subCategory?: string;
    },
    onChunkProgress?: (progress: BatchChunkProgress) => void
  ): Promise<{ updatedCount: number; summaryText: string }> => {
    const cleanIds = Array.from(
      new Set(tagIds.filter((id) => Boolean(id) && !isStagingTagId(id)))
    );
    if (
      cleanIds.length === 0 ||
      (!updates.color &&
        !updates.entityType &&
        !updates.tier &&
        !updates.subCategory)
    ) {
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
        ...(updates.tier ? { tier: updates.tier } : {}),
        ...(updates.subCategory ? { subCategory: updates.subCategory } : {}),
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
    if (updates.tier) summaryParts.push(`Tier ${updates.tier}`);
    if (updates.subCategory)
      summaryParts.push(`หมวดย่อย (${updates.subCategory})`);
    const summaryText = `อัปเดต ${summaryParts.join(' & ')} จำนวน ${changedTags.length} แท็ก`;

    setLastTagReorgUndoRecord({
      id: `UNDO-META-${Date.now()}`,
      summaryText,
      previousTags,
      previousFootages: [],
      timestamp: Date.now(),
    });

    try {
      await firestoreService.withBatchWriteLock(async () => {
        await firestoreService.batchSaveCategories(
          changedTags,
          onChunkProgress
        );
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

    if (record.deletedTagIds && record.deletedTagIds.length > 0) {
      cmsRepository.unmarkTagIdsDeleted(record.deletedTagIds);
    }

    const prevTagMap = new Map(record.previousTags.map((t) => [t.id, t]));
    const updatedExistingTags = tags.map((t) => prevTagMap.get(t.id) || t);
    const existingIds = new Set(updatedExistingTags.map((t) => t.id));
    const missingDeletedTags = record.previousTags.filter(
      (t) => !existingIds.has(t.id)
    );
    const nextTags = [...updatedExistingTags, ...missingDeletedTags];
    setTags(nextTags);
    cmsRepository.saveTags(nextTags);

    if (record.previousFootages.length > 0) {
      const prevFtMap = new Map(record.previousFootages.map((f) => [f.id, f]));
      const nextFootage = footage.map((f) => prevFtMap.get(f.id) || f);
      setFootage(nextFootage);
      cmsRepository.saveFootage(nextFootage);
    }

    if (record.previousSources && record.previousSources.length > 0) {
      const prevSrcMap = new Map(record.previousSources.map((s) => [s.id, s]));
      const nextSources = sources.map((s) => prevSrcMap.get(s.id) || s);
      setSources(nextSources);
      cmsRepository.saveSources(nextSources);
    }

    if (record.previousEpisodes && record.previousEpisodes.length > 0) {
      const prevEpMap = new Map(record.previousEpisodes.map((ep) => [ep.id, ep]));
      const nextEpisodes = episodes.map((ep) => prevEpMap.get(ep.id) || ep);
      setEpisodes(nextEpisodes);
      cmsRepository.saveEpisodes(nextEpisodes);
    }

    try {
      await firestoreService.withBatchWriteLock(async () => {
        if (record.previousTags.length > 0) {
          await firestoreService.batchSaveCategories(record.previousTags);
        }
        if (record.previousFootages.length > 0) {
          await firestoreService.batchSaveFootages(record.previousFootages);
        }
        if (record.previousSources && record.previousSources.length > 0) {
          await firestoreService.batchSaveSources(record.previousSources);
        }
        if (record.previousEpisodes && record.previousEpisodes.length > 0) {
          await firestoreService.batchSaveEpisodes(record.previousEpisodes);
        }
      });
    } catch (err) {
      console.warn('Firestore undoLastTagReorg error:', err);
    }
  };

  const dismissTagReorgUndoRecord = () => {
    setLastTagReorgUndoRecord(null);
  };

  const reorganizeTagsToDataDictionary = async (
    onChunkProgress?: (progress: BatchChunkProgress) => void
  ) => {
    cmsRepository.setCategoriesWiped(false);
    const reorg = computeDictionaryTagReorganization({
      tags,
      footage,
      sources,
      currentTierSubCategories: settings.tierSubCategories,
    });

    setTags(reorg.nextTags);
    cmsRepository.saveTags(reorg.nextTags);

    if (reorg.tagIdsToDelete.length > 0) {
      cmsRepository.markTagIdsDeleted(reorg.tagIdsToDelete);
      const deletedSet = new Set(reorg.tagIdsToDelete);
      setSelectedTagFilter((prev) => prev.filter((id) => !deletedSet.has(id)));
    }

    if (reorg.changedFootages.length > 0) {
      setFootage(reorg.nextFootage);
      cmsRepository.saveFootage(reorg.nextFootage);
    }

    if (reorg.changedSources.length > 0) {
      setSources(reorg.nextSources);
      cmsRepository.saveSources(reorg.nextSources);
    }

    updateSettings({
      tierSubCategories: reorg.nextTierSubCategories,
    });

    try {
      await firestoreService.withBatchWriteLock(async () => {
        if (reorg.tagsToSave.length > 0) {
          await firestoreService.batchSaveCategories(
            reorg.tagsToSave,
            onChunkProgress
          );
        }
        if (reorg.tagIdsToDelete.length > 0) {
          await firestoreService.batchDeleteCategories(
            reorg.tagIdsToDelete,
            onChunkProgress
          );
        }
        if (reorg.changedFootages.length > 0) {
          await firestoreService.batchSaveFootages(reorg.changedFootages);
        }
        if (reorg.changedSources.length > 0) {
          await firestoreService.batchSaveSources(reorg.changedSources);
        }
      });
    } catch (err) {
      console.warn('Firestore reorganizeTagsToDataDictionary error:', err);
    }

    return reorg.stats;
  };

  const deduplicateDuplicateTags = async (
    onChunkProgress?: (progress: BatchChunkProgress) => void
  ) => {
    const mergePlan = computeDuplicateTagMerge({
      tags,
      footage,
      sources,
      episodes,
    });

    if (mergePlan.tagIdsToDelete.length === 0) {
      return mergePlan.stats;
    }

    const previousTagsToRestore = tags.filter(
      (t) =>
        mergePlan.tagIdsToDelete.includes(t.id) ||
        mergePlan.tagsToSave.some((saved) => saved.id === t.id)
    );
    const changedFootageIds = new Set(
      mergePlan.changedFootages.map((f) => f.id)
    );
    const previousFootages = footage.filter((f) => changedFootageIds.has(f.id));
    const changedSourceIds = new Set(
      mergePlan.changedSources.map((s) => s.id)
    );
    const previousSources = sources.filter((s) => changedSourceIds.has(s.id));
    const changedEpisodeIds = new Set(
      mergePlan.changedEpisodes.map((ep) => ep.id)
    );
    const previousEpisodes = episodes.filter((ep) =>
      changedEpisodeIds.has(ep.id)
    );

    const replacementByLoserId = new Map<string, string>();
    mergePlan.groups.forEach((g) => {
      g.losers.forEach((l) => replacementByLoserId.set(l.id, g.winner.id));
    });

    setTags(mergePlan.nextTags);
    cmsRepository.saveTags(mergePlan.nextTags);
    cmsRepository.markTagIdsDeleted(mergePlan.tagIdsToDelete);

    setSelectedTagFilter((prev) =>
      Array.from(
        new Set(prev.map((tid) => replacementByLoserId.get(tid) || tid))
      )
    );

    if (mergePlan.changedFootages.length > 0) {
      setFootage(mergePlan.nextFootage);
      cmsRepository.saveFootage(mergePlan.nextFootage);
    }

    if (mergePlan.changedSources.length > 0) {
      setSources(mergePlan.nextSources);
      cmsRepository.saveSources(mergePlan.nextSources);
    }

    if (mergePlan.changedEpisodes.length > 0) {
      setEpisodes(mergePlan.nextEpisodes);
      cmsRepository.saveEpisodes(mergePlan.nextEpisodes);
    }

    const sampleNames = mergePlan.stats.mergedSummaries
      .slice(0, 3)
      .map((s) => `#${s.winnerName}`)
      .join(', ');
    const moreSuffix =
      mergePlan.stats.mergedSummaries.length > 3
        ? ` และอีก ${mergePlan.stats.mergedSummaries.length - 3} กลุ่ม`
        : '';

    setLastTagReorgUndoRecord({
      id: `UNDO-DEDUP-${Date.now()}`,
      summaryText: `รวมแท็กซ้ำ ${mergePlan.stats.duplicateGroupCount} กลุ่ม (${sampleNames}${moreSuffix}) ➔ ลบตัวซ้ำ ${mergePlan.stats.mergedTagsCount} แท็ก`,
      previousTags: previousTagsToRestore,
      previousFootages,
      previousSources,
      previousEpisodes,
      deletedTagIds: mergePlan.tagIdsToDelete,
      timestamp: Date.now(),
    });

    try {
      await firestoreService.withBatchWriteLock(async () => {
        if (mergePlan.tagsToSave.length > 0) {
          await firestoreService.batchSaveCategories(
            mergePlan.tagsToSave,
            onChunkProgress
          );
        }
        await firestoreService.batchDeleteCategories(
          mergePlan.tagIdsToDelete,
          onChunkProgress
        );
        if (mergePlan.changedFootages.length > 0) {
          await firestoreService.batchSaveFootages(mergePlan.changedFootages);
        }
        if (mergePlan.changedSources.length > 0) {
          await firestoreService.batchSaveSources(mergePlan.changedSources);
        }
        if (mergePlan.changedEpisodes.length > 0) {
          await firestoreService.batchSaveEpisodes(mergePlan.changedEpisodes);
        }
      });
    } catch (err) {
      console.warn('Firestore deduplicateDuplicateTags error:', err);
    }

    return mergePlan.stats;
  };

  return {
    batchAddTags,
    batchMoveOrReparentTags,
    batchUpdateTagsMetadata,
    lastTagReorgUndoRecord,
    undoLastTagReorg,
    dismissTagReorgUndoRecord,
    reorganizeTagsToDataDictionary,
    deduplicateDuplicateTags,
  };
}
