import React, { useState } from 'react';
import {
  ArchiveSummaryStats,
  CLIENT_INSTANCE_ID,
  firestoreService,
  ServerCollectionCounts,
} from '../../firebase/firestoreService';
import { cmsRepository } from '../../services/cmsRepository';
import { idbStorageService, safeLocalStorageSet } from '../../services/idbStorageService';
import { broadcastLocalCollectionsUpdated } from '../../services/multiTabSyncBus';
import { syncHistoryService } from '../../services/syncHistoryService';
import { evaluateEpisodeCompleteness } from '../../utils/episodeValidator';
import { APP_SCHEMA_EPOCH, APP_VERSION } from '../../constants/appVersion';
import { Episode } from '../../types/episode.types';
import { Footage } from '../../types/footage.types';
import { RawSource } from '../../types/source.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../../types/tag.types';
import { ManualSyncReport } from './useCMSSyncHealth';

interface UseCMSAdminCloudActionsParams {
  tags: CategoryTag[];
  footage: Footage[];
  episodes: Episode[];
  settings: SystemSettings;
  categoryGroups: CategoryGroup[];
  sources: RawSource[];
  setSources: React.Dispatch<React.SetStateAction<RawSource[]>>;
  setFootage: React.Dispatch<React.SetStateAction<Footage[]>>;
  setEpisodes: React.Dispatch<React.SetStateAction<Episode[]>>;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  setSelectedTagFilter: React.Dispatch<React.SetStateAction<string[]>>;
  setServerCounts: React.Dispatch<React.SetStateAction<ServerCollectionCounts | null>>;
  setArchiveSummaryStats: React.Dispatch<React.SetStateAction<ArchiveSummaryStats | null>>;
  setLastSyncedAt: React.Dispatch<React.SetStateAction<string | null>>;
  setLocalMutationVersion: React.Dispatch<React.SetStateAction<number>>;
  setIsCloudSynced: React.Dispatch<React.SetStateAction<boolean>>;
  setLastReport: React.Dispatch<React.SetStateAction<ManualSyncReport | null>>;
  hasFullCloudEpisodesRef: React.MutableRefObject<boolean>;
  hasFullCloudFootageRef: React.MutableRefObject<boolean>;
  hasFullCloudSourcesRef: React.MutableRefObject<boolean>;
  isWipingCloudRef: React.MutableRefObject<boolean>;
}

export function useCMSAdminCloudActions({
  tags,
  footage,
  episodes,
  settings,
  categoryGroups,
  sources,
  setSources,
  setFootage,
  setEpisodes,
  setSettings,
  setSelectedTagFilter,
  setServerCounts,
  setArchiveSummaryStats,
  setLastSyncedAt,
  setLocalMutationVersion,
  setIsCloudSynced,
  setLastReport,
  hasFullCloudEpisodesRef,
  hasFullCloudFootageRef,
  hasFullCloudSourcesRef,
  isWipingCloudRef,
}: UseCMSAdminCloudActionsParams) {
  const [isSeedingToCloud, setIsSeedingToCloud] = useState(false);
  const [isClearingClips, setIsClearingClips] = useState(false);

  const seedToCloud = async () => {
    setIsSeedingToCloud(true);
    try {
      const seedResult = await firestoreService.seedInitialDatabase(
        tags,
        footage,
        episodes,
        settings,
        categoryGroups,
        sources
      );
      const nowIso = new Date().toISOString();
      cmsRepository.setLastCloudSyncTimestamp(nowIso);
      cmsRepository.setLocalSchemaEpoch(APP_SCHEMA_EPOCH);
      setLastSyncedAt(nowIso);
      setLocalMutationVersion((v) => v + 1);
      setIsCloudSynced(true);

      hasFullCloudEpisodesRef.current = true;
      hasFullCloudFootageRef.current = true;
      hasFullCloudSourcesRef.current = true;

      setServerCounts({
        totalFootage: footage.length,
        totalEpisodes: episodes.length,
        totalSources: sources.length,
        totalCategories: tags.length,
        fetchedAt: nowIso,
      });

      let completeEpisodesCount = 0;
      let incompleteEpisodesCount = 0;
      let incompleteFootageEpisodesCount = 0;
      for (const ep of episodes) {
        const comp = evaluateEpisodeCompleteness(ep);
        if (comp.isComplete) completeEpisodesCount++;
        else incompleteEpisodesCount++;
        if (!comp.hasFullFiveSlots) incompleteFootageEpisodesCount++;
      }

      const updatedSummary: ArchiveSummaryStats = {
        totalEpisodes: episodes.length,
        completeEpisodesCount,
        incompleteEpisodesCount,
        incompleteFootageEpisodesCount,
        distinctSeriesCount: 0,
        totalFootage: footage.length,
        usedFootageCount: 0,
        readyFootageCount: footage.length,
        newFootageCount: footage.length,
        coolingFootageCount: 0,
        untaggedFootageCount: footage.filter((f) => !f.tags || f.tags.length === 0).length,
        missingDriveCount: footage.filter((f) => !f.driveFileUrl).length,
        totalSources: sources.length,
        totalCategories: tags.length,
        minRequiredAppVersion: APP_VERSION,
        updatedAt: nowIso,
        lastMutationAt: nowIso,
        lastMutationBy: CLIENT_INSTANCE_ID,
        lastMutationType: 'admin:seed',
      };
      setArchiveSummaryStats(updatedSummary);
      void idbStorageService.setMeta('archive_summary_stats', updatedSummary);

      setLastReport({
        mode: 'push_seed',
        upsertedCount:
          seedResult?.upsertedCount ??
          footage.length + episodes.length + sources.length + tags.length + categoryGroups.length,
        deletedCount: seedResult?.deletedCount ?? 0,
        syncedAt: nowIso,
        ok: true,
        message:
          (seedResult?.deletedCount ?? 0) > 0
            ? `สำรองข้อมูลขึ้น Cloud สำเร็จ (ตรงกับเครื่องนี้ 100% ลบข้อมูลเก่าส่วนเกินบน Cloud ไป ${seedResult.deletedCount} รายการ)`
            : 'สำรองข้อมูลขึ้น Cloud สำเร็จ (ตรงกับเครื่องนี้ 100%)',
      });

      syncHistoryService.recordSyncSuccess({
        timestamp: nowIso,
        type: 'push_seed',
        label: 'Master Push (สำรองขึ้น Cloud)',
        upsertedCount:
          seedResult?.upsertedCount ??
          footage.length + episodes.length + sources.length + tags.length + categoryGroups.length,
        deletedCount: seedResult?.deletedCount ?? 0,
        message:
          (seedResult?.deletedCount ?? 0) > 0
            ? `สำรองข้อมูลขึ้น Cloud สำเร็จ (ลบข้อมูลส่วนเกินบน Cloud ${seedResult.deletedCount} รายการ)`
            : 'สำรองข้อมูลเครื่องหลักขึ้น Cloud สำเร็จ ตรงกัน 100%',
      });
      syncHistoryService.resolveActiveConflicts('สำรองข้อมูลเครื่องนี้เป็นหลักขึ้น Cloud เรียบร้อยแล้ว');
    } catch (err) {
      console.error('Manual cloud sync error:', err);
      const msg = err instanceof Error ? err.message : String(err || '');
      setLastReport({
        mode: 'push_seed',
        upsertedCount: 0,
        deletedCount: 0,
        syncedAt: new Date().toISOString(),
        ok: false,
        message: `อัปโหลดข้อมูลขึ้น Cloud ไม่สำเร็จ (${msg.slice(0, 100)})`,
        error: msg,
      });
    } finally {
      setIsSeedingToCloud(false);
    }
  };

  const clearAllClips = async () => {
    setIsClearingClips(true);
    isWipingCloudRef.current = true;
    try {
      cmsRepository.clearAllClips();
      setSources([]);
      setFootage([]);
      setEpisodes([]);
      setSelectedTagFilter([]);
      setServerCounts((prev) => ({
        totalEpisodes: 0,
        totalFootage: 0,
        totalSources: 0,
        totalCategories: prev?.totalCategories ?? tags.length,
        fetchedAt: new Date().toISOString(),
      }));

      setSettings((prev) => {
        const cleanedFolders = (prev.savedDriveFolders || []).map((f) => ({
          ...f,
          lastSyncTimestamp: undefined,
          totalClipsInFolder: 0,
        }));
        const nextSettings = {
          ...prev,
          savedDriveFolders: cleanedFolders,
        };
        safeLocalStorageSet(
          'rrl_drive_saved_folders_v1',
          JSON.stringify(cleanedFolders)
        );
        firestoreService.saveSettings(nextSettings).catch(() => {});
        return nextSettings;
      });

      await firestoreService.clearAllClipsFromCloud();
      cmsRepository.markCloudClipsWiped();
      setLocalMutationVersion((v) => v + 1);
      setIsCloudSynced(true);
      broadcastLocalCollectionsUpdated(['footage', 'episodes', 'sources', 'settings']);
    } catch (err) {
      console.warn('Firestore clearAllClips error:', err);
    } finally {
      isWipingCloudRef.current = false;
      setIsClearingClips(false);
    }
  };

  const resetDemoData = () => {
    void clearAllClips();
  };

  return {
    isSeedingToCloud,
    isClearingClips,
    seedToCloud,
    clearAllClips,
    resetDemoData,
  };
}
