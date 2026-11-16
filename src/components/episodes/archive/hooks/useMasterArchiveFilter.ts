import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCMS } from '../../../../context/CMSContext';
import { useDebounce } from '../../../../hooks/useDebounce';
import {
  validateEpisodeStandard,
  auditEpisodesQuality,
  evaluateEpisodeCompleteness,
  EpisodeQualityAuditSummary,
  EpisodeCompletenessFilter,
} from '../../../../utils/episodeValidator';
import type {
  Episode,
  EpisodeRankingSlot,
  EpisodeProductionTarget,
} from '../../../../types/episode.types';
import type { CategoryTag } from '../../../../types/tag.types';
import type {
  CategoryRankingItem,
  EpisodeFootageMix,
} from './useMasterArchiveMetrics';

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
  const { episodes, tags, tagMap } = useCMS();

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

  // Series displayed in Series Shelf tab (Active Series + optional 0-EP Series)
  const shelfSeriesItems = useMemo(() => {
    const baseList = showUnproducedSeries
      ? [...categoryRanking, ...unproducedSeriesRanking]
      : categoryRanking;
    const byGroup =
      selectedGroupId === 'ALL'
        ? baseList
        : baseList.filter((item) => item.archiveCategoryId === selectedGroupId);

    const q = debouncedSearchQuery.trim().toLowerCase();
    if (!q) return byGroup;
    return byGroup.filter(
      (item) =>
        item.seriesName.toLowerCase().includes(q) ||
        item.fullSeriesTitle.toLowerCase().includes(q)
    );
  }, [
    showUnproducedSeries,
    categoryRanking,
    unproducedSeriesRanking,
    selectedGroupId,
    debouncedSearchQuery,
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
    const q = debouncedSearchQuery.trim().toLowerCase();

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

      // 3. Filter by 3-Tier Footage Tags present inside the Episode's 5 slots
      if (selectedFootageTagIds.length > 0) {
        const epTagSet = episodeFootageTagsMap[ep.id];
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
      if (q !== '') {
        const inId = ep.id.toLowerCase().includes(q);
        if (inId) return true;
        const inTitle = ep.title.toLowerCase().includes(q);
        if (inTitle) return true;
        const inSeriesTitle = (ep.seriesTitle || '')
          .toLowerCase()
          .includes(q);
        if (inSeriesTitle) return true;
        const inMasterFile = (
          ep.masterVideoInfo?.masterFileName || ''
        )
          .toLowerCase()
          .includes(q);
        if (inMasterFile) return true;
        const catName = (
          tagMap[ep.mainCategoryTagId]?.name || ''
        ).toLowerCase();
        const subName = ep.targetSubcategoryId
          ? (tagMap[ep.targetSubcategoryId]?.name || '').toLowerCase()
          : '';
        if (catName.includes(q) || subName.includes(q)) return true;
        const epNoStr = `ep.${ep.categoryEpisodeNo || ''}`.toLowerCase();
        const epNoStr2 = `ep ${ep.categoryEpisodeNo || ''}`.toLowerCase();
        if (
          Boolean(ep.categoryEpisodeNo) &&
          (epNoStr.includes(q) || epNoStr2.includes(q))
        ) {
          return true;
        }
        const inFootage = ep.rankings.some((r: EpisodeRankingSlot) =>
          (r.footageId || '').toLowerCase().includes(q)
        );
        if (inFootage) return true;
        return false;
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
    debouncedSearchQuery,
    tagMap,
  ]);

  // Step 2: Compute live counts per completeness state from baseFilteredEpisodes
  const completenessCounts = useMemo<
    Record<EpisodeCompletenessFilter, number>
  >(() => {
    const counts: Record<EpisodeCompletenessFilter, number> = {
      ALL: baseFilteredEpisodes.length,
      COMPLETE: 0,
      INCOMPLETE: 0,
    };
    for (const ep of baseFilteredEpisodes) {
      if (evaluateEpisodeCompleteness(ep).isComplete) {
        counts.COMPLETE += 1;
      } else {
        counts.INCOMPLETE += 1;
      }
    }
    return counts;
  }, [baseFilteredEpisodes]);

  // Step 3: Apply completenessFilter and sortBy
  const sortedEpisodes = useMemo(() => {
    const filtered =
      completenessFilter === 'ALL'
        ? [...baseFilteredEpisodes]
        : baseFilteredEpisodes.filter((ep) => {
            const { isComplete } = evaluateEpisodeCompleteness(ep);
            return completenessFilter === 'COMPLETE'
              ? isComplete
              : !isComplete;
          });

    return filtered.sort((a, b) => {
      if (sortBy === 'TITLE_ASC') {
        const titleDiff = a.title.localeCompare(b.title, 'th', {
          sensitivity: 'base',
        });
        if (titleDiff !== 0) return titleDiff;
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      }
      if (sortBy === 'TITLE_DESC') {
        const titleDiff = b.title.localeCompare(a.title, 'th', {
          sensitivity: 'base',
        });
        if (titleDiff !== 0) return titleDiff;
        return b.id.localeCompare(a.id, undefined, { numeric: true });
      }
      if (sortBy === 'ID_ASC') {
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      }
      if (sortBy === 'ID_DESC') {
        return b.id.localeCompare(a.id, undefined, { numeric: true });
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
        if (a.publishDate !== b.publishDate)
          return a.publishDate.localeCompare(b.publishDate);
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      }
      // Default: DATE_DESC
      if (a.publishDate !== b.publishDate)
        return b.publishDate.localeCompare(a.publishDate);
      if (a.publishSlot !== b.publishSlot)
        return b.publishSlot.localeCompare(a.publishSlot);
      return b.id.localeCompare(a.id, undefined, { numeric: true });
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
    totalEpisodesCount: episodes.length,
    hasActiveFilters,
    resetFilters,
  };
}
