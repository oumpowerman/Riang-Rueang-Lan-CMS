import { isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag } from '../../../types/tag.types';
import {
  BuilderScopeMatchMode,
  PickerSortBy,
  PoolCoTagChip,
  PoolQuickFilter,
  PoolTabCounts,
} from './builder.types';

export function buildScopeSummaryLabel(
  mainCategoryTagId: string,
  selectedFacetTagIds: string[],
  scopeMatchMode: BuilderScopeMatchMode,
  tagMap: Record<string, CategoryTag>
): string {
  const primaryName = tagMap[mainCategoryTagId]?.name;
  const facetNames = selectedFacetTagIds
    .filter((id) => Boolean(id) && id !== mainCategoryTagId && Boolean(tagMap[id]))
    .map((id) => `#${tagMap[id].name}`);

  const parts: string[] = [];
  if (primaryName) {
    parts.push(`#${primaryName}`);
  }
  parts.push(...facetNames);

  if (parts.length === 0) return 'ทุกหมวด';
  const separator = scopeMatchMode === 'AND' ? ' + ' : ' หรือ ';
  return parts.join(separator);
}

interface ComputeBuilderPoolPipelineParams {
  computedFootage: ComputedFootage[];
  scopedFootages: ComputedFootage[];
  allowCrossCategory: boolean;
  poolFilterGroupId: string;
  poolCoTagFilterIds: string[];
  poolCoTagMatchMode: BuilderScopeMatchMode;
  poolQuickFilter: PoolQuickFilter;
  pickerSearch: string;
  pickerSortBy: PickerSortBy;
  selectedFootageIds: string[];
  activeScopeTagIds: string[];
  tagMap: Record<string, CategoryTag>;
  resolveTagGroupId: (tag: CategoryTag | undefined | null) => string;
}

export interface BuilderPoolPipelineResult {
  pickerCandidates: ComputedFootage[];
  poolTabCounts: PoolTabCounts;
  poolCoTagChips: PoolCoTagChip[];
  coTagAllCount: number;
}

function matchesQuickFilter(
  ft: ComputedFootage,
  quickFilter: PoolQuickFilter,
  selectedSet: Set<string>
): boolean {
  if (quickFilter === 'AVAILABLE_USABLE') {
    const isUsable =
      ft.cooldownStatus === 'NEW_UNTOUCHED' ||
      ft.cooldownStatus === 'READY_FRESH';
    return isUsable && !selectedSet.has(ft.id);
  }
  if (quickFilter === 'ONLY_NEW') {
    return ft.cooldownStatus === 'NEW_UNTOUCHED' && !selectedSet.has(ft.id);
  }
  if (quickFilter === 'ONLY_FRESH') {
    return ft.cooldownStatus === 'READY_FRESH' && !selectedSet.has(ft.id);
  }
  return true;
}

export function computeBuilderPoolPipeline({
  computedFootage,
  scopedFootages,
  allowCrossCategory,
  poolFilterGroupId,
  poolCoTagFilterIds,
  poolCoTagMatchMode,
  poolQuickFilter,
  pickerSearch,
  pickerSortBy,
  selectedFootageIds,
  activeScopeTagIds,
  tagMap,
  resolveTagGroupId,
}: ComputeBuilderPoolPipelineParams): BuilderPoolPipelineResult {
  const selectedSet = new Set(selectedFootageIds);
  const activeScopeTagSet = new Set(activeScopeTagIds);
  const cleanCoTagIds = Array.from(
    new Set(poolCoTagFilterIds.filter((id) => Boolean(id) && Boolean(tagMap[id])))
  );
  const selectedCoTagSet = new Set(cleanCoTagIds);

  // 1. Base Pool from Step 1 Scope OR Cross-Category Group
  let scopeBasePool = allowCrossCategory ? computedFootage : scopedFootages;

  if (allowCrossCategory && poolFilterGroupId !== 'ALL') {
    scopeBasePool = scopeBasePool.filter((ft) =>
      ft.tags.some((tid) => {
        const t = tagMap[tid];
        return t && resolveTagGroupId(t) === poolFilterGroupId;
      })
    );
  }

  // 2. Apply Search Query before co-tag & tab counts so all counters stay 100% consistent
  const q = pickerSearch.trim().toLowerCase();
  const searchFilteredPool = q
    ? scopeBasePool.filter(
        (ft) =>
          ft.id.toLowerCase().includes(q) ||
          ft.title.toLowerCase().includes(q) ||
          ft.mascotNotes.toLowerCase().includes(q)
      )
    : scopeBasePool;

  // Pre-co-tag total matching the active Quick Filter tab
  let coTagAllCount = 0;
  for (const ft of searchFilteredPool) {
    if (matchesQuickFilter(ft, poolQuickFilter, selectedSet)) {
      coTagAllCount += 1;
    }
  }

  // 3. Apply multi-select Co-Tag filter (AND or OR) to get the exact pool backing all 4 Quick Filter tabs
  const basePoolForTabs =
    cleanCoTagIds.length > 0
      ? searchFilteredPool.filter((ft) =>
          poolCoTagMatchMode === 'AND'
            ? cleanCoTagIds.every((tid) => ft.tags.includes(tid))
            : cleanCoTagIds.some((tid) => ft.tags.includes(tid))
        )
      : searchFilteredPool;

  // 4. Derive Co-occurring Tier 2/3 Quick Filter Chips
  // - In AND mode with active co-tags: count against basePoolForTabs (true faceted drill-down, zero dead clicks!)
  // - In OR mode or when no co-tags selected: count against searchFilteredPool so users can combine freely
  const chipCountSourcePool =
    poolCoTagMatchMode === 'AND' && cleanCoTagIds.length > 0
      ? basePoolForTabs
      : searchFilteredPool;

  const coTagStatsMap: Record<
    string,
    { count: number; usableInPool: number; totalInPool: number }
  > = {};

  for (const ft of chipCountSourcePool) {
    const isUsableUnselected =
      (ft.cooldownStatus === 'NEW_UNTOUCHED' ||
        ft.cooldownStatus === 'READY_FRESH') &&
      !selectedSet.has(ft.id);
    const passesCurrentQuickTab = matchesQuickFilter(
      ft,
      poolQuickFilter,
      selectedSet
    );

    const uniqueTags = Array.from(new Set(ft.tags || []));
    for (const tid of uniqueTags) {
      if (isStagingTagId(tid)) continue;
      if (!allowCrossCategory && activeScopeTagSet.has(tid)) continue;
      const t = tagMap[tid];
      if (!t || (t.tier !== 2 && t.tier !== 3)) continue;

      if (!coTagStatsMap[tid]) {
        coTagStatsMap[tid] = { count: 0, usableInPool: 0, totalInPool: 0 };
      }
      coTagStatsMap[tid].totalInPool += 1;
      if (isUsableUnselected) {
        coTagStatsMap[tid].usableInPool += 1;
      }
      if (passesCurrentQuickTab) {
        coTagStatsMap[tid].count += 1;
      }
    }
  }

  // Ensure every currently selected co-tag stays visible even if its count drops to 0
  for (const selectedId of cleanCoTagIds) {
    if (!coTagStatsMap[selectedId] && tagMap[selectedId]) {
      coTagStatsMap[selectedId] = {
        count: 0,
        usableInPool: 0,
        totalInPool: 0,
      };
    }
  }

  const poolCoTagChips: PoolCoTagChip[] = Object.entries(coTagStatsMap)
    .map(([tid, stats]) => ({
      tag: tagMap[tid],
      count: stats.count,
      usableInPool: stats.usableInPool,
      totalInPool: stats.totalInPool,
    }))
    .filter(
      (chip) =>
        Boolean(chip.tag) &&
        (chip.count > 0 || selectedCoTagSet.has(chip.tag.id))
    )
    .sort((a, b) => {
      const aSelected = selectedCoTagSet.has(a.tag.id) ? 1 : 0;
      const bSelected = selectedCoTagSet.has(b.tag.id) ? 1 : 0;
      if (bSelected !== aSelected) return bSelected - aSelected;
      if (b.count !== a.count) return b.count - a.count;
      if (b.usableInPool !== a.usableInPool) {
        return b.usableInPool - a.usableInPool;
      }
      return b.totalInPool - a.totalInPool;
    });

  // 5. Compute exact live counts for every Quick Filter tab
  let onlyNew = 0;
  let onlyFresh = 0;
  for (const ft of basePoolForTabs) {
    if (selectedSet.has(ft.id)) continue;
    if (ft.cooldownStatus === 'NEW_UNTOUCHED') onlyNew += 1;
    else if (ft.cooldownStatus === 'READY_FRESH') onlyFresh += 1;
  }

  const poolTabCounts: PoolTabCounts = {
    usable: onlyNew + onlyFresh,
    onlyNew,
    onlyFresh,
    all: basePoolForTabs.length,
  };

  // 6. Filter by active Quick Filter tab and sort
  const filteredCandidates = basePoolForTabs.filter((ft) =>
    matchesQuickFilter(ft, poolQuickFilter, selectedSet)
  );

  const pickerCandidates = [...filteredCandidates].sort((a, b) => {
    if (pickerSortBy === 'REST_DAYS_DESC') {
      const daysA = a.daysSinceLastUsed === null ? 9999 : a.daysSinceLastUsed;
      const daysB = b.daysSinceLastUsed === null ? 9999 : b.daysSinceLastUsed;
      if (daysB !== daysA) return daysB - daysA;
      return a.usageLast90Days - b.usageLast90Days;
    }
    if (a.usageLast90Days !== b.usageLast90Days) {
      return a.usageLast90Days - b.usageLast90Days;
    }
    return a.totalUsageCount - b.totalUsageCount;
  });

  return {
    pickerCandidates,
    poolTabCounts,
    poolCoTagChips,
    coTagAllCount,
  };
}
