import React, { useEffect, useRef, useState } from 'react';
import {
  ArchiveSummaryStats,
  firestoreService,
  ServerCollectionCounts,
} from '../../firebase/firestoreService';
import { cmsRepository } from '../../services/cmsRepository';
import {
  idbStorageService,
  safeLocalStorageSet,
} from '../../services/idbStorageService';
import { INITIAL_SETTINGS } from '../../services/seedData';
import { Episode } from '../../types/episode.types';
import { Footage } from '../../types/footage.types';
import { RawSource } from '../../types/source.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../../types/tag.types';

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

  const isWipingCloudRef = useRef<boolean>(false);

  // Track IndexedDB hydration and authoritative Cloud snapshot state
  const isIdbHydratedRef = useRef<boolean>(false);
  const hasFullCloudSourcesRef = useRef<boolean>(false);
  const hasFullCloudFootageRef = useRef<boolean>(false);
  const hasFullCloudEpisodesRef = useRef<boolean>(false);

  const episodesCountRef = useRef<number>(episodes.length);
  episodesCountRef.current = episodes.length;
  const footageCountRef = useRef<number>(footage.length);
  footageCountRef.current = footage.length;

  // Buffer latest Firestore snapshots received while a multi-chunk batch write is in progress
  // so partial 400-item chunks never overwrite the UI mid-upload, and flush the final authoritative
  // snapshot once all chunks have committed.
  const pendingCategoryGroupsRef = useRef<CategoryGroup[] | null>(null);
  const pendingTagsRef = useRef<CategoryTag[] | null>(null);
  const pendingSourcesRef = useRef<RawSource[] | null>(null);
  const pendingFootageRef = useRef<Footage[] | null>(null);
  const pendingEpisodesRef = useRef<Episode[] | null>(null);

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
        isIdbHydratedRef.current = true;

        if (!hasFullCloudSourcesRef.current && idbSources.length > 0) {
          setSources(idbSources);
        }
        if (!hasFullCloudFootageRef.current && idbFootage.length > 0) {
          setFootage(idbFootage);
        }
        if (!hasFullCloudEpisodesRef.current && idbEpisodes.length > 0) {
          setEpisodes(idbEpisodes);
        }
        if (cachedSummary) {
          setArchiveSummaryStats((prev) => prev || cachedSummary);
        }
      })
      .catch((err) => {
        isIdbHydratedRef.current = true;
        console.warn('IndexedDB initial hydration warning:', err);
      });

    return () => {
      cancelled = true;
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

    const flushPendingSnapshots = () => {
      if (isWipingCloudRef.current || firestoreService.isBatchWriteInProgress()) {
        return;
      }
      if (pendingCategoryGroupsRef.current !== null) {
        const groups = pendingCategoryGroupsRef.current;
        pendingCategoryGroupsRef.current = null;
        setCategoryGroups(groups);
        cmsRepository.saveCategoryGroups(groups);
      }
      if (pendingTagsRef.current !== null) {
        const normalized = cmsRepository.normalizeAndRepairTags(
          pendingTagsRef.current,
          pendingTagsRef.current.length <= 1
        );
        pendingTagsRef.current = null;
        setTags(normalized);
        cmsRepository.saveTags(normalized);
      }
      if (pendingSourcesRef.current !== null) {
        const cloudSources = pendingSourcesRef.current;
        pendingSourcesRef.current = null;
        hasFullCloudSourcesRef.current = true;
        setSources(cloudSources);
        cmsRepository.saveSources(cloudSources);
      }
      if (pendingFootageRef.current !== null) {
        const cloudFootages = pendingFootageRef.current;
        pendingFootageRef.current = null;
        hasFullCloudFootageRef.current = true;
        setFootage(cloudFootages);
        cmsRepository.saveFootage(cloudFootages);
      }
      if (pendingEpisodesRef.current !== null) {
        const cloudEpisodes = pendingEpisodesRef.current;
        pendingEpisodesRef.current = null;
        hasFullCloudEpisodesRef.current = true;
        setEpisodes(cloudEpisodes);
        cmsRepository.saveEpisodes(cloudEpisodes);
      }
    };

    const unsubBatchComplete = firestoreService.onBatchWriteComplete(() => {
      flushPendingSnapshots();
    });

    const handleSubError = (sourceName: string, err: Error) => {
      setIsCloudConnected(false);
      setIsCloudSynced(false);
      console.warn(`Firestore ${sourceName} subscription note:`, err?.message || err);
    };

    let isDeltaSyncing = false;

    const performSmartSync = async (cloudSummary: ArchiveSummaryStats) => {
      if (isDeltaSyncing || isWipingCloudRef.current || firestoreService.isBatchWriteInProgress()) {
        return;
      }
      isDeltaSyncing = true;

      try {
        const localSyncTs = cmsRepository.getLastCloudSyncTimestamp();
        const hasLocalFootage = footageCountRef.current > 0;
        const hasLocalEpisodes = episodesCountRef.current > 0;
        const isFreshMachine = !hasLocalFootage && !hasLocalEpisodes;

        // Populate serverCounts directly from the summary stats (zero extra getCountFromServer reads)
        setServerCounts({
          totalEpisodes: cloudSummary.totalEpisodes,
          totalFootage: cloudSummary.totalFootage,
          totalSources: cloudSummary.totalSources,
          fetchedAt: cloudSummary.updatedAt || new Date().toISOString(),
        });

        // 1. If timestamps match and local cache has data -> EXACT MATCH! 0 collection reads!
        if (!isFreshMachine && localSyncTs && cloudSummary.updatedAt && localSyncTs === cloudSummary.updatedAt) {
          setIsCloudConnected(true);
          setIsCloudSynced(true);
          hasFullCloudEpisodesRef.current = true;
          hasFullCloudFootageRef.current = true;
          hasFullCloudSourcesRef.current = true;
          return;
        }

        // 2. If local cache already has data but timestamp wasn't set yet, adopt cloud timestamp
        if (!isFreshMachine && !localSyncTs && cloudSummary.updatedAt) {
          cmsRepository.setLastCloudSyncTimestamp(cloudSummary.updatedAt);
          setIsCloudConnected(true);
          setIsCloudSynced(true);
          hasFullCloudEpisodesRef.current = true;
          hasFullCloudFootageRef.current = true;
          hasFullCloudSourcesRef.current = true;
          return;
        }

        // 3. If cold brand-new machine with empty local cache -> Full initial seed/fetch
        if (isFreshMachine) {
          const [allFootages, allEpisodes, allSources, allCats, allGroups] = await Promise.all([
            firestoreService.fetchFootagesDelta(),
            firestoreService.fetchEpisodesDelta(),
            firestoreService.fetchSourcesDelta(),
            firestoreService.fetchCategoriesDelta(),
            firestoreService.fetchCategoryGroupsDelta(),
          ]);

          if (allFootages.length > 0) {
            setFootage(allFootages);
            cmsRepository.saveFootage(allFootages);
            hasFullCloudFootageRef.current = true;
          }
          if (allEpisodes.length > 0) {
            setEpisodes(allEpisodes);
            cmsRepository.saveEpisodes(allEpisodes);
            hasFullCloudEpisodesRef.current = true;
          }
          if (allSources.length > 0) {
            setSources(allSources);
            cmsRepository.saveSources(allSources);
            hasFullCloudSourcesRef.current = true;
          }
          if (allCats.length > 0) {
            setTags(allCats);
            cmsRepository.saveTags(allCats);
          }
          if (allGroups.length > 0) {
            setCategoryGroups(allGroups);
            cmsRepository.saveCategoryGroups(allGroups);
          }
          cmsRepository.setLastCloudSyncTimestamp(cloudSummary.updatedAt || new Date().toISOString());
          setIsCloudConnected(true);
          setIsCloudSynced(true);
          return;
        }

        // 4. Incremental Delta Sync (Only fetch items modified since localSyncTs)
        if (localSyncTs) {
          const [deltaFootages, deltaEpisodes, deltaSources] = await Promise.all([
            firestoreService.fetchFootagesDelta(localSyncTs),
            firestoreService.fetchEpisodesDelta(localSyncTs),
            firestoreService.fetchSourcesDelta(localSyncTs),
          ]);

          if (deltaFootages.length > 0) {
            setFootage((prev) => {
              const map = new Map(prev.map((f) => [f.id, f]));
              deltaFootages.forEach((f) => map.set(f.id, f));
              const merged = Array.from(map.values());
              cmsRepository.saveFootage(merged);
              return merged;
            });
          }
          if (deltaEpisodes.length > 0) {
            setEpisodes((prev) => {
              const map = new Map(prev.map((e) => [e.id, e]));
              deltaEpisodes.forEach((e) => map.set(e.id, e));
              const merged = Array.from(map.values());
              cmsRepository.saveEpisodes(merged);
              return merged;
            });
          }
          if (deltaSources.length > 0) {
            setSources((prev) => {
              const map = new Map(prev.map((s) => [s.id, s]));
              deltaSources.forEach((s) => map.set(s.id, s));
              const merged = Array.from(map.values());
              cmsRepository.saveSources(merged);
              return merged;
            });
          }
        }

        // Mark timestamp as up to date
        if (cloudSummary.updatedAt) {
          cmsRepository.setLastCloudSyncTimestamp(cloudSummary.updatedAt);
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
      }
    };

    // Single document subscription: system_settings/archive_summary_stats (1 read!)
    const unsubSummaryStats = firestoreService.subscribeArchiveSummaryStats(
      (cloudSummary) => {
        if (cloudSummary) {
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
      unsubBatchComplete();
      unsubSummaryStats();
      unsubSettings();
    };
  }, []);

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
      setIsCloudSynced(true);
    } catch (err) {
      console.error('Manual cloud sync error:', err);
    } finally {
      setIsSeedingToCloud(false);
    }
  };

  useEffect(() => {
    cmsRepository.saveCategoryGroups(categoryGroups);
  }, [categoryGroups]);

  useEffect(() => {
    cmsRepository.saveTags(tags);
  }, [tags]);

  useEffect(() => {
    if (!isIdbHydratedRef.current && !hasFullCloudSourcesRef.current) return;
    cmsRepository.saveSources(sources);
  }, [sources]);

  useEffect(() => {
    if (!isIdbHydratedRef.current && !hasFullCloudFootageRef.current) return;
    cmsRepository.saveFootage(footage);
  }, [footage]);

  useEffect(() => {
    if (!isIdbHydratedRef.current && !hasFullCloudEpisodesRef.current) return;
    cmsRepository.saveEpisodes(episodes);
  }, [episodes]);

  useEffect(() => {
    cmsRepository.saveSettings(settings);
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
      setIsCloudSynced(true);
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
    isCloudConnected,
    isCloudSynced,
    isSeedingToCloud,
    seedToCloud,
    resetDemoData,
    clearAllClips,
    isClearingClips,
  };
}
