import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  ChevronDown,
  FolderOpen,
  Rocket,
  RotateCcw,
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
import { TIER_THEME_CONFIGS } from '../../tags/three-tier/IndependentTierColumn';
import { TagPill, getEntityIcon } from '../../ui/TagPill';
import { TagFilterMatchMode } from './useFootageVault';
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
  hasHierarchySelection: boolean;
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
  onClearHierarchySelection: () => void;
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
  hasHierarchySelection,
  computedFootage,
  scopedFootageCount = 0,
  scopedUsableCount = 0,
  activeDragFootageIds,
  onQuickAssignCategory,
  onSelectMainCategory,
  onToggleFacetTag,
  onClearHierarchySelection,
  onOpenThreeTierManager,
  onLaunchEpisodeBuilder,
  onLaunchEpisodeFromCurrentFilter,
}) => {
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null);
  const [explorerSearch, setExplorerSearch] = useState('');
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

  const producibleEpisodesFromCombo = Math.floor(scopedUsableCount / 5);

  const renderTierColumn = (
    tier: CategoryTier,
    groups: { subCategory: string; tags: CategoryTag[] }[]
  ) => {
    const theme = TIER_THEME_CONFIGS[tier];
    const totalInTier = groups.reduce((acc, g) => acc + g.tags.length, 0);

    return (
      <div
        key={`vault-tier-${tier}`}
        className="flex flex-col rounded-2xl border border-[#E5DED4] bg-white overflow-hidden shadow-2xs"
      >
        {/* Column Header */}
        <div
          className={`px-3 py-2 border-b ${theme.headerBorder} ${theme.headerBg} flex items-center justify-between gap-1.5 sm:gap-2`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold whitespace-nowrap shrink-0 ${theme.badgeBg} ${theme.badgeTextCls}`}
              >
                <span className="md:hidden">T{tier}</span>
                <span className="hidden md:inline">{theme.badgeText}</span>
              </span>
              <span className={`text-xs font-extrabold ${theme.accentText} truncate min-w-0`}>
                {theme.title}
              </span>
            </div>
            <p className="text-[10px] text-[#5C5042] truncate mt-0.5 hidden md:block">
              {theme.subtitle}
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 text-[#524538] border border-black/5 tabular-nums shrink-0">
            {totalInTier} แท็ก
          </span>
        </div>

        {/* Sub-category Frames inside Column */}
        <div className="p-2.5 space-y-2 max-h-72 overflow-y-auto scrollbar-thin bg-[#FAF8F5]">
          {groups.map(({ subCategory, tags: subTags }) => {
            const subKey = `${tier}__${subCategory}`;
            const isSearching = explorerSearch.trim().length > 0;
            const isCollapsed = !isSearching && Boolean(collapsedSubKeys[subKey]);
            const isUnclassified =
              subCategory === DEFAULT_UNCLASSIFIED_SUBCATEGORY;

            return (
              <div
                key={subKey}
                className={`rounded-xl border overflow-hidden ${
                  isUnclassified
                    ? 'bg-[#FFFDF8] border-[#E8D2AE]'
                    : 'bg-white border-[#E5DED4]'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedSubKeys((prev) => ({
                      ...prev,
                      [subKey]: !prev[subKey],
                    }))
                  }
                  className={`w-full px-2.5 py-1.5 border-b flex items-center justify-between gap-1.5 text-left cursor-pointer ${
                    isUnclassified
                      ? 'bg-[#FEF6E6] border-[#E8D2AE]'
                      : `${theme.subHeaderBg} ${theme.subHeaderBorder}`
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#524538] transition-transform shrink-0 ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                    <span className="text-[11px] font-extrabold text-[#3D332A] truncate">
                      {subCategory}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white text-[#6E5F52] border border-black/10 tabular-nums shrink-0">
                    {subTags.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="p-2">
                    {subTags.length === 0 ? (
                      <p className="text-[11px] text-[#8C7B6C] italic text-center py-1">
                        ยังไม่มีแท็กในหมวดนี้
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {subTags.map((tag) => {
                          const isSelected = selectedTagFilter.includes(tag.id);
                          const isDropHover = dragOverTagId === tag.id;
                          const counts = clipCountByTagId[tag.id] || {
                            total: 0,
                            usable: 0,
                          };

                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleClickTag(tag.id)}
                              onDragOver={(e) => handleDragOverTag(e, tag.id)}
                              onDragLeave={(e) => handleDragLeaveTag(e, tag.id)}
                              onDrop={(e) => handleDropOnTag(e, tag.id)}
                              className={`text-xs px-2.5 py-1 rounded-xl font-semibold inline-flex items-center gap-1 transition-all cursor-pointer ${
                                isDropHover
                                  ? 'bg-[#EDF6EF] border-2 border-[#549364] text-[#164121] scale-105'
                                  : isSelected
                                  ? 'bg-[#D5EBDA] text-[#144220] font-bold border border-[#AED7B7] shadow-2xs ring-1 ring-[#C5E6CD]'
                                  : 'bg-[#FAF8F5] text-[#4A3F31] border border-[#DFD7CA] hover:bg-[#EDF6F0] hover:border-[#C5DFCC]'
                              }`}
                              title={`#${tag.name} — พร้อมใช้ ${counts.usable} คลิป จากทั้งหมด ${counts.total} คลิป (คลิกเพื่อกรองผสม / ลากคลิปมาหย่อนเพื่อติดแท็ก)`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-[#1B572A] shrink-0" />
                              )}
                              <span className="text-xs shrink-0">
                                {getEntityIcon(tag)}
                              </span>
                              <span>#{tag.name}</span>
                              <span
                                className={`text-[10px] font-mono px-1 rounded tabular-nums ${
                                  isSelected
                                    ? 'bg-[#BFE0C8] text-[#144220]'
                                    : counts.usable >= 5
                                    ? 'bg-[#EAF5ED] text-[#245233]'
                                    : 'bg-[#EFECE6] text-[#786B5C]'
                                }`}
                              >
                                {counts.total}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
          {hasHierarchySelection && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearHierarchySelection();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#35593C] bg-[#EEF6F0] border border-[#CBE3CF] rounded-lg hover:bg-[#DFEFE3] cursor-pointer transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">ล้างตัวกรอง</span>
              <span className="sm:hidden">ล้าง</span>
            </button>
          )}

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

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#1F4828] bg-white px-2.5 py-1 rounded-xl border border-[#BFE0C8] tabular-nums">
              <span className="hidden sm:inline">พบ {scopedFootageCount} คลิป · พร้อมใช้ {scopedUsableCount} คลิป</span>
              <span className="sm:hidden">{scopedFootageCount} คลิป (พร้อมใช้ {scopedUsableCount})</span>
              {producibleEpisodesFromCombo > 0
                ? ` (${producibleEpisodesFromCombo} EP)`
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#E5DED4] p-3.5 space-y-3 bg-[#FAF8F5]">
              {/* Quick Search inside 3-Tier Explorer */}
              <div className="relative max-w-md">
                <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                  placeholder="ค้นหาแท็ก (เช่น พูดผิด, พี่แจ๊ส)..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#DED3C5] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#78593A]"
                />
                {explorerSearch && (
                  <button
                    type="button"
                    onClick={() => setExplorerSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 3 Parallel Columns (Tier 1 | Tier 2 | Tier 3) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {renderTierColumn(1, tier1Groups)}
                {renderTierColumn(2, tier2Groups)}
                {renderTierColumn(3, tier3Groups)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
