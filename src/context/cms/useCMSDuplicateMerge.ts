import React, { useEffect, useRef } from 'react';
import { BatchChunkProgress, firestoreService } from '../../firebase/firestoreService';
import { Episode } from '../../types/episode.types';
import { Footage } from '../../types/footage.types';
import { RawSource } from '../../types/source.types';
import {
  buildMergedFootageEntity,
  DuplicateMergePlan,
} from '../../utils/duplicateClusterScanner';

export interface MergeDuplicateFootagesResult {
  mergedGroupCount: number;
  deletedFootageCount: number;
  migratedEpisodeCount: number;
  updatedSourceCount: number;
}

interface UseCMSDuplicateMergeParams {
  footage: Footage[];
  setFootage: React.Dispatch<React.SetStateAction<Footage[]>>;
  episodes: Episode[];
  setEpisodes: React.Dispatch<React.SetStateAction<Episode[]>>;
  sources: RawSource[];
  setSources: React.Dispatch<React.SetStateAction<RawSource[]>>;
  setSelectedFootageIdsForBatch: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useCMSDuplicateMerge({
  footage,
  setFootage,
  episodes,
  setEpisodes,
  sources,
  setSources,
  setSelectedFootageIdsForBatch,
}: UseCMSDuplicateMergeParams) {
  const footageRef = useRef<Footage[]>(footage);
  useEffect(() => {
    footageRef.current = footage;
  }, [footage]);

  const episodesRef = useRef<Episode[]>(episodes);
  useEffect(() => {
    episodesRef.current = episodes;
  }, [episodes]);

  const sourcesRef = useRef<RawSource[]>(sources);
  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);

  const mergeDuplicateFootages = async (
    plans: DuplicateMergePlan[],
    onChunkProgress?: (progress: BatchChunkProgress) => void
  ): Promise<MergeDuplicateFootagesResult> => {
    if (!plans || plans.length === 0) {
      return {
        mergedGroupCount: 0,
        deletedFootageCount: 0,
        migratedEpisodeCount: 0,
        updatedSourceCount: 0,
      };
    }

    const footageMap = new Map<string, Footage>();
    footageRef.current.forEach((ft) => footageMap.set(ft.id, ft));

    const redirectMap = new Map<string, string>();
    const mergedSurvivorsById = new Map<string, Footage>();
    const deletedIdsSet = new Set<string>();
    let mergedGroupCount = 0;

    for (const plan of plans) {
      const survivor = mergedSurvivorsById.get(plan.survivorId) || footageMap.get(plan.survivorId);
      if (!survivor) continue;

      const validDuplicates: Footage[] = [];
      for (const dupId of plan.duplicateIds) {
        if (!dupId || dupId === plan.survivorId || deletedIdsSet.has(dupId)) {
          continue;
        }
        const dupFt = footageMap.get(dupId);
        if (dupFt) {
          validDuplicates.push(dupFt);
          deletedIdsSet.add(dupId);
          redirectMap.set(dupId, plan.survivorId);
        }
      }

      if (validDuplicates.length === 0) continue;

      const mergedSurvivor = buildMergedFootageEntity(survivor, validDuplicates);
      mergedSurvivorsById.set(plan.survivorId, mergedSurvivor);
      mergedGroupCount += 1;
    }

    if (mergedGroupCount === 0 || deletedIdsSet.size === 0) {
      return {
        mergedGroupCount: 0,
        deletedFootageCount: 0,
        migratedEpisodeCount: 0,
        updatedSourceCount: 0,
      };
    }

    // Resolve any transitive redirect chains safely
    const resolveSurvivorId = (id: string): string => {
      let current = id;
      const visited = new Set<string>();
      while (redirectMap.has(current) && !visited.has(current)) {
        visited.add(current);
        current = redirectMap.get(current)!;
      }
      return current;
    };

    // 1. Update Footages list in local state
    const updatedFootagesToSave = Array.from(mergedSurvivorsById.values());
    const nextFootageList = footageRef.current
      .filter((ft) => !deletedIdsSet.has(ft.id))
      .map((ft) => mergedSurvivorsById.get(ft.id) || ft);

    footageRef.current = nextFootageList;
    setFootage(nextFootageList);

    // 2. Migrate Episode rankings[].footageId references to Survivor ID
    const updatedEpisodesToSave: Episode[] = [];
    const nextEpisodesList = episodesRef.current.map((ep) => {
      let hasChange = false;
      const nextRankings = ep.rankings.map((slot) => {
        if (!slot.footageId || !redirectMap.has(slot.footageId)) return slot;
        hasChange = true;
        return {
          ...slot,
          footageId: resolveSurvivorId(slot.footageId),
        };
      });

      if (!hasChange) return ep;
      const updatedEp: Episode = {
        ...ep,
        rankings: nextRankings,
      };
      updatedEpisodesToSave.push(updatedEp);
      return updatedEp;
    });

    if (updatedEpisodesToSave.length > 0) {
      episodesRef.current = nextEpisodesList;
      setEpisodes(nextEpisodesList);
    }

    // 3. Migrate RawSource splitFootageIds references
    const updatedSourcesToSave: RawSource[] = [];
    const nextSourcesList = sourcesRef.current.map((src) => {
      const hasAffectedChild = src.splitFootageIds.some((fid) =>
        redirectMap.has(fid)
      );
      if (!hasAffectedChild) return src;
      const nextSplitIds = Array.from(
        new Set(src.splitFootageIds.map((fid) => resolveSurvivorId(fid)))
      );
      const updatedSrc: RawSource = {
        ...src,
        splitFootageIds: nextSplitIds,
      };
      updatedSourcesToSave.push(updatedSrc);
      return updatedSrc;
    });

    if (updatedSourcesToSave.length > 0) {
      sourcesRef.current = nextSourcesList;
      setSources(nextSourcesList);
    }

    // 4. Clean up deleted IDs from batch selection
    setSelectedFootageIdsForBatch((prev) =>
      prev.filter((id) => !deletedIdsSet.has(id))
    );

    // 5. Persist atomically to Firestore under batch write lock
    const deletedIdsArray = Array.from(deletedIdsSet);
    try {
      await firestoreService.withBatchWriteLock(async () => {
        if (updatedFootagesToSave.length > 0) {
          await firestoreService.batchSaveFootages(
            updatedFootagesToSave,
            onChunkProgress
          );
        }
        if (updatedEpisodesToSave.length > 0) {
          await firestoreService.batchSaveEpisodes(updatedEpisodesToSave);
        }
        if (updatedSourcesToSave.length > 0) {
          await firestoreService.batchSaveSources(updatedSourcesToSave);
        }
        if (deletedIdsArray.length > 0) {
          await firestoreService.batchDeleteFootages(deletedIdsArray);
        }
      });
    } catch (err) {
      console.warn('Firestore mergeDuplicateFootages error:', err);
    }

    return {
      mergedGroupCount,
      deletedFootageCount: deletedIdsArray.length,
      migratedEpisodeCount: updatedEpisodesToSave.length,
      updatedSourceCount: updatedSourcesToSave.length,
    };
  };

  return {
    mergeDuplicateFootages,
  };
}
