import React from 'react';
import { useCMS } from '../../context/CMSContext';
import { useMasterArchiveMetrics } from './archive/hooks/useMasterArchiveMetrics';
import { useMasterArchiveFilter } from './archive/hooks/useMasterArchiveFilter';
import { ArchiveOverviewHeader } from './archive/components/ArchiveOverviewHeader';
import { CategoryUtilizationDrawer } from './archive/components/CategoryUtilizationDrawer';
import { SeriesNavigationFilterBar } from './archive/components/SeriesNavigationFilterBar';
import { SeriesShelfView } from './archive/components/SeriesShelfView';
import { EpisodeFilterControls } from './archive/components/EpisodeFilterControls';
import { EpisodeCardGrid } from './archive/components/EpisodeCardGrid';
import { EpisodeTableView } from './archive/components/EpisodeTableView';

/**
 * MasterEpisodeArchiveView
 * Refactored modular coordinator for the master episode archive,
 * delegating O(1) business logic to custom hooks and UI rendering to sub-components.
 */
export const MasterEpisodeArchiveView: React.FC = () => {
  const { setSelectedEpisodeDetailId, launchEpisodeBuilderForCategory } = useCMS();

  // 1. Metrics & Precomputed O(1) Maps Hook
  const {
    categoryRanking,
    maxEpisodesInAnyCategory,
    overviewMetrics,
    getEpisodeFootageMix,
    resolveTagGroupId,
    groupEpisodeCounts,
    latestEpisodeByCategoryMap,
  } = useMasterArchiveMetrics();

  // 2. Filters, Search, Sort & Pagination Hook (Scalable to 1,000+ Episodes)
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
    totalEpisodesCount,
    hasActiveFilters,
    resetFilters,
  } = useMasterArchiveFilter({
    categoryRanking,
    resolveTagGroupId,
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
      />

      {/* 2. Category Distribution & Footage Utilization Drawer */}
      <CategoryUtilizationDrawer
        categoryRanking={categoryRanking}
        maxEpisodesInAnyCategory={maxEpisodesInAnyCategory}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        launchEpisodeBuilderForCategory={launchEpisodeBuilderForCategory}
      />

      {/* 3. 2-Tier Hierarchical Series Navigation Bar */}
      <SeriesNavigationFilterBar
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        categoryFilter={categoryFilter}
        onSelectCategory={setCategoryFilter}
        categoriesInGroup={categoriesInGroup}
        groupEpisodeCounts={groupEpisodeCounts}
      />

      {/* 4. Tab Views: Series Shelf vs Episodes List */}
      {archiveTab === 'SERIES_SHELF' ? (
        <SeriesShelfView
          categoriesInGroup={categoriesInGroup}
          selectedGroupId={selectedGroupId}
          resolveTagGroupId={resolveTagGroupId}
          latestEpisodeByCategoryMap={latestEpisodeByCategoryMap}
          onViewCategoryEpisodes={(catId) => {
            setCategoryFilter(catId);
            setArchiveTab('EPISODES');
          }}
          launchEpisodeBuilderForCategory={launchEpisodeBuilderForCategory}
        />
      ) : (
        <div className="space-y-3.5">
          {/* Precision Filter Controls Bar (Search, Subcategory, Target, Workflow, Sort, View mode) */}
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
            workflowFilter={workflowFilter}
            onWorkflowFilterChange={setWorkflowFilter}
            workflowStageCounts={workflowStageCounts}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filteredCount={sortedEpisodes.length}
            totalCount={totalEpisodesCount}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
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
            />
          )}
        </div>
      )}
    </div>
  );
};
