import React from 'react';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { FullscreenStagingStudioModal } from './stagingStudio/FullscreenStagingStudioModal';
import { useFootageVault } from './vault/useFootageVault';
import { VaultFootageResultsSection } from './vault/VaultFootageResultsSection';
import { VaultHeaderKpiSection } from './vault/VaultHeaderKpiSection';
import { VaultResultsHeaderBar } from './vault/VaultResultsHeaderBar';
import { VaultStagingQuickSortBar } from './vault/VaultStagingQuickSortBar';
import { VaultThreeTierExplorer } from './vault/VaultThreeTierExplorer';

export const FootageLibraryView: React.FC = () => {
  const vault = useFootageVault();

  return (
    <div className="space-y-5">
      {/* 1. Header, Quick Actions & Contextual 4-Card KPI Summary */}
      <VaultHeaderKpiSection
        totalVaultCount={vault.computedFootage.length}
        stagingCount={vault.untaggedFootages.length}
        isStagingFilterActive={vault.isStagingFilterActive}
        vaultMetrics={vault.vaultMetrics}
        activeScopeDescription={vault.activeScopeDescription}
        hasHierarchySelection={vault.hasHierarchySelection}
        statusFilter={vault.statusFilter}
        settings={vault.settings}
        onToggleStagingFilter={vault.handleToggleStagingFilter}
        onStatusFilterChange={vault.setStatusFilter}
        onClearHierarchySelection={vault.handleClearHierarchySelection}
        onOpenGoogleDriveBatchModal={() => vault.setIsGoogleDriveBatchModalOpen(true)}
        onOpenFullscreenStudio={() => vault.setIsFullscreenStudioOpen(true)}
      />

      {/* 2. Progressive 3-Tier Category Explorer (Group -> Main Category -> Subcategory) */}
      <VaultThreeTierExplorer
        isExpanded={vault.isCategoryInventoryExpanded}
        onToggleExpand={() => vault.setIsCategoryInventoryExpanded((prev) => !prev)}
        categoryGroupsOverview={vault.categoryGroupsOverview}
        mainCategoriesCount={vault.mainCategoriesOverview.length}
        selectedGroupId={vault.selectedGroupId}
        selectedTagFilter={vault.selectedTagFilter}
        activeGroupOverview={vault.activeGroupOverview}
        activeMainCategory={vault.activeMainCategory}
        hasHierarchySelection={vault.hasHierarchySelection}
        computedFootage={vault.computedFootage}
        activeDragFootageIds={vault.activeDragFootageIds}
        onQuickAssignCategory={vault.handleQuickAssignCategory}
        onSelectGroup={vault.handleSelectGroup}
        onSelectMainCategory={vault.handleSelectMainCategory}
        onSelectSubcategory={vault.handleSelectSubcategory}
        onClearMainCategoryFilter={() => vault.setSelectedTagFilter([])}
        onSelectAllInMainCategory={(mainTagId) =>
          vault.setSelectedTagFilter([mainTagId])
        }
        onClearHierarchySelection={vault.handleClearHierarchySelection}
        onOpenThreeTierManager={() => vault.setIsThreeTierManagerOpen(true)}
        onLaunchEpisodeBuilder={vault.launchEpisodeBuilderForCategory}
      />

      {/* 3. Streamlined Search & Action Filter Toolbar */}
      <SearchFilterBar
        searchQuery={vault.searchQuery}
        onSearchChange={vault.setSearchQuery}
        selectedTags={vault.selectedTagFilter}
        onToggleTag={vault.handleToggleTag}
        statusFilter={vault.statusFilter}
        onStatusFilterChange={vault.setStatusFilter}
        flowFilter={vault.flowFilter}
        onFlowFilterChange={vault.setFlowFilter}
        actionFilter={vault.actionFilter}
        onActionFilterChange={vault.setActionFilter}
        sortBy={vault.sortBy}
        onSortByChange={vault.setSortBy}
        tags={vault.tags}
        categoryMatrix={vault.categoryMatrix}
        untaggedCount={vault.untaggedFootages.length}
        missingDriveCount={vault.missingDriveFootages.length}
        hasCustomFilter={vault.hasHierarchySelection}
        onResetFilters={vault.handleResetFilters}
        totalResultCount={vault.filteredAndSortedFootage.length}
      />

      {/* 3.5 Sticky Top Staging Quick-Sort Workspace & Undo Notification Dock */}
      <VaultStagingQuickSortBar
        isStagingFilterActive={vault.isStagingFilterActive}
        stagingCount={vault.untaggedFootages.length}
        selectedFootageIds={vault.selectedFootageIdsForBatch}
        activeDragFootageIds={vault.activeDragFootageIds}
        categoryGroupsOverview={vault.categoryGroupsOverview}
        mainCategoriesOverview={vault.mainCategoriesOverview}
        computedFootage={vault.computedFootage}
        lastUndoRecord={vault.lastQuickSortUndoRecord}
        onQuickAssignCategory={vault.handleQuickAssignCategory}
        onUndoLastQuickSort={vault.undoLastQuickSort}
        onDismissUndoRecord={vault.dismissQuickSortUndoRecord}
        onSelectAllInStaging={vault.handleSelectAllInStaging}
        isAllStagingSelected={vault.isAllStagingSelected}
        onClearSelection={vault.handleClearBatchSelection}
        onOpenFullscreenStudio={() => vault.setIsFullscreenStudioOpen(true)}
      />

      {/* 4. Animated Scope Results Summary, Multi-Select Toolbar & View Mode Switcher */}
      <VaultResultsHeaderBar
        activeScopeDescription={vault.activeScopeDescription}
        filteredCount={vault.filteredAndSortedFootage.length}
        scopedTotalCount={vault.categoryScopedFootage.length}
        totalVaultCount={vault.computedFootage.length}
        paginatedCount={vault.paginatedFootage.length}
        stagingCount={vault.untaggedFootages.length}
        selectedBatchCount={vault.selectedFootageIdsForBatch.length}
        isAllPaginatedSelected={vault.isAllPaginatedSelected}
        isAllStagingSelected={vault.isAllStagingSelected}
        onToggleSelectAllInPage={vault.handleToggleSelectAllInPage}
        onSelectAllInStaging={vault.handleSelectAllInStaging}
        onClearBatchSelection={vault.handleClearBatchSelection}
        viewMode={vault.viewMode}
        onViewModeChange={vault.setViewMode}
      />

      {/* 5. Staggered Spring Footage Results (Grid / Table / Empty State / Pagination) */}
      <VaultFootageResultsSection
        resultsTransitionKey={vault.resultsTransitionKey}
        activeScopeDescription={vault.activeScopeDescription}
        viewMode={vault.viewMode}
        filteredCount={vault.filteredAndSortedFootage.length}
        paginatedFootage={vault.paginatedFootage}
        tagMap={vault.tagMap}
        settings={vault.settings}
        currentPage={vault.currentPage}
        pageSize={vault.pageSize}
        onPageChange={vault.setCurrentPage}
        onPageSizeChange={vault.setPageSize}
        onSelectForTraceability={vault.setTraceabilityFootageId}
        onQuickTagClick={vault.handleToggleTag}
        onSelectWithRange={vault.handleSelectWithRange}
        onStartDragFootage={vault.handleStartDragFootage}
        onEndDragFootage={vault.handleEndDragFootage}
        onResetFilters={vault.handleResetFilters}
        onOpenDirectFootageModal={() => vault.setIsDirectFootageModalOpen(true)}
      />

      {/* 6. Fullscreen Dual-Pane Staging Triage Studio Modal */}
      <FullscreenStagingStudioModal
        isOpen={vault.isFullscreenStudioOpen}
        onClose={() => vault.setIsFullscreenStudioOpen(false)}
        categoryGroupsOverview={vault.categoryGroupsOverview}
        mainCategoriesOverview={vault.mainCategoriesOverview}
        lastUndoRecord={vault.lastQuickSortUndoRecord}
        onQuickAssignCategory={vault.handleQuickAssignCategory}
        onUndoLastQuickSort={vault.undoLastQuickSort}
        onDismissUndoRecord={vault.dismissQuickSortUndoRecord}
        onStartDragFootage={vault.handleStartDragFootage}
        onEndDragFootage={vault.handleEndDragFootage}
        onSelectWithRange={vault.handleSelectWithRange}
      />
    </div>
  );
};
