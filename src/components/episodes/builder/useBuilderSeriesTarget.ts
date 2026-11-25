import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Episode } from '../../../types/episode.types';
import { CategoryTag } from '../../../types/tag.types';
import { BuilderSeriesCatalogItem, BuilderSeriesMode } from './builder.types';
import {
  buildBuilderSeriesCatalog,
  buildCanonicalSeriesKeyFromName,
  buildCanonicalSeriesTitle,
  buildStandardizedSeriesEpisodeTitle,
  cleanSeriesDisplayName,
  findExistingSeriesByName,
  findSuggestedSeriesForTag,
  replaceEpisodeNoInCustomTitle,
} from './builderSeriesEngine';

interface UseBuilderSeriesTargetParams {
  episodes: Episode[];
  tags: CategoryTag[];
  tagMap: Record<string, CategoryTag>;
  customSeriesTagMap?: Record<string, string[]>;
  mainCategoryTagId: string;
}

export function useBuilderSeriesTarget({
  episodes,
  tags,
  tagMap,
  customSeriesTagMap,
  mainCategoryTagId,
}: UseBuilderSeriesTargetParams) {
  const seriesCatalog = useMemo(
    () => buildBuilderSeriesCatalog(episodes, tags, tagMap, customSeriesTagMap),
    [episodes, tags, tagMap, customSeriesTagMap]
  );

  const seriesCatalogMap = useMemo(() => {
    const map: Record<string, BuilderSeriesCatalogItem> = {};
    for (const item of seriesCatalog) {
      map[item.seriesKey] = item;
    }
    return map;
  }, [seriesCatalog]);

  const defaultTagName = tagMap[mainCategoryTagId]?.name || 'คลิปเด็ด';

  const [seriesMode, setSeriesMode] = useState<BuilderSeriesMode>('NEW');
  const [selectedSeriesKey, setSelectedSeriesKey] = useState<string | null>(
    null
  );
  const [customSeriesName, setCustomSeriesName] = useState<string>(() =>
    cleanSeriesDisplayName(defaultTagName)
  );
  const [isCustomSeriesNameEdited, setIsCustomSeriesNameEdited] =
    useState<boolean>(false);
  const [manualEpisodeNo, setManualEpisodeNo] = useState<number | null>(null);
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] =
    useState<boolean>(false);

  const [title, setTitle] = useState<string>(() =>
    buildStandardizedSeriesEpisodeTitle(defaultTagName, 1)
  );

  // Track pending series key right after saving a brand-new series so we lock onto it
  // as soon as `episodes` updates with the newly created episode.
  const pendingLockSeriesKeyRef = useRef<string | null>(null);

  const activeExistingSeries: BuilderSeriesCatalogItem | null = useMemo(() => {
    if (seriesMode !== 'EXISTING' || !selectedSeriesKey) return null;
    return seriesCatalogMap[selectedSeriesKey] || null;
  }, [seriesMode, selectedSeriesKey, seriesCatalogMap]);

  const effectiveSeriesName = useMemo(() => {
    if (seriesMode === 'EXISTING' && activeExistingSeries) {
      return activeExistingSeries.seriesName;
    }
    const trimmedCustom = cleanSeriesDisplayName(customSeriesName);
    if (trimmedCustom) return trimmedCustom;
    return cleanSeriesDisplayName(tagMap[mainCategoryTagId]?.name || 'คลิปเด็ด');
  }, [
    seriesMode,
    activeExistingSeries,
    customSeriesName,
    tagMap,
    mainCategoryTagId,
  ]);

  const effectiveSeriesKey = useMemo(() => {
    if (seriesMode === 'EXISTING' && activeExistingSeries) {
      return activeExistingSeries.seriesKey;
    }
    return buildCanonicalSeriesKeyFromName(effectiveSeriesName);
  }, [seriesMode, activeExistingSeries, effectiveSeriesName]);

  const effectiveSeriesTitle = useMemo(
    () => buildCanonicalSeriesTitle(effectiveSeriesName),
    [effectiveSeriesName]
  );

  const autoEpisodeNo = useMemo(() => {
    if (seriesMode === 'EXISTING' && activeExistingSeries) {
      return activeExistingSeries.nextEpisodeNo;
    }
    return 1;
  }, [seriesMode, activeExistingSeries]);

  const effectiveEpisodeNo =
    manualEpisodeNo !== null ? Math.max(1, manualEpisodeNo) : autoEpisodeNo;

  const isManualEpisodeNo =
    manualEpisodeNo !== null && manualEpisodeNo !== autoEpisodeNo;

  const isDuplicateEpisodeNo = useMemo(() => {
    if (seriesMode !== 'EXISTING' || !activeExistingSeries) return false;
    return activeExistingSeries.existingEpisodeNos.has(effectiveEpisodeNo);
  }, [seriesMode, activeExistingSeries, effectiveEpisodeNo]);

  const existingSeriesEpisodesCount = activeExistingSeries?.episodeCount || 0;
  const latestSeriesEpisodeNo = activeExistingSeries?.maxEpisodeNo || 0;

  const standardizedTitlePreview = useMemo(
    () =>
      buildStandardizedSeriesEpisodeTitle(
        effectiveSeriesName,
        effectiveEpisodeNo
      ),
    [effectiveSeriesName, effectiveEpisodeNo]
  );

  const matchingExistingSeriesForNewName = useMemo(() => {
    if (seriesMode !== 'NEW') return null;
    const candidate = customSeriesName.trim();
    if (candidate.length < 2) return null;
    return findExistingSeriesByName(candidate, seriesCatalog);
  }, [seriesMode, customSeriesName, seriesCatalog]);

  const suggestedSeriesForActiveTag = useMemo(
    () =>
      findSuggestedSeriesForTag(
        mainCategoryTagId,
        tagMap[mainCategoryTagId]?.name,
        seriesCatalog,
        seriesMode === 'EXISTING' ? selectedSeriesKey : null
      ),
    [
      mainCategoryTagId,
      tagMap,
      seriesCatalog,
      seriesMode,
      selectedSeriesKey,
    ]
  );

  // Sync newly saved series lock once `episodes` includes the newly saved record
  useEffect(() => {
    const pendingKey = pendingLockSeriesKeyRef.current;
    if (!pendingKey) return;
    const found = seriesCatalogMap[pendingKey];
    if (found) {
      pendingLockSeriesKeyRef.current = null;
      setSeriesMode('EXISTING');
      setSelectedSeriesKey(found.seriesKey);
      setManualEpisodeNo(null);
      setIsTitleManuallyEdited(false);
      setTitle(
        buildStandardizedSeriesEpisodeTitle(
          found.seriesName,
          found.nextEpisodeNo
        )
      );
    }
  }, [seriesCatalogMap]);

  // Keep auto-generated title synced when autoEpisodeNo or seriesName changes (e.g., Cloud sync or after save)
  useEffect(() => {
    if (!isTitleManuallyEdited) {
      setTitle(standardizedTitlePreview);
    }
  }, [isTitleManuallyEdited, standardizedTitlePreview]);

  const selectExistingSeries = useCallback(
    (seriesKey: string) => {
      const target = seriesCatalogMap[seriesKey];
      if (!target) return null;
      pendingLockSeriesKeyRef.current = null;
      setSeriesMode('EXISTING');
      setSelectedSeriesKey(target.seriesKey);
      setManualEpisodeNo(null);
      setIsTitleManuallyEdited(false);
      setTitle(
        buildStandardizedSeriesEpisodeTitle(
          target.seriesName,
          target.nextEpisodeNo
        )
      );
      return target;
    },
    [seriesCatalogMap]
  );

  const switchToNewSeries = useCallback(
    (initialName?: string) => {
      pendingLockSeriesKeyRef.current = null;
      const fallbackName = cleanSeriesDisplayName(
        initialName !== undefined
          ? initialName
          : tagMap[mainCategoryTagId]?.name || ''
      );
      setSeriesMode('NEW');
      setSelectedSeriesKey(null);
      setCustomSeriesName(fallbackName);
      setIsCustomSeriesNameEdited(Boolean(initialName && initialName.trim()));
      setManualEpisodeNo(null);
      setIsTitleManuallyEdited(false);
      setTitle(
        buildStandardizedSeriesEpisodeTitle(fallbackName || 'คลิปเด็ด', 1)
      );
    },
    [tagMap, mainCategoryTagId]
  );

  const updateCustomSeriesName = useCallback(
    (val: string) => {
      pendingLockSeriesKeyRef.current = null;
      setSeriesMode('NEW');
      setSelectedSeriesKey(null);
      setCustomSeriesName(val);
      setIsCustomSeriesNameEdited(val.trim().length > 0);
      if (!isTitleManuallyEdited) {
        const nextName =
          cleanSeriesDisplayName(val) ||
          tagMap[mainCategoryTagId]?.name ||
          'คลิปเด็ด';
        const nextEp = manualEpisodeNo !== null ? Math.max(1, manualEpisodeNo) : 1;
        setTitle(buildStandardizedSeriesEpisodeTitle(nextName, nextEp));
      }
    },
    [isTitleManuallyEdited, manualEpisodeNo, tagMap, mainCategoryTagId]
  );

  const setEpisodeNo = useCallback(
    (rawNum: number) => {
      const clamped = Math.max(1, Math.floor(Number.isFinite(rawNum) ? rawNum : 1));
      setManualEpisodeNo(clamped === autoEpisodeNo ? null : clamped);
      if (!isTitleManuallyEdited) {
        setTitle(
          buildStandardizedSeriesEpisodeTitle(effectiveSeriesName, clamped)
        );
      } else {
        setTitle((prev) => {
          const replaced = replaceEpisodeNoInCustomTitle(prev, clamped);
          return replaced !== null ? replaced : prev;
        });
      }
    },
    [autoEpisodeNo, effectiveSeriesName, isTitleManuallyEdited]
  );

  const resetAutoEpisodeNo = useCallback(() => {
    setManualEpisodeNo(null);
    if (!isTitleManuallyEdited) {
      setTitle(
        buildStandardizedSeriesEpisodeTitle(effectiveSeriesName, autoEpisodeNo)
      );
    } else {
      setTitle((prev) => {
        const replaced = replaceEpisodeNoInCustomTitle(prev, autoEpisodeNo);
        return replaced !== null ? replaced : prev;
      });
    }
  }, [autoEpisodeNo, effectiveSeriesName, isTitleManuallyEdited]);

  const handleUserChangeTitle = useCallback((val: string) => {
    setTitle(val);
    setIsTitleManuallyEdited(true);
  }, []);

  const applyCustomPreselectTitle = useCallback((val: string) => {
    setTitle(val);
    setIsTitleManuallyEdited(true);
  }, []);

  const resetTitleToStandard = useCallback(() => {
    setIsTitleManuallyEdited(false);
    setTitle(standardizedTitlePreview);
  }, [standardizedTitlePreview]);

  /**
   * Called when user picks a new primary tag in Step 1.
   * Preserves locked EXISTING series; if in NEW mode and user hasn't typed a custom name,
   * smoothly updates the default new series name to match the newly chosen tag.
   */
  const syncDefaultForPrimaryTag = useCallback(
    (primaryTagId: string) => {
      if (seriesMode === 'EXISTING') return;
      if (isCustomSeriesNameEdited) return;
      const nextTagName = cleanSeriesDisplayName(
        tagMap[primaryTagId]?.name || 'คลิปเด็ด'
      );
      setCustomSeriesName(nextTagName);
      if (!isTitleManuallyEdited) {
        const epNo = manualEpisodeNo !== null ? manualEpisodeNo : 1;
        setTitle(buildStandardizedSeriesEpisodeTitle(nextTagName, epNo));
      }
    },
    [
      seriesMode,
      isCustomSeriesNameEdited,
      tagMap,
      isTitleManuallyEdited,
      manualEpisodeNo,
    ]
  );

  /**
   * Called when clicking "ทำตอนต่อไปในซีรีส์นี้ทันที" after saving an episode.
   * Locks onto the saved seriesKey (even if it was just created as NEW EP.1) so EP advances automatically.
   */
  const prepareNextEpisodeAfterSave = useCallback(
    (savedSeriesKey: string, savedSeriesName: string, savedEpNo: number) => {
      const existing = seriesCatalogMap[savedSeriesKey];
      if (existing) {
        setSeriesMode('EXISTING');
        setSelectedSeriesKey(existing.seriesKey);
        setManualEpisodeNo(null);
        setIsTitleManuallyEdited(false);
        const nextEp = Math.max(existing.nextEpisodeNo, savedEpNo + 1);
        setTitle(
          buildStandardizedSeriesEpisodeTitle(existing.seriesName, nextEp)
        );
      } else {
        // Wait for React state of `episodes` to include the just-saved episode
        pendingLockSeriesKeyRef.current = savedSeriesKey;
        setSeriesMode('EXISTING');
        setSelectedSeriesKey(savedSeriesKey);
        setManualEpisodeNo(null);
        setIsTitleManuallyEdited(false);
        setTitle(
          buildStandardizedSeriesEpisodeTitle(savedSeriesName, savedEpNo + 1)
        );
      }
    },
    [seriesCatalogMap]
  );

  return {
    seriesCatalog,
    seriesCatalogMap,
    seriesMode,
    selectedSeriesKey,
    activeExistingSeries,
    customSeriesName,
    effectiveSeriesName,
    effectiveSeriesKey,
    effectiveSeriesTitle,
    autoEpisodeNo,
    effectiveEpisodeNo,
    isManualEpisodeNo,
    isDuplicateEpisodeNo,
    existingSeriesEpisodesCount,
    latestSeriesEpisodeNo,
    title,
    isTitleManuallyEdited,
    standardizedTitlePreview,
    matchingExistingSeriesForNewName,
    suggestedSeriesForActiveTag,
    selectExistingSeries,
    switchToNewSeries,
    updateCustomSeriesName,
    setEpisodeNo,
    resetAutoEpisodeNo,
    handleUserChangeTitle,
    applyCustomPreselectTitle,
    resetTitleToStandard,
    syncDefaultForPrimaryTag,
    prepareNextEpisodeAfterSave,
  };
}
