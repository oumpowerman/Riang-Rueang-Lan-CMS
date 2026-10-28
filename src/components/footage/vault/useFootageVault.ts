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

export const useFootageVault = () => {
  const {
    computedFootage,
    categoryGroups,
    tags,
    tagMap,
    categoryMatrix,
    untaggedFootages,
    missingDriveFootages,
    selectedTagFilter,
    setSelectedTagFilter,
    setIsDirectFootageModalOpen,
    openSourceSplitterFor,
    setIsThreeTierManagerOpen,
    setIsStatusRuleModalOpen,
    setTraceabilityFootageId,
    launchEpisodeBuilderForCategory,
    settings,
  } = useCMS();

  // Filter, Sort & View States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CooldownStatus | 'ALL'>('ALL');
  const [flowFilter, setFlowFilter] = useState<IngestionFlow | 'ALL'>('ALL');
  const [actionFilter, setActionFilter] = useState<FootageActionFilter>('ALL');
  const [sortBy, setSortBy] = useState<FootageLibrarySortBy>('REST_DAYS_DESC');
  const [viewMode, setViewMode] = useState<VaultViewMode>('GRID');

  // 3-Tier Explorer State
  const [isCategoryInventoryExpanded, setIsCategoryInventoryExpanded] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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
  ]);

  // Helper to check if a Tier 1 Main Category belongs to a CategoryGroup
  const doesMainTagBelongToGroup = (mainTagId: string, groupId: string): boolean => {
    const mainTag = tagMap[mainTagId];
    if (!mainTag) return false;
    if (mainTag.groupId === groupId) return true;
    const groupShort = groupId.replace('GRP-', '');
    return mainTag.groupType === groupShort || mainTag.groupType === groupId;
  };

  // Tier 1 Main Categories with aggregated counts (including child subcategories)
  const mainCategoriesOverview = useMemo<MainCategoryOverviewItem[]>(() => {
    const mainTags = tags.filter((t) => t.tier === 1 || (!t.parentId && !t.tier));

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
          // Staging area clips do not count toward 5-footage-per-1-EP quota
          producibleEpisodes: isStaging ? 0 : Math.floor(usableInFamily.length / 5),
        };
      })
      .sort((a, b) => {
        if (isStagingTagId(a.mainTag.id)) return -1;
        if (isStagingTagId(b.mainTag.id)) return 1;
        return b.usableCount - a.usableCount;
      });
  }, [tags, computedFootage]);

  // Level 1: Category Groups (Clusters) with aggregated counts across their Main Categories & Subcategories
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

  // Determine currently active Main Category for Drill-Down (Level 2)
  const activeMainCategory = useMemo<MainCategoryOverviewItem | null>(() => {
    if (selectedTagFilter.length === 0) return null;
    const firstSelected = tagMap[selectedTagFilter[0]];
    if (!firstSelected) return null;
    const mainId = firstSelected.parentId || firstSelected.id;
    return mainCategoriesOverview.find((m) => m.mainTag.id === mainId) || null;
  }, [selectedTagFilter, tagMap, mainCategoriesOverview]);

  // Determine currently active Subcategory (Level 3) if a Tier 2 tag is selected
  const activeSubcategory = useMemo(() => {
    if (selectedTagFilter.length === 0) return null;
    const firstSelected = tagMap[selectedTagFilter[0]];
    if (!firstSelected || !firstSelected.parentId) return null;
    return firstSelected;
  }, [selectedTagFilter, tagMap]);

  // Sync selectedGroupId automatically if user clicked a tag from a FootageCard or external link
  useEffect(() => {
    if (activeMainCategory) {
      const matchingGroup = categoryGroups.find((g) =>
        doesMainTagBelongToGroup(activeMainCategory.mainTag.id, g.id)
      );
      if (matchingGroup && selectedGroupId !== matchingGroup.id) {
        setSelectedGroupId(matchingGroup.id);
      }
    }
  }, [activeMainCategory, categoryGroups]);

  // Active Group object (Level 1)
  const activeGroupOverview = useMemo<CategoryGroupOverviewItem | null>(() => {
    if (!selectedGroupId) return null;
    return categoryGroupsOverview.find((g) => g.group.id === selectedGroupId) || null;
  }, [selectedGroupId, categoryGroupsOverview]);

  // Contextual Scoped Footage (Syncs Top 4 KPI Status Cards with Selected Card Below)
  const categoryScopedFootage = useMemo(() => {
    // 0. If Staging Area is selected via Main Category or Group
    if (
      selectedTagFilter.some((tid) => isStagingTagId(tid)) ||
      isStagingGroupId(selectedGroupId)
    ) {
      return computedFootage.filter((ft) => isFootageInStaging(ft.tags));
    }

    // 1. If a Main Category or Subcategory is selected (Level 2 or Level 3)
    if (selectedTagFilter.length > 0) {
      const expandedAllowedTags = new Set<string>();
      selectedTagFilter.forEach((tid) => {
        expandedAllowedTags.add(tid);
        tags
          .filter((t) => t.parentId === tid)
          .forEach((child) => expandedAllowedTags.add(child.id));
      });
      return computedFootage.filter(
        (ft) =>
          !isFootageInStaging(ft.tags) &&
          ft.tags.some((tid) => expandedAllowedTags.has(tid))
      );
    }

    // 2. If a Category Group is selected (Level 1)
    if (activeGroupOverview) {
      return computedFootage.filter(
        (ft) =>
          !isFootageInStaging(ft.tags) &&
          ft.tags.some((tid) => activeGroupOverview.groupFamilyTagIds.has(tid))
      );
    }

    // 3. Default: All footage in the vault
    return computedFootage;
  }, [computedFootage, selectedTagFilter, selectedGroupId, tags, activeGroupOverview]);

  // Executive KPI Metrics (Dynamically reflects the selected Group / Main Category / Subcategory)
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
    if (activeSubcategory && activeMainCategory) {
      return {
        key: `SUB_${activeSubcategory.id}`,
        level: 'หมวดหมู่ย่อย (ชั้นที่ 3)',
        label: `${getEntityIcon(activeSubcategory)} ${activeSubcategory.name}`,
        trail: `${
          activeGroupOverview
            ? `${activeGroupOverview.group.icon} ${activeGroupOverview.group.name} ➔ `
            : ''
        }#${activeMainCategory.mainTag.name} ➔ ${activeSubcategory.name}`,
      };
    }
    if (activeMainCategory) {
      return {
        key: `MAIN_${activeMainCategory.mainTag.id}`,
        level: 'หมวดหมู่หลัก (ชั้นที่ 2)',
        label: `#${activeMainCategory.mainTag.name}`,
        trail: `${
          activeGroupOverview
            ? `${activeGroupOverview.group.icon} ${activeGroupOverview.group.name} ➔ `
            : ''
        }#${activeMainCategory.mainTag.name}`,
      };
    }
    if (activeGroupOverview) {
      return {
        key: `GRP_${activeGroupOverview.group.id}`,
        level: 'กลุ่มหมวดหมู่ (ชั้นที่ 1)',
        label: `${activeGroupOverview.group.icon} ${activeGroupOverview.group.name}`,
        trail: `${activeGroupOverview.group.icon} ${activeGroupOverview.group.name}`,
      };
    }
    return {
      key: 'ALL_VAULT',
      level: 'ทั้งคลังฟุตเทจ',
      label: 'ฟุตเทจทั้งหมดในคลัง',
      trail: 'รวมทุกกลุ่มและทุกหมวดหมู่',
    };
  }, [activeSubcategory, activeMainCategory, activeGroupOverview]);

  // Handlers for 3-Tier Progressive Selection
  const handleSelectGroup = (groupId: string) => {
    if (selectedGroupId === groupId && selectedTagFilter.length === 0) {
      setSelectedGroupId(null);
      setSelectedTagFilter([]);
    } else {
      setSelectedGroupId(groupId);
      setSelectedTagFilter([]);
    }
  };

  const handleSelectMainCategory = (mainTagId: string) => {
    if (
      activeMainCategory?.mainTag.id === mainTagId &&
      selectedTagFilter.length === 1 &&
      selectedTagFilter[0] === mainTagId
    ) {
      setSelectedTagFilter([]);
    } else {
      setSelectedTagFilter([mainTagId]);
    }
  };

  const handleSelectSubcategory = (subTagId: string, mainTagId: string) => {
    if (selectedTagFilter.includes(subTagId)) {
      setSelectedTagFilter([mainTagId]);
    } else {
      setSelectedTagFilter([subTagId]);
    }
  };

  const handleClearHierarchySelection = () => {
    setSelectedGroupId(null);
    setSelectedTagFilter([]);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagFilter((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [tagId]
    );
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

  // Precompute sets of category IDs for actionable readiness filters (excluding Staging Area)
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
  ]);

  const paginatedFootage = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedFootage.slice(start, start + pageSize);
  }, [filteredAndSortedFootage, currentPage, pageSize]);

  const hasHierarchySelection = Boolean(selectedGroupId || selectedTagFilter.length > 0);

  // Unique transition key so switching between e.g. "น้าค่อม" and "แน็ก ชาลี" triggers choreographed staggered spring transitions
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

  return {
    // Raw & Computed Data
    computedFootage,
    tags,
    tagMap,
    categoryMatrix,
    untaggedFootages,
    missingDriveFootages,
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
    isCategoryInventoryExpanded,
    setIsCategoryInventoryExpanded,
    selectedGroupId,
    selectedTagFilter,
    setSelectedTagFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,

    // Handlers & Modal Actions
    isStagingFilterActive,
    handleToggleStagingFilter,
    handleSelectGroup,
    handleSelectMainCategory,
    handleSelectSubcategory,
    handleClearHierarchySelection,
    handleToggleTag,
    handleResetFilters,
    setIsDirectFootageModalOpen,
    openSourceSplitterFor,
    setIsThreeTierManagerOpen,
    setIsStatusRuleModalOpen,
    setTraceabilityFootageId,
    launchEpisodeBuilderForCategory,
  };
};
