import { useCallback, useMemo, useState } from 'react';
import { isStagingGroupId, isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import {
  CategoryGroup,
  CategoryTag,
  CategoryTier,
  DEFAULT_TIER_SUBCATEGORIES,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
  TierSubCategoriesConfig,
} from '../../../types/tag.types';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import {
  BuilderScopeMatchMode,
  BuilderTagClickActionMode,
  GroupStockStat,
  LiveCategoryStock,
  TagLiveStockSummary,
  TierSubCategoryGroup,
} from './builder.types';

interface UseBuilderThreeTierScopeParams {
  categoryGroups: CategoryGroup[];
  categoryGroupMap: Record<string, CategoryGroup>;
  tags: CategoryTag[];
  tagMap: Record<string, CategoryTag>;
  categoryMatrix: CategoryMatrixStat[];
  computedFootage: ComputedFootage[];
  selectedFootageIds: string[];
  tierSubCategories?: TierSubCategoriesConfig;
  mainCategoryTagId: string;
  selectedGroupId: string;
}

export function useBuilderThreeTierScope({
  categoryGroups,
  categoryGroupMap,
  tags,
  tagMap,
  categoryMatrix,
  computedFootage,
  selectedFootageIds,
  tierSubCategories = DEFAULT_TIER_SUBCATEGORIES,
  mainCategoryTagId,
  selectedGroupId,
}: UseBuilderThreeTierScopeParams) {
  const [selectedFacetTagIds, setSelectedFacetTagIds] = useState<string[]>([]);
  const [scopeMatchMode, setScopeMatchMode] = useState<BuilderScopeMatchMode>('AND');
  const [step1SearchQuery, setStep1SearchQuery] = useState<string>('');
  const [tagClickMode, setTagClickMode] =
    useState<BuilderTagClickActionMode>('SET_PRIMARY');

  // Helper to resolve legacy Tier 0 Group ID for any tag
  const resolveTagGroupId = useCallback(
    (tag: CategoryTag | undefined | null): string => {
      if (!tag) return categoryGroups[0]?.id || 'GRP-PERSON';
      if (tag.groupId && categoryGroupMap[tag.groupId]) {
        return tag.groupId;
      }
      if (tag.parentId && tagMap[tag.parentId]) {
        const parent = tagMap[tag.parentId];
        if (parent.groupId && categoryGroupMap[parent.groupId]) {
          return parent.groupId;
        }
        const fallbackParentGrp = `GRP-${parent.groupType || 'GENERAL'}`;
        if (categoryGroupMap[fallbackParentGrp]) return fallbackParentGrp;
      }
      const fallbackGrp = `GRP-${tag.groupType || 'GENERAL'}`;
      if (categoryGroupMap[fallbackGrp]) return fallbackGrp;
      return categoryGroups[0]?.id || 'GRP-PERSON';
    },
    [categoryGroups, categoryGroupMap, tagMap]
  );

  // Real tags across all 3 Tiers (excluding Staging tag)
  const realTags = useMemo(
    () => tags.filter((t) => !isStagingTagId(t.id)),
    [tags]
  );

  // Live stock counts per individual tag across all 3 Tiers
  const tagStockMap = useMemo<Record<string, TagLiveStockSummary>>(() => {
    const map: Record<string, TagLiveStockSummary> = {};
    realTags.forEach((t) => {
      map[t.id] = {
        total: 0,
        usable: 0,
        newCount: 0,
        freshCount: 0,
        producibleEpisodes: 0,
      };
    });

    computedFootage.forEach((ft) => {
      const isNew = ft.cooldownStatus === 'NEW_UNTOUCHED';
      const isFresh = ft.cooldownStatus === 'READY_FRESH';
      const isUsable = isNew || isFresh;

      const uniqueTags = Array.from(new Set(ft.tags || []));
      uniqueTags.forEach((tid) => {
        if (isStagingTagId(tid)) return;
        if (!map[tid]) {
          map[tid] = {
            total: 0,
            usable: 0,
            newCount: 0,
            freshCount: 0,
            producibleEpisodes: 0,
          };
        }
        map[tid].total += 1;
        if (isUsable) map[tid].usable += 1;
        if (isNew) map[tid].newCount += 1;
        if (isFresh) map[tid].freshCount += 1;
      });
    });

    Object.keys(map).forEach((tid) => {
      map[tid].producibleEpisodes = Math.floor(map[tid].usable / 5);
    });

    return map;
  }, [realTags, computedFootage]);

  // Build sub-category groups for a specific Tier (1, 2, or 3)
  const buildTierGroups = useCallback(
    (tier: CategoryTier, configuredSubs: string[]): TierSubCategoryGroup[] => {
      const q = step1SearchQuery.trim().toLowerCase();
      const tierTags = realTags.filter((t) => {
        const normalizedTier: CategoryTier =
          t.tier === 2 || t.tier === 3 ? t.tier : 1;
        if (normalizedTier !== tier) return false;
        if (!q) return true;
        return (
          t.name.toLowerCase().includes(q) ||
          (t.subCategory || '').toLowerCase().includes(q)
        );
      });

      const subMap: Record<string, CategoryTag[]> = {};
      configuredSubs.forEach((sc) => {
        subMap[sc] = [];
      });

      tierTags.forEach((t) => {
        const sub = (t.subCategory || DEFAULT_UNCLASSIFIED_SUBCATEGORY).trim();
        if (!subMap[sub]) {
          subMap[sub] = [];
        }
        subMap[sub].push(t);
      });

      const allSubNames = Array.from(
        new Set([...configuredSubs, ...Object.keys(subMap)])
      );

      return allSubNames
        .map((subCategory) => ({
          subCategory,
          tags: (subMap[subCategory] || []).sort((a, b) => {
            const stockA = tagStockMap[a.id];
            const stockB = tagStockMap[b.id];
            const usableDiff = (stockB?.usable || 0) - (stockA?.usable || 0);
            if (usableDiff !== 0) return usableDiff;
            return (stockB?.total || 0) - (stockA?.total || 0);
          }),
        }))
        .filter((group) => !q || group.tags.length > 0);
    },
    [realTags, step1SearchQuery, tagStockMap]
  );

  const tier1Groups = useMemo(
    () => buildTierGroups(1, tierSubCategories.tier1),
    [buildTierGroups, tierSubCategories.tier1]
  );

  const tier2Groups = useMemo(
    () => buildTierGroups(2, tierSubCategories.tier2),
    [buildTierGroups, tierSubCategories.tier2]
  );

  const tier3Groups = useMemo(
    () => buildTierGroups(3, tierSubCategories.tier3),
    [buildTierGroups, tierSubCategories.tier3]
  );

  // Combined active scope tag IDs (Primary tag first + any additional facet tags)
  const activeScopeTagIds = useMemo(() => {
    const cleanFacets = selectedFacetTagIds.filter(
      (id) => Boolean(id) && id !== mainCategoryTagId && !isStagingTagId(id)
    );
    return mainCategoryTagId
      ? [mainCategoryTagId, ...cleanFacets]
      : cleanFacets;
  }, [mainCategoryTagId, selectedFacetTagIds]);

  // Footages matching the current 3-Tier Scope
  const scopedFootages = useMemo(() => {
    if (activeScopeTagIds.length === 0) return computedFootage;
    return computedFootage.filter((ft) => {
      if (scopeMatchMode === 'AND') {
        return activeScopeTagIds.every((tid) => ft.tags.includes(tid));
      }
      return activeScopeTagIds.some((tid) => ft.tags.includes(tid));
    });
  }, [computedFootage, activeScopeTagIds, scopeMatchMode]);

  // Live stock calculation for the active 3-Tier Scope
  const liveCategoryStock = useMemo<LiveCategoryStock>(() => {
    const selectedSet = new Set(selectedFootageIds);
    const usableInScope = scopedFootages.filter(
      (f) =>
        f.cooldownStatus === 'NEW_UNTOUCHED' || f.cooldownStatus === 'READY_FRESH'
    );
    const catNew = usableInScope.filter(
      (f) => f.cooldownStatus === 'NEW_UNTOUCHED'
    );
    const catFresh = usableInScope.filter(
      (f) => f.cooldownStatus === 'READY_FRESH'
    );

    const usedNew = catNew.filter((f) => selectedSet.has(f.id)).length;
    const usedFresh = catFresh.filter((f) => selectedSet.has(f.id)).length;

    return {
      totalNew: catNew.length,
      usedNew,
      remainingNew: Math.max(0, catNew.length - usedNew),
      totalFresh: catFresh.length,
      usedFresh,
      remainingFresh: Math.max(0, catFresh.length - usedFresh),
    };
  }, [scopedFootages, selectedFootageIds]);

  // Co-occurring Tier 2 & Tier 3 tags inside the current main category scope (for quick filtering & diversity checks)
  const currentSubcategories = useMemo<CategoryTag[]>(() => {
    const legacyChildren = realTags.filter(
      (t) => t.parentId === mainCategoryTagId
    );
    if (legacyChildren.length > 0) return legacyChildren;

    // In 3-Tier Independent system, collect Tier 2 & Tier 3 tags that co-occur on clips in the primary tag
    const coTagCounts: Record<string, number> = {};
    computedFootage.forEach((ft) => {
      if (!ft.tags.includes(mainCategoryTagId)) return;
      ft.tags.forEach((tid) => {
        if (tid === mainCategoryTagId || isStagingTagId(tid)) return;
        const t = tagMap[tid];
        if (t && (t.tier === 2 || t.tier === 3)) {
          coTagCounts[tid] = (coTagCounts[tid] || 0) + 1;
        }
      });
    });

    return Object.keys(coTagCounts)
      .map((tid) => tagMap[tid])
      .filter((t): t is CategoryTag => Boolean(t))
      .sort((a, b) => (coTagCounts[b.id] || 0) - (coTagCounts[a.id] || 0));
  }, [realTags, mainCategoryTagId, computedFootage, tagMap]);

  // Sort categories so those with >=5 ready clips come first (excluding Staging Area)
  const sortedCategories = useMemo(() => {
    const mainList = categoryMatrix.filter((c) => !isStagingTagId(c.tag.id));
    return [...mainList].sort((a, b) => {
      if (b.producibleEpisodesCount !== a.producibleEpisodesCount) {
        return b.producibleEpisodesCount - a.producibleEpisodesCount;
      }
      return b.usableCount - a.usableCount;
    });
  }, [categoryMatrix]);

  // Legacy Tier 0 Group Stock Stats (kept for CandidateFootagePool cross-category filter compatibility)
  const groupStockStats = useMemo<GroupStockStat[]>(() => {
    return categoryGroups
      .filter((group) => !isStagingGroupId(group.id))
      .map((group) => {
        const groupMainStats = sortedCategories.filter(
          (stat) => resolveTagGroupId(stat.tag) === group.id
        );
        const uniqueFootageIds = new Set<string>();
        const uniqueUsableIds = new Set<string>();
        const uniqueNewIds = new Set<string>();
        const uniqueReadyIds = new Set<string>();

        groupMainStats.forEach((stat) => {
          stat.allFootages.forEach((ft) => uniqueFootageIds.add(ft.id));
          stat.usableFootages.forEach((ft) => {
            uniqueUsableIds.add(ft.id);
            if (ft.cooldownStatus === 'NEW_UNTOUCHED') uniqueNewIds.add(ft.id);
            if (ft.cooldownStatus === 'READY_FRESH') uniqueReadyIds.add(ft.id);
          });
        });

        const usableCount = uniqueUsableIds.size;
        const producibleEpisodesCount = groupMainStats.reduce(
          (sum, s) => sum + s.producibleEpisodesCount,
          0
        );

        return {
          group,
          mainCategoriesCount: groupMainStats.length,
          subcategoriesCount: 0,
          totalCount: uniqueFootageIds.size,
          usableCount,
          newCount: uniqueNewIds.size,
          readyCount: uniqueReadyIds.size,
          producibleEpisodesCount,
        };
      });
  }, [categoryGroups, sortedCategories, resolveTagGroupId]);

  const categoriesInSelectedGroup = useMemo(() => {
    return sortedCategories.filter(
      (stat) => resolveTagGroupId(stat.tag) === selectedGroupId
    );
  }, [sortedCategories, selectedGroupId, resolveTagGroupId]);

  return {
    resolveTagGroupId,
    realTags,
    tagStockMap,
    tier1Groups,
    tier2Groups,
    tier3Groups,
    selectedFacetTagIds,
    setSelectedFacetTagIds,
    scopeMatchMode,
    setScopeMatchMode,
    step1SearchQuery,
    setStep1SearchQuery,
    tagClickMode,
    setTagClickMode,
    activeScopeTagIds,
    scopedFootages,
    liveCategoryStock,
    currentSubcategories,
    sortedCategories,
    groupStockStats,
    categoriesInSelectedGroup,
  };
}
