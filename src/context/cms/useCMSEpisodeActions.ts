import React from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import {
  Episode,
  EpisodeWorkflowStage,
  MasterVideoInfo,
} from '../../types/episode.types';
import { getReferenceTodayDate } from '../../utils/cooldownCalculator';
import {
  generateMasterEpisodeFileName,
  generateNextId,
} from '../../utils/fileNameGenerator';

interface UseCMSEpisodeActionsParams {
  episodes: Episode[];
  setEpisodes: React.Dispatch<React.SetStateAction<Episode[]>>;
}

export function useCMSEpisodeActions({
  episodes,
  setEpisodes,
}: UseCMSEpisodeActionsParams) {
  const saveEpisode = (
    episodePayload: Omit<Episode, 'id' | 'createdAt' | 'masterVideoInfo'> & {
      id?: string;
      masterVideoInfo?: Partial<MasterVideoInfo>;
    }
  ): Episode => {
    const nextEpId =
      episodePayload.id ||
      generateNextId(
        'EP',
        episodes.map((e) => e.id)
      );

    const autoMasterFileName = generateMasterEpisodeFileName(
      nextEpId,
      episodePayload.publishDate,
      episodePayload.publishSlot,
      episodePayload.title
    );

    const fullMasterInfo: MasterVideoInfo = {
      masterFileName: episodePayload.masterVideoInfo?.masterFileName || autoMasterFileName,
      masterDriveUrl:
        episodePayload.masterVideoInfo?.masterDriveUrl ||
        `https://drive.google.com/file/d/MASTER-${nextEpId}/view`,
      youtubeUrl: episodePayload.masterVideoInfo?.youtubeUrl || '',
      facebookUrl: episodePayload.masterVideoInfo?.facebookUrl || '',
      viewsCount: episodePayload.masterVideoInfo?.viewsCount || 0,
      performanceNote:
        episodePayload.masterVideoInfo?.performanceNote ||
        'รออัปเดตสถิติยอดวิวหลังเผยแพร่',
    };

    if (episodePayload.id) {
      const existing = episodes.find((e) => e.id === episodePayload.id);
      if (existing) {
        const updated: Episode = {
          ...existing,
          ...episodePayload,
          id: existing.id,
          masterVideoInfo: {
            ...existing.masterVideoInfo,
            ...fullMasterInfo,
          },
        };
        setEpisodes((prev) => prev.map((e) => (e.id === existing.id ? updated : e)));
        firestoreService.saveEpisode(updated).catch((err) => console.warn('Firestore saveEpisode error:', err));
        return updated;
      }
    }

    const newEpisode: Episode = {
      ...episodePayload,
      id: nextEpId,
      masterVideoInfo: fullMasterInfo,
      createdAt: getReferenceTodayDate(),
    };
    setEpisodes((prev) => [newEpisode, ...prev]);
    firestoreService.saveEpisode(newEpisode).catch((err) => console.warn('Firestore saveEpisode error:', err));
    return newEpisode;
  };

  const updateEpisodeWorkflowStage = (episodeId: string, stage: EpisodeWorkflowStage) => {
    setEpisodes((prev) =>
      prev.map((ep) => {
        if (ep.id === episodeId) {
          const updated = { ...ep, workflowStage: stage };
          firestoreService.saveEpisode(updated).catch((err) => console.warn('Firestore updateEpisodeWorkflowStage error:', err));
          return updated;
        }
        return ep;
      })
    );
  };

  const updateEpisodeMasterInfo = (
    episodeId: string,
    updates: Partial<MasterVideoInfo>
  ) => {
    setEpisodes((prev) =>
      prev.map((ep) => {
        if (ep.id === episodeId) {
          const updated = {
            ...ep,
            masterVideoInfo: {
              ...ep.masterVideoInfo,
              ...updates,
            },
          };
          firestoreService.saveEpisode(updated).catch((err) => console.warn('Firestore updateEpisodeMasterInfo error:', err));
          return updated;
        }
        return ep;
      })
    );
  };

  const deleteEpisode = (episodeId: string) => {
    setEpisodes((prev) => prev.filter((ep) => ep.id !== episodeId));
    firestoreService.deleteEpisode(episodeId).catch((err) => console.warn('Firestore deleteEpisode error:', err));
  };

  return {
    saveEpisode,
    updateEpisodeWorkflowStage,
    updateEpisodeMasterInfo,
    deleteEpisode,
  };
}
