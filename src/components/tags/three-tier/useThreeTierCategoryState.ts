import React, { useState, useMemo } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { isStagingTagId } from '../../../services/seedData';
import {
  CategoryGroup,
  CategoryTag,
  CategoryTier,
  EntitySubtype,
} from '../../../types/tag.types';

export const COLOR_OPTIONS = [
  'purple',
  'blue',
  'emerald',
  'amber',
  'rose',
  'cyan',
  'indigo',
  'teal',
  'slate',
];

export const useThreeTierCategoryState = () => {
  const {
    isThreeTierManagerOpen,
    setIsThreeTierManagerOpen,
    categoryGroups,
    tags,
    tierSubCategories,
    deleteCategoryGroup,
    createTag,
    updateTag,
    deleteTag,
    addTierSubCategory,
    renameTierSubCategory,
    deleteTierSubCategory,
    wipeAllCategories,
    restoreDefaultCategories,
    batchMoveOrReparentTags,
    batchUpdateTagsMetadata,
    batchDeleteTags,
    reorganizeTagsToDataDictionary,
    lastTagReorgUndoRecord,
    undoLastTagReorg,
    dismissTagReorgUndoRecord,
  } = useCMS();

  // Column-level search filters for Tier 1, Tier 2, and Tier 3
  const [tier1SearchQuery, setTier1SearchQuery] = useState<string>('');
  const [tier2SearchQuery, setTier2SearchQuery] = useState<string>('');
  const [tier3SearchQuery, setTier3SearchQuery] = useState<string>('');

  // Multi-select & Drag-and-Drop states for bulk tag reorganization
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [lastClickedTagId, setLastClickedTagId] = useState<string | null>(null);
  const [draggingTagIds, setDraggingTagIds] = useState<string[]>([]);
  const [isBatchMovingTags, setIsBatchMovingTags] = useState<boolean>(false);
  const [batchMoveProgressText, setBatchMoveProgressText] = useState<
    string | null
  >(null);

  // Inline Rename State (Double-click on tag name)
  const [inlineEditingTagId, setInlineEditingTagId] = useState<string | null>(
    null
  );
  const [inlineEditingName, setInlineEditingName] = useState<string>('');

  // Confirmation Modals
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState<
    string | null
  >(null);
  const [showDeleteTagConfirm, setShowDeleteTagConfirm] = useState<
    string | null
  >(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Tags partitioned by Tier 1, Tier 2, Tier 3
  const tier1Tags = useMemo(
    () =>
      tags.filter(
        (t) => !isStagingTagId(t.id) && (t.tier === 1 || (!t.tier && !t.parentId))
      ),
    [tags]
  );

  const tier2Tags = useMemo(
    () => tags.filter((t) => !isStagingTagId(t.id) && t.tier === 2),
    [tags]
  );

  const tier3Tags = useMemo(
    () => tags.filter((t) => !isStagingTagId(t.id) && t.tier === 3),
    [tags]
  );

  // Handlers for Creating & Updating Tags inside any Tier + Sub-category
  const handleCreateTagInSubCategory = (
    tier: CategoryTier,
    subCategory: string,
    name: string,
    color: string,
    entityType: EntitySubtype,
    description: string
  ) => {
    const groupType =
      tier === 3 ? 'PERSON' : tier === 2 ? 'ACTION' : 'THEME';
    createTag(
      name,
      groupType,
      color,
      description,
      tier,
      null,
      entityType,
      `GRP-${groupType}`,
      subCategory
    );
  };

  const handleUpdateTagDetails = (
    tagId: string,
    updates: {
      name: string;
      color: string;
      entityType: EntitySubtype;
      description: string;
      subCategory: string;
    }
  ) => {
    updateTag(tagId, {
      name: updates.name,
      color: updates.color,
      entityType: updates.entityType,
      description: updates.description,
      subCategory: updates.subCategory,
    });
  };

  const handleConfirmWipe = () => {
    wipeAllCategories();
    setShowWipeConfirm(false);
  };

  const handleConfirmDeleteGroup = (id: string) => {
    deleteCategoryGroup(id);
    setShowDeleteGroupConfirm(null);
  };

  const handleConfirmDeleteTag = (id: string) => {
    deleteTag(id);
    setShowDeleteTagConfirm(null);
  };

  const handleRestoreDefaultsAndSelect = () => {
    restoreDefaultCategories();
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
    setBatchMoveProgressText(
      `กำลังลบ ${idsToDelete.length} แท็กออกจากคลังและ Cloud...`
    );
    try {
      await batchDeleteTags(idsToDelete, (prog) => {
        setBatchMoveProgressText(
          `กำลังลบจาก Cloud ก้อนที่ ${prog.completedChunks}/${prog.totalChunks} (${prog.completedOps}/${prog.totalOps})...`
        );
      });
      setSelectedTagIds([]);
      setDraggingTagIds([]);
    } finally {
      setIsBatchMovingTags(false);
      setBatchMoveProgressText(null);
    }
  };

  return {
    isThreeTierManagerOpen,
    setIsThreeTierManagerOpen,
    categoryGroups: categoryGroups as CategoryGroup[],
    tags,
    tierSubCategories,
    tier1Tags,
    tier2Tags,
    tier3Tags,
    restoreDefaultCategories,
    handleRestoreDefaultsAndSelect,
    reorganizeTagsToDataDictionary,

    // Column search filters
    tier1SearchQuery,
    setTier1SearchQuery,
    tier2SearchQuery,
    setTier2SearchQuery,
    tier3SearchQuery,
    setTier3SearchQuery,

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
  };
};
