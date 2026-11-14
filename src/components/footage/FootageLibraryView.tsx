import React, { useState } from 'react';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { DuplicateMergeModal } from './duplicates/DuplicateMergeModal';
import { VaultDuplicateBanner } from './duplicates/VaultDuplicateBanner';
import { LineOaIntegrationModal } from './lineIntegration/LineOaIntegrationModal';
import { MissingDriveQueueBanner } from './lineIntegration/MissingDriveQueueBanner';
import { QuickDriveLinkerModal } from './lineIntegration/QuickDriveLinkerModal';
import { FullscreenStagingStudioModal } from './stagingStudio/FullscreenStagingStudioModal';
import { useFootageVault } from './vault/useFootageVault';
import { VaultFootageResultsSection } from './vault/VaultFootageResultsSection';
import { VaultHeaderKpiSection } from './vault/VaultHeaderKpiSection';
import { VaultResultsHeaderBar } from './vault/VaultResultsHeaderBar';
import { VaultStagingQuickSortBar } from './vault/VaultStagingQuickSortBar';
import { VaultThreeTierExplorer } from './vault/VaultThreeTierExplorer';

export const FootageLibraryView: React.FC = () => {
  const vault = useFootageVault();
  const [isLineOaModalOpen, setIsLineOaModalOpen] = useState(false);
  const [isQuickDriveLinkerOpen, setIsQuickDriveLinkerOpen] = useState(false);
  const [isDuplicateMergeModalOpen, setIsDuplicateMergeModalOpen] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 0. Duplicate Footage Scanner Alert Banner */}
      <VaultDuplicateBanner
        duplicateScan={vault.duplicateScan}
        actionFilter={vault.actionFilter}
        onActionFilterChange={vault.setActionFilter}
        onOpenMergeModal={() => setIsDuplicateMergeModalOpen(true)}
      />

      {/* 0.5 Missing Google Drive / Social Link Queue Banner */}
      <MissingDriveQueueBanner
        missingDriveFootages={vault.missingDriveFootages}
        actionFilter={vault.actionFilter}
        onActionFilterChange={vault.setActionFilter}
        onOpenQuickDriveLinker={() => setIsQuickDriveLinkerOpen(true)}
        onOpenLineOaModal={() => setIsLineOaModalOpen(true)}
      />

      {/* 1. Header, Quick Actions & Contextual 4-Card KPI Summary */}
      <VaultHeaderKpiSection
        totalVaultCount={vault.computedFootage.length}
        stagingCount={vault.untaggedFootages.length}
        missingDriveCount={vault.missingDriveFootages.length}
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
        onOpenSheetTagImportModal={() => vault.setIsSheetTagImportModalOpen(true)}
        onOpenYouTubeDateSyncModal={() => vault.setIsYouTubeDateSyncModalOpen(true)}
        onOpenLineOaModal={() => setIsLineOaModalOpen(true)}
        onOpenQuickDriveLinker={() => setIsQuickDriveLinkerOpen(true)}
      />

      {/* 2. 3-Tier Independent Faceted Tag Combiner (Tier 1 | Tier 2 | Tier 3 with Sub-categories & AND/OR Filter) */}
      <VaultThreeTierExplorer
        isExpanded={vault.isCategoryInventoryExpanded}
        onToggleExpand={() => vault.setIsCategoryInventoryExpanded((prev) => !prev)}
        tags={vault.tags}
        tierSubCategories={vault.tierSubCategories}
        tagMatchMode={vault.tagMatchMode}
        onChangeTagMatchMode={vault.setTagMatchMode}
        categoryGroupsOverview={vault.categoryGroupsOverview}
        mainCategoriesCount={vault.mainCategoriesOverview.length}
        selectedGroupId={vault.selectedGroupId}
        selectedTagFilter={vault.selectedTagFilter}
        activeGroupOverview={vault.activeGroupOverview}
        activeMainCategory={vault.activeMainCategory}
        hasHierarchySelection={vault.hasHierarchySelection}
        computedFootage={vault.computedFootage}
        scopedFootageCount={vault.categoryScopedFootage.length}
        scopedUsableCount={vault.vaultMetrics.usable}
        activeDragFootageIds={vault.activeDragFootageIds}
        onQuickAssignCategory={vault.handleQuickAssignCategory}
        onSelectGroup={vault.handleSelectGroup}
        onSelectMainCategory={vault.handleSelectMainCategory}
        onSelectSubcategory={vault.handleSelectSubcategory}
        onToggleFacetTag={vault.handleToggleFacetTag}
        onClearMainCategoryFilter={() => vault.setSelectedTagFilter([])}
        onSelectAllInMainCategory={(mainTagId) =>
          vault.setSelectedTagFilter([mainTagId])
        }
        onClearHierarchySelection={vault.handleClearHierarchySelection}
        onOpenThreeTierManager={() => vault.setIsThreeTierManagerOpen(true)}
        onLaunchEpisodeBuilder={vault.launchEpisodeBuilderForCategory}
        onLaunchEpisodeFromCurrentFilter={vault.handleLaunchEpisodeFromCurrentFilter}
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
        duplicateCount={vault.duplicateScan.totalItemsInClusters}
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
        duplicateReasonsById={vault.duplicateScan.itemReasonsById}
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

      {/* 7. LINE OA Webhook Apps Script Generator & Simulator Modal */}
      <LineOaIntegrationModal
        isOpen={isLineOaModalOpen}
        onClose={() => setIsLineOaModalOpen(false)}
        onOpenQuickDriveLinker={() => setIsQuickDriveLinkerOpen(true)}
      />

      {/* 8. Quick Drive Linker Queue Modal */}
      <QuickDriveLinkerModal
        isOpen={isQuickDriveLinkerOpen}
        onClose={() => setIsQuickDriveLinkerOpen(false)}
        onSelectForTraceability={vault.setTraceabilityFootageId}
      />

      {/* 9. Duplicate Footage Review, Survivor Selector & Auto-Merge Modal */}
      <DuplicateMergeModal
        isOpen={isDuplicateMergeModalOpen}
        onClose={() => setIsDuplicateMergeModalOpen(false)}
        duplicateScan={vault.duplicateScan}
      />
    </div>
  );
};

