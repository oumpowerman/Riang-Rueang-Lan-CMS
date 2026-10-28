import React, { useMemo, useState } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { isFootageInStaging, isStagingTagId } from '../../../services/seedData';
import { CooldownStatus } from '../../../types/footage.types';
import {
  CategoryFilterMode,
  CategorySortMode,
  DashboardMetrics,
  DashboardProductionRadarData,
  DashboardViewMode,
  FlowFilter,
  FootageSortMode,
  StatusFilter,
  WorkflowStep,
} from './dashboard.types';

export const useDashboardOverview = () => {
  const {
    computedFootage,
    sources,
    episodes,
    categoryMatrix,
    tagMap,
    settings,
    untaggedFootages,
    missingDriveFootages,
    setActiveTab,
    setSelectedTagFilter,
    setIsDirectFootageModalOpen,
    openSourceSplitterFor,
    setIsTagManagerOpen,
    setIsStatusRuleModalOpen,
    setTraceabilityFootageId,
    setSelectedEpisodeDetailId,
    launchEpisodeBuilderForCategory,
  } = useCMS();

  // 1. Step Navigation & View Mode States
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<WorkflowStep>(2);
  const [viewMode, setViewMode] = useState<DashboardViewMode>('FOCUS');

  // 2. Global & Section Search / Filter States
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>('ALL');
  const [activeFlowFilter, setActiveFlowFilter] = useState<FlowFilter>('ALL');
  const [activeCategoryIdFilter, setActiveCategoryIdFilter] = useState<string | null>(null);
  const [footageSortMode, setFootageSortMode] = useState<FootageSortMode>('SMART_ROI');
  const [footageLimit, setFootageLimit] = useState<number>(8);

  // Category Matrix Search, Filter & Sort States
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryFilterMode, setCategoryFilterMode] = useState<CategoryFilterMode>('ALL');
  const [categorySortMode, setCategorySortMode] = useState<CategorySortMode>('USABLE_DESC');

  // Episode & Source Search States
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');

  // Framer Motion Collapsible States (Default collapsed: false)
  const [isStatusRulesExpanded, setIsStatusRulesExpanded] = useState(false);
  const [isCategorySectionExpanded, setIsCategorySectionExpanded] = useState(false);
  const [isRadarExpanded, setIsRadarExpanded] = useState(false);

  // Clipboard Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (id: string, text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1800);
  };

  // 3. Core Footage Metrics & Utilization Analytics
  const metrics = useMemo<DashboardMetrics>(() => {
    const total = computedFootage.length;
    const newCount = computedFootage.filter((f) => f.cooldownStatus === 'NEW_UNTOUCHED').length;
    const readyCount = computedFootage.filter((f) => f.cooldownStatus === 'READY_FRESH').length;
    const warningCount = computedFootage.filter(
      (f) => f.cooldownStatus === 'HIGH_VELOCITY_WARNING'
    ).length;
    const cooldownCount = computedFootage.filter(
      (f) => f.cooldownStatus === 'RECENT_COOLDOWN'
    ).length;
    const directCount = computedFootage.filter((f) => f.ingestionFlow === 'DIRECT_1_TO_1').length;
    const splitCount = computedFootage.filter((f) => f.ingestionFlow === 'SPLIT_1_TO_N').length;

    const usableTotal = newCount + readyCount;
    // Exclude staging footage from 5-footage-per-1-EP quota until assigned to a real category
    const categorizedUsableCount = computedFootage.filter(
      (f) =>
        !isFootageInStaging(f.tags) &&
        (f.cooldownStatus === 'NEW_UNTOUCHED' || f.cooldownStatus === 'READY_FRESH')
    ).length;
    const totalProducibleEps = Math.floor(categorizedUsableCount / 5);
    const everUsedCount = computedFootage.filter((f) => f.totalUsageCount > 0).length;
    const utilizationRate = total > 0 ? Math.round((everUsedCount / total) * 100) : 0;
    const totalUsagesAllClips = computedFootage.reduce((sum, f) => sum + f.totalUsageCount, 0);
    const avgUsagePerClip = total > 0 ? (totalUsagesAllClips / total).toFixed(1) : '0.0';

    return {
      total,
      newCount,
      readyCount,
      warningCount,
      cooldownCount,
      directCount,
      splitCount,
      usableTotal,
      totalProducibleEps,
      everUsedCount,
      utilizationRate,
      totalUsagesAllClips,
      avgUsagePerClip,
    };
  }, [computedFootage]);

  // 4. Actionable Production Radar (Excludes Staging Area)
  const productionRadar = useMemo<DashboardProductionRadarData>(() => {
    const readyCategories = categoryMatrix
      .filter((c) => !isStagingTagId(c.tag.id) && c.producibleEpisodesCount > 0)
      .sort((a, b) => b.usableCount - a.usableCount);

    const almostReadyCategories = categoryMatrix
      .filter(
        (c) => !isStagingTagId(c.tag.id) && c.usableCount >= 3 && c.usableCount < 5
      )
      .sort((a, b) => b.usableCount - a.usableCount);

    const topRoiFootages = [...computedFootage]
      .filter(
        (f) =>
          !isFootageInStaging(f.tags) &&
          (f.cooldownStatus === 'NEW_UNTOUCHED' || f.cooldownStatus === 'READY_FRESH')
      )
      .sort((a, b) => {
        if (a.cooldownStatus !== b.cooldownStatus) {
          return a.cooldownStatus === 'NEW_UNTOUCHED' ? -1 : 1;
        }
        return (b.daysSinceLastUsed ?? 999) - (a.daysSinceLastUsed ?? 999);
      })
      .slice(0, 5);

    return {
      readyCategories,
      almostReadyCategories,
      topRoiFootages,
    };
  }, [categoryMatrix, computedFootage]);

  // 5. Filtered & Sorted Category Matrix
  const filteredCategories = useMemo(() => {
    const q = (categorySearch || globalSearchQuery).trim().toLowerCase();

    return categoryMatrix
      .filter((stat) => {
        if (categoryFilterMode === 'READY_EP' && stat.producibleEpisodesCount <= 0) return false;
        if (
          categoryFilterMode === 'ALMOST_READY' &&
          !(stat.usableCount >= 3 && stat.usableCount < 5)
        ) {
          return false;
        }
        if (categoryFilterMode === 'TIER_1' && stat.tag.tier === 2) return false;
        if (categoryFilterMode === 'TIER_2' && stat.tag.tier !== 2) return false;

        if (!q) return true;
        const matchName = stat.tag.name.toLowerCase().includes(q);
        const matchId = stat.tag.id.toLowerCase().includes(q);
        const matchDesc = (stat.tag.description || '').toLowerCase().includes(q);
        const matchSub = stat.subcategoryStats.some((s) =>
          s.subcategory.name.toLowerCase().includes(q)
        );
        return matchName || matchId || matchDesc || matchSub;
      })
      .sort((a, b) => {
        switch (categorySortMode) {
          case 'USABLE_DESC':
            return b.usableCount - a.usableCount || b.totalCount - a.totalCount;
          case 'EP_QUOTA_DESC':
            return (
              b.producibleEpisodesCount - a.producibleEpisodesCount ||
              b.usableCount - a.usableCount
            );
          case 'ALMOST_5_ASC':
            return a.remainingForNextEp - b.remainingForNextEp || b.usableCount - a.usableCount;
          case 'TOTAL_DESC':
            return b.totalCount - a.totalCount;
          case 'NAME_ASC':
            return a.tag.name.localeCompare(b.tag.name, 'th');
          default:
            return 0;
        }
      });
  }, [categoryMatrix, categorySearch, globalSearchQuery, categoryFilterMode, categorySortMode]);

  // 6. Filtered & Sorted Interactive Footage Explorer
  const filteredFootages = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();

    return computedFootage
      .filter((ft) => {
        if (activeStatusFilter !== 'ALL' && ft.cooldownStatus !== activeStatusFilter) {
          return false;
        }
        if (activeFlowFilter !== 'ALL' && ft.ingestionFlow !== activeFlowFilter) {
          return false;
        }
        if (activeCategoryIdFilter) {
          if (isStagingTagId(activeCategoryIdFilter)) {
            if (!isFootageInStaging(ft.tags)) return false;
          } else {
            if (isFootageInStaging(ft.tags)) return false;
            const childIds =
              categoryMatrix
                .find((c) => c.tag.id === activeCategoryIdFilter)
                ?.subcategoryStats.map((s) => s.subcategory.id) || [];
            const validTagIds = [activeCategoryIdFilter, ...childIds];
            if (!ft.tags.some((tid) => validTagIds.includes(tid))) {
              return false;
            }
          }
        }

        if (!q) return true;
        const inId = ft.id.toLowerCase().includes(q);
        const inTitle = ft.title.toLowerCase().includes(q);
        const inNotes = (ft.mascotNotes || '').toLowerCase().includes(q);
        const inFile = (ft.standardFileName || '').toLowerCase().includes(q);
        const inTags = ft.tags.some((tid) =>
          (tagMap[tid]?.name || '').toLowerCase().includes(q)
        );
        return inId || inTitle || inNotes || inFile || inTags;
      })
      .sort((a, b) => {
        switch (footageSortMode) {
          case 'SMART_ROI': {
            const rankOrder: Record<CooldownStatus, number> = {
              NEW_UNTOUCHED: 1,
              READY_FRESH: 2,
              HIGH_VELOCITY_WARNING: 3,
              RECENT_COOLDOWN: 4,
            };
            if (rankOrder[a.cooldownStatus] !== rankOrder[b.cooldownStatus]) {
              return rankOrder[a.cooldownStatus] - rankOrder[b.cooldownStatus];
            }
            return (b.daysSinceLastUsed ?? 999) - (a.daysSinceLastUsed ?? 999);
          }
          case 'REST_DAYS_DESC':
            return (b.daysSinceLastUsed ?? -1) - (a.daysSinceLastUsed ?? -1);
          case 'USAGE_DESC':
            return b.totalUsageCount - a.totalUsageCount;
          case 'Usage_ASC':
            return a.totalUsageCount - b.totalUsageCount;
          case 'ID_DESC':
            return b.id.localeCompare(a.id);
          default:
            return 0;
        }
      });
  }, [
    computedFootage,
    globalSearchQuery,
    activeStatusFilter,
    activeFlowFilter,
    activeCategoryIdFilter,
    footageSortMode,
    tagMap,
    categoryMatrix,
  ]);

  const filteredEpisodes = useMemo(() => {
    const q = (episodeSearch || globalSearchQuery).trim().toLowerCase();
    return episodes
      .filter((ep) => {
        if (!q) return true;
        const matchTitle = ep.title.toLowerCase().includes(q);
        const matchId = ep.id.toLowerCase().includes(q);
        const matchFt = ep.rankings.some((r) => r.footageId?.toLowerCase().includes(q));
        return matchTitle || matchId || matchFt;
      })
      .sort((a, b) => {
        if (a.publishDate !== b.publishDate) {
          return b.publishDate.localeCompare(a.publishDate);
        }
        return b.publishSlot.localeCompare(a.publishSlot);
      })
      .slice(0, 6);
  }, [episodes, episodeSearch, globalSearchQuery]);

  const filteredSources = useMemo(() => {
    const q = (sourceSearch || globalSearchQuery).trim().toLowerCase();
    return sources.filter((src) => {
      if (!q) return true;
      return (
        src.id.toLowerCase().includes(q) ||
        src.title.toLowerCase().includes(q) ||
        src.channelOrCreator.toLowerCase().includes(q) ||
        src.platform.toLowerCase().includes(q)
      );
    });
  }, [sources, sourceSearch, globalSearchQuery]);

  const handleOpenCategoryInVault = (tagId: string) => {
    setSelectedTagFilter([tagId]);
    setActiveTab('FOOTAGE_LIBRARY');
  };

  const resetAllFilters = () => {
    setGlobalSearchQuery('');
    setActiveStatusFilter('ALL');
    setActiveFlowFilter('ALL');
    setActiveCategoryIdFilter(null);
    setCategorySearch('');
    setCategoryFilterMode('ALL');
    setEpisodeSearch('');
    setSourceSearch('');
  };

  const hasAnyActiveFilter =
    globalSearchQuery.trim() !== '' ||
    activeStatusFilter !== 'ALL' ||
    activeFlowFilter !== 'ALL' ||
    activeCategoryIdFilter !== null ||
    categorySearch.trim() !== '' ||
    categoryFilterMode !== 'ALL';

  const handleSelectStep = (step: WorkflowStep) => {
    setActiveWorkflowStep(step);
    if (viewMode === 'ALL') {
      const el = document.getElementById(`step-section-${step}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return {
    // CMS Data & Actions
    sources,
    episodes,
    categoryMatrix,
    tagMap,
    settings,
    untaggedFootages,
    missingDriveFootages,
    setActiveTab,
    setIsDirectFootageModalOpen,
    openSourceSplitterFor,
    setIsTagManagerOpen,
    setIsStatusRuleModalOpen,
    setTraceabilityFootageId,
    setSelectedEpisodeDetailId,
    launchEpisodeBuilderForCategory,

    // Navigation & View Mode
    activeWorkflowStep,
    viewMode,
    setViewMode,
    handleSelectStep,

    // Search, Filter & Sort States
    globalSearchQuery,
    setGlobalSearchQuery,
    activeStatusFilter,
    setActiveStatusFilter,
    activeFlowFilter,
    setActiveFlowFilter,
    activeCategoryIdFilter,
    setActiveCategoryIdFilter,
    footageSortMode,
    setFootageSortMode,
    footageLimit,
    setFootageLimit,
    categorySearch,
    setCategorySearch,
    categoryFilterMode,
    setCategoryFilterMode,
    categorySortMode,
    setCategorySortMode,
    episodeSearch,
    setEpisodeSearch,
    sourceSearch,
    setSourceSearch,

    // Collapsible UI States
    isStatusRulesExpanded,
    setIsStatusRulesExpanded,
    isCategorySectionExpanded,
    setIsCategorySectionExpanded,
    isRadarExpanded,
    setIsRadarExpanded,

    // Clipboard State
    copiedId,
    handleCopyText,

    // Computed Data
    metrics,
    productionRadar,
    filteredCategories,
    filteredFootages,
    filteredEpisodes,
    filteredSources,
    hasAnyActiveFilter,
    resetAllFilters,
    handleOpenCategoryInVault,
  };
};
