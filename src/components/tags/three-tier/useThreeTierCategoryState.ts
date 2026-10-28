import React, { useState, useMemo } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { CategoryGroup, CategoryTag, EntitySubtype, TagGroupType } from '../../../types/tag.types';

export const EMOJI_OPTIONS = ['🌟', '🎭', '🐾', '⚡', '🏷️', '🎮', '🎤', '⚽', '🍔', '🚗', '🎬', '🏆', '🔥', '💻'];
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
  } = useCMS();

  // Selected state for 3-tier cascade navigation
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => categoryGroups[0]?.id || '');
  const [selectedMainCatId, setSelectedMainCatId] = useState<string>('');

  // Forms / Editing states
  const [isEditingGroup, setIsEditingGroup] = useState<boolean>(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormIcon, setGroupFormIcon] = useState('🌟');
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

  // Confirmation Modals
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState<string | null>(null);
  const [showDeleteTagConfirm, setShowDeleteTagConfirm] = useState<string | null>(null);

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

  // Handlers for Group Form
  const handleOpenAddGroup = () => {
    setEditingGroupId(null);
    setGroupFormName('');
    setGroupFormIcon('🌟');
    setGroupFormColor('indigo');
    setGroupFormDesc('');
    setIsEditingGroup(true);
  };

  const handleOpenEditGroup = (g: CategoryGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(g.id);
    setGroupFormName(g.name);
    setGroupFormIcon(g.icon || '🌟');
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
    subcategoriesInActiveCat,

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
    handleConfirmWipe,
    handleConfirmDeleteGroup,
    handleConfirmDeleteTag,
  };
};
