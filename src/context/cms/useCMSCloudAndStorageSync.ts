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
import {
  idbStorageService,
  safeLocalStorageSet,
} from '../../services/idbStorageService';
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
import { useCMSManualSyncActions } from './useCMSManualSyncActions';
import { useCMSSyncHealth } from './useCMSSyncHealth';

export function useCMSCloudAndStorageSync(
  setSelectedTagFilter: React.Dispatch<React.SetStateAction<string[]>>
) {
  // Ensure one-time local production check runs before state initialization
  cmsRepository.ensureProductionCleanSlate();

  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>(() =>
    cmsRepository.getCategoryGroups()
  );
  const [tags, setTags] = useState<CategoryTag[]>(() => cmsRepository.getTags());
  const [sources, setSources] = useState<RawSource[]>(() => cmsRepository.getSources());
  const [footage, setFootage] = useState<Footage[]>(() => cmsRepository.getFootage());
  const [episodes, setEpisodes] = useState<Episode[]>(() => cmsRepository.getEpisodes());
  const [settings, setSettings] = useState<SystemSettings>(() => cmsRepository.getSettings());

  // Server-Side Counts & Central Summary Document (for instant 10,000+ row totals)
  const [serverCounts, setServerCounts] = useState<ServerCollectionCounts | null>(null);
  const [archiveSummaryStats, setArchiveSummaryStats] =
    useState<ArchiveSummaryStats | null>(null);

  // Cloud Realtime State
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isSeedingToCloud, setIsSeedingToCloud] = useState(false);
  const [isClearingClips, setIsClearingClips] = useState(false);
  const [isIdbHydrated, setIsIdbHydrated] = useState(false);
  const [localMutationVersion, setLocalMutationVersion] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    cmsRepository.getLastCloudSyncTimestamp()
  );

  const isWipingCloudRef = useRef<boolean>(false);
  const isApplyingMultiTabRef = useRef<boolean>(false);
  const onIdbHydratedRef = useRef<(() => void) | null>(null);

  // Track IndexedDB hydration and authoritative Cloud snapshot state
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
        jobs.push(
          cmsRepository.loadFootageAsync().then((loaded) => {
            setFootage(loaded);
          })
        );
      }
      if (cols.has('episodes')) {
        jobs.push(
          cmsRepository.loadEpisodesAsync().then((loaded) => {
            setEpisodes(loaded);
          })
        );
      }
      if (cols.has('sources')) {
        jobs.push(
          cmsRepository.loadSourcesAsync().then((loaded) => {
            setSources(loaded);
          })
        );
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

  // 2. Authoritative Firestore Realtime Subscriptions + Progressive First-Window Loader
  useEffect(() => {
    // Fetch instant server collection counts via getCountFromServer()
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

    // Immediately record our own emitted pulse timestamp so our tab ignores its own echo
    // and marks that THIS device made a real mutation eligible to refresh archive_summary_stats KPIs.
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
        // Legacy summary document without per-collection versions -> check all 5 collections safely
        return true;
      }
      const colVersion = versions[col];
      return Boolean(colVersion && colVersion > bufferedSinceIso);
    };

    const performSmartSync = async (cloudSummary: ArchiveSummaryStats) => {
      // Wait for IndexedDB hydration before deciding whether this machine has local cache
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
        const localSyncTs = cmsRepository.getLastCloudSyncTimestamp();
        const hasLocalFootage = footageCountRef.current > 0;
        const hasLocalEpisodes = episodesCountRef.current > 0;
        const isFreshMachine = !hasLocalFootage && !hasLocalEpisodes;
        const cloudMutationTs = cloudSummary.lastMutationAt || cloudSummary.updatedAt;

        // Populate serverCounts directly from the summary stats (zero extra getCountFromServer reads)
        setServerCounts({
          totalEpisodes: cloudSummary.totalEpisodes,
          totalFootage: cloudSummary.totalFootage,
          totalSources: cloudSummary.totalSources,
          fetchedAt: cloudSummary.updatedAt || new Date().toISOString(),
        });

        // 0. Self-echo guard: this pulse originated from THIS exact browser tab -> 0 reads!
        if (
          !isFreshMachine &&
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

        // 1. Exact timestamp match and local cache has data -> 0 collection reads!
        if (
          !isFreshMachine &&
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

        // 2. Legacy device upgrade check: if local cache exists WITHOUT localSyncTs (e.g. upgrading
        // from an older Vercel build), NEVER blindly skip syncing!
        // If local totals differ from Cloud totals -> run authoritative full pull once.
        // If totals match -> fall through to a safe 24-hour delta pull to catch recent edits.
        const legacyCountMismatch =
          !isFreshMachine &&
          !localSyncTs &&
          ((typeof cloudSummary.totalFootage === 'number' &&
            footageCountRef.current !== cloudSummary.totalFootage) ||
            (typeof cloudSummary.totalEpisodes === 'number' &&
              episodesCountRef.current !== cloudSummary.totalEpisodes) ||
            (typeof cloudSummary.totalSources === 'number' &&
              sourcesCountRef.current !== cloudSummary.totalSources));

        // 3. Cold brand-new machine OR legacy cache with count mismatch -> Full authoritative fetch across all 5 collections
        if (isFreshMachine || legacyCountMismatch) {
          const [allFootages, allEpisodes, allSources, allCats, allGroups] =
            await Promise.all([
              firestoreService.fetchFootagesDelta(),
              firestoreService.fetchEpisodesDelta(),
              firestoreService.fetchSourcesDelta(),
              firestoreService.fetchCategoriesDelta(),
              firestoreService.fetchCategoryGroupsDelta(),
            ]);

          if (allFootages.length > 0 || legacyCountMismatch) {
            setFootage(allFootages);
            cmsRepository.saveFootage(allFootages);
            hasFullCloudFootageRef.current = true;
          }
          if (allEpisodes.length > 0 || legacyCountMismatch) {
            setEpisodes(allEpisodes);
            cmsRepository.saveEpisodes(allEpisodes);
            hasFullCloudEpisodesRef.current = true;
          }
          if (allSources.length > 0 || legacyCountMismatch) {
            setSources(allSources);
            cmsRepository.saveSources(allSources);
            hasFullCloudSourcesRef.current = true;
          }
          if (allCats.length > 0) {
            const normalizedCats = cmsRepository.normalizeAndRepairTags(
              allCats,
              allCats.length <= 1
            );
            setTags(normalizedCats);
            cmsRepository.saveTags(normalizedCats);
          }
          if (allGroups.length > 0) {
            setCategoryGroups(allGroups);
            cmsRepository.saveCategoryGroups(allGroups);
          }
          const resolvedTs = cloudMutationTs || new Date().toISOString();
          cmsRepository.setLastCloudSyncTimestamp(resolvedTs);
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

  const { syncHealth, flushOutboxNow, clearOutboxNow } = useCMSSyncHealth({
    localFootageCount: footage.length,
    localEpisodesCount: episodes.length,
    localSourcesCount: sources.length,
    archiveSummaryStats,
    isIdbHydrated,
    isManualSyncing,
    isSeedingToCloud,
    isClearingClips,
    lastSyncedAt,
    lastReport,
  });

  const seedToCloud = async () => {
    setIsSeedingToCloud(true);
    try {
      await firestoreService.seedInitialDatabase(
        tags,
        footage,
        episodes,
        settings,
        categoryGroups,
        sources
      );
      const nowIso = new Date().toISOString();
      cmsRepository.setLastCloudSyncTimestamp(nowIso);
      setLastSyncedAt(nowIso);
      setLocalMutationVersion((v) => v + 1);
      setIsCloudSynced(true);
      setLastReport({
        mode: 'push_seed',
        upsertedCount:
          footage.length + episodes.length + sources.length + tags.length + categoryGroups.length,
        deletedCount: 0,
        syncedAt: nowIso,
        ok: true,
        message: 'อัปโหลดข้อมูลจากเครื่องขึ้น Cloud เรียบร้อยแล้ว',
      });
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

  const clearAllClips = async () => {
    setIsClearingClips(true);
    isWipingCloudRef.current = true;
    try {
      cmsRepository.clearAllClips();
      setSources([]);
      setFootage([]);
      setEpisodes([]);
      setSelectedTagFilter([]);

      // Also reset sync timestamps on savedDriveFolders while keeping folder URLs & names intact
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
    flushOutboxNow,
    clearOutboxNow,
  };
}
