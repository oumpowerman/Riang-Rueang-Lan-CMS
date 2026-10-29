import React from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { isStagingTagId, normalizeFootageTags, STAGING_TAG_ID } from '../../services/seedData';
import { Footage } from '../../types/footage.types';
import { RawSource, SourcePlatform } from '../../types/source.types';
import { getReferenceTodayDate } from '../../utils/cooldownCalculator';
import {
  cleanFootageTitle,
  generateNextId,
  generateStandardFileName,
} from '../../utils/fileNameGenerator';
import { SplitClipDraft } from './cms.types';

interface UseCMSFootageActionsParams {
  footage: Footage[];
  setFootage: React.Dispatch<React.SetStateAction<Footage[]>>;
  sources: RawSource[];
  setSources: React.Dispatch<React.SetStateAction<RawSource[]>>;
}

export function useCMSFootageActions({
  footage,
  setFootage,
  sources,
  setSources,
}: UseCMSFootageActionsParams) {
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
    firestoreService.saveFootage(newFootage).catch((err) => console.warn('Firestore addDirectFootage error:', err));
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
      firestoreService.saveFootage(ftItem).catch((err) => console.warn('Firestore split footage error:', err));
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
    if (createdFootage.length > 0) {
      setFootage((prev) => [...createdFootage, ...prev]);
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
      firestoreService.saveFootage(ftItem).catch((err) => console.warn('Firestore append footage error:', err));
    }

    if (createdFootage.length > 0) {
      setFootage((prev) => [...createdFootage, ...prev]);
      setSources((prev) =>
        prev.map((src) =>
          src.id === sourceId
            ? {
                ...src,
                splitFootageIds: [...src.splitFootageIds, ...createdFootage.map((c) => c.id)],
              }
            : src
        )
      );
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
        firestoreService.saveFootage(updatedFt).catch((err) => console.warn('Firestore updateFootage error:', err));
        return updatedFt;
      })
    );
  };

  const deleteFootage = (id: string) => {
    setFootage((prev) => prev.filter((ft) => ft.id !== id));
    firestoreService.deleteFootage(id).catch((err) => console.warn('Firestore deleteFootage error:', err));
    setSources((prev) =>
      prev.map((src) => ({
        ...src,
        splitFootageIds: src.splitFootageIds.filter((fid) => fid !== id),
      }))
    );
  };

  // Flow C: Batch Direct Footage Ingestion (300+ items from Google Drive / Batch Paste)
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
        tags: normalizeFootageTags(item.tags && item.tags.length > 0 ? item.tags : [STAGING_TAG_ID]),
        driveFileUrl: (item.driveFileUrl || '').trim(),
        standardFileName,
        mascotNotes: (item.mascotNotes || '').trim(),
        createdAt: getReferenceTodayDate(),
      };
      newItems.push(newFootage);
    }

    if (newItems.length > 0) {
      setFootage((prev) => [...newItems, ...prev]);
      // Batch save to Firestore in chunks of 20
      const chunkSize = 20;
      for (let i = 0; i < newItems.length; i += chunkSize) {
        const chunk = newItems.slice(i, i + chunkSize);
        Promise.all(chunk.map((ft) => firestoreService.saveFootage(ft))).catch((err) =>
          console.warn('Firestore batch save error:', err)
        );
      }
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
        firestoreService.saveFootage(updatedFt).catch((err) =>
          console.warn('Firestore batch update tags error:', err)
        );
        return updatedFt;
      })
    );
  };

  // Batch Delete: Remove multiple footages at once
  const batchDeleteFootage = (footageIds: string[]) => {
    if (!footageIds.length) return;
    const targetSet = new Set(footageIds);
    setFootage((prev) => prev.filter((ft) => !targetSet.has(ft.id)));
    setSources((prev) =>
      prev.map((src) => ({
        ...src,
        splitFootageIds: src.splitFootageIds.filter((fid) => !targetSet.has(fid)),
      }))
    );
    footageIds.forEach((id) => {
      firestoreService.deleteFootage(id).catch((err) =>
        console.warn('Firestore batch delete error:', err)
      );
    });
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
    }
    if (allNewFootage.length > 0) {
      setFootage((prev) => [...allNewFootage, ...prev]);
      const chunkSize = 20;
      for (let i = 0; i < allNewFootage.length; i += chunkSize) {
        const chunk = allNewFootage.slice(i, i + chunkSize);
        Promise.all(chunk.map((ft) => firestoreService.saveFootage(ft))).catch((err) =>
          console.warn('Firestore batch 1:N footage save error:', err)
        );
      }
    }

    return { createdSources: allNewSources, createdFootage: allNewFootage };
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
  };
}
