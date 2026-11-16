import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCMS } from '../../../../context/CMSContext';
import { useDebounce } from '../../../../hooks/useDebounce';
import {
  validateEpisodeStandard,
  auditEpisodesQuality,
  evaluateEpisodeCompleteness,
  EpisodeQualityAuditSummary,
  EpisodeCompletenessFilter,
  THAI_COLLATOR,
  NUMERIC_ID_COLLATOR,
} from '../../../../utils/episodeValidator';
import type {
  Episode,
  EpisodeProductionTarget,
} from '../../../../types/episode.types';
import type { CategoryTag } from '../../../../types/tag.types';
import type {
  CategoryRankingItem,
  EpisodeFootageMix,
} from './useMasterArchiveMetrics';

import {
  getEpisodeSmartSearchIndex,
  matchesSmartSearchTokens,
  normalizeCompactSearchText,
  parseSmartSearchQuery,
} from '../../../../utils/smartSearchEngine';

export type ArchiveTab = 'EPISODES' | 'SERIES_SHELF';
export type ViewMode = 'CARDS' | 'TABLE';
export type SortOption =
  | 'DATE_DESC'
  | 'DATE_ASC'
  | 'ID_DESC'
  | 'ID_ASC'
  | 'TITLE_ASC'
  | 'TITLE_DESC'
  | 'SERIES_EP_DESC'
  | 'NEW_MIX_DESC';

interface UseMasterArchiveFilterProps {
  categoryRanking: CategoryRankingItem[];
  unproducedSeriesRanking: CategoryRankingItem[];
  episodeSeriesKeyMap: Record<string, string>;
  episodeFootageTagsMap: Record<string, Set<string>>;
  getEpisodeFootageMix: (ep: Episode) => EpisodeFootageMix;
}

export function useMasterArchiveFilter({
  categoryRanking,
  unproducedSeriesRanking,
  episodeSeriesKeyMap,
  episodeFootageTagsMap,
  getEpisodeFootageMix,
}: UseMasterArchiveFilterProps) {
  const { episodes, tags, tagMap, serverCounts, archiveSummaryStats } = useCMS();

  const [archiveTab, setArchiveTab] = useState<ArchiveTab>('EPISODES');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('ALL');
  const [productionTargetFilter, setProductionTargetFilter] = useState<
    'ALL' | EpisodeProductionTarget
  >('ALL');
  const [completenessFilter, setCompletenessFilter] =
    useState<EpisodeCompletenessFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DATE_DESC');
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');

  // Filter for non-standard / problem episodes
  const [issueFilterOnly, setIssueFilterOnly] = useState(false);

  // 3-Tier Footage Tag Filter for Master Episodes
  const [selectedFootageTagIds, setSelectedFootageTagIds] = useState<string[]>(
    []
  );
  const [footageTagMatchMode, setFootageTagMatchMode] = useState<'AND' | 'OR'>(
    'AND'
  );

  // Series Shelf 0-EP Toggle (Default: false -> only show produced series)
  const [showUnproducedSeries, setShowUnproducedSeries] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    setSubcategoryFilter('ALL');
  }, [categoryFilter, selectedGroupId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    categoryFilter,
    subcategoryFilter,
    productionTargetFilter,
    selectedGroupId,
    completenessFilter,
    issueFilterOnly,
    selectedFootageTagIds,
    footageTagMatchMode,
    sortBy,
    archiveTab,
  ]);

  // Overall Quality Audit Summary across all episodes
  const auditSummary = useMemo<EpisodeQualityAuditSummary>(() => {
    return auditEpisodesQuality(episodes);
  }, [episodes]);

  const handleToggleFootageTag = useCallback((tagId: string) => {
    setSelectedFootageTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  const handleClearFootageTags = useCallback(() => {
    setSelectedFootageTagIds([]);
  }, []);

  // Series belonging to currently selected Archive Category (Active Series > 0 EP)
  const categoriesInGroup = useMemo(() => {
    if (selectedGroupId === 'ALL') return categoryRanking;
    return categoryRanking.filter(
      (item) => item.archiveCategoryId === selectedGroupId
    );
  }, [categoryRanking, selectedGroupId]);

  // Parse debounced search query into normalized tokens ONCE per search change
  const queryTokens = useMemo(
    () => parseSmartSearchQuery(debouncedSearchQuery),
    [debouncedSearchQuery]
  );

  // Series displayed in Series Shelf tab (Active Series + optional 0-EP Series)
  const shelfSeriesItems = useMemo(() => {
    const baseList = showUnproducedSeries
      ? [...categoryRanking, ...unproducedSeriesRanking]
      : categoryRanking;
    const byGroup =
      selectedGroupId === 'ALL'
        ? baseList
        : baseList.filter((item) => item.archiveCategoryId === selectedGroupId);

    if (queryTokens.length === 0) return byGroup;
    return byGroup.filter((item) => {
      const compactSeriesText = normalizeCompactSearchText(
        `${item.seriesName} ${item.fullSeriesTitle} ${item.matchedTagNames.join(' ')}`
      );
      return matchesSmartSearchTokens(compactSeriesText, queryTokens);
    });
  }, [
    showUnproducedSeries,
    categoryRanking,
    unproducedSeriesRanking,
    selectedGroupId,
    queryTokens,
  ]);

  const availableSubcategories = useMemo(() => {
    const allowedMainIds = new Set(
      categoryFilter !== 'ALL'
        ? [categoryFilter]
        : categoriesInGroup.map((c) => c.builderTargetTagId)
    );
    return tags.filter(
      (t: CategoryTag) => Boolean(t.parentId) && allowedMainIds.has(t.parentId!)
    );
  }, [tags, categoryFilter, categoriesInGroup]);

  // Lookup map: seriesKey -> archiveCategoryId
  const seriesKeyToArchiveCatMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoryRanking.forEach((item) => {
      map[item.seriesKey] = item.archiveCategoryId;
    });
    return map;
  }, [categoryRanking]);

  // Step 1: Filter episodes by everything EXCEPT workflowStage
  const baseFilteredEpisodes = useMemo(() => {
    const hasQuery = queryTokens.length > 0;

    return episodes.filter((ep: Episode) => {
      // 0. Issue Filter (Non-standard / Incomplete / Missing Title)
      if (issueFilterOnly) {
        const val = validateEpisodeStandard(ep);
        if (val.isStandard) return false;
      }

      const epSeriesKey = episodeSeriesKeyMap[ep.id];

      // 1. Filter by Master Archive Category
      if (selectedGroupId !== 'ALL') {
        const epArcCatId = epSeriesKey
          ? seriesKeyToArchiveCatMap[epSeriesKey]
          : undefined;
        if (epArcCatId !== selectedGroupId) return false;
      }

      // 2. Filter by Specific "5 อันดับ [ชื่อรายการ]" Series
      if (categoryFilter !== 'ALL') {
        if (categoryFilter.startsWith('SERIES::')) {
          if (epSeriesKey !== categoryFilter) return false;
        } else {
          const inMain = ep.mainCategoryTagId === categoryFilter;
          const inSub = ep.targetSubcategoryId === categoryFilter;
          const inSeries = ep.seriesId === categoryFilter;
          if (!inMain && !inSub && !inSeries) return false;
        }
      }

      const epTagSet = episodeFootageTagsMap[ep.id];

      // 3. Filter by 3-Tier Footage Tags present inside the Episode's 5 slots
      if (selectedFootageTagIds.length > 0) {
        if (!epTagSet) return false;
        if (footageTagMatchMode === 'AND') {
          const hasAll = selectedFootageTagIds.every((tid) =>
            epTagSet.has(tid)
          );
          if (!hasAll) return false;
        } else {
          const hasSome = selectedFootageTagIds.some((tid) =>
            epTagSet.has(tid)
          );
          if (!hasSome) return false;
        }
      }

      if (subcategoryFilter !== 'ALL') {
        if (ep.targetSubcategoryId !== subcategoryFilter) return false;
      }
      if (productionTargetFilter !== 'ALL') {
        const epTarget = ep.productionTarget || 'MAIN_CATEGORY_VARIETY';
        if (epTarget !== productionTargetFilter) return false;
      }
      if (hasQuery) {
        const compactIndex = getEpisodeSmartSearchIndex(ep, tagMap, epTagSet);
        return matchesSmartSearchTokens(compactIndex, queryTokens);
      }
      return true;
    });
  }, [
    episodes,
    issueFilterOnly,
    episodeSeriesKeyMap,
    selectedGroupId,
    seriesKeyToArchiveCatMap,
    categoryFilter,
    selectedFootageTagIds,
    episodeFootageTagsMap,
    footageTagMatchMode,
    subcategoryFilter,
    productionTargetFilter,
    queryTokens,
    tagMap,
  ]);

  const hasBaseFilters =
    debouncedSearchQuery.trim() !== '' ||
    categoryFilter !== 'ALL' ||
    subcategoryFilter !== 'ALL' ||
    productionTargetFilter !== 'ALL' ||
    selectedGroupId !== 'ALL' ||
    issueFilterOnly ||
    selectedFootageTagIds.length > 0;

  // Step 2: Compute live counts per completeness state from baseFilteredEpisodes
  // (merges serverCounts / archiveSummaryStats when unfiltered & hydrating background chunks)
  const completenessCounts = useMemo<
    Record<EpisodeCompletenessFilter, number>
  >(() => {
    const counts: Record<EpisodeCompletenessFilter, number> = {
      ALL: baseFilteredEpisodes.length,
      COMPLETE: 0,
      INCOMPLETE: 0,
      INCOMPLETE_FOOTAGE: 0,
    };
    for (let i = 0; i < baseFilteredEpisodes.length; i++) {
      const comp = evaluateEpisodeCompleteness(baseFilteredEpisodes[i]);
      if (comp.isComplete) {
        counts.COMPLETE += 1;
      } else {
        counts.INCOMPLETE += 1;
      }
      if (!comp.hasFullFiveSlots) {
        counts.INCOMPLETE_FOOTAGE += 1;
      }
    }

    if (
      !hasBaseFilters &&
      serverCounts &&
      serverCounts.totalEpisodes > episodes.length
    ) {
      counts.ALL = serverCounts.totalEpisodes;
      if (
        archiveSummaryStats &&
        archiveSummaryStats.totalEpisodes >= serverCounts.totalEpisodes
      ) {
        counts.COMPLETE = archiveSummaryStats.completeEpisodesCount;
        counts.INCOMPLETE = archiveSummaryStats.incompleteEpisodesCount;
        counts.INCOMPLETE_FOOTAGE =
          archiveSummaryStats.incompleteFootageEpisodesCount;
      }
    }

    return counts;
  }, [
    baseFilteredEpisodes,
    hasBaseFilters,
    serverCounts,
    episodes.length,
    archiveSummaryStats,
  ]);

  // Step 3: Apply completenessFilter and sortBy using shared THAI_COLLATOR & NUMERIC_ID_COLLATOR
  const sortedEpisodes = useMemo(() => {
    const filtered =
      completenessFilter === 'ALL'
        ? [...baseFilteredEpisodes]
        : baseFilteredEpisodes.filter((ep) => {
            const comp = evaluateEpisodeCompleteness(ep);
            if (completenessFilter === 'COMPLETE') return comp.isComplete;
            if (completenessFilter === 'INCOMPLETE_FOOTAGE') {
              return !comp.hasFullFiveSlots;
            }
            return !comp.isComplete;
          });

    return filtered.sort((a, b) => {
      if (sortBy === 'TITLE_ASC') {
        const titleDiff = THAI_COLLATOR.compare(a.title, b.title);
        if (titleDiff !== 0) return titleDiff;
        return NUMERIC_ID_COLLATOR.compare(a.id, b.id);
      }
      if (sortBy === 'TITLE_DESC') {
        const titleDiff = THAI_COLLATOR.compare(b.title, a.title);
        if (titleDiff !== 0) return titleDiff;
        return NUMERIC_ID_COLLATOR.compare(b.id, a.id);
      }
      if (sortBy === 'ID_ASC') {
        return NUMERIC_ID_COLLATOR.compare(a.id, b.id);
      }
      if (sortBy === 'ID_DESC') {
        return NUMERIC_ID_COLLATOR.compare(b.id, a.id);
      }
      if (sortBy === 'SERIES_EP_DESC') {
        const epDiff = (b.categoryEpisodeNo || 0) - (a.categoryEpisodeNo || 0);
        if (epDiff !== 0) return epDiff;
      }
      if (sortBy === 'NEW_MIX_DESC') {
        const mixA = getEpisodeFootageMix(a).newCount;
        const mixB = getEpisodeFootageMix(b).newCount;
        if (mixB !== mixA) return mixB - mixA;
      }
      if (sortBy === 'DATE_ASC') {
        if (a.publishDate !== b.publishDate) {
          return a.publishDate > b.publishDate ? 1 : -1;
        }
        return NUMERIC_ID_COLLATOR.compare(a.id, b.id);
      }
      // Default: DATE_DESC
      if (a.publishDate !== b.publishDate) {
        return b.publishDate > a.publishDate ? 1 : -1;
      }
      if (a.publishSlot !== b.publishSlot) {
        return b.publishSlot > a.publishSlot ? 1 : -1;
      }
      return NUMERIC_ID_COLLATOR.compare(b.id, a.id);
    });
  }, [baseFilteredEpisodes, completenessFilter, sortBy, getEpisodeFootageMix]);

  const paginatedEpisodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEpisodes.slice(start, start + pageSize);
  }, [sortedEpisodes, currentPage, pageSize]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'ALL' ||
    subcategoryFilter !== 'ALL' ||
    productionTargetFilter !== 'ALL' ||
    selectedGroupId !== 'ALL' ||
    completenessFilter !== 'ALL' ||
    issueFilterOnly ||
    selectedFootageTagIds.length > 0;

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setSubcategoryFilter('ALL');
    setProductionTargetFilter('ALL');
    setSelectedGroupId('ALL');
    setCompletenessFilter('ALL');
    setIssueFilterOnly(false);
    setSelectedFootageTagIds([]);
  };

  const onToggleSortColumn = (column: 'TITLE' | 'ID' | 'DATE') => {
    if (column === 'TITLE') {
      setSortBy((prev) => (prev === 'TITLE_ASC' ? 'TITLE_DESC' : 'TITLE_ASC'));
    } else if (column === 'ID') {
      setSortBy((prev) => (prev === 'ID_DESC' ? 'ID_ASC' : 'ID_DESC'));
    } else if (column === 'DATE') {
      setSortBy((prev) => (prev === 'DATE_DESC' ? 'DATE_ASC' : 'DATE_DESC'));
    }
  };

  return {
    archiveTab,
    setArchiveTab,
    selectedGroupId,
    setSelectedGroupId,
    searchQuery,
    debouncedSearchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    subcategoryFilter,
    setSubcategoryFilter,
    productionTargetFilter,
    setProductionTargetFilter,
    availableSubcategories,
    completenessFilter,
    setCompletenessFilter,
    completenessCounts,
    issueFilterOnly,
    setIssueFilterOnly,
    auditSummary,
    selectedFootageTagIds,
    handleToggleFootageTag,
    handleClearFootageTags,
    footageTagMatchMode,
    setFootageTagMatchMode,
    showUnproducedSeries,
    setShowUnproducedSeries,
    shelfSeriesItems,
    sortBy,
    setSortBy,
    onToggleSortColumn,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    categoriesInGroup,
    sortedEpisodes,
    paginatedEpisodes,
    totalEpisodesCount:
      serverCounts && serverCounts.totalEpisodes > episodes.length
        ? serverCounts.totalEpisodes
        : episodes.length || archiveSummaryStats?.totalEpisodes || 0,
    hasActiveFilters,
    resetFilters,
  };
}
