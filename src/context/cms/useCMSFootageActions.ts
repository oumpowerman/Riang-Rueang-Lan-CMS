import React from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { normalizeFootageTags } from '../../services/seedData';
import { Footage } from '../../types/footage.types';
import { RawSource, SourcePlatform } from '../../types/source.types';
import { getReferenceTodayDate } from '../../utils/cooldownCalculator';
import { generateNextId, generateStandardFileName } from '../../utils/fileNameGenerator';
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

  return {
    addDirectFootage,
    createSourceWithSplitFootage,
    appendSplitFootageToSource,
    updateFootage,
    deleteFootage,
  };
}
