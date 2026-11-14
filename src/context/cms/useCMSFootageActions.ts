import React, { useEffect, useRef, useState } from 'react';
import { BatchChunkProgress, firestoreService } from '../../firebase/firestoreService';
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

  // Keep synchronous refs so multi-step async workflows (e.g. Sheet Sync creating missing footages then updating tags)
  // always read the latest list without waiting for a React re-render.
  const footageRef = useRef<Footage[]>(footage);
  useEffect(() => {
    footageRef.current = footage;
  }, [footage]);

  const sourcesRef = useRef<RawSource[]>(sources);
  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);

  // Flow A: 1-to-1 Direct Footage
  const addDirectFootage = (payload: {
    title: string;
    originalUrl: string;
    tags: string[];
    driveFileUrl: string;
    thumbnailUrl?: string;
    mascotNotes: string;
    durationSec?: number;
  }): Footage => {
    const nextId = generateNextId('FT', footageRef.current.map((f) => f.id));
    const cleanedTitle = cleanFootageTitle(payload.title);
    const standardFileName = generateStandardFileName(nextId, cleanedTitle);
    const newFootage: Footage = {
      id: nextId,
      title: cleanedTitle,
      ingestionFlow: 'DIRECT_1_TO_1',
      sourceId: null,
      originalUrl: payload.originalUrl.trim(),
      timestampRange: null,
      durationSec: payload.durationSec || 25,
      tags: normalizeFootageTags(payload.tags),
      driveFileUrl: payload.driveFileUrl.trim(),
      ...(payload.thumbnailUrl ? { thumbnailUrl: payload.thumbnailUrl.trim() } : {}),
      standardFileName,
      mascotNotes: payload.mascotNotes.trim(),
      createdAt: getReferenceTodayDate(),
    };
    const nextFootageList = [newFootage, ...footageRef.current];
    footageRef.current = nextFootageList;
    setFootage(nextFootageList);
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
      driveFolderUrl?: string;
      notes: string;
    },
    clips: SplitClipDraft[]
  ) => {
    const nextSourceId = generateNextId('SRC', sourcesRef.current.map((s) => s.id));
    const currentFootageIds = footageRef.current.map((f) => f.id);
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
      driveFolderUrl: sourcePayload.driveFolderUrl?.trim() || '',
      notes: sourcePayload.notes.trim(),
      createdAt: getReferenceTodayDate(),
      splitFootageIds: createdFootage.map((f) => f.id),
    };

    const nextSources = [newSource, ...sourcesRef.current];
    sourcesRef.current = nextSources;
    setSources(nextSources);
    firestoreService
      .saveSource(newSource)
      .catch((err) => console.warn('Firestore saveSource error:', err));

    if (createdFootage.length > 0) {
      const nextFootageList = [...createdFootage, ...footageRef.current];
      footageRef.current = nextFootageList;
      setFootage(nextFootageList);
      firestoreService
        .batchSaveFootages(createdFootage)
        .catch((err) => console.warn('Firestore split footage batch save error:', err));
    }

    return { source: newSource, createdFootage };
  };

  // Flow B Continuation
  const appendSplitFootageToSource = (sourceId: string, clips: SplitClipDraft[]): Footage[] => {
    const targetSource = sourcesRef.current.find((s) => s.id === sourceId);
    if (!targetSource) return [];

    const currentFootageIds = footageRef.current.map((f) => f.id);
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
      const nextFootageList = [...createdFootage, ...footageRef.current];
      footageRef.current = nextFootageList;
      setFootage(nextFootageList);
      firestoreService
        .batchSaveFootages(createdFootage)
        .catch((err) => console.warn('Firestore append footage batch save error:', err));

      const updatedSource: RawSource = {
        ...targetSource,
        splitFootageIds: [...targetSource.splitFootageIds, ...createdFootage.map((c) => c.id)],
      };

      const nextSources = sourcesRef.current.map((src) =>
        src.id === sourceId ? updatedSource : src
      );
      sourcesRef.current = nextSources;
      setSources(nextSources);
      firestoreService
        .saveSource(updatedSource)
        .catch((err) => console.warn('Firestore update source splitFootageIds error:', err));
    }

    return createdFootage;
  };

  const updateFootage = (id: string, updates: Partial<Footage>) => {
    const target = footageRef.current.find((ft) => ft.id === id);
    if (!target) return;

    const nextTitle = updates.title !== undefined ? updates.title : target.title;
    const nextTags =
      updates.tags !== undefined ? normalizeFootageTags(updates.tags) : target.tags;
    const updatedFt: Footage = {
      ...target,
      ...updates,
      tags: nextTags,
      standardFileName: generateStandardFileName(target.id, nextTitle),
    };

    const nextFootageList = footageRef.current.map((ft) => (ft.id === id ? updatedFt : ft));
    footageRef.current = nextFootageList;
    setFootage(nextFootageList);
    firestoreService
      .saveFootage(updatedFt)
      .catch((err) => console.warn('Firestore updateFootage error:', err));
  };

  const deleteFootage = (id: string) => {
    const nextFootageList = footageRef.current.filter((ft) => ft.id !== id);
    footageRef.current = nextFootageList;
    setFootage(nextFootageList);
    firestoreService
      .deleteFootage(id)
      .catch((err) => console.warn('Firestore deleteFootage error:', err));

    const affectedSources = sourcesRef.current.filter((src) =>
      src.splitFootageIds.includes(id)
    );
    if (affectedSources.length > 0) {
      const updatedSources = affectedSources.map((src) => ({
        ...src,
        splitFootageIds: src.splitFootageIds.filter((fid) => fid !== id),
      }));
      const nextSources = sourcesRef.current.map((src) => {
        const found = updatedSources.find((u) => u.id === src.id);
        return found || src;
      });
      sourcesRef.current = nextSources;
      setSources(nextSources);
      firestoreService
        .batchSaveSources(updatedSources)
        .catch((err) => console.warn('Firestore update source on deleteFootage error:', err));
    }
  };

  // Flow C: Batch Direct Footage Ingestion (300–5,000+ items from Google Drive / Sheet / Batch Paste)
  // Awaits all 400-item Firestore chunks before resolving so 100% of items commit to Cloud.
  const batchAddDirectFootage = async (
    items: Array<{
      title: string;
      driveFileUrl?: string;
      originalUrl?: string;
      thumbnailUrl?: string;
      mascotNotes?: string;
      tags?: string[];
      durationSec?: number;
    }>,
    idPrefix: 'CLP' | 'FT' = 'CLP',
    onChunkProgress?: (progress: BatchChunkProgress) => void
  ): Promise<Footage[]> => {
    if (!items || items.length === 0) return [];
    const currentFootageIds = footageRef.current.map((f) => f.id);
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
        ...(item.thumbnailUrl ? { thumbnailUrl: item.thumbnailUrl.trim() } : {}),
        standardFileName,
        mascotNotes: (item.mascotNotes || '').trim(),
        createdAt: getReferenceTodayDate(),
      };
      newItems.push(newFootage);
    }

    if (newItems.length > 0) {
      const nextFootageList = [...newItems, ...footageRef.current];
      footageRef.current = nextFootageList;
      setFootage(nextFootageList);

      try {
        await firestoreService.batchSaveFootages(newItems, onChunkProgress);
      } catch (err) {
        console.warn('Firestore batchSaveFootages error:', err);
      }
    }

    return newItems;
  };

  // Batch Categorization: Assign or append tags to multiple footages at once
  const batchUpdateFootageTags = async (
    footageIds: string[],
    newTags: string[],
    mode: 'REPLACE' | 'APPEND' = 'REPLACE',
    onChunkProgress?: (progress: BatchChunkProgress) => void
  ): Promise<void> => {
    if (!footageIds.length) return;
    const targetSet = new Set(footageIds);
    const updatedFootages: Footage[] = [];

    const nextList = footageRef.current.map((ft) => {
      if (!targetSet.has(ft.id)) return ft;
      let mergedTags: string[];
      if (mode === 'REPLACE') {
        mergedTags = normalizeFootageTags(newTags);
      } else {
        const existingReal = ft.tags.filter((t) => !isStagingTagId(t));
        mergedTags = normalizeFootageTags([...existingReal, ...newTags]);
      }
      const updatedFt: Footage = {
        ...ft,
        tags: mergedTags,
      };
      updatedFootages.push(updatedFt);
      return updatedFt;
    });

    footageRef.current = nextList;
    setFootage(nextList);

    if (updatedFootages.length > 0) {
      try {
        await firestoreService.batchSaveFootages(updatedFootages, onChunkProgress);
      } catch (err) {
        console.warn('Firestore batch update tags error:', err);
      }
    }
  };

  // Batch Delete: Remove multiple footages at once and await all chunks
  const batchDeleteFootage = async (
    footageIds: string[],
    onChunkProgress?: (progress: BatchChunkProgress) => void
  ): Promise<void> => {
    if (!footageIds.length) return;
    const targetSet = new Set(footageIds);
    const nextFootageList = footageRef.current.filter((ft) => !targetSet.has(ft.id));
    footageRef.current = nextFootageList;
    setFootage(nextFootageList);

    const modifiedSources: RawSource[] = [];
    const nextSources = sourcesRef.current.map((src) => {
      const hasDeletedChild = src.splitFootageIds.some((fid) => targetSet.has(fid));
      if (!hasDeletedChild) return src;
      const updatedSrc: RawSource = {
        ...src,
        splitFootageIds: src.splitFootageIds.filter((fid) => !targetSet.has(fid)),
      };
      modifiedSources.push(updatedSrc);
      return updatedSrc;
    });

    sourcesRef.current = nextSources;
    setSources(nextSources);

    try {
      await firestoreService.withBatchWriteLock(async () => {
        await firestoreService.batchDeleteFootages(footageIds, onChunkProgress);
        if (modifiedSources.length > 0) {
          await firestoreService.batchSaveSources(modifiedSources);
        }
      });
    } catch (err) {
      console.warn('Firestore batch delete error:', err);
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
        driveFolderUrl?: string;
        notes: string;
      };
      clips: SplitClipDraft[];
    }>
  ): { createdSources: RawSource[]; createdFootage: Footage[] } => {
    if (!groups || groups.length === 0) {
      return { createdSources: [], createdFootage: [] };
    }

    const accumulatedSourceIds = sourcesRef.current.map((s) => s.id);
    const accumulatedFootageIds = footageRef.current.map((f) => f.id);
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
        driveFolderUrl: sourcePayload.driveFolderUrl?.trim() || '',
        notes: sourcePayload.notes.trim(),
        createdAt: getReferenceTodayDate(),
        splitFootageIds: groupFootage.map((f) => f.id),
      };
      allNewSources.push(newSource);
    }

    if (allNewSources.length > 0) {
      const nextSources = [...allNewSources, ...sourcesRef.current];
      sourcesRef.current = nextSources;
      setSources(nextSources);
      firestoreService
        .batchSaveSources(allNewSources)
        .catch((err) => console.warn('Firestore batch 1:N sources save error:', err));
    }
    if (allNewFootage.length > 0) {
      const nextFootageList = [...allNewFootage, ...footageRef.current];
      footageRef.current = nextFootageList;
      setFootage(nextFootageList);
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

    const assignedTags = targetTag.parentId
      ? normalizeFootageTags([targetTag.parentId, targetTag.id])
      : normalizeFootageTags([targetTag.id]);

    const targetSet = new Set(footageIds);
    const previousTagsByFootageId: Record<string, string[]> = {};
    const updatedFootages: Footage[] = [];

    footageRef.current.forEach((ft) => {
      if (targetSet.has(ft.id)) {
        previousTagsByFootageId[ft.id] = [...ft.tags];
      }
    });

    const movedCount = Object.keys(previousTagsByFootageId).length;
    if (movedCount === 0) return;

    const nextList = footageRef.current.map((ft) => {
      if (!targetSet.has(ft.id)) return ft;
      const updatedFt: Footage = {
        ...ft,
        tags: assignedTags,
      };
      updatedFootages.push(updatedFt);
      return updatedFt;
    });

    footageRef.current = nextList;
    setFootage(nextList);

    if (updatedFootages.length > 0) {
      firestoreService
        .batchSaveFootages(updatedFootages)
        .catch((err) => console.warn('Firestore quickAssignCategoryToFootage error:', err));
    }

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
    const nextList = footageRef.current.map((ft) => {
      const prevTags = previousTagsByFootageId[ft.id];
      if (!prevTags) return ft;
      const restoredFt: Footage = {
        ...ft,
        tags: normalizeFootageTags(prevTags),
      };
      restoredFootages.push(restoredFt);
      return restoredFt;
    });

    footageRef.current = nextList;
    setFootage(nextList);

    if (restoredFootages.length > 0) {
      firestoreService
        .batchSaveFootages(restoredFootages)
        .catch((err) => console.warn('Firestore undoLastQuickSort error:', err));
    }

    setSelectedFootageIdsForBatch(targetIds);
    setLastQuickSortUndoRecord(null);
  };

  const dismissQuickSortUndoRecord = () => {
    setLastQuickSortUndoRecord(null);
  };

  // Batch Sync Individual Footage Tags & Mascot Notes Map in a single atomic state + Firestore batch
  const batchSyncFootageTagsByMap = async (
    tagsByFootageId: Record<string, string[]>,
    mode: 'REPLACE' | 'APPEND' = 'APPEND',
    onChunkProgress?: (progress: BatchChunkProgress) => void,
    mascotNotesByFootageId?: Record<string, string>
  ): Promise<void> => {
    const targetIds = new Set([
      ...Object.keys(tagsByFootageId),
      ...Object.keys(mascotNotesByFootageId || {}),
    ]);
    if (targetIds.size === 0) return;

    const updatedFootages: Footage[] = [];
    const nextList = footageRef.current.map((ft) => {
      if (!targetIds.has(ft.id)) return ft;

      const incomingTags = tagsByFootageId[ft.id];
      let mergedTags = ft.tags;
      if (incomingTags) {
        if (mode === 'REPLACE') {
          mergedTags = normalizeFootageTags(incomingTags);
        } else {
          const existingReal = ft.tags.filter((t) => !isStagingTagId(t));
          mergedTags = normalizeFootageTags([...existingReal, ...incomingTags]);
        }
      }

      const incomingNote = mascotNotesByFootageId?.[ft.id];
      const nextMascotNotes =
        incomingNote !== undefined && incomingNote.trim().length > 0
          ? incomingNote.trim()
          : ft.mascotNotes;

      const updatedFt: Footage = {
        ...ft,
        tags: mergedTags,
        mascotNotes: nextMascotNotes,
      };
      updatedFootages.push(updatedFt);
      return updatedFt;
    });

    footageRef.current = nextList;
    setFootage(nextList);

    if (updatedFootages.length > 0) {
      try {
        await firestoreService.batchSaveFootages(updatedFootages, onChunkProgress);
      } catch (err) {
        console.warn('Firestore batchSyncFootageTagsByMap error:', err);
      }
    }
  };

  // Batch Sync Footage createdAt dates (e.g. when aligning with real historical Episode publishDate)
  const batchSyncFootageCreatedAtByMap = async (
    createdAtByFootageId: Record<string, string>,
    onChunkProgress?: (progress: BatchChunkProgress) => void
  ): Promise<number> => {
    const targetIds = Object.keys(createdAtByFootageId);
    if (targetIds.length === 0) return 0;

    const updatedFootages: Footage[] = [];
    const nextList = footageRef.current.map((ft) => {
      const targetDate = createdAtByFootageId[ft.id];
      if (!targetDate || ft.createdAt === targetDate) return ft;

      const updatedFt: Footage = {
        ...ft,
        createdAt: targetDate,
      };
      updatedFootages.push(updatedFt);
      return updatedFt;
    });

    if (updatedFootages.length === 0) return 0;

    footageRef.current = nextList;
    setFootage(nextList);

    try {
      await firestoreService.batchSaveFootages(updatedFootages, onChunkProgress);
    } catch (err) {
      console.warn('Firestore batchSyncFootageCreatedAtByMap error:', err);
    }

    return updatedFootages.length;
  };

  // Batch Clean Leading Rank Prefixes (e.g. "1. ", "2. ", "1) ") from existing vault footages
  const batchCleanExistingFootageTitles = async (
    onChunkProgress?: (progress: BatchChunkProgress) => void
  ): Promise<number> => {
    const updatedFootages: Footage[] = [];
    const nextList = footageRef.current.map((ft) => {
      const cleaned = cleanFootageTitle(ft.title);
      if (!cleaned || cleaned === ft.title.trim()) return ft;
      const updatedFt: Footage = {
        ...ft,
        title: cleaned,
        standardFileName: generateStandardFileName(ft.id, cleaned),
      };
      updatedFootages.push(updatedFt);
      return updatedFt;
    });

    if (updatedFootages.length === 0) return 0;

    footageRef.current = nextList;
    setFootage(nextList);

    try {
      await firestoreService.batchSaveFootages(updatedFootages, onChunkProgress);
    } catch (err) {
      console.warn('Firestore batchCleanExistingFootageTitles error:', err);
    }

    return updatedFootages.length;
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
    batchSyncFootageTagsByMap,
    batchSyncFootageCreatedAtByMap,
    batchCleanExistingFootageTitles,
    batchDeleteFootage,
    lastQuickSortUndoRecord,
    quickAssignCategoryToFootage,
    undoLastQuickSort,
    dismissQuickSortUndoRecord,
  };
}
