import { useState, useMemo, useEffect } from 'react';
import { useCMS } from '../../../../context/CMSContext';
import type {
  EpisodeWorkflowStage,
  Episode,
  EpisodeRankingSlot,
  EpisodeProductionTarget,
} from '../../../../types/episode.types';
import type { CategoryTag } from '../../../../types/tag.types';
import type { CategoryRankingItem, EpisodeFootageMix } from './useMasterArchiveMetrics';

export type ArchiveTab = 'EPISODES' | 'SERIES_SHELF';
export type ViewMode = 'CARDS' | 'TABLE';
export type SortOption =
  | 'DATE_DESC'
  | 'DATE_ASC'
  | 'ID_DESC'
  | 'ID_ASC'
  | 'SERIES_EP_DESC'
  | 'NEW_MIX_DESC';

interface UseMasterArchiveFilterProps {
  categoryRanking: CategoryRankingItem[];
  resolveTagGroupId: (tag: CategoryTag | undefined) => string;
  getEpisodeFootageMix: (ep: Episode) => EpisodeFootageMix;
}

export function useMasterArchiveFilter({
  categoryRanking,
  resolveTagGroupId,
  getEpisodeFootageMix,
}: UseMasterArchiveFilterProps) {
  const { episodes, tags, tagMap } = useCMS();

  const [archiveTab, setArchiveTab] = useState<ArchiveTab>('EPISODES');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('ALL');
  const [productionTargetFilter, setProductionTargetFilter] = useState<'ALL' | EpisodeProductionTarget>('ALL');
  const [workflowFilter, setWorkflowFilter] = useState<'ALL' | EpisodeWorkflowStage>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DATE_DESC');
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');

  // Pagination state (12 items fits both 2-col cards and table view cleanly, scalable to 96 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Reset subcategory filter if main category or group changes and doesn't contain it
  useEffect(() => {
    setSubcategoryFilter('ALL');
  }, [categoryFilter, selectedGroupId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    categoryFilter,
    subcategoryFilter,
    productionTargetFilter,
    selectedGroupId,
    workflowFilter,
    sortBy,
    archiveTab,
  ]);

  // Categories belonging to currently selected Tier 0 Group
  const categoriesInGroup = useMemo(() => {
    if (selectedGroupId === 'ALL') return categoryRanking;
    return categoryRanking.filter((item) => resolveTagGroupId(item.mainTag) === selectedGroupId);
  }, [categoryRanking, selectedGroupId, resolveTagGroupId]);

  // Available subcategories for the selected main category (or within selected group)
  const availableSubcategories = useMemo(() => {
    const allowedMainIds = new Set(
      categoryFilter !== 'ALL'
        ? [categoryFilter]
        : categoriesInGroup.map((c) => c.mainTag.id)
    );
    return tags.filter(
      (t: CategoryTag) => Boolean(t.parentId) && allowedMainIds.has(t.parentId!)
    );
  }, [tags, categoryFilter, categoriesInGroup]);

  // Step 1: Filter episodes by everything EXCEPT workflowStage so we can compute accurate tab counts
  const baseFilteredEpisodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return episodes.filter((ep: Episode) => {
      if (selectedGroupId !== 'ALL') {
        const t = tagMap[ep.mainCategoryTagId];
        if (resolveTagGroupId(t) !== selectedGroupId) return false;
      }
      if (categoryFilter !== 'ALL') {
        const inMain = ep.mainCategoryTagId === categoryFilter;
        const inSub = ep.targetSubcategoryId === categoryFilter;
        const inSeries = ep.seriesId === categoryFilter;
        if (!inMain && !inSub && !inSeries) return false;
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
        const inMasterFile = (ep.masterVideoInfo?.masterFileName || '').toLowerCase().includes(q);
        if (inMasterFile) return true;
        const catName = (tagMap[ep.mainCategoryTagId]?.name || '').toLowerCase();
        const subName = ep.targetSubcategoryId
          ? (tagMap[ep.targetSubcategoryId]?.name || '').toLowerCase()
          : '';
        if (catName.includes(q) || subName.includes(q)) return true;
        const epNoStr = `ep.${ep.categoryEpisodeNo || ''}`.toLowerCase();
        const epNoStr2 = `ep ${ep.categoryEpisodeNo || ''}`.toLowerCase();
        if (Boolean(ep.categoryEpisodeNo) && (epNoStr.includes(q) || epNoStr2.includes(q))) {
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
    selectedGroupId,
    categoryFilter,
    subcategoryFilter,
    productionTargetFilter,
    searchQuery,
    tagMap,
    resolveTagGroupId,
  ]);

  // Step 2: Compute live counts per workflow stage from baseFilteredEpisodes
  const workflowStageCounts = useMemo<Record<'ALL' | EpisodeWorkflowStage, number>>(() => {
    const counts: Record<'ALL' | EpisodeWorkflowStage, number> = {
      ALL: baseFilteredEpisodes.length,
      '1_MIXING': 0,
      '2_MASCOT_SCRIPTING': 0,
      '3_VIDEO_EDITING': 0,
      '4_PUBLISHED': 0,
    };
    for (const ep of baseFilteredEpisodes) {
      if (counts[ep.workflowStage] !== undefined) {
        counts[ep.workflowStage] += 1;
      }
    }
    return counts;
  }, [baseFilteredEpisodes]);

  // Step 3: Apply workflowFilter and sortBy
  const sortedEpisodes = useMemo(() => {
    const filtered =
      workflowFilter === 'ALL'
        ? [...baseFilteredEpisodes]
        : baseFilteredEpisodes.filter((ep) => ep.workflowStage === workflowFilter);

    return filtered.sort((a, b) => {
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
        if (a.publishDate !== b.publishDate) return a.publishDate.localeCompare(b.publishDate);
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      }
      // Default: DATE_DESC
      if (a.publishDate !== b.publishDate) return b.publishDate.localeCompare(a.publishDate);
      if (a.publishSlot !== b.publishSlot) return b.publishSlot.localeCompare(a.publishSlot);
      return b.id.localeCompare(a.id, undefined, { numeric: true });
    });
  }, [baseFilteredEpisodes, workflowFilter, sortBy, getEpisodeFootageMix]);

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
    workflowFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setSubcategoryFilter('ALL');
    setProductionTargetFilter('ALL');
    setSelectedGroupId('ALL');
    setWorkflowFilter('ALL');
  };

  return {
    archiveTab,
    setArchiveTab,
    selectedGroupId,
    setSelectedGroupId,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    subcategoryFilter,
    setSubcategoryFilter,
    productionTargetFilter,
    setProductionTargetFilter,
    availableSubcategories,
    workflowFilter,
    setWorkflowFilter,
    workflowStageCounts,
    sortBy,
    setSortBy,
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
