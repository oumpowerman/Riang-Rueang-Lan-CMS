import { useEffect, useMemo, useState } from 'react';
import { useCMS } from '../../../context/CMSContext';
import {
  STAGING_GROUP_ID,
  STAGING_TAG_ID,
  isFootageInStaging,
  isStagingGroupId,
  isStagingTagId,
} from '../../../services/seedData';
import { CooldownStatus, IngestionFlow } from '../../../types/footage.types';
import { scanDuplicateFootageClusters } from '../../../utils/duplicateClusterScanner';
import { hasRealDriveLink } from '../../../utils/fileNameGenerator';
import {
  FootageActionFilter,
  FootageLibrarySortBy,
} from '../../ui/SearchFilterBar';
import { getEntityIcon } from '../../ui/TagPill';
import {
  ActiveScopeDescription,
  CategoryGroupOverviewItem,
  MainCategoryOverviewItem,
  VaultMetricsSummary,
  VaultViewMode,
} from './vault.types';

export type TagFilterMatchMode = 'AND' | 'OR';

export const useFootageVault = () => {
  const {
    computedFootage,
    categoryGroups,
    tags,
    tagMap,
    tierSubCategories,
    categoryMatrix,
    untaggedFootages,
    missingDriveFootages,
    selectedTagFilter,
    setSelectedTagFilter,
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
    activeDragFootageIds,
    setActiveDragFootageIds,
    lastSelectedFootageId,
    setLastSelectedFootageId,
    lastQuickSortUndoRecord,
    quickAssignCategoryToFootage,
    undoLastQuickSort,
    dismissQuickSortUndoRecord,
    setIsDirectFootageModalOpen,
    setIsGoogleDriveBatchModalOpen,
    isSheetTagImportModalOpen,
    setIsSheetTagImportModalOpen,
    setIsYouTubeDateSyncModalOpen,
    openSourceSplitterFor,
    setIsThreeTierManagerOpen,
    setIsStatusRuleModalOpen,
    setTraceabilityFootageId,
    launchEpisodeBuilderForCategory,
    launchEpisodeBuilderWithCustomClips,
    settings,
  } = useCMS();

  const duplicateScan = useMemo(
    () => scanDuplicateFootageClusters(computedFootage),
    [computedFootage]
  );

  // Filter, Sort & View States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CooldownStatus | 'ALL'>('ALL');
  const [flowFilter, setFlowFilter] = useState<IngestionFlow | 'ALL'>('ALL');
  const [actionFilter, setActionFilter] = useState<FootageActionFilter>('ALL');
  const [sortBy, setSortBy] = useState<FootageLibrarySortBy>('REST_DAYS_DESC');
  const [viewMode, setViewMode] = useState<VaultViewMode>('GRID');

  // Multi-Tag Match Mode: Default to 'AND' (ต้องมีครบทุกแท็กที่กดเลือก) with toggle to 'OR'
  const [tagMatchMode, setTagMatchMode] = useState<TagFilterMatchMode>('AND');

  // 3-Tier Explorer State
  const [isCategoryInventoryExpanded, setIsCategoryInventoryExpanded] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Fullscreen 2-Pane Staging Triage Studio State
  const [isFullscreenStudioOpen, setIsFullscreenStudioOpen] = useState(false);

  // Pagination State (9 items fits a 3-column grid cleanly)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Reset page to 1 whenever any filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    statusFilter,
    flowFilter,
    actionFilter,
    sortBy,
    selectedTagFilter,
    selectedGroupId,
    tagMatchMode,
  ]);

  const doesMainTagBelongToGroup = (mainTagId: string, groupId: string): boolean => {
    const mainTag = tagMap[mainTagId];
    if (!mainTag) return false;
    if (mainTag.groupId === groupId) return true;
    const groupShort = groupId.replace('GRP-', '');
    return mainTag.groupType === groupShort || mainTag.groupType === groupId;
  };

  // Overview of all tags for legacy/staging studio compatibility
  const mainCategoriesOverview = useMemo<MainCategoryOverviewItem[]>(() => {
    const mainTags = tags.filter((t) => !isStagingTagId(t.id) || t.id === STAGING_TAG_ID);

    return mainTags
      .map((mainTag) => {
        const isStaging = isStagingTagId(mainTag.id);
        const subTags = tags.filter((t) => t.parentId === mainTag.id);
        const familyIds = new Set([mainTag.id, ...subTags.map((s) => s.id)]);

        const footagesInFamily = isStaging
          ? computedFootage.filter((ft) => isFootageInStaging(ft.tags))
          : computedFootage.filter(
              (ft) =>
                !isFootageInStaging(ft.tags) &&
                ft.tags.some((tid) => familyIds.has(tid))
            );
        const usableInFamily = footagesInFamily.filter(
          (ft) =>
            ft.cooldownStatus === 'NEW_UNTOUCHED' ||
            ft.cooldownStatus === 'READY_FRESH'
        );
        const newInFamily = footagesInFamily.filter(
          (ft) => ft.cooldownStatus === 'NEW_UNTOUCHED'
        );

        return {
          mainTag,
          subTags,
          familyIds,
          totalCount: footagesInFamily.length,
          usableCount: usableInFamily.length,
          newCount: newInFamily.length,
          producibleEpisodes: isStaging ? 0 : Math.floor(usableInFamily.length / 5),
        };
      })
      .sort((a, b) => {
        if (isStagingTagId(a.mainTag.id)) return -1;
        if (isStagingTagId(b.mainTag.id)) return 1;
        return b.usableCount - a.usableCount;
      });
  }, [tags, computedFootage]);

  const categoryGroupsOverview = useMemo<CategoryGroupOverviewItem[]>(() => {
    return categoryGroups.map((group) => {
      const isStagingGrp = isStagingGroupId(group.id);
      const mainCatsInGroup = mainCategoriesOverview.filter((item) =>
        doesMainTagBelongToGroup(item.mainTag.id, group.id)
      );

      const groupFamilyTagIds = new Set<string>();
      mainCatsInGroup.forEach((mc) => {
        mc.familyIds.forEach((id) => groupFamilyTagIds.add(id));
      });

      const footagesInGroup = isStagingGrp
        ? computedFootage.filter((ft) => isFootageInStaging(ft.tags))
        : computedFootage.filter(
            (ft) =>
              !isFootageInStaging(ft.tags) &&
              ft.tags.some((tid) => groupFamilyTagIds.has(tid))
          );
      const usableInGroup = footagesInGroup.filter(
        (ft) =>
          ft.cooldownStatus === 'NEW_UNTOUCHED' ||
          ft.cooldownStatus === 'READY_FRESH'
      );
      const newInGroup = footagesInGroup.filter(
        (ft) => ft.cooldownStatus === 'NEW_UNTOUCHED'
      );

      return {
        group,
        mainCategories: mainCatsInGroup,
        groupFamilyTagIds,
        mainCatCount: mainCatsInGroup.length,
        totalCount: footagesInGroup.length,
        usableCount: usableInGroup.length,
        newCount: newInGroup.length,
      };
    });
  }, [categoryGroups, mainCategoriesOverview, computedFootage, tagMap]);

  const activeMainCategory = useMemo<MainCategoryOverviewItem | null>(() => {
    if (selectedTagFilter.length === 0) return null;
    const firstSelected = tagMap[selectedTagFilter[0]];
    if (!firstSelected) return null;
    return mainCategoriesOverview.find((m) => m.mainTag.id === firstSelected.id) || null;
  }, [selectedTagFilter, tagMap, mainCategoriesOverview]);

  const activeSubcategory = useMemo(() => {
    if (selectedTagFilter.length <= 1) return null;
    return tagMap[selectedTagFilter[selectedTagFilter.length - 1]] || null;
  }, [selectedTagFilter, tagMap]);

  const activeGroupOverview = useMemo<CategoryGroupOverviewItem | null>(() => {
    if (!selectedGroupId) return null;
    return categoryGroupsOverview.find((g) => g.group.id === selectedGroupId) || null;
  }, [selectedGroupId, categoryGroupsOverview]);

  // Contextual Scoped Footage supporting Multi-Tag AND / OR Intersection Filtering!
  const categoryScopedFootage = useMemo(() => {
    // 0. If Staging Area is selected
    if (
      selectedTagFilter.some((tid) => isStagingTagId(tid)) ||
      isStagingGroupId(selectedGroupId)
    ) {
      return computedFootage.filter((ft) => isFootageInStaging(ft.tags));
    }

    // 1. If one or more independent tags are selected across Tier 1, Tier 2, Tier 3
    const realSelectedIds = selectedTagFilter.filter(
      (tid) => Boolean(tid) && !isStagingTagId(tid)
    );
    if (realSelectedIds.length > 0) {
      if (tagMatchMode === 'AND') {
        return computedFootage.filter(
          (ft) =>
            !isFootageInStaging(ft.tags) &&
            realSelectedIds.every((tid) => ft.tags.includes(tid))
        );
      } else {
        const allowedSet = new Set(realSelectedIds);
        return computedFootage.filter(
          (ft) =>
            !isFootageInStaging(ft.tags) &&
            ft.tags.some((tid) => allowedSet.has(tid))
        );
      }
    }

    // 2. If a Category Group is selected
    if (activeGroupOverview) {
      return computedFootage.filter(
        (ft) =>
          !isFootageInStaging(ft.tags) &&
          ft.tags.some((tid) => activeGroupOverview.groupFamilyTagIds.has(tid))
      );
    }

    // 3. Default: All footage in the vault
    return computedFootage;
  }, [
    computedFootage,
    selectedTagFilter,
    selectedGroupId,
    tagMatchMode,
    activeGroupOverview,
  ]);

  // Executive KPI Metrics (Dynamically reflects the selected Tag Combination)
  const vaultMetrics = useMemo<VaultMetricsSummary>(() => {
    const total = categoryScopedFootage.length;
    const newUntouched = categoryScopedFootage.filter(
      (f) => f.cooldownStatus === 'NEW_UNTOUCHED'
    ).length;
    const readyFresh = categoryScopedFootage.filter(
      (f) => f.cooldownStatus === 'READY_FRESH'
    ).length;
    const inCooldown = categoryScopedFootage.filter(
      (f) =>
        f.cooldownStatus === 'RECENT_COOLDOWN' ||
        f.cooldownStatus === 'HIGH_VELOCITY_WARNING'
    ).length;

    return {
      total,
      usable: newUntouched + readyFresh,
      newUntouched,
      readyFresh,
      inCooldown,
    };
  }, [categoryScopedFootage]);

  // Human-readable label describing what the 4 KPI cards at the top currently represent
  const activeScopeDescription = useMemo<ActiveScopeDescription>(() => {
    const realSelected = selectedTagFilter
      .filter((tid) => !isStagingTagId(tid))
      .map((tid) => tagMap[tid])
      .filter(Boolean);

    if (realSelected.length > 1) {
      const joiner = tagMatchMode === 'AND' ? ' + ' : ' หรือ ';
      const names = realSelected.map((t) => `#${t.name}`).join(joiner);
      return {
        key: `COMBO_${tagMatchMode}_${realSelected.map((t) => t.id).join('_')}`,
        level: tagMatchMode === 'AND' ? 'ผสมแท็ก (AND)' : 'ผสมแท็ก (OR)',
        label: names,
        trail: `กรองผสม ${realSelected.length} แท็ก (${
          tagMatchMode === 'AND' ? 'ต้องมีครบทุกแท็ก' : 'มีอย่างน้อย 1 แท็ก'
        }): ${names}`,
      };
    }

    if (realSelected.length === 1) {
      const single = realSelected[0];
      return {
        key: `TAG_${single.id}`,
        level: `Tier ${single.tier || 1}`,
        label: `${getEntityIcon(single)} #${single.name}`,
        trail: `Tier ${single.tier || 1} (${single.subCategory || 'ทั่วไป'}) ➔ #${single.name}`,
      };
    }

    if (selectedTagFilter.some((tid) => isStagingTagId(tid)) || isStagingGroupId(selectedGroupId)) {
      return {
        key: 'STAGING_VAULT',
        level: 'พื้นที่พัก',
        label: 'คลิปยังไม่ติดแท็ก',
        trail: 'พื้นที่พักรอจัดหมวดหมู่ (Staging Area)',
      };
    }

    return {
      key: 'ALL_VAULT',
      level: 'ทั้งคลัง',
      label: 'ทั้งหมด',
      trail: 'ทุกหมวดหมู่',
    };
  }, [selectedTagFilter, selectedGroupId, tagMap, tagMatchMode]);

  // Handlers for 3-Tier Multi-Tag Selection
  const handleSelectGroup = (groupId: string) => {
    if (selectedGroupId === groupId && selectedTagFilter.length === 0) {
      setSelectedGroupId(null);
      setSelectedTagFilter([]);
    } else {
      setSelectedGroupId(groupId);
      setSelectedTagFilter([]);
    }
  };

  // Clicking a tag in the 3-Tier Explorer toggles it in `selectedTagFilter` so users can combine multiple tags freely!
  const handleToggleFacetTag = (tagId: string) => {
    if (isStagingTagId(tagId)) {
      handleToggleStagingFilter();
      return;
    }
    setSelectedGroupId(null);
    setSelectedTagFilter((prev) => {
      const cleanPrev = prev.filter((id) => !isStagingTagId(id));
      if (cleanPrev.includes(tagId)) {
        return cleanPrev.filter((id) => id !== tagId);
      }
      return [...cleanPrev, tagId];
    });
  };

  const handleSelectMainCategory = (mainTagId: string) => {
    handleToggleFacetTag(mainTagId);
  };

  const handleSelectSubcategory = (subTagId: string) => {
    handleToggleFacetTag(subTagId);
  };

  const handleClearHierarchySelection = () => {
    setSelectedGroupId(null);
    setSelectedTagFilter([]);
  };

  const handleToggleTag = (tagId: string) => {
    handleToggleFacetTag(tagId);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGroupId(null);
    setSelectedTagFilter([]);
    setStatusFilter('ALL');
    setFlowFilter('ALL');
    setActionFilter('ALL');
    setSortBy('REST_DAYS_DESC');
    setCurrentPage(1);
  };

  const isStagingFilterActive = useMemo(() => {
    return (
      selectedTagFilter.some((tid) => isStagingTagId(tid)) ||
      isStagingGroupId(selectedGroupId) ||
      actionFilter === 'UNTAGGED_ONLY'
    );
  }, [selectedTagFilter, selectedGroupId, actionFilter]);

  const handleToggleStagingFilter = () => {
    if (isStagingFilterActive) {
      setSelectedGroupId(null);
      setSelectedTagFilter([]);
      if (actionFilter === 'UNTAGGED_ONLY') {
        setActionFilter('ALL');
      }
    } else {
      setSelectedGroupId(STAGING_GROUP_ID);
      setSelectedTagFilter([STAGING_TAG_ID]);
      setStatusFilter('ALL');
      setFlowFilter('ALL');
      setActionFilter('ALL');
    }
  };

  // Launch Episode Builder directly from the currently filtered usable clips!
  const handleLaunchEpisodeFromCurrentFilter = () => {
    const usableClips = categoryScopedFootage.filter(
      (ft) =>
        ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH'
    );
    const realSelected = selectedTagFilter.filter((tid) => !isStagingTagId(tid));
    const primaryTagId = realSelected[0] || '';

    if (usableClips.length >= 5) {
      const pickedIds = usableClips.slice(0, 5).map((f) => f.id);
      const comboTitle =
        realSelected.length > 0
          ? `5 อันดับ ${realSelected
              .map((id) => tagMap[id]?.name)
              .filter(Boolean)
              .join(' x ')}`
          : undefined;
      launchEpisodeBuilderWithCustomClips(pickedIds, primaryTagId, comboTitle);
    } else if (primaryTagId) {
      launchEpisodeBuilderForCategory(primaryTagId, 'FORMULA_2_NEW_3_FRESH');
    }
  };

  // Precompute sets of category IDs for actionable readiness filters
  const ready5CategoryIds = useMemo(
    () =>
      new Set(
        categoryMatrix
          .filter((c) => !isStagingTagId(c.tag.id) && c.usableCount >= 5)
          .map((c) => c.tag.id)
      ),
    [categoryMatrix]
  );

  const allNew5CategoryIds = useMemo(
    () =>
      new Set(
        categoryMatrix
          .filter((c) => !isStagingTagId(c.tag.id) && c.canMakeAllNew5)
          .map((c) => c.tag.id)
      ),
    [categoryMatrix]
  );

  const smartMixCategoryIds = useMemo(
    () =>
      new Set(
        categoryMatrix
          .filter((c) => !isStagingTagId(c.tag.id) && c.canMakeMix2New3Fresh)
          .map((c) => c.tag.id)
      ),
    [categoryMatrix]
  );

  const filteredAndSortedFootage = useMemo(() => {
    const filtered = categoryScopedFootage.filter((ft) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'RECENT_COOLDOWN') {
          if (
            ft.cooldownStatus !== 'RECENT_COOLDOWN' &&
            ft.cooldownStatus !== 'HIGH_VELOCITY_WARNING'
          ) {
            return false;
          }
        } else if (ft.cooldownStatus !== statusFilter) {
          return false;
        }
      }

      if (flowFilter !== 'ALL' && ft.ingestionFlow !== flowFilter) {
        return false;
      }

      if (actionFilter === 'UNTAGGED_ONLY') {
        if (!isFootageInStaging(ft.tags)) return false;
      } else if (actionFilter === 'MISSING_DRIVE_ONLY') {
        if (hasRealDriveLink(ft.driveFileUrl)) return false;
      } else if (actionFilter === 'DUPLICATES_ONLY') {
        if (duplicateScan.itemClusterIndexById[ft.id] === undefined) return false;
      } else if (actionFilter === 'CATEGORY_READY_5') {
        if (isFootageInStaging(ft.tags)) return false;
        const isUsable =
          ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH';
        const belongsToReadyCat = ft.tags.some((tid) => ready5CategoryIds.has(tid));
        if (!isUsable || !belongsToReadyCat) return false;
      } else if (actionFilter === 'RECIPE_ALL_NEW') {
        if (isFootageInStaging(ft.tags)) return false;
        const isNew = ft.cooldownStatus === 'NEW_UNTOUCHED';
        const belongsToAllNewCat = ft.tags.some((tid) => allNew5CategoryIds.has(tid));
        if (!isNew || !belongsToAllNewCat) return false;
      } else if (actionFilter === 'RECIPE_SMART_MIX') {
        if (isFootageInStaging(ft.tags)) return false;
        const isUsable =
          ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH';
        const belongsToMixCat = ft.tags.some((tid) => smartMixCategoryIds.has(tid));
        if (!isUsable || !belongsToMixCat) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inId = ft.id.toLowerCase().includes(q);
        const inTitle = ft.title.toLowerCase().includes(q);
        const inFile = ft.standardFileName.toLowerCase().includes(q);
        const inNotes = ft.mascotNotes.toLowerCase().includes(q);
        const inSource = (ft.sourceId || '').toLowerCase().includes(q);
        if (!inId && !inTitle && !inFile && !inNotes && !inSource) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (actionFilter === 'DUPLICATES_ONLY') {
        const idxA = duplicateScan.itemClusterIndexById[a.id] ?? Number.MAX_SAFE_INTEGER;
        const idxB = duplicateScan.itemClusterIndexById[b.id] ?? Number.MAX_SAFE_INTEGER;
        if (idxA !== idxB) return idxA - idxB;
      }
      if (sortBy === 'REST_DAYS_DESC') {
        const daysA = a.daysSinceLastUsed === null ? 9999 : a.daysSinceLastUsed;
        const daysB = b.daysSinceLastUsed === null ? 9999 : b.daysSinceLastUsed;
        if (daysB !== daysA) return daysB - daysA;
        return a.usageLast90Days - b.usageLast90Days;
      }
      if (sortBy === 'USAGE_90D_ASC') {
        if (a.usageLast90Days !== b.usageLast90Days) {
          return a.usageLast90Days - b.usageLast90Days;
        }
        return a.totalUsageCount - b.totalUsageCount;
      }
      if (sortBy === 'NEWEST_CREATED') {
        if (b.createdAt !== a.createdAt) return b.createdAt.localeCompare(a.createdAt);
        return b.id.localeCompare(a.id);
      }
      return a.id.localeCompare(b.id);
    });
  }, [
    categoryScopedFootage,
    statusFilter,
    flowFilter,
    actionFilter,
    searchQuery,
    sortBy,
    ready5CategoryIds,
    allNew5CategoryIds,
    smartMixCategoryIds,
    duplicateScan,
  ]);

  const paginatedFootage = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedFootage.slice(start, start + pageSize);
  }, [filteredAndSortedFootage, currentPage, pageSize]);

  const hasHierarchySelection = Boolean(selectedGroupId || selectedTagFilter.length > 0);

  const resultsTransitionKey = useMemo(() => {
    return `${activeScopeDescription.key}__${statusFilter}__${flowFilter}__${actionFilter}__${sortBy}__p${currentPage}`;
  }, [
    activeScopeDescription.key,
    statusFilter,
    flowFilter,
    actionFilter,
    sortBy,
    currentPage,
  ]);

  const isDraggingClips = activeDragFootageIds.length > 0;

  const handleStartDragFootage = (footageId: string): string[] => {
    const batchIds = selectedFootageIdsForBatch.includes(footageId)
      ? selectedFootageIdsForBatch
      : [footageId];
    setActiveDragFootageIds(batchIds);
    return batchIds;
  };

  const handleEndDragFootage = () => {
    setActiveDragFootageIds([]);
  };

  const handleQuickAssignCategory = (footageIds: string[], targetTagId: string) => {
    if (!footageIds.length) return;
    quickAssignCategoryToFootage(footageIds, targetTagId);
  };

  const handleSelectWithRange = (footageId: string, shiftKey = false) => {
    if (shiftKey && lastSelectedFootageId && lastSelectedFootageId !== footageId) {
      const startIndex = filteredAndSortedFootage.findIndex(
        (ft) => ft.id === lastSelectedFootageId
      );
      const endIndex = filteredAndSortedFootage.findIndex((ft) => ft.id === footageId);

      if (startIndex !== -1 && endIndex !== -1) {
        const minIdx = Math.min(startIndex, endIndex);
        const maxIdx = Math.max(startIndex, endIndex);
        const rangeIds = filteredAndSortedFootage
          .slice(minIdx, maxIdx + 1)
          .map((ft) => ft.id);

        setSelectedFootageIdsForBatch((prev) =>
          Array.from(new Set([...prev, ...rangeIds]))
        );
        setLastSelectedFootageId(footageId);
        return;
      }
    }

    setSelectedFootageIdsForBatch((prev) =>
      prev.includes(footageId)
        ? prev.filter((id) => id !== footageId)
        : [...prev, footageId]
    );
    setLastSelectedFootageId(footageId);
  };

  const isAllPaginatedSelected = useMemo(() => {
    return (
      paginatedFootage.length > 0 &&
      paginatedFootage.every((ft) => selectedFootageIdsForBatch.includes(ft.id))
    );
  }, [paginatedFootage, selectedFootageIdsForBatch]);

  const handleToggleSelectAllInPage = () => {
    if (paginatedFootage.length === 0) return;
    const pageIds = paginatedFootage.map((f) => f.id);
    if (isAllPaginatedSelected) {
      const pageIdSet = new Set(pageIds);
      setSelectedFootageIdsForBatch((prev) => prev.filter((id) => !pageIdSet.has(id)));
    } else {
      setSelectedFootageIdsForBatch((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const isAllStagingSelected = useMemo(() => {
    return (
      untaggedFootages.length > 0 &&
      untaggedFootages.every((ft) => selectedFootageIdsForBatch.includes(ft.id))
    );
  }, [untaggedFootages, selectedFootageIdsForBatch]);

  const handleSelectAllInStaging = () => {
    if (untaggedFootages.length === 0) return;
    const stagingIds = untaggedFootages.map((f) => f.id);
    if (isAllStagingSelected) {
      const stagingSet = new Set(stagingIds);
      setSelectedFootageIdsForBatch((prev) => prev.filter((id) => !stagingSet.has(id)));
    } else {
      setSelectedFootageIdsForBatch((prev) =>
        Array.from(new Set([...prev, ...stagingIds]))
      );
    }
  };

  const handleClearBatchSelection = () => {
    setSelectedFootageIdsForBatch([]);
    setLastSelectedFootageId(null);
  };

  return {
    // Raw & Computed Data
    computedFootage,
    tags,
    tagMap,
    tierSubCategories,
    categoryMatrix,
    untaggedFootages,
    missingDriveFootages,
    duplicateScan,
    settings,
    mainCategoriesOverview,
    categoryGroupsOverview,
    activeGroupOverview,
    activeMainCategory,
    activeSubcategory,
    categoryScopedFootage,
    vaultMetrics,
    activeScopeDescription,
    filteredAndSortedFootage,
    paginatedFootage,
    hasHierarchySelection,
    resultsTransitionKey,

    // UI & Filter States
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    flowFilter,
    setFlowFilter,
    actionFilter,
    setActionFilter,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    tagMatchMode,
    setTagMatchMode,
    isCategoryInventoryExpanded,
    setIsCategoryInventoryExpanded,
    selectedGroupId,
    selectedTagFilter,
    setSelectedTagFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    isFullscreenStudioOpen,
    setIsFullscreenStudioOpen,

    // Multi-Select, Drag & Drop & Quick-Sort States
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
    activeDragFootageIds,
    isDraggingClips,
    isAllPaginatedSelected,
    isAllStagingSelected,
    lastQuickSortUndoRecord,
    handleStartDragFootage,
    handleEndDragFootage,
    handleQuickAssignCategory,
    undoLastQuickSort,
    dismissQuickSortUndoRecord,
    handleSelectWithRange,
    handleToggleSelectAllInPage,
    handleSelectAllInStaging,
    handleClearBatchSelection,

    // Handlers & Modal Actions
    isStagingFilterActive,
    handleToggleStagingFilter,
    handleSelectGroup,
    handleToggleFacetTag,
    handleSelectMainCategory,
    handleSelectSubcategory,
    handleClearHierarchySelection,
    handleToggleTag,
    handleResetFilters,
    handleLaunchEpisodeFromCurrentFilter,
    setIsDirectFootageModalOpen,
    setIsGoogleDriveBatchModalOpen,
    isSheetTagImportModalOpen,
    setIsSheetTagImportModalOpen,
    setIsYouTubeDateSyncModalOpen,
    openSourceSplitterFor,
    setIsThreeTierManagerOpen,
    setIsStatusRuleModalOpen,
    setTraceabilityFootageId,
    launchEpisodeBuilderForCategory,
  };
};
