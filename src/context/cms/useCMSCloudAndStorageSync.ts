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
  // Ensure one-time local production wipe runs before state initialization
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

  const isWipingCloudRef = useRef<boolean>(!cmsRepository.hasWipedCloudClips());

  // Firestore Realtime Subscriptions
  useEffect(() => {
    let isMounted = true;
    let hasSeededCategories = false;

    // One-time automatic cloud wipe of old demo clips on transition to production mode
    if (!cmsRepository.hasWipedCloudClips()) {
      isWipingCloudRef.current = true;
      setSources([]);
      setFootage([]);
      setEpisodes([]);
      cmsRepository.clearAllClips();

      firestoreService
        .clearAllClipsFromCloud()
        .then(() => {
          cmsRepository.markCloudClipsWiped();
        })
        .catch((err) => {
          console.warn('Initial production cloud clip wipe warning:', err);
          cmsRepository.markCloudClipsWiped();
        })
        .finally(() => {
          if (isMounted) {
            isWipingCloudRef.current = false;
          }
        });
    }

    let isRepairingCloudCategories = false;

    const unsubCategoryGroups = firestoreService.subscribeCategoryGroups(
      (cloudGroups) => {
        if (cmsRepository.isCategoriesWiped() && cloudGroups.length === 0) {
          setCategoryGroups([]);
          setIsCloudConnected(true);
          setIsCloudSynced(true);
          return;
        }

        if (cloudGroups.length > 0) {
          setCategoryGroups((prevGroups) => {
            const { groups: reconciledGroups } = cmsRepository.reconcileCategoryGroups(
              cloudGroups,
              prevGroups
            );
            return reconciledGroups;
          });
        }
        setIsCloudConnected(true);
        setIsCloudSynced(true);
      },
      (err) => console.warn('Firestore category_groups subscription warning:', err)
    );

    const unsubCategories = firestoreService.subscribeCategories(
      (cloudCats) => {
        if (cmsRepository.isCategoriesWiped() && cloudCats.length === 0) {
          setTags([]);
          setIsCloudConnected(true);
          setIsCloudSynced(true);
          return;
        }

        if (cloudCats.length > 0) {
          hasSeededCategories = true;
          setTags((prevTags) => {
            const { tags: reconciledTags, needsCloudRepair } =
              cmsRepository.reconcileTagsWithHierarchy(cloudCats, prevTags);

            if (needsCloudRepair && !isRepairingCloudCategories) {
              isRepairingCloudCategories = true;
              const currentGroups = cmsRepository.getCategoryGroups();
              firestoreService
                .restoreCategoriesToCloud(currentGroups, reconciledTags)
                .catch((err) => console.warn('Cloud category hierarchy auto-repair warning:', err))
                .finally(() => {
                  isRepairingCloudCategories = false;
                });
            }

            return reconciledTags;
          });
        } else if (!hasSeededCategories && !cmsRepository.isCategoriesWiped()) {
          hasSeededCategories = true;
          // Seed ONLY 3-tier categories and settings if Firestore has no categories yet (never seed demo clips)
          const initialGroups = cmsRepository.getCategoryGroups();
          const initialTags = cmsRepository.getTags();
          const initialSettings = cmsRepository.getSettings();
          firestoreService
            .seedInitialDatabase(
              initialTags,
              [],
              [],
              initialSettings,
              initialGroups
            )
            .then(() => setIsCloudSynced(true))
            .catch((err) => console.warn('Category structure sync to Firestore warning:', err));
        }
        setIsCloudConnected(true);
        setIsCloudSynced(true);
      },
      (err) => console.warn('Firestore categories subscription warning:', err)
    );

    const unsubFootages = firestoreService.subscribeFootages(
      (cloudFootages) => {
        if (isWipingCloudRef.current) {
          return;
        }
        setFootage(cloudFootages);
        setIsCloudConnected(true);
        setIsCloudSynced(true);
      },
      (err) => console.warn('Firestore footages subscription warning:', err)
    );

    const unsubEpisodes = firestoreService.subscribeEpisodes(
      (cloudEpisodes) => {
        if (isWipingCloudRef.current) {
          return;
        }
        setEpisodes(cloudEpisodes);
        setIsCloudConnected(true);
        setIsCloudSynced(true);
      },
      (err) => console.warn('Firestore episodes subscription warning:', err)
    );

    const unsubSettings = firestoreService.subscribeSettings(
      (cloudSettings) => {
        if (cloudSettings) {
          setSettings({ ...INITIAL_SETTINGS, ...cloudSettings });
        }
        setIsCloudConnected(true);
        setIsCloudSynced(true);
      },
      (err) => console.warn('Firestore settings subscription warning:', err)
    );

    return () => {
      isMounted = false;
      unsubCategoryGroups();
      unsubCategories();
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
        categoryGroups
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
