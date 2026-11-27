import React, { useEffect, useRef, useState } from 'react';
import {
  ArchiveSummaryStats,
  CLIENT_INSTANCE_ID,
  extractDeletedIdsSince,
  firestoreService,
  registerOnPulseEmitted,
  reloadOutboxFromStorage,
  ServerCollectionCounts,
  subtractClockSkewBuffer,
  SyncCollectionKey,
  updateCachedSyncPulse,
} from '../../firebase/firestoreService';
import { cmsRepository } from '../../services/cmsRepository';
import { idbStorageService } from '../../services/idbStorageService';
import {
  broadcastLocalCollectionsUpdated,
  MultiTabCollectionKey,
  subscribeMultiTabSync,
} from '../../services/multiTabSyncBus';
import { INITIAL_SETTINGS } from '../../services/seedData';
import { Episode } from '../../types/episode.types';
import { Footage } from '../../types/footage.types';
import { RawSource } from '../../types/source.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../../types/tag.types';
import { useCMSAdminCloudActions } from './useCMSAdminCloudActions';
import { useCMSManualSyncActions } from './useCMSManualSyncActions';
import { useCMSSyncHealth } from './useCMSSyncHealth';
import {
  APP_SCHEMA_EPOCH,
  APP_VERSION,
  compareAppVersions,
  hardReloadAndPurgeBrowserCaches,
  VERSION_STORAGE_KEYS,
} from '../../constants/appVersion';

export function useCMSCloudAndStorageSync(
  setSelectedTagFilter: React.Dispatch<React.SetStateAction<string[]>>
) {
  cmsRepository.ensureProductionCleanSlate();

  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>(() =>
    cmsRepository.getCategoryGroups()
  );
  const [tags, setTags] = useState<CategoryTag[]>(() => cmsRepository.getTags());
  const [sources, setSources] = useState<RawSource[]>(() => cmsRepository.getSources());
  const [footage, setFootage] = useState<Footage[]>(() => cmsRepository.getFootage());
  const [episodes, setEpisodes] = useState<Episode[]>(() => cmsRepository.getEpisodes());
  const [settings, setSettings] = useState<SystemSettings>(() => cmsRepository.getSettings());

  const [serverCounts, setServerCounts] = useState<ServerCollectionCounts | null>(null);
  const [archiveSummaryStats, setArchiveSummaryStats] =
    useState<ArchiveSummaryStats | null>(null);

  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isIdbHydrated, setIsIdbHydrated] = useState(false);
  const [localMutationVersion, setLocalMutationVersion] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    cmsRepository.getLastCloudSyncTimestamp()
  );

  const isWipingCloudRef = useRef<boolean>(false);
  const isApplyingMultiTabRef = useRef<boolean>(false);
  const onIdbHydratedRef = useRef<(() => void) | null>(null);

  const isIdbHydratedRef = useRef<boolean>(false);
  const hasFullCloudSourcesRef = useRef<boolean>(false);
  const hasFullCloudFootageRef = useRef<boolean>(false);
  const hasFullCloudEpisodesRef = useRef<boolean>(false);

  const episodesCountRef = useRef<number>(episodes.length);
  episodesCountRef.current = episodes.length;
  const footageCountRef = useRef<number>(footage.length);
  footageCountRef.current = footage.length;
  const sourcesCountRef = useRef<number>(sources.length);
  sourcesCountRef.current = sources.length;
  const tagsCountRef = useRef<number>(tags.length);
  tagsCountRef.current = tags.length;

  // 1. Zero-Wait Local Hydration from IndexedDB on startup
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      cmsRepository.loadSourcesAsync(),
      cmsRepository.loadFootageAsync(),
      cmsRepository.loadEpisodesAsync(),
      idbStorageService.getMeta<ArchiveSummaryStats>('archive_summary_stats'),
    ])
      .then(([idbSources, idbFootage, idbEpisodes, cachedSummary]) => {
        if (cancelled) return;

        if (!hasFullCloudSourcesRef.current && idbSources.length > 0) {
          sourcesCountRef.current = idbSources.length;
          setSources(idbSources);
        }
        if (!hasFullCloudFootageRef.current && idbFootage.length > 0) {
          footageCountRef.current = idbFootage.length;
          setFootage(idbFootage);
        }
        if (!hasFullCloudEpisodesRef.current && idbEpisodes.length > 0) {
          episodesCountRef.current = idbEpisodes.length;
          setEpisodes(idbEpisodes);
        }
        if (cachedSummary) {
          setArchiveSummaryStats((prev) => prev || cachedSummary);
        }

        isIdbHydratedRef.current = true;
        setIsIdbHydrated(true);
        onIdbHydratedRef.current?.();
      })
      .catch((err) => {
        isIdbHydratedRef.current = true;
        setIsIdbHydrated(true);
        onIdbHydratedRef.current?.();
        console.warn('IndexedDB initial hydration warning:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 1.5 Zero-Read Same-Device Multi-Tab Sync via BroadcastChannel
  useEffect(() => {
    const unsubMultiTab = subscribeMultiTabSync((msg) => {
      if (msg.type === 'OUTBOX_CHANGED') {
        void reloadOutboxFromStorage();
        return;
      }

      if (msg.type !== 'LOCAL_DATA_UPDATED' || !msg.collections?.length) {
        return;
      }

      const cols = new Set<MultiTabCollectionKey>(msg.collections);
      isApplyingMultiTabRef.current = true;

      const jobs: Promise<void>[] = [];
      if (cols.has('footage')) {
        jobs.push(cmsRepository.loadFootageAsync().then((loaded) => setFootage(loaded)));
      }
      if (cols.has('episodes')) {
        jobs.push(cmsRepository.loadEpisodesAsync().then((loaded) => setEpisodes(loaded)));
      }
      if (cols.has('sources')) {
        jobs.push(cmsRepository.loadSourcesAsync().then((loaded) => setSources(loaded)));
      }
      if (cols.has('tags')) {
        setTags(cmsRepository.getTags());
      }
      if (cols.has('categoryGroups')) {
        setCategoryGroups(cmsRepository.getCategoryGroups());
      }
      if (cols.has('settings')) {
        setSettings(cmsRepository.getSettings());
      }
      if (msg.syncTs) {
        setLastSyncedAt(msg.syncTs);
      }

      void Promise.all(jobs).finally(() => {
        window.setTimeout(() => {
          isApplyingMultiTabRef.current = false;
        }, 400);
      });
    });

    return () => {
      unsubMultiTab();
    };
  }, []);

  // 2. Authoritative Firestore Realtime Subscriptions + Smart Schema & Count Reconciliation
  useEffect(() => {
    firestoreService
      .fetchServerCollectionCounts()
      .then((counts) => {
        if (counts) {
          setServerCounts(counts);
        }
      })
      .catch(() => {});

    let isDeltaSyncing = false;
    let queuedSummary: ArchiveSummaryStats | null = null;

    const handleSubError = (sourceName: string, err: Error) => {
      setIsCloudConnected(false);
      setIsCloudSynced(false);
      console.warn(`Firestore ${sourceName} subscription note:`, err?.message || err);
    };

    const unsubPulseEmitted = registerOnPulseEmitted((mutationIso) => {
      cmsRepository.setLastCloudSyncTimestamp(mutationIso);
      setLastSyncedAt(mutationIso);
      setLocalMutationVersion((v) => v + 1);
    });

    const shouldFetchCollection = (
      col: SyncCollectionKey,
      cloudSummary: ArchiveSummaryStats,
      bufferedSinceIso: string
    ): boolean => {
      const versions = cloudSummary.collectionVersions;
      if (!versions || Object.keys(versions).length === 0) {
        return true;
      }
      const colVersion = versions[col];
      return Boolean(colVersion && colVersion > bufferedSinceIso);
    };

    const performSmartSync = async (cloudSummary: ArchiveSummaryStats) => {
      if (
        !isIdbHydratedRef.current ||
        isWipingCloudRef.current ||
        firestoreService.isBatchWriteInProgress()
      ) {
        queuedSummary = cloudSummary;
        return;
      }
      if (isDeltaSyncing) {
        queuedSummary = cloudSummary;
        return;
      }
      isDeltaSyncing = true;

      try {
        // 0a. Automatic Minimum App Version Enforcement across Chrome / Edge / Mobile:
        // If Cloud requires a newer version than this tab's loaded JS bundle, purge SW/caches & hard-reload once.
        if (
          cloudSummary.minRequiredAppVersion &&
          compareAppVersions(APP_VERSION, cloudSummary.minRequiredAppVersion) < 0
        ) {
          const lastReloadedFor =
            typeof window !== 'undefined'
              ? localStorage.getItem(VERSION_STORAGE_KEYS.LAST_HARD_RELOAD_VERSION)
              : null;
          if (lastReloadedFor !== cloudSummary.minRequiredAppVersion) {
            void hardReloadAndPurgeBrowserCaches(cloudSummary.minRequiredAppVersion);
            return;
          }
        }

        const localSyncTs = cmsRepository.getLastCloudSyncTimestamp();
        const hasLocalFootage = footageCountRef.current > 0;
        const hasLocalEpisodes = episodesCountRef.current > 0;
        const isFreshMachine = !hasLocalFootage && !hasLocalEpisodes;
        const cloudMutationTs = cloudSummary.lastMutationAt || cloudSummary.updatedAt;

        setServerCounts((prev) => ({
          totalEpisodes: cloudSummary.totalEpisodes,
          totalFootage: cloudSummary.totalFootage,
          totalSources: cloudSummary.totalSources,
          totalCategories:
            typeof cloudSummary.totalCategories === 'number'
              ? cloudSummary.totalCategories
              : prev?.totalCategories,
          fetchedAt: cloudSummary.updatedAt || new Date().toISOString(),
        }));

        // Check schema epoch, remote force-sync broadcast, and count mismatch (even when localSyncTs exists!)
        const needsSchemaUpgrade =
          cmsRepository.getLocalSchemaEpoch() !== APP_SCHEMA_EPOCH;
        const hasRemoteForceSync = Boolean(
          cloudSummary.forceFullSyncEpoch &&
            cloudSummary.forceFullSyncEpoch !== cmsRepository.getLocalForceSyncEpoch()
        );
        const hasCountMismatch =
          !isFreshMachine &&
          ((typeof cloudSummary.totalFootage === 'number' &&
            footageCountRef.current !== cloudSummary.totalFootage) ||
            (typeof cloudSummary.totalEpisodes === 'number' &&
              episodesCountRef.current !== cloudSummary.totalEpisodes) ||
            (typeof cloudSummary.totalSources === 'number' &&
              sourcesCountRef.current !== cloudSummary.totalSources) ||
            (typeof cloudSummary.totalCategories === 'number' &&
              tagsCountRef.current !== cloudSummary.totalCategories));

        const isAdminSeedMutation =
          cloudSummary.lastMutationType === 'admin:seed' ||
          cloudSummary.lastMutationType === 'admin:force_sync';

        const requiresAuthoritativeFullPull =
          isFreshMachine ||
          needsSchemaUpgrade ||
          hasRemoteForceSync ||
          hasCountMismatch ||
          isAdminSeedMutation;

        // 0b. Self-echo guard: only skip if local counts & schema epoch are already 100% in sync
        if (
          !requiresAuthoritativeFullPull &&
          cloudSummary.lastMutationBy === CLIENT_INSTANCE_ID &&
          cloudMutationTs
        ) {
          cmsRepository.setLastCloudSyncTimestamp(cloudMutationTs);
          setIsCloudConnected(true);
          setIsCloudSynced(true);
          hasFullCloudEpisodesRef.current = true;
          hasFullCloudFootageRef.current = true;
          hasFullCloudSourcesRef.current = true;
          return;
        }

        // 1. Exact timestamp match AND no count/schema mismatch -> 0 collection reads!
        if (
          !requiresAuthoritativeFullPull &&
          localSyncTs &&
          cloudMutationTs &&
          localSyncTs >= cloudMutationTs
        ) {
          setIsCloudConnected(true);
          setIsCloudSynced(true);
          hasFullCloudEpisodesRef.current = true;
          hasFullCloudFootageRef.current = true;
          hasFullCloudSourcesRef.current = true;
          return;
        }

        // 2. Authoritative Full Pull across all 5 collections whenever machine is fresh,
        // upgraded to a new APP_SCHEMA_EPOCH, received a remote Force-Sync signal, or has ANY count mismatch!
        if (requiresAuthoritativeFullPull) {
          const [allFootages, allEpisodes, allSources, allCats, allGroups] =
            await Promise.all([
              firestoreService.fetchFootagesDelta(),
              firestoreService.fetchEpisodesDelta(),
              firestoreService.fetchSourcesDelta(),
              firestoreService.fetchCategoriesDelta(),
              firestoreService.fetchCategoryGroupsDelta(),
            ]);

          const shouldReplaceEvenIfEmpty =
            hasCountMismatch ||
            needsSchemaUpgrade ||
            hasRemoteForceSync ||
            isAdminSeedMutation;

          if (allFootages.length > 0 || shouldReplaceEvenIfEmpty) {
            footageCountRef.current = allFootages.length;
            setFootage(allFootages);
            void idbStorageService.saveFootage(allFootages, true);
            hasFullCloudFootageRef.current = true;
          }
          if (allEpisodes.length > 0 || shouldReplaceEvenIfEmpty) {
            episodesCountRef.current = allEpisodes.length;
            setEpisodes(allEpisodes);
            void idbStorageService.saveEpisodes(allEpisodes, true);
            hasFullCloudEpisodesRef.current = true;
          }
          if (allSources.length > 0 || shouldReplaceEvenIfEmpty) {
            sourcesCountRef.current = allSources.length;
            setSources(allSources);
            void idbStorageService.saveSources(allSources, true);
            hasFullCloudSourcesRef.current = true;
          }
          if (allCats.length > 0 || shouldReplaceEvenIfEmpty) {
            // Purge stale browser-local deleted tag/group tombstones so Chrome & Edge always converge 1:1
            cmsRepository.clearDeletedTagIds();
            cmsRepository.clearDeletedGroupIds();
            if (allCats.length > 0) {
              cmsRepository.setCategoriesWiped(false);
            }
            const normalizedCats =
              allCats.length > 0
                ? cmsRepository.normalizeAndRepairTags(allCats, allCats.length <= 1)
                : [];
            tagsCountRef.current = normalizedCats.length;
            setTags(normalizedCats);
            cmsRepository.saveTags(normalizedCats);
          }
          if (allGroups.length > 0 || shouldReplaceEvenIfEmpty) {
            const sortedGroups = [...allGroups].sort(
              (a, b) => (a.order ?? 99) - (b.order ?? 99)
            );
            setCategoryGroups(sortedGroups);
            cmsRepository.saveCategoryGroups(sortedGroups);
          }

          const resolvedTs = cloudMutationTs || new Date().toISOString();
          cmsRepository.setLastCloudSyncTimestamp(resolvedTs);
          cmsRepository.setLocalSchemaEpoch(APP_SCHEMA_EPOCH);
          if (cloudSummary.forceFullSyncEpoch) {
            cmsRepository.setLocalForceSyncEpoch(cloudSummary.forceFullSyncEpoch);
          }
          setLastSyncedAt(resolvedTs);
          setIsCloudConnected(true);
          setIsCloudSynced(true);
          return;
        }

        // 4. Incremental Multi-Device Delta Sync + 60-Second Clock-Skew Buffer + Tombstone Deletions
        // (For legacy devices with matching counts and no localSyncTs, use a safe 24h lookback window)
        const effectiveSinceTs =
          localSyncTs || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        if (effectiveSinceTs) {
          const bufferedSince = subtractClockSkewBuffer(effectiveSinceTs);

          // 4a. Handle full remote wipes (e.g. another device triggered Clear All Clips / Categories)
          if (cloudSummary.clipsWipedAt && cloudSummary.clipsWipedAt > bufferedSince) {
            cmsRepository.clearAllClips();
            setFootage([]);
            setEpisodes([]);
            setSources([]);
          }
          if (
            cloudSummary.categoriesWipedAt &&
            cloudSummary.categoriesWipedAt > bufferedSince
          ) {
            setTags([]);
            setCategoryGroups([]);
            cmsRepository.saveTags([]);
            cmsRepository.saveCategoryGroups([]);
          }

          // 4b. Extract tombstone deletions since bufferedSince (0 Firestore reads!)
          const deletedByCol = extractDeletedIdsSince(
            cloudSummary.recentDeletes,
            bufferedSince
          );
          const deleteTimestamps = new Map<string, string>();
          (cloudSummary.recentDeletes || []).forEach((rec) => {
            if (rec?.id && rec?.col && rec?.deletedAt) {
              deleteTimestamps.set(`${rec.col}::${rec.id}`, rec.deletedAt);
            }
          });

          // 4c. Query ONLY collections whose version advanced past bufferedSince (all 5 collections supported)
          const fetchFootages = shouldFetchCollection('footages', cloudSummary, bufferedSince);
          const fetchEpisodes = shouldFetchCollection('episodes', cloudSummary, bufferedSince);
          const fetchSources = shouldFetchCollection('sources', cloudSummary, bufferedSince);
          const fetchCategories = shouldFetchCollection('categories', cloudSummary, bufferedSince);
          const fetchGroups = shouldFetchCollection('category_groups', cloudSummary, bufferedSince);

          const [
            deltaFootages,
            deltaEpisodes,
            deltaSources,
            deltaCategories,
            deltaGroups,
          ] = await Promise.all([
            fetchFootages
              ? firestoreService.fetchFootagesDelta(bufferedSince)
              : Promise.resolve([]),
            fetchEpisodes
              ? firestoreService.fetchEpisodesDelta(bufferedSince)
              : Promise.resolve([]),
            fetchSources
              ? firestoreService.fetchSourcesDelta(bufferedSince)
              : Promise.resolve([]),
            fetchCategories
              ? firestoreService.fetchCategoriesDelta(bufferedSince)
              : Promise.resolve([]),
            fetchGroups
              ? firestoreService.fetchCategoryGroupsDelta(bufferedSince)
              : Promise.resolve([]),
          ]);

          // Helper to skip removing an ID if it was freshly re-created after its tombstone timestamp
          const isStaleTombstone = (
            col: SyncCollectionKey,
            id: string,
            freshDoc?: { updatedAt?: string }
          ): boolean => {
            const delTs = deleteTimestamps.get(`${col}::${id}`);
            if (!delTs || !freshDoc?.updatedAt) return false;
            return freshDoc.updatedAt > delTs;
          };

          // Merge Footages (upserts + tombstones)
          if (deltaFootages.length > 0 || deletedByCol.footages.size > 0) {
            const freshById = new Map(deltaFootages.map((f) => [f.id, f]));
            setFootage((prev) => {
              const map = new Map(prev.map((f) => [f.id, f]));
              deltaFootages.forEach((f) => map.set(f.id, f));
              deletedByCol.footages.forEach((id) => {
                const fresh = freshById.get(id) as
                  | (Footage & { updatedAt?: string })
                  | undefined;
                if (!isStaleTombstone('footages', id, fresh)) {
                  map.delete(id);
                }
              });
              const merged = Array.from(map.values());
              cmsRepository.saveFootage(merged);
              return merged;
            });
          }

          // Merge Episodes (upserts + tombstones)
          if (deltaEpisodes.length > 0 || deletedByCol.episodes.size > 0) {
            const freshById = new Map(deltaEpisodes.map((e) => [e.id, e]));
            setEpisodes((prev) => {
              const map = new Map(prev.map((e) => [e.id, e]));
              deltaEpisodes.forEach((e) => map.set(e.id, e));
              deletedByCol.episodes.forEach((id) => {
                const fresh = freshById.get(id) as
                  | (Episode & { updatedAt?: string })
                  | undefined;
                if (!isStaleTombstone('episodes', id, fresh)) {
                  map.delete(id);
                }
              });
              const merged = Array.from(map.values());
              cmsRepository.saveEpisodes(merged);
              return merged;
            });
          }

          // Merge Sources (upserts + tombstones)
          if (deltaSources.length > 0 || deletedByCol.sources.size > 0) {
            const freshById = new Map(deltaSources.map((s) => [s.id, s]));
            setSources((prev) => {
              const map = new Map(prev.map((s) => [s.id, s]));
              deltaSources.forEach((s) => map.set(s.id, s));
              deletedByCol.sources.forEach((id) => {
                const fresh = freshById.get(id) as
                  | (RawSource & { updatedAt?: string })
                  | undefined;
                if (!isStaleTombstone('sources', id, fresh)) {
                  map.delete(id);
                }
              });
              const merged = Array.from(map.values());
              cmsRepository.saveSources(merged);
              return merged;
            });
          }

          // Merge 3-Tier Categories / Tags (upserts + tombstones)
          if (deltaCategories.length > 0 || deletedByCol.categories.size > 0) {
            const freshById = new Map(deltaCategories.map((c) => [c.id, c]));
            setTags((prev) => {
              const map = new Map(prev.map((c) => [c.id, c]));
              deltaCategories.forEach((c) => map.set(c.id, c));
              deletedByCol.categories.forEach((id) => {
                const fresh = freshById.get(id) as
                  | (CategoryTag & { updatedAt?: string })
                  | undefined;
                if (!isStaleTombstone('categories', id, fresh)) {
                  map.delete(id);
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

          // Merge Category Groups (upserts + tombstones)
          if (deltaGroups.length > 0 || deletedByCol.category_groups.size > 0) {
            const freshById = new Map(deltaGroups.map((g) => [g.id, g]));
            setCategoryGroups((prev) => {
              const map = new Map(prev.map((g) => [g.id, g]));
              deltaGroups.forEach((g) => map.set(g.id, g));
              deletedByCol.category_groups.forEach((id) => {
                const fresh = freshById.get(id) as
                  | (CategoryGroup & { updatedAt?: string })
                  | undefined;
                if (!isStaleTombstone('category_groups', id, fresh)) {
                  map.delete(id);
                }
              });
              const merged = Array.from(map.values()).sort(
                (a, b) => (a.order ?? 99) - (b.order ?? 99)
              );
              cmsRepository.saveCategoryGroups(merged);
              return merged;
            });
          }
        }

        // Advance local sync timestamp to latest cloud mutation marker
        if (cloudMutationTs) {
          cmsRepository.setLastCloudSyncTimestamp(cloudMutationTs);
          setLastSyncedAt(cloudMutationTs);
        }
        hasFullCloudEpisodesRef.current = true;
        hasFullCloudFootageRef.current = true;
        hasFullCloudSourcesRef.current = true;
        setIsCloudConnected(true);
        setIsCloudSynced(true);
      } catch (err) {
        console.warn('SmartSync error:', err);
      } finally {
        isDeltaSyncing = false;
        // Drain queued rapid pulse if another update arrived mid-sync
        if (queuedSummary && !isWipingCloudRef.current && !firestoreService.isBatchWriteInProgress()) {
          const nextSummary = queuedSummary;
          queuedSummary = null;
          void performSmartSync(nextSummary);
        }
      }
    };

    const drainQueuedSummary = () => {
      if (
        queuedSummary &&
        isIdbHydratedRef.current &&
        !isWipingCloudRef.current &&
        !firestoreService.isBatchWriteInProgress() &&
        !isDeltaSyncing
      ) {
        const nextSummary = queuedSummary;
        queuedSummary = null;
        void performSmartSync(nextSummary);
      }
    };

    onIdbHydratedRef.current = drainQueuedSummary;

    const unsubBatchComplete = firestoreService.onBatchWriteComplete(() => {
      drainQueuedSummary();
    });

    // Single document subscription: system_settings/archive_summary_stats (1 read!)
    const unsubSummaryStats = firestoreService.subscribeArchiveSummaryStats(
      (cloudSummary) => {
        if (cloudSummary) {
          updateCachedSyncPulse(cloudSummary);
          setArchiveSummaryStats(cloudSummary);
          void idbStorageService.setMeta('archive_summary_stats', cloudSummary);
          void performSmartSync(cloudSummary);
        } else {
          setIsCloudConnected(true);
          setIsCloudSynced(true);
        }
      },
      (err) => handleSubError('archive_summary_stats', err)
    );

    // Single document subscription: system_settings/global_rules (1 read!)
    const unsubSettings = firestoreService.subscribeSettings(
      (cloudSettings) => {
        if (cloudSettings) {
          const mergedSettings = { ...INITIAL_SETTINGS, ...cloudSettings };
          setSettings(mergedSettings);
          cmsRepository.saveSettings(mergedSettings);
        }
        setIsCloudConnected(true);
        setIsCloudSynced(true);
      },
      (err) => handleSubError('settings', err)
    );

    return () => {
      onIdbHydratedRef.current = null;
      unsubBatchComplete();
      unsubPulseEmitted();
      unsubSummaryStats();
      unsubSettings();
    };
  }, []);

  const {
    isManualSyncing,
    lastReport,
    setLastReport,
    manualDeltaRefresh,
    manualFullPullFromCloud,
    broadcastForceSyncAll,
  } = useCMSManualSyncActions({
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
  });

  const {
    isSeedingToCloud,
    isClearingClips,
    seedToCloud,
    clearAllClips,
    resetDemoData,
  } = useCMSAdminCloudActions({
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
  });

  const { syncHealth, flushOutboxNow, clearOutboxNow } = useCMSSyncHealth({
    localFootageCount: footage.length,
    localEpisodesCount: episodes.length,
    localSourcesCount: sources.length,
    localCategoriesCount: tags.length,
    archiveSummaryStats,
    serverCounts,
    isIdbHydrated,
    isManualSyncing,
    isSeedingToCloud,
    isClearingClips,
    lastSyncedAt,
    lastReport,
  });

  useEffect(() => {
    if (isApplyingMultiTabRef.current) return;
    cmsRepository.saveCategoryGroups(categoryGroups);
    broadcastLocalCollectionsUpdated(['categoryGroups']);
  }, [categoryGroups]);

  useEffect(() => {
    if (isApplyingMultiTabRef.current) return;
    cmsRepository.saveTags(tags);
    broadcastLocalCollectionsUpdated(['tags']);
  }, [tags]);

  useEffect(() => {
    if (!isIdbHydratedRef.current && !hasFullCloudSourcesRef.current) return;
    if (isApplyingMultiTabRef.current) return;
    cmsRepository.saveSources(sources);
    const t = window.setTimeout(() => {
      broadcastLocalCollectionsUpdated(['sources']);
    }, 340);
    return () => window.clearTimeout(t);
  }, [sources]);

  useEffect(() => {
    if (!isIdbHydratedRef.current && !hasFullCloudFootageRef.current) return;
    if (isApplyingMultiTabRef.current) return;
    cmsRepository.saveFootage(footage);
    const t = window.setTimeout(() => {
      broadcastLocalCollectionsUpdated(['footage']);
    }, 340);
    return () => window.clearTimeout(t);
  }, [footage]);

  useEffect(() => {
    if (!isIdbHydratedRef.current && !hasFullCloudEpisodesRef.current) return;
    if (isApplyingMultiTabRef.current) return;
    cmsRepository.saveEpisodes(episodes);
    const t = window.setTimeout(() => {
      broadcastLocalCollectionsUpdated(['episodes']);
    }, 340);
    return () => window.clearTimeout(t);
  }, [episodes]);

  useEffect(() => {
    if (isApplyingMultiTabRef.current) return;
    cmsRepository.saveSettings(settings);
    broadcastLocalCollectionsUpdated(['settings']);
  }, [settings]);

  return {
    categoryGroups,
    setCategoryGroups,
    tags,
    setTags,
    sources,
    setSources,
    footage,
    setFootage,
    episodes,
    setEpisodes,
    settings,
    setSettings,
    serverCounts,
    archiveSummaryStats,
    setArchiveSummaryStats,
    hasFullCloudEpisodesRef,
    hasFullCloudFootageRef,
    localMutationVersion,
    isCloudConnected,
    isCloudSynced,
    isSeedingToCloud,
    seedToCloud,
    resetDemoData,
    clearAllClips,
    isClearingClips,
    syncHealth,
    manualDeltaRefresh,
    manualFullPullFromCloud,
    broadcastForceSyncAll,
    flushOutboxNow,
    clearOutboxNow,
  };
}
