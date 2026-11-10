import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tags } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { BaseModal } from '../ui/BaseModal';
import { Tab1StatusRulesConfig } from './tabs/Tab1StatusRulesConfig';
import { JunkTagCleanupModal } from './JunkTagCleanupModal';
import { useThreeTierCategoryState } from './three-tier/useThreeTierCategoryState';
import {
  ThreeTierHeaderRightControls,
  ThreeTierQuickSearchAndSummaryBar,
  ThreeTierConceptBanner,
  ThreeTierEmptyState,
  UnifiedTagStudioTab,
} from './three-tier/ThreeTierHeaderAndEmpty';
import { Tier0GroupColumn } from './three-tier/Tier0GroupColumn';
import { Tier1MainCategoryColumn } from './three-tier/Tier1MainCategoryColumn';
import { Tier2SubcategoryColumn } from './three-tier/Tier2SubcategoryColumn';
import { ThreeTierBatchMoveBar } from './three-tier/ThreeTierBatchMoveBar';
import { ThreeTierConfirmModals } from './three-tier/ThreeTierConfirmModals';

export const ThreeTierCategoryManagerModal: React.FC = () => {
  const {
    computedFootage,
    categoryMatrix,
    settings,
    updateSettings,
    setIsClearClipsModalOpen,
    threeTierStudioTab,
    setThreeTierStudioTab,
  } = useCMS();

  const {
    isThreeTierManagerOpen,
    setIsThreeTierManagerOpen,
    categoryGroups,
    tags,
    handleRestoreDefaultsAndSelect,

    // Cascade selections & active items
    setSelectedGroupId,
    handleSelectGroup,
    setSelectedMainCatId,
    activeGroup,
    activeMainCat,
    mainCategoriesInActiveGroup,
    filteredMainCategoriesInActiveGroup,
    subcategoriesInActiveCat,
    filteredSubcategoriesInActiveCat,

    // Column search filters
    tier1SearchQuery,
    setTier1SearchQuery,
    tier2SearchQuery,
    setTier2SearchQuery,

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
    handleStartInlineRename,
    handleCommitInlineRename,
    handleCancelInlineRename,

    // Tier 0 Group form state & handlers
    isEditingGroup,
    setIsEditingGroup,
    editingGroupId,
    groupFormName,
    setGroupFormName,
    groupFormIcon,
    setGroupFormIcon,
    groupFormDesc,
    setGroupFormDesc,
    handleOpenAddGroup,
    handleOpenEditGroup,
    handleSaveGroup,

    // Tier 1 Main Category form state & handlers
    isEditingMainCat,
    setIsEditingMainCat,
    editingMainCatId,
    mainCatFormName,
    setMainCatFormName,
    mainCatFormColor,
    setMainCatFormColor,
    mainCatFormDesc,
    setMainCatFormDesc,
    handleOpenAddMainCat,
    handleOpenEditMainCat,
    handleSaveMainCat,

    // Tier 2 Subcategory form state & handlers
    isEditingSubCat,
    setIsEditingSubCat,
    editingSubCatId,
    subCatFormName,
    setSubCatFormName,
    subCatFormType,
    setSubCatFormType,
    subCatFormDesc,
    setSubCatFormDesc,
    handleOpenAddSubCat,
    handleOpenEditSubCat,
    handleSaveSubCat,

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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isJunkTagCleanupOpen, setIsJunkTagCleanupOpen] = useState(false);
  const [expandedFocusColumn, setExpandedFocusColumn] = useState<
    'NONE' | 'TIER_1' | 'TIER_2'
  >('NONE');

  const isBulkFocusMode =
    activeStudioTab === 'STUDIO_3TIER' && expandedFocusColumn !== 'NONE';

  React.useEffect(() => {
    if (isThreeTierManagerOpen && threeTierStudioTab) {
      setActiveStudioTab(threeTierStudioTab);
    }
  }, [isThreeTierManagerOpen, threeTierStudioTab]);

  const handleClose = () => {
    if (isBatchMovingTags) return;
    setIsThreeTierManagerOpen(false);
  };

  const handleJumpToTag = (groupId: string, mainCatId: string) => {
    setSelectedGroupId(groupId);
    setSelectedMainCatId(mainCatId);
  };

  const handleRequestClearAllClips = () => {
    if (isBatchMovingTags) return;
    setIsThreeTierManagerOpen(false);
    setIsClearClipsModalOpen(true);
  };

  const handleToggleHeaderBulkFocus = () => {
    setExpandedFocusColumn((prev) => (prev === 'NONE' ? 'TIER_1' : 'NONE'));
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
        title="สตูดิโอกลุ่มแท็กหลายมิติ & ตั้งค่าเกณฑ์สีพักฟุต"
        subtitle={
          isBulkFocusMode
            ? undefined
            : activeStudioTab === 'STUDIO_3TIER'
            ? 'มิติกลุ่มแท็ก (Tier 0) ➔ ป้ายแท็กหลัก & โทนสี (Tier 1) ➔ ป้ายแท็กย่อย & ความพร้อม Solo EP (Tier 2)'
            : 'ตั้งค่าเกณฑ์วันพักฟุตเทจ 4 สถานะ (ฟ้า · เขียว · เหลือง · แดง) พร้อมจำลองสัดส่วนคลิปแบบเรียลไทม์'
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
            onRequestWipe={() => setShowWipeConfirm(true)}
            onRestoreDefaults={handleRestoreDefaultsAndSelect}
            onRequestClearAllClips={handleRequestClearAllClips}
            isFullScreen={isFullScreen || isBulkFocusMode}
            onToggleFullScreen={() => {
              if (isBulkFocusMode) {
                setExpandedFocusColumn('NONE');
                setIsFullScreen(false);
              } else {
                setIsFullScreen((prev) => !prev);
              }
            }}
            isBulkFocusMode={isBulkFocusMode}
            onToggleBulkFocusMode={handleToggleHeaderBulkFocus}
            onOpenJunkTagCleanup={() => setIsJunkTagCleanupOpen(true)}
          />
        }
        headerContent={
          isBulkFocusMode ? undefined : (
            <ThreeTierConceptBanner isOpen={showConceptBanner} />
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
              {/* Quick Search & Unified KPI Summary Bar (Hidden in Bulk Focus Mode to maximize vertical space) */}
              {!isBulkFocusMode && (
                <ThreeTierQuickSearchAndSummaryBar
                  categoryGroups={categoryGroups}
                  tags={tags}
                  categoryMatrix={categoryMatrix}
                  onJumpToTag={handleJumpToTag}
                />
              )}

              {/* Empty State when 0 Groups exist and not currently adding a new group */}
              {categoryGroups.length === 0 && !isEditingGroup ? (
                <ThreeTierEmptyState
                  onOpenAddGroup={handleOpenAddGroup}
                  onRestoreDefaults={handleRestoreDefaultsAndSelect}
                />
              ) : (
                <>
                  {/* 3-Column Cascading Studio (Switches to Slim Drop Rails + Expanded Multi-Column Grid in Bulk Focus Mode) */}
                  <div
                    className={
                      isBulkFocusMode
                        ? 'flex-1 min-h-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#E8E2D8] overflow-hidden'
                        : 'flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E2D8] overflow-hidden'
                    }
                  >
                    {/* COLUMN 1: LEVEL 1 — มิติกลุ่มแท็ก (Tag Dimensions) */}
                    <div
                      className={
                        isBulkFocusMode
                          ? 'md:w-52 lg:w-56 shrink-0 h-40 md:h-full min-h-0 overflow-hidden'
                          : 'h-full min-h-0 overflow-hidden'
                      }
                    >
                      <Tier0GroupColumn
                        categoryGroups={categoryGroups}
                        tags={tags}
                        activeGroup={activeGroup}
                        selectedTagIds={selectedTagIds}
                        draggingTagIds={draggingTagIds}
                        isBatchMovingTags={isBatchMovingTags}
                        onExecuteBatchMove={handleExecuteBatchMove}
                        isEditingGroup={isEditingGroup}
                        setIsEditingGroup={setIsEditingGroup}
                        editingGroupId={editingGroupId}
                        groupFormName={groupFormName}
                        setGroupFormName={setGroupFormName}
                        groupFormIcon={groupFormIcon}
                        setGroupFormIcon={setGroupFormIcon}
                        groupFormDesc={groupFormDesc}
                        setGroupFormDesc={setGroupFormDesc}
                        onOpenAddGroup={handleOpenAddGroup}
                        onOpenEditGroup={handleOpenEditGroup}
                        onSaveGroup={handleSaveGroup}
                        onSelectGroup={handleSelectGroup}
                        onRequestDeleteGroup={(groupId) =>
                          setShowDeleteGroupConfirm(groupId)
                        }
                        isCompactRail={isBulkFocusMode}
                      />
                    </div>

                    {/* COLUMN 2: LEVEL 2 — ป้ายแท็กหลัก + โทนสี + สถิติฟุตเทจ/EP */}
                    <div
                      className={
                        expandedFocusColumn === 'TIER_1'
                          ? 'flex-1 min-w-0 h-full min-h-0 overflow-hidden'
                          : expandedFocusColumn === 'TIER_2'
                          ? 'md:w-64 lg:w-72 shrink-0 h-44 md:h-full min-h-0 overflow-hidden'
                          : 'h-full min-h-0 overflow-hidden'
                      }
                    >
                      <Tier1MainCategoryColumn
                        activeGroup={activeGroup}
                        mainCategoriesInActiveGroup={mainCategoriesInActiveGroup}
                        filteredMainCategoriesInActiveGroup={
                          filteredMainCategoriesInActiveGroup
                        }
                        activeMainCat={activeMainCat}
                        tags={tags}
                        categoryMatrix={categoryMatrix}
                        tier1SearchQuery={tier1SearchQuery}
                        setTier1SearchQuery={setTier1SearchQuery}
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
                        onStartInlineRename={handleStartInlineRename}
                        onCommitInlineRename={handleCommitInlineRename}
                        onCancelInlineRename={handleCancelInlineRename}
                        isEditingMainCat={isEditingMainCat}
                        setIsEditingMainCat={setIsEditingMainCat}
                        editingMainCatId={editingMainCatId}
                        mainCatFormName={mainCatFormName}
                        setMainCatFormName={setMainCatFormName}
                        mainCatFormColor={mainCatFormColor}
                        setMainCatFormColor={setMainCatFormColor}
                        mainCatFormDesc={mainCatFormDesc}
                        setMainCatFormDesc={setMainCatFormDesc}
                        onOpenAddMainCat={handleOpenAddMainCat}
                        onOpenEditMainCat={handleOpenEditMainCat}
                        onSaveMainCat={handleSaveMainCat}
                        onSelectMainCat={(catId) => setSelectedMainCatId(catId)}
                        onRequestDeleteTag={(tagId) =>
                          setShowDeleteTagConfirm(tagId)
                        }
                        isExpandedGrid={expandedFocusColumn === 'TIER_1'}
                        isCompactRail={expandedFocusColumn === 'TIER_2'}
                        onToggleExpandColumn={() =>
                          setExpandedFocusColumn((prev) =>
                            prev === 'TIER_1' ? 'NONE' : 'TIER_1'
                          )
                        }
                      />
                    </div>

                    {/* COLUMN 3: LEVEL 3 — ป้ายแท็กย่อย + สถิติฟุตเทจ + Solo EP พร้อมผลิต */}
                    <div
                      className={
                        expandedFocusColumn === 'TIER_2'
                          ? 'flex-1 min-w-0 h-full min-h-0 overflow-hidden'
                          : expandedFocusColumn === 'TIER_1'
                          ? 'md:w-64 lg:w-72 shrink-0 h-44 md:h-full min-h-0 overflow-hidden'
                          : 'h-full min-h-0 overflow-hidden'
                      }
                    >
                      <Tier2SubcategoryColumn
                        activeMainCat={activeMainCat}
                        subcategoriesInActiveCat={subcategoriesInActiveCat}
                        filteredSubcategoriesInActiveCat={
                          filteredSubcategoriesInActiveCat
                        }
                        categoryMatrix={categoryMatrix}
                        tier2SearchQuery={tier2SearchQuery}
                        setTier2SearchQuery={setTier2SearchQuery}
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
                        onStartInlineRename={handleStartInlineRename}
                        onCommitInlineRename={handleCommitInlineRename}
                        onCancelInlineRename={handleCancelInlineRename}
                        isEditingSubCat={isEditingSubCat}
                        setIsEditingSubCat={setIsEditingSubCat}
                        editingSubCatId={editingSubCatId}
                        subCatFormName={subCatFormName}
                        setSubCatFormName={setSubCatFormName}
                        subCatFormType={subCatFormType}
                        setSubCatFormType={setSubCatFormType}
                        subCatFormDesc={subCatFormDesc}
                        setSubCatFormDesc={setSubCatFormDesc}
                        onOpenAddSubCat={handleOpenAddSubCat}
                        onOpenEditSubCat={handleOpenEditSubCat}
                        onSaveSubCat={handleSaveSubCat}
                        onRequestDeleteTag={(tagId) =>
                          setShowDeleteTagConfirm(tagId)
                        }
                        isExpandedGrid={expandedFocusColumn === 'TIER_2'}
                        isCompactRail={expandedFocusColumn === 'TIER_1'}
                        onToggleExpandColumn={() =>
                          setExpandedFocusColumn((prev) =>
                            prev === 'TIER_2' ? 'NONE' : 'TIER_2'
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Docked Bulk Move, Edit Color/Type & Delete Action Bar + Undo Toast */}
                  <ThreeTierBatchMoveBar
                    categoryGroups={categoryGroups}
                    tags={tags}
                    selectedTagIds={selectedTagIds}
                    isBatchMovingTags={isBatchMovingTags}
                    batchMoveProgressText={batchMoveProgressText}
                    lastTagReorgUndoRecord={lastTagReorgUndoRecord}
                    onExecuteBatchMove={handleExecuteBatchMove}
                    onExecuteBatchMetadataUpdate={
                      handleExecuteBatchMetadataUpdate
                    }
                    onRequestBatchDelete={() => setShowBatchDeleteConfirm(true)}
                    onClearSelectedTags={handleClearSelectedTags}
                    onUndoLastTagReorg={undoLastTagReorg}
                    onDismissTagReorgUndoRecord={dismissTagReorgUndoRecord}
                  />
                </>
              )}
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
    </>
  );
};
