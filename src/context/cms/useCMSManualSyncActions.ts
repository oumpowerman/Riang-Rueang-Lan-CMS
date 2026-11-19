import React, { useCallback, useState } from 'react';
import {
  ArchiveSummaryStats,
  extractDeletedIdsSince,
  firestoreService,
  isQuotaExhaustedError,
  markFirestoreQuotaExhausted,
  ServerCollectionCounts,
  subtractClockSkewBuffer,
  SyncCollectionKey,
} from '../../firebase/firestoreService';
import { cmsRepository } from '../../services/cmsRepository';
import { idbStorageService } from '../../services/idbStorageService';
import { broadcastLocalCollectionsUpdated } from '../../services/multiTabSyncBus';
import { INITIAL_SETTINGS } from '../../services/seedData';
import { Episode } from '../../types/episode.types';
import { Footage } from '../../types/footage.types';
import { RawSource } from '../../types/source.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../../types/tag.types';
import { ManualSyncReport } from './useCMSSyncHealth';

const MANUAL_DELTA_MIN_LOOKBACK_MS = 24 * 60 * 60 * 1000; // 24 hours safety lookback

interface UseCMSManualSyncActionsParams {
  setCategoryGroups: React.Dispatch<React.SetStateAction<CategoryGroup[]>>;
  setTags: React.Dispatch<React.SetStateAction<CategoryTag[]>>;
  setSources: React.Dispatch<React.SetStateAction<RawSource[]>>;
  setFootage: React.Dispatch<React.SetStateAction<Footage[]>>;
  setEpisodes: React.Dispatch<React.SetStateAction<Episode[]>>;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  setArchiveSummaryStats: React.Dispatch<React.SetStateAction<ArchiveSummaryStats | null>>;
  setServerCounts: React.Dispatch<React.SetStateAction<ServerCollectionCounts | null>>;
  setIsCloudConnected: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCloudSynced: React.Dispatch<React.SetStateAction<boolean>>;
  setLastSyncedAt: React.Dispatch<React.SetStateAction<string | null>>;
  hasFullCloudEpisodesRef: React.MutableRefObject<boolean>;
  hasFullCloudFootageRef: React.MutableRefObject<boolean>;
  hasFullCloudSourcesRef: React.MutableRefObject<boolean>;
}

function formatSyncErrorThai(err: unknown): string {
  if (isQuotaExhaustedError(err)) {
    return 'ติดเพดานโควตาการอ่าน Firestore รายวัน (Free Tier) — ข้อมูลในเครื่องยังใช้งานได้ปกติ และสามารถลองซิงก์ใหม่ได้หลังโควตารีเซ็ต';
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'อุปกรณ์กำลังออฟไลน์ — กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง';
  }
  const msg = err instanceof Error ? err.message : String(err || '');
  return msg ? `ไม่สามารถดึงข้อมูลจาก Cloud ได้ (${msg.slice(0, 120)})` : 'ไม่สามารถดึงข้อมูลจาก Cloud ได้';
}

export function useCMSManualSyncActions({
  setCategoryGroups,
  setTags,
  setSources,
  setFootage,
  setEpisodes,
  setSettings,
  setArchiveSummaryStats,
  setServerCounts,
  setIsCloudConnected,
  setIsCloudSynced,
  setLastSyncedAt,
  hasFullCloudEpisodesRef,
  hasFullCloudFootageRef,
  hasFullCloudSourcesRef,
}: UseCMSManualSyncActionsParams) {
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastReport, setLastReport] = useState<ManualSyncReport | null>(null);

  /**
   * Tier 1 Manual Refresh (Smart Delta):
   * Reads archive_summary_stats once, then pulls deltas across all 5 collections
   * covering at least the last 24 hours (or localSyncTs - 60s, whichever is older)
   * and applies recent deletion tombstones. Minimal Firestore reads.
   */
  const manualDeltaRefresh = useCallback(async (): Promise<ManualSyncReport> => {
    setIsManualSyncing(true);
    const startedIso = new Date().toISOString();

    try {
      const cloudSummary = await firestoreService.fetchArchiveSummaryStatsOnce();
      const localSyncTs = cmsRepository.getLastCloudSyncTimestamp();
      const twentyFourHoursAgoIso = new Date(
        Date.now() - MANUAL_DELTA_MIN_LOOKBACK_MS
      ).toISOString();

      const bufferedLocalIso = localSyncTs
        ? subtractClockSkewBuffer(localSyncTs)
        : twentyFourHoursAgoIso;
      const effectiveSinceIso =
        bufferedLocalIso < twentyFourHoursAgoIso
          ? bufferedLocalIso
          : twentyFourHoursAgoIso;

      if (cloudSummary) {
        setArchiveSummaryStats(cloudSummary);
        void idbStorageService.setMeta('archive_summary_stats', cloudSummary);
        setServerCounts({
          totalEpisodes: cloudSummary.totalEpisodes,
          totalFootage: cloudSummary.totalFootage,
          totalSources: cloudSummary.totalSources,
          fetchedAt: cloudSummary.updatedAt || startedIso,
        });
      }

      // Handle remote wipe markers if present
      if (cloudSummary?.clipsWipedAt && cloudSummary.clipsWipedAt > effectiveSinceIso) {
        cmsRepository.clearAllClips();
        setFootage([]);
        setEpisodes([]);
        setSources([]);
      }
      if (
        cloudSummary?.categoriesWipedAt &&
        cloudSummary.categoriesWipedAt > effectiveSinceIso
      ) {
        setTags([]);
        setCategoryGroups([]);
        cmsRepository.saveTags([]);
        cmsRepository.saveCategoryGroups([]);
      }

      const [
        deltaFootages,
        deltaEpisodes,
        deltaSources,
        deltaCategories,
        deltaGroups,
      ] = await Promise.all([
        firestoreService.fetchFootagesDelta(effectiveSinceIso),
        firestoreService.fetchEpisodesDelta(effectiveSinceIso),
        firestoreService.fetchSourcesDelta(effectiveSinceIso),
        firestoreService.fetchCategoriesDelta(effectiveSinceIso),
        firestoreService.fetchCategoryGroupsDelta(effectiveSinceIso),
      ]);

      const deletedByCol = extractDeletedIdsSince(
        cloudSummary?.recentDeletes,
        effectiveSinceIso
      );
      const deleteTimestamps = new Map<string, string>();
      (cloudSummary?.recentDeletes || []).forEach((rec) => {
        if (rec?.id && rec?.col && rec?.deletedAt) {
          deleteTimestamps.set(`${rec.col}::${rec.id}`, rec.deletedAt);
        }
      });

      const isStaleTombstone = (
        col: SyncCollectionKey,
        id: string,
        freshDoc?: { updatedAt?: string }
      ): boolean => {
        const delTs = deleteTimestamps.get(`${col}::${id}`);
        if (!delTs || !freshDoc?.updatedAt) return false;
        return freshDoc.updatedAt > delTs;
      };

      let removedCount = 0;

      if (deltaFootages.length > 0 || deletedByCol.footages.size > 0) {
        const freshById = new Map(deltaFootages.map((f) => [f.id, f]));
        setFootage((prev) => {
          const map = new Map(prev.map((f) => [f.id, f]));
          deltaFootages.forEach((f) => map.set(f.id, f));
          deletedByCol.footages.forEach((id) => {
            const fresh = freshById.get(id) as
              | (Footage & { updatedAt?: string })
              | undefined;
            if (!isStaleTombstone('footages', id, fresh) && map.delete(id)) {
              removedCount += 1;
            }
          });
          const merged = Array.from(map.values());
          void idbStorageService.saveFootage(merged, true);
          return merged;
        });
      }

      if (deltaEpisodes.length > 0 || deletedByCol.episodes.size > 0) {
        const freshById = new Map(deltaEpisodes.map((e) => [e.id, e]));
        setEpisodes((prev) => {
          const map = new Map(prev.map((e) => [e.id, e]));
          deltaEpisodes.forEach((e) => map.set(e.id, e));
          deletedByCol.episodes.forEach((id) => {
            const fresh = freshById.get(id) as
              | (Episode & { updatedAt?: string })
              | undefined;
            if (!isStaleTombstone('episodes', id, fresh) && map.delete(id)) {
              removedCount += 1;
            }
          });
          const merged = Array.from(map.values());
          void idbStorageService.saveEpisodes(merged, true);
          return merged;
        });
      }

      if (deltaSources.length > 0 || deletedByCol.sources.size > 0) {
        const freshById = new Map(deltaSources.map((s) => [s.id, s]));
        setSources((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          deltaSources.forEach((s) => map.set(s.id, s));
          deletedByCol.sources.forEach((id) => {
            const fresh = freshById.get(id) as
              | (RawSource & { updatedAt?: string })
              | undefined;
            if (!isStaleTombstone('sources', id, fresh) && map.delete(id)) {
              removedCount += 1;
            }
          });
          const merged = Array.from(map.values());
          void idbStorageService.saveSources(merged, true);
          return merged;
        });
      }

      if (deltaCategories.length > 0 || deletedByCol.categories.size > 0) {
        const freshById = new Map(deltaCategories.map((c) => [c.id, c]));
        setTags((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          deltaCategories.forEach((c) => map.set(c.id, c));
          deletedByCol.categories.forEach((id) => {
            const fresh = freshById.get(id) as
              | (CategoryTag & { updatedAt?: string })
              | undefined;
            if (!isStaleTombstone('categories', id, fresh) && map.delete(id)) {
              removedCount += 1;
            }
          });
          const rawMerged = Array.from(map.values());
          const normalized = cmsRepository.normalizeAndRepairTags(
            rawMerged,
            rawMerged.length <= 1
          );
          cmsRepository.saveTags(normalized);
          return normalized;
        });
      }

      if (deltaGroups.length > 0 || deletedByCol.category_groups.size > 0) {
        const freshById = new Map(deltaGroups.map((g) => [g.id, g]));
        setCategoryGroups((prev) => {
          const map = new Map(prev.map((g) => [g.id, g]));
          deltaGroups.forEach((g) => map.set(g.id, g));
          deletedByCol.category_groups.forEach((id) => {
            const fresh = freshById.get(id) as
              | (CategoryGroup & { updatedAt?: string })
              | undefined;
            if (!isStaleTombstone('category_groups', id, fresh) && map.delete(id)) {
              removedCount += 1;
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => (a.order ?? 99) - (b.order ?? 99)
          );
          cmsRepository.saveCategoryGroups(merged);
          return merged;
        });
      }

      const upsertedCount =
        deltaFootages.length +
        deltaEpisodes.length +
        deltaSources.length +
        deltaCategories.length +
        deltaGroups.length;

      const syncedIso =
        cloudSummary?.lastMutationAt || cloudSummary?.updatedAt || new Date().toISOString();
      cmsRepository.setLastCloudSyncTimestamp(syncedIso);
      setLastSyncedAt(syncedIso);
      markFirestoreQuotaExhausted(false);
      setIsCloudConnected(true);
      setIsCloudSynced(true);
      hasFullCloudEpisodesRef.current = true;
      hasFullCloudFootageRef.current = true;
      hasFullCloudSourcesRef.current = true;

      if (upsertedCount > 0 || removedCount > 0) {
        broadcastLocalCollectionsUpdated(
          ['footage', 'episodes', 'sources', 'tags', 'categoryGroups'],
          syncedIso
        );
      }

      const report: ManualSyncReport = {
        mode: 'delta',
        upsertedCount,
        deletedCount: removedCount,
        syncedAt: new Date().toISOString(),
        ok: true,
        message:
          upsertedCount === 0 && removedCount === 0
            ? 'ตรวจสอบกับ Cloud แล้ว ข้อมูลในเครื่องเป็นเวอร์ชันล่าสุดทั้งหมด'
            : `ดึงข้อมูลล่าสุดสำเร็จ: อัปเดต ${upsertedCount} รายการ, ลบออก ${removedCount} รายการ`,
      };
      setLastReport(report);
      return report;
    } catch (err) {
      const errorText = formatSyncErrorThai(err);
      const report: ManualSyncReport = {
        mode: 'delta',
        upsertedCount: 0,
        deletedCount: 0,
        syncedAt: new Date().toISOString(),
        ok: false,
        message: errorText,
        error: errorText,
      };
      setLastReport(report);
      return report;
    } finally {
      setIsManualSyncing(false);
    }
  }, [
    setArchiveSummaryStats,
    setCategoryGroups,
    setEpisodes,
    setFootage,
    setIsCloudConnected,
    setIsCloudSynced,
    setLastSyncedAt,
    setServerCounts,
    setSources,
    setTags,
    hasFullCloudEpisodesRef,
    hasFullCloudFootageRef,
    hasFullCloudSourcesRef,
  ]);

  /**
   * Tier 2 Manual Refresh (Authoritative Full Pull):
   * Downloads all 5 collections + settings from Firestore and replaces local IndexedDB cache.
   * Reconciles any drift (e.g. >400 bulk deletes or >14 days offline).
   */
  const manualFullPullFromCloud = useCallback(async (): Promise<ManualSyncReport> => {
    setIsManualSyncing(true);

    try {
      const [
        allFootages,
        allEpisodes,
        allSources,
        allCats,
        allGroups,
        cloudSettings,
        cloudSummary,
      ] = await Promise.all([
        firestoreService.fetchFootagesDelta(),
        firestoreService.fetchEpisodesDelta(),
        firestoreService.fetchSourcesDelta(),
        firestoreService.fetchCategoriesDelta(),
        firestoreService.fetchCategoryGroupsDelta(),
        firestoreService.fetchSettingsOnce().catch(() => null),
        firestoreService.fetchArchiveSummaryStatsOnce().catch(() => null),
      ]);

      // Replace local cache authoritatively (including empty collections!)
      await Promise.all([
        idbStorageService.saveFootage(allFootages, true),
        idbStorageService.saveEpisodes(allEpisodes, true),
        idbStorageService.saveSources(allSources, true),
      ]);

      setFootage(allFootages);
      setEpisodes(allEpisodes);
      setSources(allSources);

      const normalizedCats =
        allCats.length > 0
          ? cmsRepository.normalizeAndRepairTags(allCats, allCats.length <= 1)
          : [];
      setTags(normalizedCats);
      cmsRepository.saveTags(normalizedCats);

      const sortedGroups = [...allGroups].sort(
        (a, b) => (a.order ?? 99) - (b.order ?? 99)
      );
      setCategoryGroups(sortedGroups);
      cmsRepository.saveCategoryGroups(sortedGroups);

      if (cloudSettings) {
        const mergedSettings = { ...INITIAL_SETTINGS, ...cloudSettings };
        setSettings(mergedSettings);
        cmsRepository.saveSettings(mergedSettings);
      }

      const syncedIso =
        cloudSummary?.lastMutationAt ||
        cloudSummary?.updatedAt ||
        new Date().toISOString();

      if (cloudSummary) {
        setArchiveSummaryStats(cloudSummary);
        void idbStorageService.setMeta('archive_summary_stats', cloudSummary);
      }
      setServerCounts({
        totalEpisodes: allEpisodes.length,
        totalFootage: allFootages.length,
        totalSources: allSources.length,
        fetchedAt: new Date().toISOString(),
      });

      cmsRepository.setLastCloudSyncTimestamp(syncedIso);
      setLastSyncedAt(syncedIso);
      markFirestoreQuotaExhausted(false);
      setIsCloudConnected(true);
      setIsCloudSynced(true);
      hasFullCloudEpisodesRef.current = true;
      hasFullCloudFootageRef.current = true;
      hasFullCloudSourcesRef.current = true;

      broadcastLocalCollectionsUpdated(
        ['footage', 'episodes', 'sources', 'tags', 'categoryGroups', 'settings'],
        syncedIso
      );

      const totalLoaded =
        allFootages.length +
        allEpisodes.length +
        allSources.length +
        normalizedCats.length +
        sortedGroups.length;

      const report: ManualSyncReport = {
        mode: 'full',
        upsertedCount: totalLoaded,
        deletedCount: 0,
        syncedAt: new Date().toISOString(),
        ok: true,
        message: `ดึงข้อมูลใหม่ทั้งหมดจาก Cloud สำเร็จ (ฟุตเทจ ${allFootages.length}, ตอน ${allEpisodes.length}, ต้นฉบับ ${allSources.length}, แท็ก ${normalizedCats.length})`,
      };
      setLastReport(report);
      return report;
    } catch (err) {
      const errorText = formatSyncErrorThai(err);
      const report: ManualSyncReport = {
        mode: 'full',
        upsertedCount: 0,
        deletedCount: 0,
        syncedAt: new Date().toISOString(),
        ok: false,
        message: errorText,
        error: errorText,
      };
      setLastReport(report);
      return report;
    } finally {
      setIsManualSyncing(false);
    }
  }, [
    setArchiveSummaryStats,
    setCategoryGroups,
    setEpisodes,
    setFootage,
    setIsCloudConnected,
    setIsCloudSynced,
    setLastSyncedAt,
    setServerCounts,
    setSettings,
    setSources,
    setTags,
    hasFullCloudEpisodesRef,
    hasFullCloudFootageRef,
    hasFullCloudSourcesRef,
  ]);

  return {
    isManualSyncing,
    lastReport,
    setLastReport,
    manualDeltaRefresh,
    manualFullPullFromCloud,
  };
}
