import React from 'react';
import { useThreeTierCategoryState } from './three-tier/useThreeTierCategoryState';
import {
  ThreeTierModalHeader,
  ThreeTierEmptyState,
  ThreeTierModalFooter,
} from './three-tier/ThreeTierHeaderAndEmpty';
import { Tier0GroupColumn } from './three-tier/Tier0GroupColumn';
import { Tier1MainCategoryColumn } from './three-tier/Tier1MainCategoryColumn';
import { Tier2SubcategoryColumn } from './three-tier/Tier2SubcategoryColumn';
import { ThreeTierConfirmModals } from './three-tier/ThreeTierConfirmModals';

export const ThreeTierCategoryManagerModal: React.FC = () => {
  const {
    isThreeTierManagerOpen,
    setIsThreeTierManagerOpen,
    categoryGroups,
    tags,
    restoreDefaultCategories,
    handleRestoreDefaultsAndSelect,

    // Cascade selections & active items
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

  if (!isThreeTierManagerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[85vh] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <ThreeTierModalHeader
          onRequestWipe={() => setShowWipeConfirm(true)}
          onRestoreDefaults={handleRestoreDefaultsAndSelect}
          onClose={() => setIsThreeTierManagerOpen(false)}
        />

        {/* Empty State when 0 Groups exist and not currently adding a new group */}
        {categoryGroups.length === 0 && !isEditingGroup ? (
          <ThreeTierEmptyState
            onOpenAddGroup={handleOpenAddGroup}
            onRestoreDefaults={handleRestoreDefaultsAndSelect}
          />
        ) : (
          /* 3-Column Cascading Studio */
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
            {/* COLUMN 1: LEVEL 1 — กลุ่มหมวดหมู่ (Category Groups) */}
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
              onRequestDeleteGroup={(groupId) => setShowDeleteGroupConfirm(groupId)}
            />

            {/* COLUMN 2: LEVEL 2 — หมวดหมู่หลัก (Main Categories) */}
            <Tier1MainCategoryColumn
              activeGroup={activeGroup}
              mainCategoriesInActiveGroup={mainCategoriesInActiveGroup}
              activeMainCat={activeMainCat}
              tags={tags}
              isEditingMainCat={isEditingMainCat}
              setIsEditingMainCat={setIsEditingMainCat}
              editingMainCatId={editingMainCatId}
              mainCatFormName={mainCatFormName}
              setMainCatFormName={setMainCatFormName}
              mainCatFormDesc={mainCatFormDesc}
              setMainCatFormDesc={setMainCatFormDesc}
              onOpenAddMainCat={handleOpenAddMainCat}
              onOpenEditMainCat={handleOpenEditMainCat}
              onSaveMainCat={handleSaveMainCat}
              onSelectMainCat={(catId) => setSelectedMainCatId(catId)}
              onRequestDeleteTag={(tagId) => setShowDeleteTagConfirm(tagId)}
            />

            {/* COLUMN 3: LEVEL 3 — หมวดหมู่ย่อย / บุคคล / ตัวตน (Subcategories) */}
            <Tier2SubcategoryColumn
              activeMainCat={activeMainCat}
              subcategoriesInActiveCat={subcategoriesInActiveCat}
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
              onRequestDeleteTag={(tagId) => setShowDeleteTagConfirm(tagId)}
            />
          </div>
        )}

        {/* Footer info bar */}
        <ThreeTierModalFooter onClose={() => setIsThreeTierManagerOpen(false)} />
      </div>

      {/* Safeguard & Delete Confirmation Modals */}
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
      />
    </div>
  );
};
