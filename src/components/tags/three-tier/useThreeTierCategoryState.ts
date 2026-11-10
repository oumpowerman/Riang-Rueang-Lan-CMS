import React, { useState, useMemo } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { CategoryGroup, CategoryTag, EntitySubtype, TagGroupType } from '../../../types/tag.types';
import { resolveIconKey } from '../../ui/CategoryGroupIcon';

export const COLOR_OPTIONS = ['purple', 'blue', 'emerald', 'amber', 'rose', 'cyan', 'indigo', 'teal', 'slate'];

export const useThreeTierCategoryState = () => {
  const {
    isThreeTierManagerOpen,
    setIsThreeTierManagerOpen,
    categoryGroups,
    tags,
    createCategoryGroup,
    updateCategoryGroup,
    deleteCategoryGroup,
    createTag,
    updateTag,
    deleteTag,
    createSubcategory,
    wipeAllCategories,
    restoreDefaultCategories,
    batchMoveOrReparentTags,
    batchUpdateTagsMetadata,
    batchDeleteTags,
    lastTagReorgUndoRecord,
    undoLastTagReorg,
    dismissTagReorgUndoRecord,
  } = useCMS();

  // Selected state for 3-tier cascade navigation
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => categoryGroups[0]?.id || '');
  const [selectedMainCatId, setSelectedMainCatId] = useState<string>('');

  // Column-level search filters for fast filtering inside 190+ tags
  const [tier1SearchQuery, setTier1SearchQuery] = useState<string>('');
  const [tier2SearchQuery, setTier2SearchQuery] = useState<string>('');

  // Multi-select & Drag-and-Drop states for bulk tag reorganization
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [lastClickedTagId, setLastClickedTagId] = useState<string | null>(null);
  const [draggingTagIds, setDraggingTagIds] = useState<string[]>([]);
  const [isBatchMovingTags, setIsBatchMovingTags] = useState<boolean>(false);
  const [batchMoveProgressText, setBatchMoveProgressText] = useState<string | null>(null);

  // Forms / Editing states
  const [isEditingGroup, setIsEditingGroup] = useState<boolean>(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormIcon, setGroupFormIcon] = useState('star');
  const [groupFormColor, setGroupFormColor] = useState('indigo');
  const [groupFormDesc, setGroupFormDesc] = useState('');

  // Main Cat form state
  const [isEditingMainCat, setIsEditingMainCat] = useState<boolean>(false);
  const [editingMainCatId, setEditingMainCatId] = useState<string | null>(null);
  const [mainCatFormName, setMainCatFormName] = useState('');
  const [mainCatFormColor, setMainCatFormColor] = useState('blue');
  const [mainCatFormDesc, setMainCatFormDesc] = useState('');

  // Sub Cat form state
  const [isEditingSubCat, setIsEditingSubCat] = useState<boolean>(false);
  const [editingSubCatId, setEditingSubCatId] = useState<string | null>(null);
  const [subCatFormName, setSubCatFormName] = useState('');
  const [subCatFormType, setSubCatFormType] = useState<EntitySubtype>('PERSON');
  const [subCatFormDesc, setSubCatFormDesc] = useState('');

  // Inline Rename State (Double-click or quick rename on card)
  const [inlineEditingTagId, setInlineEditingTagId] = useState<string | null>(null);
  const [inlineEditingName, setInlineEditingName] = useState<string>('');

  // Confirmation Modals
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState<string | null>(null);
  const [showDeleteTagConfirm, setShowDeleteTagConfirm] = useState<string | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Active Group
  const activeGroup = useMemo(() => {
    return categoryGroups.find((g) => g.id === selectedGroupId) || categoryGroups[0] || null;
  }, [categoryGroups, selectedGroupId]);

  // Main categories under active group
  const mainCategoriesInActiveGroup = useMemo(() => {
    if (!activeGroup) return [];
    return tags.filter((t) => {
      if (t.tier === 2) return false;
      if (t.groupId) return t.groupId === activeGroup.id;
      // Fallback for legacy tags
      const groupShort = activeGroup.id.replace('GRP-', '');
      return t.groupType === groupShort;
    });
  }, [tags, activeGroup]);

  // Filtered Main Categories in Column 2
  const filteredMainCategoriesInActiveGroup = useMemo(() => {
    const q = tier1SearchQuery.trim().toLowerCase();
    if (!q) return mainCategoriesInActiveGroup;
    return mainCategoriesInActiveGroup.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [mainCategoriesInActiveGroup, tier1SearchQuery]);

  // Active Main Category
  const activeMainCat = useMemo(() => {
    if (selectedMainCatId) {
      const found = tags.find((t) => t.id === selectedMainCatId && t.tier === 1);
      if (found) return found;
    }
    return mainCategoriesInActiveGroup[0] || null;
  }, [tags, selectedMainCatId, mainCategoriesInActiveGroup]);

  // Subcategories under active main category
  const subcategoriesInActiveCat = useMemo(() => {
    if (!activeMainCat) return [];
    return tags.filter((t) => t.tier === 2 && t.parentId === activeMainCat.id);
  }, [tags, activeMainCat]);

  // Filtered Subcategories in Column 3
  const filteredSubcategoriesInActiveCat = useMemo(() => {
    const q = tier2SearchQuery.trim().toLowerCase();
    if (!q) return subcategoriesInActiveCat;
    return subcategoriesInActiveCat.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [subcategoriesInActiveCat, tier2SearchQuery]);

  // Handlers for Group Form
  const handleOpenAddGroup = () => {
    setEditingGroupId(null);
    setGroupFormName('');
    setGroupFormIcon('star');
    setGroupFormColor('indigo');
    setGroupFormDesc('');
    setIsEditingGroup(true);
  };

  const handleOpenEditGroup = (g: CategoryGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(g.id);
    setGroupFormName(g.name);
    setGroupFormIcon(resolveIconKey(g.icon));
    setGroupFormColor(g.color || 'indigo');
    setGroupFormDesc(g.description || '');
    setIsEditingGroup(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormName.trim()) return;

    if (editingGroupId) {
      updateCategoryGroup(editingGroupId, {
        name: groupFormName.trim(),
        icon: groupFormIcon,
        color: groupFormColor,
        description: groupFormDesc.trim(),
      });
    } else {
      const created = createCategoryGroup(
        groupFormName.trim(),
        groupFormIcon,
        groupFormColor,
        groupFormDesc.trim()
      );
      setSelectedGroupId(created.id);
    }
    setIsEditingGroup(false);
  };

  // Handlers for Main Category Form
  const handleOpenAddMainCat = () => {
    if (!activeGroup) return;
    setEditingMainCatId(null);
    setMainCatFormName('');
    setMainCatFormColor(activeGroup.color || 'blue');
    setMainCatFormDesc('');
    setIsEditingMainCat(true);
  };

  const handleOpenEditMainCat = (cat: CategoryTag, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMainCatId(cat.id);
    setMainCatFormName(cat.name);
    setMainCatFormColor(cat.color || 'blue');
    setMainCatFormDesc(cat.description || '');
    setIsEditingMainCat(true);
  };

  const handleSaveMainCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainCatFormName.trim() || !activeGroup) return;

    const legacyGroupType: TagGroupType = (activeGroup.id.replace('GRP-', '') as TagGroupType) || 'GENERAL';

    if (editingMainCatId) {
      updateTag(editingMainCatId, {
        name: mainCatFormName.trim(),
        color: mainCatFormColor,
        description: mainCatFormDesc.trim(),
        groupId: activeGroup.id,
        tier: 1,
        parentId: null,
      });
      setSelectedMainCatId(editingMainCatId);
    } else {
      const created = createTag(
        mainCatFormName.trim(),
        legacyGroupType,
        mainCatFormColor,
        mainCatFormDesc.trim(),
        1,
        null,
        undefined,
        activeGroup.id
      );
      setSelectedMainCatId(created.id);
    }
    setIsEditingMainCat(false);
    setEditingMainCatId(null);
  };

  // Handlers for Subcategory Form
  const handleOpenAddSubCat = () => {
    if (!activeMainCat) return;
    setEditingSubCatId(null);
    setSubCatFormName('');
    setSubCatFormType('PERSON');
    setSubCatFormDesc('');
    setIsEditingSubCat(true);
  };

  const handleOpenEditSubCat = (sub: CategoryTag, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubCatId(sub.id);
    setSubCatFormName(sub.name);
    setSubCatFormType(sub.entityType || 'PERSON');
    setSubCatFormDesc(sub.description || '');
    setIsEditingSubCat(true);
  };

  const handleSaveSubCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCatFormName.trim() || !activeMainCat) return;

    if (editingSubCatId) {
      updateTag(editingSubCatId, {
        name: subCatFormName.trim(),
        entityType: subCatFormType,
        description: subCatFormDesc.trim(),
        tier: 2,
        parentId: activeMainCat.id,
        groupId: activeMainCat.groupId || activeGroup?.id,
      });
      setSelectedMainCatId(activeMainCat.id);
    } else {
      createSubcategory(
        activeMainCat.id,
        subCatFormName.trim(),
        subCatFormType,
        activeMainCat.color || 'amber',
        subCatFormDesc.trim()
      );
      setSelectedMainCatId(activeMainCat.id);
    }
    setIsEditingSubCat(false);
    setEditingSubCatId(null);
  };

  const handleConfirmWipe = () => {
    wipeAllCategories();
    setSelectedGroupId('');
    setSelectedMainCatId('');
    setShowWipeConfirm(false);
  };

  const handleConfirmDeleteGroup = (id: string) => {
    deleteCategoryGroup(id);
    setShowDeleteGroupConfirm(null);
    if (selectedGroupId === id) {
      const remaining = categoryGroups.filter((g) => g.id !== id);
      setSelectedGroupId(remaining[0]?.id || '');
    }
  };

  const handleConfirmDeleteTag = (id: string) => {
    deleteTag(id);
    setShowDeleteTagConfirm(null);
    if (selectedMainCatId === id) {
      setSelectedMainCatId('');
    }
  };

  const handleRestoreDefaultsAndSelect = () => {
    restoreDefaultCategories();
    setSelectedGroupId('GRP-PERSON');
    setSelectedMainCatId('TAG-0004');
    setIsEditingGroup(false);
    setIsEditingMainCat(false);
    setIsEditingSubCat(false);
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedMainCatId('');
  };

  // Multi-select & Shift+Click Range Selection Handler
  const handleToggleSelectTag = (
    tagId: string,
    visibleOrderIds: string[],
    shiftKey = false
  ) => {
    if (shiftKey && lastClickedTagId && lastClickedTagId !== tagId) {
      const startIdx = visibleOrderIds.indexOf(lastClickedTagId);
      const endIdx = visibleOrderIds.indexOf(tagId);
      if (startIdx !== -1 && endIdx !== -1) {
        const [from, to] =
          startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const rangeIds = visibleOrderIds.slice(from, to + 1);
        setSelectedTagIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
        setLastClickedTagId(tagId);
        return;
      }
    }

    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
    setLastClickedTagId(tagId);
  };

  const handleToggleSelectAllVisible = (visibleIds: string[]) => {
    if (visibleIds.length === 0) return;
    const allSelected = visibleIds.every((id) => selectedTagIds.includes(id));
    if (allSelected) {
      const visibleSet = new Set(visibleIds);
      setSelectedTagIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      setSelectedTagIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelectedTags = () => {
    setSelectedTagIds([]);
    setLastClickedTagId(null);
  };

  // Drag-and-Drop Handlers for Tags
  const handleStartDragTag = (tagId: string): string[] => {
    const batch =
      selectedTagIds.includes(tagId) && selectedTagIds.length > 0
        ? selectedTagIds
        : [tagId];
    setDraggingTagIds(batch);
    return batch;
  };

  const handleEndDragTag = () => {
    setDraggingTagIds([]);
  };

  // Execute Bulk Move / Reparent
  const handleExecuteBatchMove = async (
    tagIdsToMove: string[],
    destination: import('../../../context/cms/cms.types').BatchTagMoveDestination
  ) => {
    if (tagIdsToMove.length === 0 || isBatchMovingTags) return;
    setIsBatchMovingTags(true);
    setBatchMoveProgressText(`กำลังย้าย ${tagIdsToMove.length} แท็ก...`);
    try {
      await batchMoveOrReparentTags(tagIdsToMove, destination, (prog) => {
        setBatchMoveProgressText(
          `กำลังบันทึกขึ้น Cloud ก้อนที่ ${prog.completedChunks}/${prog.totalChunks} (${prog.completedOps}/${prog.totalOps})...`
        );
      });
      setSelectedTagIds((prev) =>
        prev.filter((id) => !tagIdsToMove.includes(id))
      );
      setDraggingTagIds([]);
    } finally {
      setIsBatchMovingTags(false);
      setBatchMoveProgressText(null);
    }
  };

  // Inline Rename Handlers
  const handleStartInlineRename = (tag: CategoryTag, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInlineEditingTagId(tag.id);
    setInlineEditingName(tag.name);
  };

  const handleCommitInlineRename = (tagId: string) => {
    const trimmed = inlineEditingName.trim().replace(/^#+/, '').trim();
    if (trimmed) {
      const target = tags.find((t) => t.id === tagId);
      if (target && target.name !== trimmed) {
        updateTag(tagId, { name: trimmed });
      }
    }
    setInlineEditingTagId(null);
    setInlineEditingName('');
  };

  const handleCancelInlineRename = () => {
    setInlineEditingTagId(null);
    setInlineEditingName('');
  };

  // Execute Bulk Metadata Update (Color / EntityType)
  const handleExecuteBatchMetadataUpdate = async (
    tagIds: string[],
    updates: { color?: string; entityType?: EntitySubtype }
  ) => {
    if (tagIds.length === 0 || isBatchMovingTags) return;
    setIsBatchMovingTags(true);
    setBatchMoveProgressText(`กำลังอัปเดต ${tagIds.length} แท็ก...`);
    try {
      await batchUpdateTagsMetadata(tagIds, updates, (prog) => {
        setBatchMoveProgressText(
          `กำลังบันทึกขึ้น Cloud ก้อนที่ ${prog.completedChunks}/${prog.totalChunks} (${prog.completedOps}/${prog.totalOps})...`
        );
      });
    } finally {
      setIsBatchMovingTags(false);
      setBatchMoveProgressText(null);
    }
  };

  // Execute Bulk Delete of Selected Tags
  const handleConfirmBatchDelete = async () => {
    if (selectedTagIds.length === 0 || isBatchMovingTags) {
      setShowBatchDeleteConfirm(false);
      return;
    }
    const idsToDelete = [...selectedTagIds];
    setShowBatchDeleteConfirm(false);
    setIsBatchMovingTags(true);
    setBatchMoveProgressText(`กำลังลบ ${idsToDelete.length} แท็กออกจากคลังและ Cloud...`);
    try {
      await batchDeleteTags(idsToDelete, (prog) => {
        setBatchMoveProgressText(
          `กำลังลบจาก Cloud ก้อนที่ ${prog.completedChunks}/${prog.totalChunks} (${prog.completedOps}/${prog.totalOps})...`
        );
      });
      setSelectedTagIds([]);
      setDraggingTagIds([]);
      if (selectedMainCatId && idsToDelete.includes(selectedMainCatId)) {
        setSelectedMainCatId('');
      }
    } finally {
      setIsBatchMovingTags(false);
      setBatchMoveProgressText(null);
    }
  };

  return {
    isThreeTierManagerOpen,
    setIsThreeTierManagerOpen,
    categoryGroups,
    tags,
    restoreDefaultCategories,
    handleRestoreDefaultsAndSelect,

    // Cascade selections & active items
    selectedGroupId,
    setSelectedGroupId,
    handleSelectGroup,
    selectedMainCatId,
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
    setSelectedTagIds,
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
    groupFormColor,
    setGroupFormColor,
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
  };
};
