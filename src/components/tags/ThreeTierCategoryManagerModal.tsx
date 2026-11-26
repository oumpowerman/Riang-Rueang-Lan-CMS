import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, GitMerge, Tags, X } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { CategoryTier } from '../../types/tag.types';
import { BaseModal } from '../ui/BaseModal';
import { Tab1StatusRulesConfig } from './tabs/Tab1StatusRulesConfig';
import { JunkTagCleanupModal } from './JunkTagCleanupModal';
import { TagRulesDictionaryModal } from './TagRulesDictionaryModal';
import { useThreeTierCategoryState } from './three-tier/useThreeTierCategoryState';
import {
  ThreeTierHeaderRightControls,
  ThreeTierQuickSearchAndSummaryBar,
  ThreeTierConceptBanner,
  UnifiedTagStudioTab,
} from './three-tier/ThreeTierHeaderAndEmpty';
import { IndependentTierColumn } from './three-tier/IndependentTierColumn';
import { ThreeTierBatchMoveBar } from './three-tier/ThreeTierBatchMoveBar';
import { ThreeTierConfirmModals } from './three-tier/ThreeTierConfirmModals';
import { needsDictionaryCleanup } from '../../utils/reorganizeTagsToDictionary';

export const ThreeTierCategoryManagerModal: React.FC = () => {
  const {
    computedFootage,
    categoryMatrix,
    settings,
    updateSettings,
    setIsClearClipsModalOpen,
    threeTierStudioTab,
    setThreeTierStudioTab,
    isCloudSynced,
  } = useCMS();

  const {
    isThreeTierManagerOpen,
    setIsThreeTierManagerOpen,
    categoryGroups,
    tags,
    tierSubCategories,
    tier1Tags,
    tier2Tags,
    tier3Tags,
    handleRestoreDefaultsAndSelect,
    reorganizeTagsToDataDictionary,

    // Unified cross-tier & column search filters
    globalSearchQuery,
    setGlobalSearchQuery,
    clearAllSearches,
    filteredTierCounts,
    tier1SearchQuery,
    setTier1SearchQuery,
    tier2SearchQuery,
    setTier2SearchQuery,
    tier3SearchQuery,
    setTier3SearchQuery,

    // Multi-select, Drag-and-Drop & Bulk Move / Edit / Delete
    selectedTagIds,
    draggingTagIds,
    isBatchMovingTags,
    batchMoveProgressText,
    handleToggleSelectTag,
    handleToggleSelectAllVisible,
    handleClearSelectedTags,
    handleStartDragTag,
    handleEndDragTag,
    handleExecuteBatchMove,
    handleExecuteBatchMetadataUpdate,
    lastTagReorgUndoRecord,
    undoLastTagReorg,
    dismissTagReorgUndoRecord,

    // Inline Rename on Card
    inlineEditingTagId,
    inlineEditingName,
    setInlineEditingName,
    inlineDuplicateConflict,
    handleStartInlineRename,
    handleCommitInlineRename,
    handleCancelInlineRename,

    // Duplicate Check & Merge
    duplicateGroupsCount,
    isDeduplicatingTags,
    dedupReportBanner,
    setDedupReportBanner,
    handleRunDeduplicateTags,

    // Tag & Sub-category CRUD
    handleCreateTagInSubCategory,
    handleUpdateTagDetails,
    addTierSubCategory,
    renameTierSubCategory,
    deleteTierSubCategory,

    // Confirmation modals state & handlers
    showWipeConfirm,
    setShowWipeConfirm,
    showDeleteGroupConfirm,
    setShowDeleteGroupConfirm,
    showDeleteTagConfirm,
    setShowDeleteTagConfirm,
    showBatchDeleteConfirm,
    setShowBatchDeleteConfirm,
    handleConfirmWipe,
    handleConfirmDeleteGroup,
    handleConfirmDeleteTag,
    handleConfirmBatchDelete,
  } = useThreeTierCategoryState();

  const [activeStudioTab, setActiveStudioTab] =
    useState<UnifiedTagStudioTab>(threeTierStudioTab || 'STUDIO_3TIER');
  const [showConceptBanner, setShowConceptBanner] = useState(false);
  const unifiedSearchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isJunkTagCleanupOpen, setIsJunkTagCleanupOpen] = useState(false);
  const [isTagRulesDictionaryOpen, setIsTagRulesDictionaryOpen] =
    useState(false);
  const [expandedFocusColumn, setExpandedFocusColumn] = useState<
    'NONE' | 'TIER_1' | 'TIER_2' | 'TIER_3'
  >('NONE');

  const isBulkFocusMode =
    activeStudioTab === 'STUDIO_3TIER' && expandedFocusColumn !== 'NONE';
  const isExpandedCleanView = isBulkFocusMode || isFullScreen;

  const [mobileActiveTier, setMobileActiveTier] = useState<CategoryTier>(1);

  const hasAnySearchActive = Boolean(
    globalSearchQuery.trim() ||
      tier1SearchQuery.trim() ||
      tier2SearchQuery.trim() ||
      tier3SearchQuery.trim()
  );

  React.useEffect(() => {
    if (isThreeTierManagerOpen && threeTierStudioTab) {
      setActiveStudioTab(threeTierStudioTab);
    }
  }, [isThreeTierManagerOpen, threeTierStudioTab]);

  // Safely run initial dictionary cleanup once when Cloud sync is ready, avoiding interfering with live user edits
  const hasRunInitialCleanRef = React.useRef(false);
  React.useEffect(() => {
    if (!isCloudSynced || hasRunInitialCleanRef.current || tags.length <= 1) {
      return;
    }
    hasRunInitialCleanRef.current = true;
    if (!needsDictionaryCleanup(tags, settings.tierSubCategories)) {
      return;
    }

    reorganizeTagsToDataDictionary()
      .catch((err) => {
        console.warn('Auto dictionary cleanup error:', err);
        hasRunInitialCleanRef.current = false;
      });
  }, [
    isCloudSynced,
    tags,
    settings.tierSubCategories,
    reorganizeTagsToDataDictionary,
  ]);

  const handleClose = () => {
    if (isBatchMovingTags) return;
    setIsThreeTierManagerOpen(false);
  };

  const handleFocusUnifiedSearch = () => {
    if (activeStudioTab !== 'STUDIO_3TIER') {
      setActiveStudioTab('STUDIO_3TIER');
      setThreeTierStudioTab('STUDIO_3TIER');
    }
    window.setTimeout(() => {
      unifiedSearchInputRef.current?.focus();
      unifiedSearchInputRef.current?.select();
    }, 60);
  };

  const handleRequestClearAllClips = () => {
    if (isBatchMovingTags) return;
    setIsThreeTierManagerOpen(false);
    setIsClearClipsModalOpen(true);
  };

  return (
    <>
      <BaseModal
        isOpen={isThreeTierManagerOpen}
        onClose={handleClose}
        closeOnBackdropClick={!isBatchMovingTags}
        closeOnEsc={!isBatchMovingTags}
        fullScreen={isFullScreen || isBulkFocusMode}
        maxWidthClass="max-w-[96vw] xl:max-w-[1440px]"
        heightClass="h-[92dvh] sm:h-[90vh]"
        icon={<Tags className="w-5 h-5" />}
        title={
          <>
            <span className="sm:hidden">สตูดิโอแท็ก 3 ชั้น</span>
            <span className="hidden sm:inline">
              สตูดิโอระบบแท็ก 3 ชั้นอิสระ & ตั้งค่าเกณฑ์สีพักฟุต
            </span>
          </>
        }
        headerRight={
          <ThreeTierHeaderRightControls
            activeStudioTab={activeStudioTab}
            onChangeActiveStudioTab={(tab) => {
              setActiveStudioTab(tab);
              setThreeTierStudioTab(tab);
            }}
            cooldownDays={settings.cooldownDays ?? 14}
            greenReadyDays={settings.greenReadyDays ?? 21}
            showConceptBanner={showConceptBanner}
            onToggleConceptBanner={() => setShowConceptBanner((prev) => !prev)}
            showGlobalSearch={Boolean(globalSearchQuery.trim())}
            onToggleGlobalSearch={handleFocusUnifiedSearch}
            onRequestWipe={() => setShowWipeConfirm(true)}
            onRestoreDefaults={handleRestoreDefaultsAndSelect}
            onRequestClearAllClips={handleRequestClearAllClips}
            isFullScreen={isFullScreen || isBulkFocusMode}
            onToggleFullScreen={() => {
              if (isBulkFocusMode || isFullScreen) {
                setExpandedFocusColumn('NONE');
                setIsFullScreen(false);
              } else {
                setIsFullScreen(true);
              }
            }}
            isBulkFocusMode={isBulkFocusMode}
            onOpenJunkTagCleanup={() => setIsJunkTagCleanupOpen(true)}
            onOpenTagRulesDictionary={() => setIsTagRulesDictionaryOpen(true)}
            duplicateGroupsCount={duplicateGroupsCount}
            isDeduplicatingTags={isDeduplicatingTags}
            onRunDeduplicateTags={handleRunDeduplicateTags}
          />
        }
        headerContent={
          isExpandedCleanView ? undefined : (
            <ThreeTierConceptBanner
              isOpen={showConceptBanner}
              onOpenTagRulesDictionary={() => setIsTagRulesDictionaryOpen(true)}
            />
          )
        }
        bodyClassName="p-0 bg-[#FAF8F5] flex flex-col overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {activeStudioTab === 'STUDIO_3TIER' ? (
            <motion.div
              key="studio-3tier-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex-1 min-h-0 flex flex-col overflow-hidden"
            >
              {/* Always-Ready Unified Cross-Tier Search & Live Match Summary Bar */}
              <ThreeTierQuickSearchAndSummaryBar
                globalSearchQuery={globalSearchQuery}
                onGlobalSearchQueryChange={setGlobalSearchQuery}
                hasAnySearchActive={hasAnySearchActive}
                onClearAllSearches={clearAllSearches}
                totalCounts={{
                  tier1: tier1Tags.length,
                  tier2: tier2Tags.length,
                  tier3: tier3Tags.length,
                }}
                matchCounts={filteredTierCounts}
                onSelectTierTab={(tier) => setMobileActiveTier(tier)}
                searchInputRef={unifiedSearchInputRef}
              />

              {/* Duplicate Tag Scan / Merge Result Banner */}
              <AnimatePresence initial={false}>
                {dedupReportBanner && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden shrink-0 border-b border-[#BAD8BF] bg-[#EEF5EE]"
                  >
                    <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#1C4824]">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        {dedupReportBanner.status === 'MERGED' ? (
                          <GitMerge className="w-4 h-4 text-[#2D623C] shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-[#2D623C] shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 space-y-0.5">
                          {dedupReportBanner.status === 'MERGED' ? (
                            <>
                              <div className="font-extrabold">
                                รวมแท็กซ้ำเรียบร้อยแล้ว{' '}
                                <span className="tabular-nums">
                                  ({dedupReportBanner.stats.duplicateGroupCount} กลุ่ม · ลบตัวซ้ำ {dedupReportBanner.stats.mergedTagsCount} แท็ก · อัปเดต {dedupReportBanner.stats.migratedFootagesCount} ฟุต / {dedupReportBanner.stats.migratedEpisodesCount} EP)
                                </span>
                              </div>
                              <div className="text-[11px] text-[#2D5E36] truncate">
                                รวมเข้าเป็น:{' '}
                                {dedupReportBanner.stats.mergedSummaries
                                  .map((s) => `#${s.winnerName}`)
                                  .join(', ')}
                              </div>
                            </>
                          ) : (
                            <div className="font-bold">
                              ตรวจเช็กเรียบร้อย: ไม่พบแท็กชื่อซ้ำในระบบ (แท็กทั้งหมดไม่ซ้ำกัน 100%)
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDedupReportBanner(null)}
                        aria-label="ปิดแถบสรุปผลตรวจแท็กซ้ำ"
                        className="p-1 rounded-lg text-[#2D623C] hover:bg-[#DCECE0] cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Tier Segmented Switcher (md:hidden) */}
              <div className="md:hidden px-3 py-2 bg-[#F5EFE6] border-b border-[#E2D5C4] shrink-0">
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#EAE2D5] border border-[#DDD3C4]">
                  <button
                    type="button"
                    onClick={() => setMobileActiveTier(1)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      mobileActiveTier === 1
                        ? 'bg-[#2C5378] text-white shadow-xs'
                        : 'text-[#4A3F33] hover:text-[#2D241C]'
                    }`}
                  >
                    <span>TIER 1</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded tabular-nums ${
                        mobileActiveTier === 1
                          ? 'bg-white/20 text-white font-extrabold'
                          : 'bg-white/60 text-[#524538]'
                      }`}
                    >
                      {hasAnySearchActive
                        ? `${filteredTierCounts.tier1}/${tier1Tags.length}`
                        : tier1Tags.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileActiveTier(2)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      mobileActiveTier === 2
                        ? 'bg-[#8A5A22] text-white shadow-xs'
                        : 'text-[#4A3F33] hover:text-[#2D241C]'
                    }`}
                  >
                    <span>TIER 2</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded tabular-nums ${
                        mobileActiveTier === 2
                          ? 'bg-white/20 text-white font-extrabold'
                          : 'bg-white/60 text-[#524538]'
                      }`}
                    >
                      {hasAnySearchActive
                        ? `${filteredTierCounts.tier2}/${tier2Tags.length}`
                        : tier2Tags.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileActiveTier(3)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      mobileActiveTier === 3
                        ? 'bg-[#2D623C] text-white shadow-xs'
                        : 'text-[#4A3F33] hover:text-[#2D241C]'
                    }`}
                  >
                    <span>TIER 3</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded tabular-nums ${
                        mobileActiveTier === 3
                          ? 'bg-white/20 text-white font-extrabold'
                          : 'bg-white/60 text-[#524538]'
                      }`}
                    >
                      {hasAnySearchActive
                        ? `${filteredTierCounts.tier3}/${tier3Tags.length}`
                        : tier3Tags.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* 3-Column Studio (Mobile: shows mobileActiveTier full screen; Desktop: 3-column parallel grid) */}
              <div
                className={
                  isBulkFocusMode
                    ? 'flex-1 min-h-0 flex flex-col md:flex-row md:divide-x divide-[#E8E2D8] overflow-hidden'
                    : 'flex-1 min-h-0 flex flex-col md:grid md:grid-cols-3 md:divide-x divide-[#E8E2D8] overflow-hidden'
                }
              >
                {/* COLUMN 1: TIER 1 — มิติปลายทาง / หมวดกว้าง (+ หมวดย่อย 'รอคัดแยก') */}
                <div
                  className={`${
                    mobileActiveTier === 1 ? 'flex' : 'hidden'
                  } md:flex flex-col min-h-0 overflow-hidden ${
                    expandedFocusColumn === 'TIER_1'
                      ? 'flex-1 min-w-0 h-full'
                      : isBulkFocusMode
                      ? 'md:w-60 lg:w-64 shrink-0 h-44 md:h-full'
                      : 'flex-1 h-full'
                  }`}
                >
                  <IndependentTierColumn
                    tier={1}
                    subCategories={tierSubCategories.tier1}
                    tagsInTier={tier1Tags}
                    allTags={tags}
                    categoryMatrix={categoryMatrix}
                    globalSearchQuery={globalSearchQuery}
                    searchQuery={tier1SearchQuery}
                    onSearchQueryChange={setTier1SearchQuery}
                    onClearAllSearch={clearAllSearches}
                    selectedTagIds={selectedTagIds}
                    draggingTagIds={draggingTagIds}
                    isBatchMovingTags={isBatchMovingTags}
                    onToggleSelectTag={handleToggleSelectTag}
                    onToggleSelectAllVisible={handleToggleSelectAllVisible}
                    onStartDragTag={handleStartDragTag}
                    onEndDragTag={handleEndDragTag}
                    onExecuteBatchMove={handleExecuteBatchMove}
                    inlineEditingTagId={inlineEditingTagId}
                    inlineEditingName={inlineEditingName}
                    setInlineEditingName={setInlineEditingName}
                    inlineDuplicateConflict={inlineDuplicateConflict}
                    onStartInlineRename={handleStartInlineRename}
                    onCommitInlineRename={handleCommitInlineRename}
                    onCancelInlineRename={handleCancelInlineRename}
                    onCreateTagInSubCategory={handleCreateTagInSubCategory}
                    onUpdateTagDetails={handleUpdateTagDetails}
                    onRequestDeleteTag={(tagId) =>
                      setShowDeleteTagConfirm(tagId)
                    }
                    onAddSubCategory={addTierSubCategory}
                    onRenameSubCategory={renameTierSubCategory}
                    onDeleteSubCategory={deleteTierSubCategory}
                    isExpandedGrid={
                      expandedFocusColumn === 'TIER_1' ||
                      (isFullScreen && expandedFocusColumn === 'NONE')
                    }
                    isCompactRail={
                      expandedFocusColumn === 'TIER_2' ||
                      expandedFocusColumn === 'TIER_3'
                    }
                    onToggleExpandColumn={() =>
                      setExpandedFocusColumn((prev) =>
                        prev === 'TIER_1' ? 'NONE' : 'TIER_1'
                      )
                    }
                  />
                </div>

                {/* COLUMN 2: TIER 2 — บริบท / สไตล์คลิป (สถานการณ์, วิธีการนำเสนอ, ความขลัง) */}
                <div
                  className={`${
                    mobileActiveTier === 2 ? 'flex' : 'hidden'
                  } md:flex flex-col min-h-0 overflow-hidden ${
                    expandedFocusColumn === 'TIER_2'
                      ? 'flex-1 min-w-0 h-full'
                      : isBulkFocusMode
                      ? 'md:w-60 lg:w-64 shrink-0 h-44 md:h-full'
                      : 'flex-1 h-full'
                  }`}
                >
                  <IndependentTierColumn
                    tier={2}
                    subCategories={tierSubCategories.tier2}
                    tagsInTier={tier2Tags}
                    allTags={tags}
                    categoryMatrix={categoryMatrix}
                    globalSearchQuery={globalSearchQuery}
                    searchQuery={tier2SearchQuery}
                    onSearchQueryChange={setTier2SearchQuery}
                    onClearAllSearch={clearAllSearches}
                    selectedTagIds={selectedTagIds}
                    draggingTagIds={draggingTagIds}
                    isBatchMovingTags={isBatchMovingTags}
                    onToggleSelectTag={handleToggleSelectTag}
                    onToggleSelectAllVisible={handleToggleSelectAllVisible}
                    onStartDragTag={handleStartDragTag}
                    onEndDragTag={handleEndDragTag}
                    onExecuteBatchMove={handleExecuteBatchMove}
                    inlineEditingTagId={inlineEditingTagId}
                    inlineEditingName={inlineEditingName}
                    setInlineEditingName={setInlineEditingName}
                    inlineDuplicateConflict={inlineDuplicateConflict}
                    onStartInlineRename={handleStartInlineRename}
                    onCommitInlineRename={handleCommitInlineRename}
                    onCancelInlineRename={handleCancelInlineRename}
                    onCreateTagInSubCategory={handleCreateTagInSubCategory}
                    onUpdateTagDetails={handleUpdateTagDetails}
                    onRequestDeleteTag={(tagId) =>
                      setShowDeleteTagConfirm(tagId)
                    }
                    onAddSubCategory={addTierSubCategory}
                    onRenameSubCategory={renameTierSubCategory}
                    onDeleteSubCategory={deleteTierSubCategory}
                    isExpandedGrid={expandedFocusColumn === 'TIER_2'}
                    isCompactRail={
                      expandedFocusColumn === 'TIER_1' ||
                      expandedFocusColumn === 'TIER_3'
                    }
                    onToggleExpandColumn={() =>
                      setExpandedFocusColumn((prev) =>
                        prev === 'TIER_2' ? 'NONE' : 'TIER_2'
                      )
                    }
                  />
                </div>

                {/* COLUMN 3: TIER 3 — บุคคลเจาะจง / รายการ (บุคคล/คนดัง, รายการ/ช่อง) */}
                <div
                  className={`${
                    mobileActiveTier === 3 ? 'flex' : 'hidden'
                  } md:flex flex-col min-h-0 overflow-hidden ${
                    expandedFocusColumn === 'TIER_3'
                      ? 'flex-1 min-w-0 h-full'
                      : isBulkFocusMode
                      ? 'md:w-60 lg:w-64 shrink-0 h-44 md:h-full'
                      : 'flex-1 h-full'
                  }`}
                >
                  <IndependentTierColumn
                    tier={3}
                    subCategories={tierSubCategories.tier3}
                    tagsInTier={tier3Tags}
                    allTags={tags}
                    categoryMatrix={categoryMatrix}
                    globalSearchQuery={globalSearchQuery}
                    searchQuery={tier3SearchQuery}
                    onSearchQueryChange={setTier3SearchQuery}
                    onClearAllSearch={clearAllSearches}
                    selectedTagIds={selectedTagIds}
                    draggingTagIds={draggingTagIds}
                    isBatchMovingTags={isBatchMovingTags}
                    onToggleSelectTag={handleToggleSelectTag}
                    onToggleSelectAllVisible={handleToggleSelectAllVisible}
                    onStartDragTag={handleStartDragTag}
                    onEndDragTag={handleEndDragTag}
                    onExecuteBatchMove={handleExecuteBatchMove}
                    inlineEditingTagId={inlineEditingTagId}
                    inlineEditingName={inlineEditingName}
                    setInlineEditingName={setInlineEditingName}
                    inlineDuplicateConflict={inlineDuplicateConflict}
                    onStartInlineRename={handleStartInlineRename}
                    onCommitInlineRename={handleCommitInlineRename}
                    onCancelInlineRename={handleCancelInlineRename}
                    onCreateTagInSubCategory={handleCreateTagInSubCategory}
                    onUpdateTagDetails={handleUpdateTagDetails}
                    onRequestDeleteTag={(tagId) =>
                      setShowDeleteTagConfirm(tagId)
                    }
                    onAddSubCategory={addTierSubCategory}
                    onRenameSubCategory={renameTierSubCategory}
                    onDeleteSubCategory={deleteTierSubCategory}
                    isExpandedGrid={expandedFocusColumn === 'TIER_3'}
                    isCompactRail={
                      expandedFocusColumn === 'TIER_1' ||
                      expandedFocusColumn === 'TIER_2'
                    }
                    onToggleExpandColumn={() =>
                      setExpandedFocusColumn((prev) =>
                        prev === 'TIER_3' ? 'NONE' : 'TIER_3'
                      )
                    }
                  />
                </div>
              </div>

              {/* Docked Bulk Move across Tier 1/2/3 Subcategories, Edit Color/Type & Delete Action Bar + Undo Toast */}
              <ThreeTierBatchMoveBar
                categoryGroups={categoryGroups}
                tags={tags}
                tierSubCategories={tierSubCategories}
                selectedTagIds={selectedTagIds}
                isBatchMovingTags={isBatchMovingTags}
                batchMoveProgressText={batchMoveProgressText}
                lastTagReorgUndoRecord={lastTagReorgUndoRecord}
                onExecuteBatchMove={handleExecuteBatchMove}
                onExecuteBatchMetadataUpdate={handleExecuteBatchMetadataUpdate}
                onRequestBatchDelete={() => setShowBatchDeleteConfirm(true)}
                onClearSelectedTags={handleClearSelectedTags}
                onUndoLastTagReorg={undoLastTagReorg}
                onDismissTagReorgUndoRecord={dismissTagReorgUndoRecord}
              />
            </motion.div>
          ) : (
            <motion.div
              key="cooldown-rules-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 sm:p-6 bg-[#FAF8F5]"
            >
              <Tab1StatusRulesConfig
                settings={settings}
                computedFootage={computedFootage}
                onUpdateSettings={updateSettings}
                onProceedToTab2={() => setActiveStudioTab('STUDIO_3TIER')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </BaseModal>

      {/* Safeguard & Delete Confirmation Modals (wrapped in BaseModal) */}
      <ThreeTierConfirmModals
        showWipeConfirm={showWipeConfirm}
        setShowWipeConfirm={setShowWipeConfirm}
        onConfirmWipe={handleConfirmWipe}
        showDeleteGroupConfirm={showDeleteGroupConfirm}
        setShowDeleteGroupConfirm={setShowDeleteGroupConfirm}
        onConfirmDeleteGroup={handleConfirmDeleteGroup}
        showDeleteTagConfirm={showDeleteTagConfirm}
        setShowDeleteTagConfirm={setShowDeleteTagConfirm}
        onConfirmDeleteTag={handleConfirmDeleteTag}
        showBatchDeleteConfirm={showBatchDeleteConfirm}
        setShowBatchDeleteConfirm={setShowBatchDeleteConfirm}
        onConfirmBatchDelete={handleConfirmBatchDelete}
        selectedTagIds={selectedTagIds}
        categoryGroups={categoryGroups}
        tags={tags}
        computedFootage={computedFootage}
      />

      <JunkTagCleanupModal
        isOpen={isJunkTagCleanupOpen}
        onClose={() => setIsJunkTagCleanupOpen(false)}
      />

      <TagRulesDictionaryModal
        isOpen={isTagRulesDictionaryOpen}
        onClose={() => setIsTagRulesDictionaryOpen(false)}
        onRunAutoReorganize={reorganizeTagsToDataDictionary}
      />
    </>
  );
};
