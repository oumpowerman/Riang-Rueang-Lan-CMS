import React from 'react';
import { GoogleDriveIcon } from '../ui/GoogleDriveIcon';
import { PaginationBar } from '../ui/PaginationBar';
import { GoogleDriveSource1ToNModal } from './GoogleDriveSource1ToNModal';
import { SourceMiningKpiGrid } from './studio/SourceMiningKpiGrid';
import { SourceParentCard } from './studio/SourceParentCard';
import { SourceSmartFilterBar } from './studio/SourceSmartFilterBar';
import { SourceStudioHeader } from './studio/SourceStudioHeader';
import { useSourceMiningStudio } from './studio/useSourceMiningStudio';

export const SourceLibraryView: React.FC = () => {
  const studio = useSourceMiningStudio();

  return (
    <div className="space-y-4">
      {/* Compact Pastel Studio Toolbar */}
      <SourceStudioHeader
        onOpenDrive1ToN={() => studio.setIsDrive1ToNOpen(true)}
        onOpenSourceSplitter={() => studio.openSourceSplitterFor(null)}
      />

      {/* 4-Card Pastel Source KPIs */}
      <SourceMiningKpiGrid
        miningKpis={studio.miningKpis}
        miningFilter={studio.miningFilter}
        underMinedThreshold={studio.underMinedThreshold}
        onMiningFilterChange={studio.setMiningFilter}
        onUnderMinedThresholdChange={studio.setUnderMinedThreshold}
      />

      {/* Smart Filter & 3-Tier Compact Bar */}
      <SourceSmartFilterBar
        searchQuery={studio.searchQuery}
        onSearchChange={studio.setSearchQuery}
        platformFilter={studio.platformFilter}
        onPlatformFilterChange={studio.setPlatformFilter}
        sortBy={studio.sortBy}
        onSortByChange={studio.setSortBy}
        selectedGroupId={studio.selectedGroupId}
        onSelectGroupId={studio.setSelectedGroupId}
        tagsCount={studio.tags.length}
        categoryGroups={studio.categoryGroups}
        showAllTags={studio.showAllTags}
        onToggleShowAllTags={studio.setShowAllTags}
        visibleTagsForBar={studio.visibleTagsForBar}
        tagSourceCounts={studio.tagSourceCounts}
        selectedTags={studio.selectedTags}
        onToggleTag={studio.handleToggleTag}
        hiddenZeroTagCount={studio.hiddenZeroTagCount}
        filteredSourcesCount={studio.filteredAndSortedSources.length}
        hasActiveFilters={studio.hasActiveFilters}
        onResetFilters={studio.handleResetFilters}
      />

      {/* Sources List with Parent & Child Pagination */}
      {studio.filteredAndSortedSources.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-bold text-slate-800">ไม่พบไลฟ์ต้นฉบับ</p>
          <div className="flex items-center justify-center gap-2">
            {studio.hasActiveFilters && (
              <button
                type="button"
                onClick={studio.handleResetFilters}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
            <button
              type="button"
              onClick={() => studio.setIsDrive1ToNOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-800 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 rounded-xl cursor-pointer"
            >
              <GoogleDriveIcon className="w-4 h-4" />
              <span>ดึงไลฟ์จากไดร์ฟ</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {studio.paginatedSources.map((src) => (
            <SourceParentCard
              key={src.id}
              source={src}
              computedFootageMap={studio.computedFootageMap}
              tagMap={studio.tagMap}
              defaultFallbackTagId={studio.tags[0]?.id || 'tag-streamer'}
              underMinedThreshold={studio.underMinedThreshold}
              selectedIdsForSource={studio.selectedClipIdsBySource[src.id] || []}
              currentChildPage={studio.childPageMap[src.id] || 1}
              childPageSize={studio.childPageSize}
              settings={studio.settings}
              onLaunchEpisodeForCategory={studio.launchEpisodeBuilderForCategory}
              onOpenSourceSplitter={studio.openSourceSplitterFor}
              onSelectForTraceability={studio.setTraceabilityFootageId}
              onSelectTop5Ready={studio.handleSelectTop5ReadyInSource}
              onLaunchEpisodeWithCustomClips={
                studio.launchEpisodeBuilderWithCustomClips
              }
              onToggleSelectClip={studio.handleToggleSelectClip}
              onChildPageChange={(p) => studio.handleChildPageChange(src.id, p)}
              onChildPageSizeChange={studio.setChildPageSize}
            />
          ))}

          {/* Parent Sources PaginationBar */}
          <PaginationBar
            currentPage={studio.sourcePage}
            totalItems={studio.filteredAndSortedSources.length}
            pageSize={studio.sourcePageSize}
            onPageChange={studio.setSourcePage}
            onPageSizeChange={studio.setSourcePageSize}
            pageSizeOptions={[2, 3, 5, 10]}
            itemLabel="ไลฟ์"
          />
        </div>
      )}

      {/* Google Drive 1:N Importer Modal */}
      <GoogleDriveSource1ToNModal
        isOpen={studio.isDrive1ToNOpen}
        onClose={() => studio.setIsDrive1ToNOpen(false)}
      />
    </div>
  );
};
