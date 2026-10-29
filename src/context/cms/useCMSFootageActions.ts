import React, { useState } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { isStagingTagId, normalizeFootageTags, STAGING_TAG_ID } from '../../services/seedData';
import { Footage } from '../../types/footage.types';
import { RawSource, SourcePlatform } from '../../types/source.types';
import { CategoryTag } from '../../types/tag.types';
import { getReferenceTodayDate } from '../../utils/cooldownCalculator';
import {
  cleanFootageTitle,
  generateNextId,
  generateStandardFileName,
} from '../../utils/fileNameGenerator';
import { QuickSortUndoRecord, SplitClipDraft } from './cms.types';

interface UseCMSFootageActionsParams {
  footage: Footage[];
  setFootage: React.Dispatch<React.SetStateAction<Footage[]>>;
  sources: RawSource[];
  setSources: React.Dispatch<React.SetStateAction<RawSource[]>>;
  tagMap: Record<string, CategoryTag>;
  setSelectedFootageIdsForBatch: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveDragFootageIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useCMSFootageActions({
  footage,
  setFootage,
  sources,
  setSources,
  tagMap,
  setSelectedFootageIdsForBatch,
  setActiveDragFootageIds,
}: UseCMSFootageActionsParams) {
  const [lastQuickSortUndoRecord, setLastQuickSortUndoRecord] =
    useState<QuickSortUndoRecord | null>(null);
  // Flow A: 1-to-1 Direct Footage
  const addDirectFootage = (payload: {
    title: string;
    originalUrl: string;
    tags: string[];
    driveFileUrl: string;
    mascotNotes: string;
    durationSec?: number;
  }): Footage => {
    const nextId = generateNextId('FT', footage.map((f) => f.id));
    const standardFileName = generateStandardFileName(nextId, payload.title);
    const newFootage: Footage = {
      id: nextId,
      title: payload.title.trim(),
      ingestionFlow: 'DIRECT_1_TO_1',
      sourceId: null,
      originalUrl: payload.originalUrl.trim(),
      timestampRange: null,
      durationSec: payload.durationSec || 25,
      tags: normalizeFootageTags(payload.tags),
      driveFileUrl: payload.driveFileUrl.trim(),
      standardFileName,
      mascotNotes: payload.mascotNotes.trim(),
      createdAt: getReferenceTodayDate(),
    };
    setFootage((prev) => [newFootage, ...prev]);
    firestoreService
      .saveFootage(newFootage)
      .catch((err) => console.warn('Firestore addDirectFootage error:', err));
    return newFootage;
  };

  // Flow B: 1-to-Many Source Splitter (New Source + N Footages)
  const createSourceWithSplitFootage = (
    sourcePayload: {
      title: string;
      originalUrl: string;
      platform: SourcePlatform;
      channelOrCreator: string;
      totalDuration?: string;
      tags: string[];
      notes: string;
    },
    clips: SplitClipDraft[]
  ) => {
    const nextSourceId = generateNextId('SRC', sources.map((s) => s.id));
    const currentFootageIds = footage.map((f) => f.id);
    const createdFootage: Footage[] = [];

    for (const clip of clips) {
      if (!clip.title.trim()) continue;
      const nextFtId = generateNextId('FT', [
        ...currentFootageIds,
        ...createdFootage.map((c) => c.id),
      ]);
      const mergedTags = normalizeFootageTags([...sourcePayload.tags, ...clip.tags]);
      const ftItem: Footage = {
        id: nextFtId,
        title: clip.title.trim(),
        ingestionFlow: 'SPLIT_1_TO_N',
        sourceId: nextSourceId,
        originalUrl: sourcePayload.originalUrl.trim(),
        timestampRange: clip.timestampRange.trim() || '00:00 - 00:35',
        durationSec: 35,
        tags: mergedTags,
        driveFileUrl: clip.driveFileUrl?.trim() || '',
        standardFileName: generateStandardFileName(nextFtId, clip.title),
        mascotNotes: clip.mascotNotes.trim(),
        createdAt: getReferenceTodayDate(),
      };
      createdFootage.push(ftItem);
    }

    const newSource: RawSource = {
      id: nextSourceId,
      title: sourcePayload.title.trim(),
      originalUrl: sourcePayload.originalUrl.trim(),
      platform: sourcePayload.platform,
      channelOrCreator: sourcePayload.channelOrCreator.trim() || 'ไม่ระบุช่องต้นทาง',
      totalDuration: sourcePayload.totalDuration?.trim() || '01:00:00',
      tags: sourcePayload.tags,
      notes: sourcePayload.notes.trim(),
      createdAt: getReferenceTodayDate(),
      splitFootageIds: createdFootage.map((f) => f.id),
    };

    setSources((prev) => [newSource, ...prev]);
    firestoreService
      .saveSource(newSource)
      .catch((err) => console.warn('Firestore saveSource error:', err));

    if (createdFootage.length > 0) {
      setFootage((prev) => [...createdFootage, ...prev]);
      firestoreService
        .batchSaveFootages(createdFootage)
        .catch((err) => console.warn('Firestore split footage batch save error:', err));
    }

    return { source: newSource, createdFootage };
  };

  // Flow B Continuation
  const appendSplitFootageToSource = (sourceId: string, clips: SplitClipDraft[]): Footage[] => {
    const targetSource = sources.find((s) => s.id === sourceId);
    if (!targetSource) return [];

    const currentFootageIds = footage.map((f) => f.id);
    const createdFootage: Footage[] = [];

    for (const clip of clips) {
      if (!clip.title.trim()) continue;
      const nextFtId = generateNextId('FT', [
        ...currentFootageIds,
        ...createdFootage.map((c) => c.id),
      ]);
      const mergedTags = normalizeFootageTags([...targetSource.tags, ...clip.tags]);
      const ftItem: Footage = {
        id: nextFtId,
        title: clip.title.trim(),
        ingestionFlow: 'SPLIT_1_TO_N',
        sourceId: targetSource.id,
        originalUrl: targetSource.originalUrl,
        timestampRange: clip.timestampRange.trim() || '00:00 - 00:35',
        durationSec: 35,
        tags: mergedTags,
        driveFileUrl: clip.driveFileUrl?.trim() || '',
        standardFileName: generateStandardFileName(nextFtId, clip.title),
        mascotNotes: clip.mascotNotes.trim(),
        createdAt: getReferenceTodayDate(),
      };
      createdFootage.push(ftItem);
    }

    if (createdFootage.length > 0) {
      setFootage((prev) => [...createdFootage, ...prev]);
      firestoreService
        .batchSaveFootages(createdFootage)
        .catch((err) => console.warn('Firestore append footage batch save error:', err));

      const updatedSource: RawSource = {
        ...targetSource,
        splitFootageIds: [...targetSource.splitFootageIds, ...createdFootage.map((c) => c.id)],
      };

      setSources((prev) => prev.map((src) => (src.id === sourceId ? updatedSource : src)));
      firestoreService
        .saveSource(updatedSource)
        .catch((err) => console.warn('Firestore update source splitFootageIds error:', err));
    }

    return createdFootage;
  };

  const updateFootage = (id: string, updates: Partial<Footage>) => {
    setFootage((prev) =>
      prev.map((ft) => {
        if (ft.id !== id) return ft;
        const nextTitle = updates.title !== undefined ? updates.title : ft.title;
        const nextTags =
          updates.tags !== undefined ? normalizeFootageTags(updates.tags) : ft.tags;
        const updatedFt = {
          ...ft,
          ...updates,
          tags: nextTags,
          standardFileName: generateStandardFileName(ft.id, nextTitle),
        };
        firestoreService
          .saveFootage(updatedFt)
          .catch((err) => console.warn('Firestore updateFootage error:', err));
        return updatedFt;
      })
    );
  };

  const deleteFootage = (id: string) => {
    setFootage((prev) => prev.filter((ft) => ft.id !== id));
    firestoreService
      .deleteFootage(id)
      .catch((err) => console.warn('Firestore deleteFootage error:', err));

    setSources((prev) =>
      prev.map((src) => {
        if (!src.splitFootageIds.includes(id)) return src;
        const updatedSrc: RawSource = {
          ...src,
          splitFootageIds: src.splitFootageIds.filter((fid) => fid !== id),
        };
        firestoreService
          .saveSource(updatedSrc)
          .catch((err) => console.warn('Firestore update source on deleteFootage error:', err));
        return updatedSrc;
      })
    );
  };

  // Flow C: Batch Direct Footage Ingestion (300–2,000+ items from Google Drive / Batch Paste)
  const batchAddDirectFootage = (
    items: Array<{
      title: string;
      driveFileUrl?: string;
      originalUrl?: string;
      mascotNotes?: string;
      tags?: string[];
      durationSec?: number;
    }>,
    idPrefix: 'CLP' | 'FT' = 'CLP'
  ): Footage[] => {
    if (!items || items.length === 0) return [];
    const currentFootageIds = footage.map((f) => f.id);
    const newItems: Footage[] = [];
    const accumulatedIds = [...currentFootageIds];

    for (const item of items) {
      const cleanedTitle = cleanFootageTitle(item.title);
      if (!cleanedTitle) continue;
      const nextId = generateNextId(idPrefix, accumulatedIds);
      accumulatedIds.push(nextId);
      const standardFileName = generateStandardFileName(nextId, cleanedTitle);
      const newFootage: Footage = {
        id: nextId,
        title: cleanedTitle,
        ingestionFlow: 'DIRECT_1_TO_1',
        sourceId: null,
        originalUrl: (item.originalUrl || item.driveFileUrl || '').trim(),
        timestampRange: null,
        durationSec: item.durationSec || 25,
        tags: normalizeFootageTags(
          item.tags && item.tags.length > 0 ? item.tags : [STAGING_TAG_ID]
        ),
        driveFileUrl: (item.driveFileUrl || '').trim(),
        standardFileName,
        mascotNotes: (item.mascotNotes || '').trim(),
        createdAt: getReferenceTodayDate(),
      };
      newItems.push(newFootage);
    }

    if (newItems.length > 0) {
      setFootage((prev) => [...newItems, ...prev]);
      // Chunked WriteBatch (400 items per Firestore batch) prevents rate-limiting & 500-op crash
      firestoreService
        .batchSaveFootages(newItems)
        .catch((err) => console.warn('Firestore batchSaveFootages error:', err));
    }

    return newItems;
  };

  // Batch Categorization: Assign or append tags to multiple footages at once
  const batchUpdateFootageTags = (
    footageIds: string[],
    newTags: string[],
    mode: 'REPLACE' | 'APPEND' = 'REPLACE'
  ) => {
    if (!footageIds.length) return;
    const targetSet = new Set(footageIds);
    const updatedFootages: Footage[] = [];

    setFootage((prev) =>
      prev.map((ft) => {
        if (!targetSet.has(ft.id)) return ft;
        let mergedTags: string[];
        if (mode === 'REPLACE') {
          mergedTags = normalizeFootageTags(newTags);
        } else {
          // APPEND: merge new tags, remove STAGING_TAG_ID if real categories are present
          const existingReal = ft.tags.filter((t) => !isStagingTagId(t));
          mergedTags = normalizeFootageTags([...existingReal, ...newTags]);
        }
        const updatedFt: Footage = {
          ...ft,
          tags: mergedTags,
        };
        updatedFootages.push(updatedFt);
        return updatedFt;
      })
    );

    if (updatedFootages.length > 0) {
      firestoreService
        .batchSaveFootages(updatedFootages)
        .catch((err) => console.warn('Firestore batch update tags error:', err));
    }
  };

  // Batch Delete: Remove multiple footages at once
  const batchDeleteFootage = (footageIds: string[]) => {
    if (!footageIds.length) return;
    const targetSet = new Set(footageIds);
    setFootage((prev) => prev.filter((ft) => !targetSet.has(ft.id)));

    const modifiedSources: RawSource[] = [];
    setSources((prev) =>
      prev.map((src) => {
        const hasDeletedChild = src.splitFootageIds.some((fid) => targetSet.has(fid));
        if (!hasDeletedChild) return src;
        const updatedSrc: RawSource = {
          ...src,
          splitFootageIds: src.splitFootageIds.filter((fid) => !targetSet.has(fid)),
        };
        modifiedSources.push(updatedSrc);
        return updatedSrc;
      })
    );

    firestoreService
      .batchDeleteFootages(footageIds)
      .catch((err) => console.warn('Firestore batch delete error:', err));

    if (modifiedSources.length > 0) {
      firestoreService
        .batchSaveSources(modifiedSources)
        .catch((err) => console.warn('Firestore batch update sources on delete error:', err));
    }
  };

  // Batch Create Multiple 1:N Sources + Split Footages at once (for Google Drive 1:N Importer)
  const batchCreateSourcesWithSplitFootage = (
    groups: Array<{
      sourcePayload: {
        title: string;
        originalUrl: string;
        platform: SourcePlatform;
        channelOrCreator: string;
        totalDuration?: string;
        tags: string[];
        notes: string;
      };
      clips: SplitClipDraft[];
    }>
  ): { createdSources: RawSource[]; createdFootage: Footage[] } => {
    if (!groups || groups.length === 0) {
      return { createdSources: [], createdFootage: [] };
    }

    const accumulatedSourceIds = sources.map((s) => s.id);
    const accumulatedFootageIds = footage.map((f) => f.id);
    const allNewSources: RawSource[] = [];
    const allNewFootage: Footage[] = [];

    for (const grp of groups) {
      const { sourcePayload, clips } = grp;
      const nextSourceId = generateNextId('SRC', accumulatedSourceIds);
      accumulatedSourceIds.push(nextSourceId);

      const groupFootage: Footage[] = [];
      for (const clip of clips) {
        if (!clip.title.trim()) continue;
        const nextFtId = generateNextId('FT', accumulatedFootageIds);
        accumulatedFootageIds.push(nextFtId);

        const mergedTags = normalizeFootageTags([...sourcePayload.tags, ...clip.tags]);
        const ftItem: Footage = {
          id: nextFtId,
          title: clip.title.trim(),
          ingestionFlow: 'SPLIT_1_TO_N',
          sourceId: nextSourceId,
          originalUrl: sourcePayload.originalUrl.trim(),
          timestampRange: clip.timestampRange.trim() || '00:00 - 00:35',
          durationSec: 35,
          tags: mergedTags,
          driveFileUrl: clip.driveFileUrl?.trim() || '',
          standardFileName: generateStandardFileName(nextFtId, clip.title),
          mascotNotes: clip.mascotNotes.trim(),
          createdAt: getReferenceTodayDate(),
        };
        groupFootage.push(ftItem);
        allNewFootage.push(ftItem);
      }

      const newSource: RawSource = {
        id: nextSourceId,
        title: sourcePayload.title.trim(),
        originalUrl: sourcePayload.originalUrl.trim(),
        platform: sourcePayload.platform,
        channelOrCreator: sourcePayload.channelOrCreator.trim() || 'ไม่ระบุช่องต้นทาง',
        totalDuration: sourcePayload.totalDuration?.trim() || '01:00:00',
        tags: sourcePayload.tags,
        notes: sourcePayload.notes.trim(),
        createdAt: getReferenceTodayDate(),
        splitFootageIds: groupFootage.map((f) => f.id),
      };
      allNewSources.push(newSource);
    }

    if (allNewSources.length > 0) {
      setSources((prev) => [...allNewSources, ...prev]);
      firestoreService
        .batchSaveSources(allNewSources)
        .catch((err) => console.warn('Firestore batch 1:N sources save error:', err));
    }
    if (allNewFootage.length > 0) {
      setFootage((prev) => [...allNewFootage, ...prev]);
      firestoreService
        .batchSaveFootages(allNewFootage)
        .catch((err) => console.warn('Firestore batch 1:N footage save error:', err));
    }

    return { createdSources: allNewSources, createdFootage: allNewFootage };
  };

  // Quick-Sort Assign Category (REPLACE mode + Auto-exit Staging + Snapshot for 1-Click Undo)
  const quickAssignCategoryToFootage = (footageIds: string[], targetTagId: string) => {
    if (!footageIds.length) return;
    const targetTag = tagMap[targetTagId];
    if (!targetTag || isStagingTagId(targetTagId)) return;

    // Resolve 3-Tier hierarchy: if targetTag is a Tier 2 subcategory, include its Tier 1 parentTag automatically
    const assignedTags = targetTag.parentId
      ? normalizeFootageTags([targetTag.parentId, targetTag.id])
      : normalizeFootageTags([targetTag.id]);

    const targetSet = new Set(footageIds);
    const previousTagsByFootageId: Record<string, string[]> = {};
    const updatedFootages: Footage[] = [];

    footage.forEach((ft) => {
      if (targetSet.has(ft.id)) {
        previousTagsByFootageId[ft.id] = [...ft.tags];
      }
    });

    const movedCount = Object.keys(previousTagsByFootageId).length;
    if (movedCount === 0) return;

    setFootage((prev) =>
      prev.map((ft) => {
        if (!targetSet.has(ft.id)) return ft;
        const updatedFt: Footage = {
          ...ft,
          tags: assignedTags,
        };
        updatedFootages.push(updatedFt);
        return updatedFt;
      })
    );

    if (updatedFootages.length > 0) {
      firestoreService
        .batchSaveFootages(updatedFootages)
        .catch((err) => console.warn('Firestore quickAssignCategoryToFootage error:', err));
    }

    // Automatically clear moved items from selection and drag state
    setSelectedFootageIdsForBatch((prev) => prev.filter((id) => !targetSet.has(id)));
    setActiveDragFootageIds([]);

    const parentTag = targetTag.parentId ? tagMap[targetTag.parentId] : null;
    const displayTagName = parentTag
      ? `#${parentTag.name} ➔ ${targetTag.name}`
      : `#${targetTag.name}`;

    setLastQuickSortUndoRecord({
      id: `UNDO-${Date.now()}`,
      targetTagId,
      targetTagName: displayTagName,
      movedCount,
      previousTagsByFootageId,
      timestamp: Date.now(),
    });
  };

  // Undo the last Quick-Sort / Drag-and-Drop category assignment
  const undoLastQuickSort = () => {
    if (!lastQuickSortUndoRecord) return;
    const { previousTagsByFootageId } = lastQuickSortUndoRecord;
    const targetIds = Object.keys(previousTagsByFootageId);
    if (targetIds.length === 0) {
      setLastQuickSortUndoRecord(null);
      return;
    }

    const restoredFootages: Footage[] = [];
    setFootage((prev) =>
      prev.map((ft) => {
        const prevTags = previousTagsByFootageId[ft.id];
        if (!prevTags) return ft;
        const restoredFt: Footage = {
          ...ft,
          tags: normalizeFootageTags(prevTags),
        };
        restoredFootages.push(restoredFt);
        return restoredFt;
      })
    );

    if (restoredFootages.length > 0) {
      firestoreService
        .batchSaveFootages(restoredFootages)
        .catch((err) => console.warn('Firestore undoLastQuickSort error:', err));
    }

    // Re-select the restored clips so the user can immediately assign them elsewhere if desired
    setSelectedFootageIdsForBatch(targetIds);
    setLastQuickSortUndoRecord(null);
  };

  const dismissQuickSortUndoRecord = () => {
    setLastQuickSortUndoRecord(null);
  };

  return {
    addDirectFootage,
    createSourceWithSplitFootage,
    appendSplitFootageToSource,
    batchCreateSourcesWithSplitFootage,
    updateFootage,
    deleteFootage,
    batchAddDirectFootage,
    batchUpdateFootageTags,
    batchDeleteFootage,
    lastQuickSortUndoRecord,
    quickAssignCategoryToFootage,
    undoLastQuickSort,
    dismissQuickSortUndoRecord,
  };
}
