import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tags } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { BaseModal } from '../ui/BaseModal';
import { Tab1StatusRulesConfig } from './tabs/Tab1StatusRulesConfig';
import { useThreeTierCategoryState } from './three-tier/useThreeTierCategoryState';
import {
  ThreeTierHeaderRightControls,
  ThreeTierQuickSearchAndSummaryBar,
  ThreeTierConceptBanner,
  ThreeTierEmptyState,
  ThreeTierModalFooter,
  UnifiedTagStudioTab,
} from './three-tier/ThreeTierHeaderAndEmpty';
import { Tier0GroupColumn } from './three-tier/Tier0GroupColumn';
import { Tier1MainCategoryColumn } from './three-tier/Tier1MainCategoryColumn';
import { Tier2SubcategoryColumn } from './three-tier/Tier2SubcategoryColumn';
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
    subcategoriesInActiveCat,

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
    handleConfirmWipe,
    handleConfirmDeleteGroup,
    handleConfirmDeleteTag,
  } = useThreeTierCategoryState();

  const [activeStudioTab, setActiveStudioTab] =
    useState<UnifiedTagStudioTab>(threeTierStudioTab || 'STUDIO_3TIER');
  const [showConceptBanner, setShowConceptBanner] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  React.useEffect(() => {
    if (isThreeTierManagerOpen && threeTierStudioTab) {
      setActiveStudioTab(threeTierStudioTab);
    }
  }, [isThreeTierManagerOpen, threeTierStudioTab]);

  const handleClose = () => {
    setIsThreeTierManagerOpen(false);
  };

  const handleJumpToTag = (groupId: string, mainCatId: string) => {
    setSelectedGroupId(groupId);
    setSelectedMainCatId(mainCatId);
  };

  const handleRequestClearAllClips = () => {
    setIsThreeTierManagerOpen(false);
    setIsClearClipsModalOpen(true);
  };

  return (
    <>
      <BaseModal
        isOpen={isThreeTierManagerOpen}
        onClose={handleClose}
        fullScreen={isFullScreen}
        maxWidthClass="max-w-[96vw] xl:max-w-[1440px]"
        heightClass="h-[92dvh] sm:h-[90vh]"
        icon={<Tags className="w-5 h-5" />}
        title="สตูดิโอกลุ่มแท็กหลายมิติ & ตั้งค่าเกณฑ์สีพักฟุต"
        subtitle={
          activeStudioTab === 'STUDIO_3TIER'
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
            isFullScreen={isFullScreen}
            onToggleFullScreen={() => setIsFullScreen((prev) => !prev)}
          />
        }
        headerContent={<ThreeTierConceptBanner isOpen={showConceptBanner} />}
        footer={<ThreeTierModalFooter onClose={handleClose} />}
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
              {/* Quick Search & Unified KPI Summary Bar */}
              <ThreeTierQuickSearchAndSummaryBar
                categoryGroups={categoryGroups}
                tags={tags}
                categoryMatrix={categoryMatrix}
                onJumpToTag={handleJumpToTag}
              />

              {/* Empty State when 0 Groups exist and not currently adding a new group */}
              {categoryGroups.length === 0 && !isEditingGroup ? (
                <ThreeTierEmptyState
                  onOpenAddGroup={handleOpenAddGroup}
                  onRestoreDefaults={handleRestoreDefaultsAndSelect}
                />
              ) : (
                /* 3-Column Cascading Studio */
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E2D8] overflow-hidden">
                  {/* COLUMN 1: LEVEL 1 — มิติกลุ่มแท็ก (Tag Dimensions) */}
                  <Tier0GroupColumn
                    categoryGroups={categoryGroups}
                    tags={tags}
                    activeGroup={activeGroup}
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
                  />

                  {/* COLUMN 2: LEVEL 2 — ป้ายแท็กหลัก + โทนสี + สถิติฟุตเทจ/EP */}
                  <Tier1MainCategoryColumn
                    activeGroup={activeGroup}
                    mainCategoriesInActiveGroup={mainCategoriesInActiveGroup}
                    activeMainCat={activeMainCat}
                    tags={tags}
                    categoryMatrix={categoryMatrix}
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
                  />

                  {/* COLUMN 3: LEVEL 3 — ป้ายแท็กย่อย + สถิติฟุตเทจ + Solo EP พร้อมผลิต */}
                  <Tier2SubcategoryColumn
                    activeMainCat={activeMainCat}
                    subcategoriesInActiveCat={subcategoriesInActiveCat}
                    categoryMatrix={categoryMatrix}
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
                  />
                </div>
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
        categoryGroups={categoryGroups}
        tags={tags}
        computedFootage={computedFootage}
      />
    </>
  );
};
