import React from 'react';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { useFootageVault } from './vault/useFootageVault';
import { VaultFootageResultsSection } from './vault/VaultFootageResultsSection';
import { VaultHeaderKpiSection } from './vault/VaultHeaderKpiSection';
import { VaultResultsHeaderBar } from './vault/VaultResultsHeaderBar';
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
        onOpenStatusRuleModal={() => vault.setIsStatusRuleModalOpen(true)}
        onOpenThreeTierManager={() => vault.setIsThreeTierManagerOpen(true)}
        onOpenSourceSplitter={() => vault.openSourceSplitterFor(null)}
        onOpenDirectFootageModal={() => vault.setIsDirectFootageModalOpen(true)}
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

      {/* 4. Animated Scope Results Summary & View Mode Switcher */}
      <VaultResultsHeaderBar
        activeScopeDescription={vault.activeScopeDescription}
        filteredCount={vault.filteredAndSortedFootage.length}
        scopedTotalCount={vault.categoryScopedFootage.length}
        totalVaultCount={vault.computedFootage.length}
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
        onResetFilters={vault.handleResetFilters}
        onOpenDirectFootageModal={() => vault.setIsDirectFootageModalOpen(true)}
      />
    </div>
  );
};
