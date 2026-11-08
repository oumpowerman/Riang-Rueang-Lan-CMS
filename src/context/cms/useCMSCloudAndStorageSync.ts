import React, { useEffect, useRef, useState } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { cmsRepository } from '../../services/cmsRepository';
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

  // Cloud Realtime State
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isSeedingToCloud, setIsSeedingToCloud] = useState(false);
  const [isClearingClips, setIsClearingClips] = useState(false);

  const isWipingCloudRef = useRef<boolean>(false);

  // Buffer latest Firestore snapshots received while a multi-chunk batch write is in progress
  // so partial 400-item chunks never overwrite the UI mid-upload, and flush the final authoritative
  // snapshot once all chunks have committed.
  const pendingCategoryGroupsRef = useRef<CategoryGroup[] | null>(null);
  const pendingTagsRef = useRef<CategoryTag[] | null>(null);
  const pendingSourcesRef = useRef<RawSource[] | null>(null);
  const pendingFootageRef = useRef<Footage[] | null>(null);
  const pendingEpisodesRef = useRef<Episode[] | null>(null);

  // Authoritative Firestore Realtime Subscriptions
  // Firestore is the Single Source of Truth across all devices/tabs.
  // When any item is added, updated, or deleted on Device A, Device B immediately
  // receives the exact Firestore collection state and overwrites its localStorage cache.
  useEffect(() => {
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
        const normalized = pendingTagsRef.current;
        pendingTagsRef.current = null;
        setTags(normalized);
        cmsRepository.saveTags(normalized);
      }
      if (pendingSourcesRef.current !== null) {
        const cloudSources = pendingSourcesRef.current;
        pendingSourcesRef.current = null;
        setSources(cloudSources);
        cmsRepository.saveSources(cloudSources);
      }
      if (pendingFootageRef.current !== null) {
        const cloudFootages = pendingFootageRef.current;
        pendingFootageRef.current = null;
        setFootage(cloudFootages);
        cmsRepository.saveFootage(cloudFootages);
      }
      if (pendingEpisodesRef.current !== null) {
        const cloudEpisodes = pendingEpisodesRef.current;
        pendingEpisodesRef.current = null;
        setEpisodes(cloudEpisodes);
        cmsRepository.saveEpisodes(cloudEpisodes);
      }
    };

    const unsubBatchComplete = firestoreService.onBatchWriteComplete(() => {
      flushPendingSnapshots();
    });

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
        const normalized = cloudCats.map((t) => ({
          ...t,
          tier: (t.tier === 2 || !!t.parentId ? 2 : 1) as 1 | 2,
          parentId: t.tier === 2 || !!t.parentId ? t.parentId || null : null,
          groupId: t.groupId || `GRP-${t.groupType || 'GENERAL'}`,
        }));
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
        setSources(cloudSources);
        cmsRepository.saveSources(cloudSources);
      },
      (err) => console.warn('Firestore sources subscription warning:', err)
    );

    const unsubFootages = firestoreService.subscribeFootages(
      (cloudFootages) => {
        setIsCloudConnected(true);
        setIsCloudSynced(true);
        if (isWipingCloudRef.current || firestoreService.isBatchWriteInProgress()) {
          pendingFootageRef.current = cloudFootages;
          return;
        }
        pendingFootageRef.current = null;
        setFootage(cloudFootages);
        cmsRepository.saveFootage(cloudFootages);
      },
      (err) => console.warn('Firestore footages subscription warning:', err)
    );

    const unsubEpisodes = firestoreService.subscribeEpisodes(
      (cloudEpisodes) => {
        setIsCloudConnected(true);
        setIsCloudSynced(true);
        if (isWipingCloudRef.current || firestoreService.isBatchWriteInProgress()) {
          pendingEpisodesRef.current = cloudEpisodes;
          return;
        }
        pendingEpisodesRef.current = null;
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
    cmsRepository.saveSources(sources);
  }, [sources]);

  useEffect(() => {
    cmsRepository.saveFootage(footage);
  }, [footage]);

  useEffect(() => {
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
    isCloudConnected,
    isCloudSynced,
    isSeedingToCloud,
    seedToCloud,
    resetDemoData,
    clearAllClips,
    isClearingClips,
  };
}
