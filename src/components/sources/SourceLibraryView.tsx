import React from 'react';
import { HardDrive } from 'lucide-react';
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
    <div className="space-y-5">
      {/* Studio Header */}
      <SourceStudioHeader
        onOpenDrive1ToN={() => studio.setIsDrive1ToNOpen(true)}
        onOpenSourceSplitter={() => studio.openSourceSplitterFor(null)}
      />

      {/* Dimension 2: 4-Card Source Yield & Mining KPIs */}
      <SourceMiningKpiGrid
        miningKpis={studio.miningKpis}
        miningFilter={studio.miningFilter}
        underMinedThreshold={studio.underMinedThreshold}
        onMiningFilterChange={studio.setMiningFilter}
        onUnderMinedThresholdChange={studio.setUnderMinedThreshold}
      />

      {/* Dimension 1: Smart Filter & 3-Tier Compact Bar */}
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
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm font-bold text-slate-900">
            ไม่พบคลิปต้นฉบับยาวตามตัวกรองที่เลือก
          </p>
          <p className="text-xs text-slate-500">
            คุณสามารถล้างตัวกรอง หรือกดดึงโฟลเดอร์ไลฟ์สดจาก Google Drive แบบ 1:N เพื่อเพิ่มไลฟ์ต้นฉบับเข้าคลังได้ทันที
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={studio.handleResetFilters}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => studio.setIsDrive1ToNOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>ดึงโฟลเดอร์ไลฟ์จาก Google Drive (1:N)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
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
            itemLabel="คลิปต้นฉบับยาว"
          />
        </div>
      )}

      {/* Dimension 4: Google Drive 1:N Importer Modal */}
      <GoogleDriveSource1ToNModal
        isOpen={studio.isDrive1ToNOpen}
        onClose={() => studio.setIsDrive1ToNOpen(false)}
      />
    </div>
  );
};
