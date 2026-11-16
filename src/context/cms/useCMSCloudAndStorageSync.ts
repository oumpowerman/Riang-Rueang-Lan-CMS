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

    const unsubSummaryStats = firestoreService.subscribeArchiveSummaryStats(
      (cloudSummary) => {
        if (cloudSummary) {
          setArchiveSummaryStats(cloudSummary);
          void idbStorageService.setMeta('archive_summary_stats', cloudSummary);
        }
      },
      (err) => console.warn('Firestore archive_summary_stats warning:', err)
    );

    const unsubCategoryGroups = firestoreService.subscribeCategoryGroups(
      (cloudGroups) => {
        setIsCloudConnected(true);
        setIsCloudSynced(true);
        if (isWipingCloudRef.current || firestoreService.isBatchWriteInProgress()) {
          pendingCategoryGroupsRef.current = cloudGroups;
          return;
        }
        pendingCategoryGroupsRef.current = null;
        setCategoryGroups(cloudGroups);
        cmsRepository.saveCategoryGroups(cloudGroups);
      },
      (err) => console.warn('Firestore category_groups subscription warning:', err)
    );

    const unsubCategories = firestoreService.subscribeCategories(
      (cloudCats) => {
        const normalized = cmsRepository.normalizeAndRepairTags(
          cloudCats,
          cloudCats.length <= 1
        );
        setIsCloudConnected(true);
        setIsCloudSynced(true);
        if (isWipingCloudRef.current || firestoreService.isBatchWriteInProgress()) {
          pendingTagsRef.current = normalized;
          return;
        }
        pendingTagsRef.current = null;
        setTags(normalized);
        cmsRepository.saveTags(normalized);
      },
      (err) => console.warn('Firestore categories subscription warning:', err)
    );

    const unsubSources = firestoreService.subscribeSources(
      (cloudSources) => {
        setIsCloudConnected(true);
        setIsCloudSynced(true);
        if (isWipingCloudRef.current || firestoreService.isBatchWriteInProgress()) {
          pendingSourcesRef.current = cloudSources;
          return;
        }
        pendingSourcesRef.current = null;
        hasFullCloudSourcesRef.current = true;
        setSources(cloudSources);
        cmsRepository.saveSources(cloudSources);
      },
      (err) => console.warn('Firestore sources subscription warning:', err)
    );

    const unsubFootages = firestoreService.subscribeFootagesProgressive(
      () => footageCountRef.current > 0,
      (firstWindowFootages) => {
        if (
          !hasFullCloudFootageRef.current &&
          footageCountRef.current === 0 &&
          firstWindowFootages.length > 0
        ) {
          setIsCloudConnected(true);
          setFootage(firstWindowFootages);
        }
      },
      (cloudFootages) => {
        setIsCloudConnected(true);
        setIsCloudSynced(true);
        if (isWipingCloudRef.current || firestoreService.isBatchWriteInProgress()) {
          pendingFootageRef.current = cloudFootages;
          return;
        }
        pendingFootageRef.current = null;
        hasFullCloudFootageRef.current = true;
        setFootage(cloudFootages);
        cmsRepository.saveFootage(cloudFootages);
      },
      (err) => console.warn('Firestore footages subscription warning:', err)
    );

    const unsubEpisodes = firestoreService.subscribeEpisodesProgressive(
      () => episodesCountRef.current > 0,
      (firstWindowEpisodes) => {
        if (
          !hasFullCloudEpisodesRef.current &&
          episodesCountRef.current === 0 &&
          firstWindowEpisodes.length > 0
        ) {
          setIsCloudConnected(true);
          setEpisodes(firstWindowEpisodes);
        }
      },
      (cloudEpisodes) => {
        setIsCloudConnected(true);
        setIsCloudSynced(true);
        if (isWipingCloudRef.current || firestoreService.isBatchWriteInProgress()) {
          pendingEpisodesRef.current = cloudEpisodes;
          return;
        }
        pendingEpisodesRef.current = null;
        hasFullCloudEpisodesRef.current = true;
        setEpisodes(cloudEpisodes);
        cmsRepository.saveEpisodes(cloudEpisodes);
      },
      (err) => console.warn('Firestore episodes subscription warning:', err)
    );

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
      (err) => console.warn('Firestore settings subscription warning:', err)
    );

    return () => {
      unsubBatchComplete();
      unsubSummaryStats();
      unsubCategoryGroups();
      unsubCategories();
      unsubSources();
      unsubFootages();
      unsubEpisodes();
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
