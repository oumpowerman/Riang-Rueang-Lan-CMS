import { useEffect, useMemo, useState } from 'react';
import {
  ArchiveSummaryStats,
  clearOutboxQueue,
  flushOutboxQueue,
  getIsFirestoreQuotaExhausted,
  initOutboxAutoRetry,
  isBatchWriteInProgress,
  OutboxFlushResult,
  OutboxQueueSnapshot,
  ServerCollectionCounts,
  subscribeFirestoreQuotaChange,
  subscribeOutboxState,
} from '../../firebase/firestoreService';
import { cmsRepository } from '../../services/cmsRepository';
import { syncHistoryService } from '../../services/syncHistoryService';

export type SyncHealthStatus =
  | 'synced'
  | 'syncing'
  | 'drift_detected'
  | 'outbox_pending'
  | 'offline_or_quota';

export interface SyncDriftSummary {
  hasDrift: boolean;
  localFootage: number;
  cloudFootage: number | null;
  footageDiff: number;
  localEpisodes: number;
  cloudEpisodes: number | null;
  episodeDiff: number;
  localSources: number;
  cloudSources: number | null;
  sourceDiff: number;
  totalAbsDiff: number;
}

export interface ManualSyncReport {
  mode: 'delta' | 'full' | 'outbox_flush' | 'push_seed';
  upsertedCount: number;
  deletedCount: number;
  syncedAt: string;
  ok: boolean;
  message: string;
  error?: string;
}

export interface SyncHealthState {
  status: SyncHealthStatus;
  isOnline: boolean;
  isQuotaExhausted: boolean;
  isManualSyncing: boolean;
  lastSyncedAt: string | null;
  outbox: OutboxQueueSnapshot;
  drift: SyncDriftSummary;
  lastReport: ManualSyncReport | null;
}

interface UseCMSSyncHealthParams {
  localFootageCount: number;
  localEpisodesCount: number;
  localSourcesCount: number;
  archiveSummaryStats: ArchiveSummaryStats | null;
  serverCounts?: ServerCollectionCounts | null;
  isIdbHydrated: boolean;
  isManualSyncing: boolean;
  isSeedingToCloud: boolean;
  isClearingClips: boolean;
  lastSyncedAt: string | null;
  lastReport: ManualSyncReport | null;
}

const DRIFT_SETTLE_DELAY_MS = 3_000;

export function useCMSSyncHealth({
  localFootageCount,
  localEpisodesCount,
  localSourcesCount,
  archiveSummaryStats,
  serverCounts,
  isIdbHydrated,
  isManualSyncing,
  isSeedingToCloud,
  isClearingClips,
  lastSyncedAt,
  lastReport,
}: UseCMSSyncHealthParams) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(() =>
    getIsFirestoreQuotaExhausted()
  );
  const [outbox, setOutbox] = useState<OutboxQueueSnapshot>({
    items: [],
    count: 0,
    isFlushing: false,
    lastFlushAt: null,
    lastFlushError: null,
  });

  // Debounced drift latch so rapid in-flight writes never flash a false alarm
  const [settledDrift, setSettledDrift] = useState<boolean>(false);

  // 1. Online/Offline + Quota + Outbox subscriptions
  useEffect(() => {
    const unsubAutoRetry = initOutboxAutoRetry();
    const unsubOutbox = subscribeOutboxState(setOutbox);
    const unsubQuota = subscribeFirestoreQuotaChange(setIsQuotaExhausted);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      unsubAutoRetry();
      unsubOutbox();
      unsubQuota();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // 2. Compute raw count comparison against central server count or signal doc
  const rawDrift = useMemo(() => {
    // Prefer authoritative real collection counts from getCountFromServer (serverCounts)
    // over potentially stale archiveSummaryStats counters
    const cloudFootage =
      typeof serverCounts?.totalFootage === 'number'
        ? serverCounts.totalFootage
        : typeof archiveSummaryStats?.totalFootage === 'number'
        ? archiveSummaryStats.totalFootage
        : null;
    const cloudEpisodes =
      typeof serverCounts?.totalEpisodes === 'number'
        ? serverCounts.totalEpisodes
        : typeof archiveSummaryStats?.totalEpisodes === 'number'
        ? archiveSummaryStats.totalEpisodes
        : null;
    const cloudSources =
      typeof serverCounts?.totalSources === 'number'
        ? serverCounts.totalSources
        : typeof archiveSummaryStats?.totalSources === 'number'
        ? archiveSummaryStats.totalSources
        : null;

    const footageDiff = cloudFootage === null ? 0 : cloudFootage - localFootageCount;
    const episodeDiff = cloudEpisodes === null ? 0 : cloudEpisodes - localEpisodesCount;
    const sourceDiff = cloudSources === null ? 0 : cloudSources - localSourcesCount;
    const totalAbsDiff =
      Math.abs(footageDiff) + Math.abs(episodeDiff) + Math.abs(sourceDiff);

    return {
      cloudFootage,
      cloudEpisodes,
      cloudSources,
      footageDiff,
      episodeDiff,
      sourceDiff,
      totalAbsDiff,
      hasRawMismatch: totalAbsDiff > 0,
    };
  }, [
    serverCounts?.totalFootage,
    serverCounts?.totalEpisodes,
    serverCounts?.totalSources,
    archiveSummaryStats?.totalFootage,
    archiveSummaryStats?.totalEpisodes,
    archiveSummaryStats?.totalSources,
    localFootageCount,
    localEpisodesCount,
    localSourcesCount,
  ]);

  // 3. Debounce drift alert by 3 seconds & suppress during active mutations/outbox
  useEffect(() => {
    const busyOrPending =
      !isIdbHydrated ||
      !archiveSummaryStats ||
      isManualSyncing ||
      isSeedingToCloud ||
      isClearingClips ||
      outbox.count > 0 ||
      isBatchWriteInProgress();

    if (busyOrPending || !rawDrift.hasRawMismatch) {
      setSettledDrift(false);
      return;
    }

    const timer = window.setTimeout(() => {
      if (!isBatchWriteInProgress()) {
        setSettledDrift(true);
      }
    }, DRIFT_SETTLE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [
    isIdbHydrated,
    archiveSummaryStats,
    isManualSyncing,
    isSeedingToCloud,
    isClearingClips,
    outbox.count,
    rawDrift.hasRawMismatch,
  ]);

  const drift: SyncDriftSummary = useMemo(
    () => ({
      hasDrift: settledDrift && rawDrift.hasRawMismatch,
      localFootage: localFootageCount,
      cloudFootage: rawDrift.cloudFootage,
      footageDiff: rawDrift.footageDiff,
      localEpisodes: localEpisodesCount,
      cloudEpisodes: rawDrift.cloudEpisodes,
      episodeDiff: rawDrift.episodeDiff,
      localSources: localSourcesCount,
      cloudSources: rawDrift.cloudSources,
      sourceDiff: rawDrift.sourceDiff,
      totalAbsDiff: rawDrift.totalAbsDiff,
    }),
    [settledDrift, rawDrift, localFootageCount, localEpisodesCount, localSourcesCount]
  );

  // 3.6 Log detected conflict or mark resolved in Sync History
  useEffect(() => {
    if (drift.hasDrift) {
      syncHistoryService.recordConflict({
        localCounts: {
          footage: localFootageCount,
          episodes: localEpisodesCount,
          sources: localSourcesCount,
        },
        cloudCounts: {
          footage: rawDrift.cloudFootage,
          episodes: rawDrift.cloudEpisodes,
          sources: rawDrift.cloudSources,
        },
        diffSummary: `ตรวจพบยอดไม่ตรงกับ Firestore (${rawDrift.totalAbsDiff} รายการ)`,
      });
    } else if (!rawDrift.hasRawMismatch && isIdbHydrated && !isManualSyncing) {
      syncHistoryService.resolveActiveConflicts('ข้อมูลในเครื่องและ Firestore ตรงกัน 100%');
    }
  }, [
    drift.hasDrift,
    rawDrift.hasRawMismatch,
    rawDrift.totalAbsDiff,
    rawDrift.cloudFootage,
    rawDrift.cloudEpisodes,
    rawDrift.cloudSources,
    localFootageCount,
    localEpisodesCount,
    localSourcesCount,
    isIdbHydrated,
    isManualSyncing,
  ]);

  const status: SyncHealthStatus = useMemo(() => {
    if (isManualSyncing || outbox.isFlushing || isSeedingToCloud || isClearingClips) {
      return 'syncing';
    }
    if (!isOnline || isQuotaExhausted) {
      return 'offline_or_quota';
    }
    if (outbox.count > 0) {
      return 'outbox_pending';
    }
    if (drift.hasDrift) {
      return 'drift_detected';
    }
    return 'synced';
  }, [
    isManualSyncing,
    outbox.isFlushing,
    outbox.count,
    isSeedingToCloud,
    isClearingClips,
    isOnline,
    isQuotaExhausted,
    drift.hasDrift,
  ]);

  const effectiveLastSyncedAt =
    lastSyncedAt || cmsRepository.getLastCloudSyncTimestamp();

  const syncHealth: SyncHealthState = useMemo(
    () => ({
      status,
      isOnline,
      isQuotaExhausted,
      isManualSyncing,
      lastSyncedAt: effectiveLastSyncedAt,
      outbox,
      drift,
      lastReport,
    }),
    [
      status,
      isOnline,
      isQuotaExhausted,
      isManualSyncing,
      effectiveLastSyncedAt,
      outbox,
      drift,
      lastReport,
    ]
  );

  const flushOutboxNow = async (): Promise<OutboxFlushResult> => {
    return flushOutboxQueue(true);
  };

  const clearOutboxNow = async (): Promise<void> => {
    await clearOutboxQueue();
  };

  return {
    syncHealth,
    flushOutboxNow,
    clearOutboxNow,
  };
}
