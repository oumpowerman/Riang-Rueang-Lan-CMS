import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCMS } from '../../context/CMSContext';
import {
  buildFixedFiveRankEpisode,
  validateEpisodeStandard,
} from '../../utils/episodeValidator';
import {
  DEFAULT_TEMPLATE_OPTIONS,
  formatEpisodeToStandardTemplate,
} from '../../utils/episodeTemplateStandardizer';
import { useMasterArchiveMetrics } from './archive/hooks/useMasterArchiveMetrics';
import { useMasterArchiveFilter } from './archive/hooks/useMasterArchiveFilter';
import { ArchiveOverviewHeader } from './archive/components/ArchiveOverviewHeader';
import {
  EpisodeQualityWarningBanner,
  Non5RankFixPreviewItem,
} from './archive/components/EpisodeQualityWarningBanner';
import { ArchiveThreeTierTagDrawer } from './archive/components/ArchiveThreeTierTagDrawer';
import { ArchiveSeriesCategoryModal } from './archive/components/ArchiveSeriesCategoryModal';
import { TemplateStandardizerModal } from './archive/components/TemplateStandardizerModal';
import { SeriesTagBindingModal } from './archive/components/SeriesTagBindingModal';
import { SeriesShelfView } from './archive/components/SeriesShelfView';
import { EpisodeFilterControls } from './archive/components/EpisodeFilterControls';
import { EpisodeCardGrid } from './archive/components/EpisodeCardGrid';
import { EpisodeTableView } from './archive/components/EpisodeTableView';
import type { Episode } from '../../types/episode.types';

/**
 * MasterEpisodeArchiveView
 * Modular coordinator for the Master Episode Archive:
 * - Smart "5 อันดับ [ชื่อรายการ]" Series extraction & episode counting
 * - Custom Master Archive Categories (independent from footage tags)
 * - 3-Tier Footage Tag Filter Drawer (AND / OR matching)
 */
export const MasterEpisodeArchiveView: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const {
    episodes,
    tags,
    computedFootage,
    batchUpsertEpisodes,
    setSelectedEpisodeDetailId,
    launchEpisodeBuilderForCategory,
    openSupabaseSyncWithFilter,
  } = useCMS();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [bindingTargetSeriesKey, setBindingTargetSeriesKey] = useState<string | null>(
    null
  );
  const [isBatchFixing, setIsBatchFixing] = useState(false);
  const [batchFixResultCount, setBatchFixResultCount] = useState<number | null>(
    null
  );
  const [isThreeTierDrawerOpen, setIsThreeTierDrawerOpen] = useState(false);

  // Count how many episodes do not yet conform to "5 อันดับ ... สุดฮา! EP.n" (with exemptions)
  const templateNeedsUpdateCount = useMemo(() => {
    let count = 0;
    for (const ep of episodes) {
      if (formatEpisodeToStandardTemplate(ep, DEFAULT_TEMPLATE_OPTIONS).needsUpdate) {
        count++;
      }
    }
    return count;
  }, [episodes]);

  // Compute all episodes flagged as NON_5_RANK (or missing 5 อันดับ in title)
  const { non5RankFixedEpisodes, non5RankPreviews } = useMemo(() => {
    const fixedList: typeof episodes = [];
    const previews: Non5RankFixPreviewItem[] = [];

    for (const ep of episodes) {
      const val = validateEpisodeStandard(ep);
      if (val.hasNon5Rank) {
        const fixed = buildFixedFiveRankEpisode(ep);
        fixedList.push(fixed);
        previews.push({
          id: ep.id,
          beforeTitle: ep.title,
          afterTitle: fixed.title,
          afterSeriesTitle: fixed.seriesTitle || '',
        });
      }
    }

    return {
      non5RankFixedEpisodes: fixedList,
      non5RankPreviews: previews,
    };
  }, [episodes]);

  const handleBatchFixNon5Rank = async () => {
    if (non5RankFixedEpisodes.length === 0 || isBatchFixing) return;
    setIsBatchFixing(true);
    try {
      const count = non5RankFixedEpisodes.length;
      await batchUpsertEpisodes(non5RankFixedEpisodes);
      setBatchFixResultCount(count);
      setTimeout(() => {
        setBatchFixResultCount(null);
      }, 5000);
    } finally {
      setIsBatchFixing(false);
    }
  };

  const handleApplyBatchTemplateStandardize = async (
    updatedEpisodes: Episode[]
  ) => {
    if (updatedEpisodes.length === 0) return;
    await batchUpsertEpisodes(updatedEpisodes);
    setBatchFixResultCount(updatedEpisodes.length);
    setTimeout(() => {
      setBatchFixResultCount(null);
    }, 5000);
  };

  // 1. Metrics, Smart "5 อันดับ" Series Ranking & Custom Archive Categories Hook
  const {
    categoryRanking,
    unproducedSeriesRanking,
    overviewMetrics,
    getEpisodeFootageMix,
    latestEpisodeByCategoryMap,
    episodeSeriesKeyMap,
    episodeFootageTagsMap,
    tagEpisodeCounts,
    archiveCategories,
    archiveCategoryMap,
    archiveCategoryStats,
    seriesToTagIdsMap,
    handleAssignSeriesToArchiveCategory,
    handleAddArchiveCategory,
    handleRenameArchiveCategory,
    handleDeleteArchiveCategory,
    handleBindSeriesToTags,
  } = useMasterArchiveMetrics();

  const bindingTargetSeries = useMemo(
    () =>
      bindingTargetSeriesKey
        ? categoryRanking.find((c) => c.seriesKey === bindingTargetSeriesKey) ||
          null
        : null,
    [bindingTargetSeriesKey, categoryRanking]
  );

  // 2. Filters, Search, 3-Tier Footage Tags, Sort & Pagination Hook
  const {
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
    completenessFilter,
    setCompletenessFilter,
    completenessCounts,
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
    totalEpisodesCount,
    hasActiveFilters,
    resetFilters,
  } = useMasterArchiveFilter({
    categoryRanking,
    unproducedSeriesRanking,
    episodeSeriesKeyMap,
    episodeFootageTagsMap,
    getEpisodeFootageMix,
  });

  return (
    <div className="space-y-4">
      {/* 1. Header & 4 Concise Pastel Earth-Tone KPI Cards */}
      <ArchiveOverviewHeader
        overviewMetrics={overviewMetrics}
        categoryRanking={categoryRanking}
        archiveTab={archiveTab}
        onTabChange={setArchiveTab}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        sortedEpisodesCount={sortedEpisodes.length}
        onOpenSupabaseSync={() =>
          openSupabaseSyncWithFilter({
            seriesKey: categoryFilter !== 'ALL' ? categoryFilter : undefined,
            archiveCategoryId:
              selectedGroupId !== 'ALL' ? selectedGroupId : undefined,
            searchQuery: searchQuery.trim() || undefined,
          })
        }
        onOpenManageCategories={() => setIsCategoryModalOpen(true)}
        onOpenTemplateStandardizer={() => setIsTemplateModalOpen(true)}
        templateNeedsUpdateCount={templateNeedsUpdateCount}
      />

      {/* 1.5 Compact Standard Fix Strip */}
      <EpisodeQualityWarningBanner
        non5RankPreviews={non5RankPreviews}
        onBatchFixNon5Rank={handleBatchFixNon5Rank}
        isBatchFixing={isBatchFixing}
        batchFixResultCount={batchFixResultCount}
      />

      {/* 2. Tab Views: Episodes List vs Series Shelf */}
      <AnimatePresence mode="wait" initial={false}>
        {archiveTab === 'SERIES_SHELF' ? (
          <motion.div
            key="archive-tab-shelf"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{
              duration: prefersReducedMotion ? 0.08 : 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <SeriesShelfView
              shelfSeriesItems={shelfSeriesItems}
              activeSeriesCount={categoryRanking.length}
              unproducedSeriesCount={unproducedSeriesRanking.length}
              showUnproducedSeries={showUnproducedSeries}
              onToggleShowUnproducedSeries={() =>
                setShowUnproducedSeries((prev) => !prev)
              }
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              archiveCategories={archiveCategories}
              onAssignSeriesToCategory={handleAssignSeriesToArchiveCategory}
              latestEpisodeByCategoryMap={latestEpisodeByCategoryMap}
              onViewCategoryEpisodes={(seriesKey) => {
                setCategoryFilter(seriesKey);
                setArchiveTab('EPISODES');
              }}
              launchEpisodeBuilderForCategory={launchEpisodeBuilderForCategory}
              onOpenTagBinding={(row) => setBindingTargetSeriesKey(row.seriesKey)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="archive-tab-episodes"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{
              duration: prefersReducedMotion ? 0.08 : 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="space-y-3.5"
          >
            {/* Precision Search & Consolidated Filter Bar */}
            <EpisodeFilterControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedGroupId={selectedGroupId}
              onGroupChange={setSelectedGroupId}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              subcategoryFilter={subcategoryFilter}
              onSubcategoryChange={setSubcategoryFilter}
              availableSubcategories={availableSubcategories}
              productionTargetFilter={productionTargetFilter}
              onProductionTargetChange={setProductionTargetFilter}
              completenessFilter={completenessFilter}
              onCompletenessFilterChange={setCompletenessFilter}
              completenessCounts={completenessCounts}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              filteredCount={sortedEpisodes.length}
              totalCount={totalEpisodesCount}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
              archiveCategoryMap={archiveCategoryMap}
              archiveCategoryStats={archiveCategoryStats}
              categoriesInGroup={categoriesInGroup}
              categoryRanking={categoryRanking}
              selectedFootageTagIds={selectedFootageTagIds}
              onToggleFootageTag={handleToggleFootageTag}
              isThreeTierDrawerOpen={isThreeTierDrawerOpen}
              onToggleThreeTierDrawer={() =>
                setIsThreeTierDrawerOpen((prev) => !prev)
              }
            />

            <ArchiveThreeTierTagDrawer
              isExpanded={isThreeTierDrawerOpen}
              onClose={() => setIsThreeTierDrawerOpen(false)}
              selectedFootageTagIds={selectedFootageTagIds}
              onToggleFootageTag={handleToggleFootageTag}
              onClearFootageTags={handleClearFootageTags}
              footageTagMatchMode={footageTagMatchMode}
              onChangeFootageTagMatchMode={setFootageTagMatchMode}
              tagEpisodeCounts={tagEpisodeCounts}
              matchedEpisodesCount={sortedEpisodes.length}
            />

            {/* Cards or Table View with Jump-to-Page Pagination */}
            {viewMode === 'CARDS' ? (
              <EpisodeCardGrid
                paginatedEpisodes={paginatedEpisodes}
                totalFilteredCount={sortedEpisodes.length}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                getEpisodeFootageMix={getEpisodeFootageMix}
                onSelectEpisode={setSelectedEpisodeDetailId}
              />
            ) : (
              <EpisodeTableView
                paginatedEpisodes={paginatedEpisodes}
                totalFilteredCount={sortedEpisodes.length}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                getEpisodeFootageMix={getEpisodeFootageMix}
                onSelectEpisode={setSelectedEpisodeDetailId}
                sortBy={sortBy}
                onToggleSortColumn={onToggleSortColumn}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Custom Master Archive Category & Series Organizer Modal (via BaseModal Portal) */}
      <ArchiveSeriesCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        archiveCategories={archiveCategories}
        archiveCategoryStats={archiveCategoryStats}
        seriesRanking={categoryRanking}
        onAssignSeriesToCategory={handleAssignSeriesToArchiveCategory}
        onAddCategory={handleAddArchiveCategory}
        onRenameCategory={handleRenameArchiveCategory}
        onDeleteCategory={handleDeleteArchiveCategory}
      />

      {/* 7. Batch Template Title Standardizer Modal (via BaseModal Portal) */}
      <TemplateStandardizerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        episodes={episodes}
        onApplyBatchStandardize={handleApplyBatchTemplateStandardize}
      />

      {/* 8. Series-to-3-Tier-Tag Binding Modal (via BaseModal Portal) */}
      <SeriesTagBindingModal
        isOpen={Boolean(bindingTargetSeries)}
        onClose={() => setBindingTargetSeriesKey(null)}
        seriesItem={bindingTargetSeries}
        tags={tags}
        computedFootage={computedFootage}
        episodes={episodes}
        episodeSeriesKeyMap={episodeSeriesKeyMap}
        customBoundTagIds={
          bindingTargetSeries
            ? seriesToTagIdsMap[bindingTargetSeries.seriesKey] || []
            : []
        }
        onSaveBinding={handleBindSeriesToTags}
      />
    </div>
  );
};
