import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronDown,
  FolderOpen,
  Rocket,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_TIER_SUBCATEGORIES,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
  TierSubCategoriesConfig,
} from '../../../types/tag.types';
import { MixRecipeId } from '../../../utils/collisionDetector';
import { TagPill } from '../../ui/TagPill';
import { TagFilterMatchMode } from './useFootageVault';
import { VaultTierColumn, VaultTierSubCategoryGroup } from './VaultTierColumn';
import {
  CategoryGroupOverviewItem,
  MainCategoryOverviewItem,
} from './vault.types';

export interface VaultThreeTierExplorerProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  tags?: CategoryTag[];
  tierSubCategories?: TierSubCategoriesConfig;
  tagMatchMode?: TagFilterMatchMode;
  onChangeTagMatchMode?: (mode: TagFilterMatchMode) => void;
  categoryGroupsOverview: CategoryGroupOverviewItem[];
  mainCategoriesCount: number;
  selectedGroupId: string | null;
  selectedTagFilter: string[];
  activeGroupOverview: CategoryGroupOverviewItem | null;
  activeMainCategory: MainCategoryOverviewItem | null;
  computedFootage: ComputedFootage[];
  scopedFootageCount?: number;
  scopedUsableCount?: number;
  activeDragFootageIds: string[];
  onQuickAssignCategory: (footageIds: string[], targetTagId: string) => void;
  onSelectGroup: (groupId: string) => void;
  onSelectMainCategory: (mainTagId: string) => void;
  onSelectSubcategory: (subTagId: string, mainTagId: string) => void;
  onToggleFacetTag?: (tagId: string) => void;
  onClearMainCategoryFilter: () => void;
  onSelectAllInMainCategory: (mainTagId: string) => void;
  onOpenThreeTierManager: () => void;
  onLaunchEpisodeBuilder: (categoryId: string, formula: MixRecipeId) => void;
  onLaunchEpisodeFromCurrentFilter?: () => void;
}

export const VaultThreeTierExplorer: React.FC<VaultThreeTierExplorerProps> = ({
  isExpanded,
  onToggleExpand,
  tags = [],
  tierSubCategories = DEFAULT_TIER_SUBCATEGORIES,
  tagMatchMode = 'AND',
  onChangeTagMatchMode,
  selectedTagFilter,
  computedFootage,
  scopedFootageCount = 0,
  scopedUsableCount = 0,
  activeDragFootageIds,
  onQuickAssignCategory,
  onSelectMainCategory,
  onToggleFacetTag,
  onOpenThreeTierManager,
  onLaunchEpisodeBuilder,
  onLaunchEpisodeFromCurrentFilter,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [cascadeTier, setCascadeTier] = useState<CategoryTier | null>(null);
  const [expandedTierColumn, setExpandedTierColumn] =
    useState<CategoryTier | null>(null);
  const [collapsedSubKeys, setCollapsedSubKeys] = useState<
    Record<string, boolean>
  >(() => ({
    [`1__${DEFAULT_UNCLASSIFIED_SUBCATEGORY}`]: true,
  }));

  const realTags = useMemo(
    () => tags.filter((t) => !isStagingTagId(t.id)),
    [tags]
  );

  const tagMap = useMemo(() => {
    const map: Record<string, CategoryTag> = {};
    realTags.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [realTags]);

  const realSelectedTagIds = useMemo(
    () => selectedTagFilter.filter((tid) => Boolean(tid) && !isStagingTagId(tid)),
    [selectedTagFilter]
  );

  // Count how many clips carry each tag
  const clipCountByTagId = useMemo(() => {
    const counts: Record<string, { total: number; usable: number }> = {};
    computedFootage.forEach((ft) => {
      const isUsable =
        ft.cooldownStatus === 'NEW_UNTOUCHED' ||
        ft.cooldownStatus === 'READY_FRESH';
      ft.tags.forEach((tid) => {
        if (!counts[tid]) counts[tid] = { total: 0, usable: 0 };
        counts[tid].total += 1;
        if (isUsable) counts[tid].usable += 1;
      });
    });
    return counts;
  }, [computedFootage]);

  const extractDraggedFootageIds = (e: React.DragEvent): string[] => {
    try {
      const raw = e.dataTransfer.getData('application/x-footage-ids');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to activeDragFootageIds
    }
    return activeDragFootageIds;
  };

  const handleDragOverTag = (e: React.DragEvent, tagId: string) => {
    if (isStagingTagId(tagId)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTagId !== tagId) {
      setDragOverTagId(tagId);
    }
  };

  const handleDragLeaveTag = (e: React.DragEvent, tagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTagId === tagId) {
      setDragOverTagId(null);
    }
  };

  const handleDropOnTag = (e: React.DragEvent, targetTagId: string) => {
    if (isStagingTagId(targetTagId)) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverTagId(null);
    const ids = extractDraggedFootageIds(e);
    if (ids.length > 0) {
      onQuickAssignCategory(ids, targetTagId);
    }
  };

  const handleClickTag = (tagId: string) => {
    if (onToggleFacetTag) {
      onToggleFacetTag(tagId);
    } else {
      onSelectMainCategory(tagId);
    }
  };

  const buildTierGroups = (tier: CategoryTier, subList: string[]) => {
    const q = explorerSearch.trim().toLowerCase();
    const tierTags = realTags.filter((t) => {
      const tTier = t.tier === 2 || t.tier === 3 ? t.tier : 1;
      if (tTier !== tier) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.subCategory || '').toLowerCase().includes(q)
      );
    });

    const map: Record<string, CategoryTag[]> = {};
    subList.forEach((sc) => {
      map[sc] = [];
    });

    tierTags.forEach((t) => {
      const sub = (t.subCategory || DEFAULT_UNCLASSIFIED_SUBCATEGORY).trim();
      if (!map[sub]) {
        map[sub] = [];
      }
      map[sub].push(t);
    });

    const keys = Array.from(new Set([...subList, ...Object.keys(map)]));
    return keys
      .map((subCategory) => ({
        subCategory,
        tags: (map[subCategory] || []).sort((a, b) => {
          const countA = clipCountByTagId[a.id]?.total || 0;
          const countB = clipCountByTagId[b.id]?.total || 0;
          return countB - countA;
        }),
      }))
      .filter((g) => !q || g.tags.length > 0);
  };

  const tier1Groups = useMemo(
    () => buildTierGroups(1, tierSubCategories.tier1),
    [realTags, tierSubCategories.tier1, explorerSearch, clipCountByTagId]
  );
  const tier2Groups = useMemo(
    () => buildTierGroups(2, tierSubCategories.tier2),
    [realTags, tierSubCategories.tier2, explorerSearch, clipCountByTagId]
  );
  const tier3Groups = useMemo(
    () => buildTierGroups(3, tierSubCategories.tier3),
    [realTags, tierSubCategories.tier3, explorerSearch, clipCountByTagId]
  );

  const handleToggleTierSubs = (
    tier: CategoryTier,
    groups: VaultTierSubCategoryGroup[]
  ) => {
    const tierKeys = groups.map((g) => `${tier}__${g.subCategory}`);
    const allExpandedInTier =
      tierKeys.length > 0 && tierKeys.every((k) => !collapsedSubKeys[k]);

    setCascadeTier(!allExpandedInTier ? tier : null);

    setCollapsedSubKeys((prev) => {
      const next = { ...prev };
      tierKeys.forEach((k) => {
        next[k] = allExpandedInTier;
      });
      return next;
    });
  };

  const handleToggleSubCategory = (subKey: string) => {
    setCascadeTier(null);
    setCollapsedSubKeys((prev) => ({
      ...prev,
      [subKey]: !prev[subKey],
    }));
  };

  const handleToggleExpandColumn = (tier: CategoryTier) => {
    setExpandedTierColumn((prev) => (prev === tier ? null : tier));
  };

  const handleExpandAndOpenSubCategory = (
    tier: CategoryTier,
    subKey: string
  ) => {
    setCascadeTier(null);
    setExpandedTierColumn(tier);
    setCollapsedSubKeys((prev) => ({
      ...prev,
      [subKey]: false,
    }));
  };

  const isSearching = explorerSearch.trim().length > 0;
  const producibleEpisodesFromCombo = Math.floor(scopedUsableCount / 5);

  return (
    <div className="bg-[#FAF8F5] border border-[#E5DED4] rounded-2xl shadow-2xs overflow-hidden">
      {/* Compact Explorer Header */}
      <div
        onClick={onToggleExpand}
        className="px-4 py-3 bg-[#FAF7F2] hover:bg-[#F3ECE0] transition-colors cursor-pointer flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EEDBC0] text-[#523715] border border-[#DFC6A3] flex items-center justify-center shrink-0">
            <FolderOpen className="w-3.5 h-3.5 text-[#6E491C]" />
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-[#3D3326] truncate">
            <span className="md:hidden">ผสมแท็ก 3 ชั้น</span>
            <span className="hidden md:inline">
              สำรวจและผสมแท็ก 3 ชั้นอิสระ (3-Tier Tag Combiner)
            </span>
          </span>
          {realSelectedTagIds.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#3B6845] text-white text-[11px] font-mono font-bold tabular-nums shrink-0">
              {realSelectedTagIds.length}
            </span>
          )}
          <span className="hidden lg:inline text-xs font-mono text-[#786B5C] tabular-nums truncate">
            คลิกผสมแท็กข้ามคอลัมน์เพื่อค้นหาคลิปจัด 5 อันดับ
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenThreeTierManager();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#5C4426] bg-[#F2EBD9] hover:bg-[#EAE0CB] border border-[#DFD4BE] cursor-pointer transition-colors whitespace-nowrap"
            title="จัดการแท็ก 3 ชั้น"
          >
            <Settings className="w-3.5 h-3.5 text-[#7D5630] shrink-0" />
            <span className="hidden sm:inline">จัดการแท็ก 3 ชั้น</span>
            <span className="sm:hidden">จัดการแท็ก</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>{isExpanded ? 'ซ่อน' : 'เลือกแท็ก'}</span>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        </div>
      </div>

      {/* Active Multi-Tag Combination Strip (Visible even when collapsed if tags are selected) */}
      {realSelectedTagIds.length > 0 && (
        <div className="px-4 py-2.5 bg-[#EEF6F0] border-t border-[#CBE3CF] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-extrabold text-[#1F4828] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#2D623C]" />
              <span className="hidden sm:inline">ป้ายที่กำลังผสม ({realSelectedTagIds.length}):</span>
              <span className="sm:hidden font-mono font-bold">({realSelectedTagIds.length})</span>
            </span>

            {realSelectedTagIds.map((tid, idx) => {
              const t = tagMap[tid];
              if (!t) return null;
              return (
                <React.Fragment key={tid}>
                  {idx > 0 && (
                    <span className="text-[11px] font-mono font-extrabold text-[#2D623C] px-0.5">
                      {tagMatchMode === 'AND' ? '+' : 'หรือ'}
                    </span>
                  )}
                  <TagPill
                    tag={t}
                    showEntityIcon={true}
                    onRemove={() => handleClickTag(tid)}
                  />
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-[#1F4828] tabular-nums">
              <span className="hidden sm:inline">พบ {scopedFootageCount} คลิป · พร้อมใช้ {scopedUsableCount} คลิป</span>
              <span className="sm:hidden">{scopedFootageCount} คลิป · พร้อมใช้ {scopedUsableCount}</span>
              {producibleEpisodesFromCombo > 0
                ? ` · ${producibleEpisodesFromCombo} EP`
                : ''}
            </span>

            <button
              type="button"
              onClick={() => {
                if (onLaunchEpisodeFromCurrentFilter) {
                  onLaunchEpisodeFromCurrentFilter();
                } else if (realSelectedTagIds[0]) {
                  onLaunchEpisodeBuilder(
                    realSelectedTagIds[0],
                    'FORMULA_2_NEW_3_FRESH'
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#3B6845] hover:bg-[#2C5235] rounded-xl shadow-2xs whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Rocket className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">จัด 5 อันดับจากชุดนี้ →</span>
              <span className="sm:hidden">จัด 5 อันดับ</span>
            </button>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={
              prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { height: 'auto', opacity: 1 }
            }
            exit={
              prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.08 : 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#E5DED4] p-3.5 space-y-3 bg-[#FAF8F5]">
              {/* Quick Search inside 3-Tier Explorer */}
              <div className="relative max-w-md">
                <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={explorerSearch}
                  onChange={(e) => {
                    setCascadeTier(null);
                    setExplorerSearch(e.target.value);
                  }}
                  placeholder="ค้นหาแท็ก (เช่น พูดผิด, พี่แจ๊ส)..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#DED3C5] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#78593A]"
                />
                {explorerSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setCascadeTier(null);
                      setExplorerSearch('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
                    aria-label="ล้างคำค้นหาแท็ก"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 3 Parallel Columns (Tier 1 | Tier 2 | Tier 3) with Expand & Compact Rail */}
              <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                {(
                  [
                    { tier: 1 as CategoryTier, groups: tier1Groups },
                    { tier: 2 as CategoryTier, groups: tier2Groups },
                    { tier: 3 as CategoryTier, groups: tier3Groups },
                  ] as const
                ).map(({ tier, groups }) => (
                  <VaultTierColumn
                    key={`vault-tier-col-${tier}`}
                    tier={tier}
                    groups={groups}
                    collapsedSubKeys={collapsedSubKeys}
                    isCascadeActive={cascadeTier === tier && !isSearching}
                    isSearching={isSearching}
                    isExpandedColumn={expandedTierColumn === tier}
                    isCompactRail={
                      expandedTierColumn !== null && expandedTierColumn !== tier
                    }
                    selectedTagFilter={selectedTagFilter}
                    dragOverTagId={dragOverTagId}
                    clipCountByTagId={clipCountByTagId}
                    onToggleTierSubs={handleToggleTierSubs}
                    onToggleSubCategory={handleToggleSubCategory}
                    onExpandAndOpenSubCategory={handleExpandAndOpenSubCategory}
                    onToggleExpandColumn={handleToggleExpandColumn}
                    onClickTag={handleClickTag}
                    onDragOverTag={handleDragOverTag}
                    onDragLeaveTag={handleDragLeaveTag}
                    onDropOnTag={handleDropOnTag}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
