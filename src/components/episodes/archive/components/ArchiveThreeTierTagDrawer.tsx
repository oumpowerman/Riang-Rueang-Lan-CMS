import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChevronUp,
  Filter,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useCMS } from '../../../../context/CMSContext';
import { isStagingTagId } from '../../../../services/seedData';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_TIER_SUBCATEGORIES,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
} from '../../../../types/tag.types';
import { TagPill } from '../../../ui/TagPill';
import {
  ArchiveTierColumn,
  ArchiveTierSubCategoryGroup,
} from './ArchiveTierColumn';

interface ArchiveThreeTierTagDrawerProps {
  isExpanded: boolean;
  onClose: () => void;
  selectedFootageTagIds: string[];
  onToggleFootageTag: (tagId: string) => void;
  onClearFootageTags: () => void;
  footageTagMatchMode: 'AND' | 'OR';
  onChangeFootageTagMatchMode: (mode: 'AND' | 'OR') => void;
  tagEpisodeCounts: Record<string, number>;
  matchedEpisodesCount: number;
}

export const ArchiveThreeTierTagDrawer: React.FC<
  ArchiveThreeTierTagDrawerProps
> = ({
  isExpanded,
  onClose,
  selectedFootageTagIds,
  onToggleFootageTag,
  onClearFootageTags,
  footageTagMatchMode,
  onChangeFootageTagMatchMode,
  tagEpisodeCounts,
  matchedEpisodesCount,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { tags, tagMap, settings } = useCMS();
  const [tagSearch, setTagSearch] = useState('');
  const [cascadeTier, setCascadeTier] = useState<CategoryTier | null>(null);
  const [expandedTierColumn, setExpandedTierColumn] =
    useState<CategoryTier | null>(null);
  const [expandedSubKeys, setExpandedSubKeys] = useState<
    Record<string, boolean>
  >({});

  const tierSubCategories =
    settings.tierSubCategories || DEFAULT_TIER_SUBCATEGORIES;

  const realTags = useMemo(
    () => tags.filter((t) => !isStagingTagId(t.id)),
    [tags]
  );

  const buildTierGroups = (
    tier: CategoryTier,
    subList: string[]
  ): ArchiveTierSubCategoryGroup[] => {
    const q = tagSearch.trim().toLowerCase();
    const tierTags = realTags.filter((t) => {
      const tTier: CategoryTier = t.tier === 2 || t.tier === 3 ? t.tier : 1;
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
      if (!map[sub]) map[sub] = [];
      map[sub].push(t);
    });

    const keys = Array.from(new Set([...subList, ...Object.keys(map)]));
    return keys
      .map((subCategory) => ({
        subCategory,
        tags: (map[subCategory] || []).sort((a, b) => {
          const epA = tagEpisodeCounts[a.id] || 0;
          const epB = tagEpisodeCounts[b.id] || 0;
          if (epB !== epA) return epB - epA;
          return a.name.localeCompare(b.name, 'th');
        }),
      }))
      .filter((g) => !q || g.tags.length > 0);
  };

  const tier1Groups = useMemo(
    () => buildTierGroups(1, tierSubCategories.tier1),
    [realTags, tierSubCategories.tier1, tagSearch, tagEpisodeCounts]
  );
  const tier2Groups = useMemo(
    () => buildTierGroups(2, tierSubCategories.tier2),
    [realTags, tierSubCategories.tier2, tagSearch, tagEpisodeCounts]
  );
  const tier3Groups = useMemo(
    () => buildTierGroups(3, tierSubCategories.tier3),
    [realTags, tierSubCategories.tier3, tagSearch, tagEpisodeCounts]
  );

  const handleToggleTierSubs = (
    tier: CategoryTier,
    groups: ArchiveTierSubCategoryGroup[]
  ) => {
    const tierKeys = groups.map((g) => `${tier}__${g.subCategory}`);
    const allExpandedInTier =
      tierKeys.length > 0 && tierKeys.every((k) => Boolean(expandedSubKeys[k]));

    setCascadeTier(!allExpandedInTier ? tier : null);

    setExpandedSubKeys((prev) => {
      const next = { ...prev };
      tierKeys.forEach((k) => {
        next[k] = !allExpandedInTier;
      });
      return next;
    });
  };

  const handleToggleSubCategory = (subKey: string) => {
    setCascadeTier(null);
    setExpandedSubKeys((prev) => ({
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
    setExpandedSubKeys((prev) => ({
      ...prev,
      [subKey]: true,
    }));
  };

  const isSearching = tagSearch.trim().length > 0;
  const hasSelectedTags = selectedFootageTagIds.length > 0;
  const shouldRenderDrawerShell = isExpanded || hasSelectedTags;

  return (
    <AnimatePresence initial={false}>
      {shouldRenderDrawerShell && (
        <motion.div
          key="archive-three-tier-shell"
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { height: 0, opacity: 0, y: -8 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { height: 'auto', opacity: 1, y: 0 }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { height: 0, opacity: 0, y: -8 }
          }
          transition={{
            duration: prefersReducedMotion ? 0.08 : 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="overflow-hidden"
        >
          <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl shadow-2xs overflow-hidden">
            {/* Active Selected Footage Tags Strip */}
            <AnimatePresence initial={false}>
              {hasSelectedTags && (
                <motion.div
                  key="archive-selected-tags-strip"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { height: 0, opacity: 0 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { height: 'auto', opacity: 1 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { height: 0, opacity: 0 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0.08 : 0.18,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 py-2 bg-[#EEF6F0] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#1F4828] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#2D623C]" />
                        <span className="tabular-nums">
                          ({selectedFootageTagIds.length})
                        </span>
                      </span>

                      {selectedFootageTagIds.map((tid, idx) => {
                        const t = tagMap[tid];
                        if (!t) return null;
                        return (
                          <React.Fragment key={tid}>
                            {idx > 0 && (
                              <span className="text-[11px] font-mono font-extrabold text-[#2D623C] px-0.5">
                                {footageTagMatchMode === 'AND' ? '+' : 'หรือ'}
                              </span>
                            )}
                            <TagPill
                              tag={t}
                              showEntityIcon={true}
                              onRemove={() => onToggleFootageTag(tid)}
                            />
                          </React.Fragment>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-[#1F4828] tabular-nums">
                        พบ {matchedEpisodesCount} ตอน
                      </span>
                      <button
                        type="button"
                        onClick={onClearFootageTags}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-[#8E3B3B] bg-white border border-[#F5D0D0] rounded-lg hover:bg-[#FDF2F2] cursor-pointer transition-colors whitespace-nowrap"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>ล้าง</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expandable 3-Tier Tag Columns Body */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="archive-three-tier-body"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { height: 0, opacity: 0, y: -6 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { height: 'auto', opacity: 1, y: 0 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { height: 0, opacity: 0, y: -6 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0.08 : 0.24,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="overflow-hidden"
                >
                  <div
                    className={`p-3.5 space-y-3 bg-[#FAF8F5] ${
                      hasSelectedTags ? 'border-t border-[#E5DED4]' : ''
                    }`}
                  >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => {
                      setCascadeTier(null);
                      setTagSearch(e.target.value);
                    }}
                    placeholder="ค้นหาแท็ก 3 ชั้น..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#DED3C5] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#3B6845]"
                  />
                  {tagSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCascadeTier(null);
                        setTagSearch('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
                      aria-label="ล้างคำค้นหาแท็ก"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-white border border-[#DED3C5]">
                    <button
                      type="button"
                      onClick={() => onChangeFootageTagMatchMode('AND')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        footageTagMatchMode === 'AND'
                          ? 'bg-[#3B6845] text-white shadow-2xs'
                          : 'text-[#524538] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      <span>ครบทุกแท็ก (AND)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeFootageTagMatchMode('OR')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        footageTagMatchMode === 'OR'
                          ? 'bg-[#8A5A22] text-white shadow-2xs'
                          : 'text-[#524538] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>บางแท็ก (OR)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-white hover:bg-[#FAF6F0] text-[#4D4740] border border-[#E2D8C9] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>ซ่อน</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3 Parallel Columns with Smooth Flex Expand & Compact Rail */}
              <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                {(
                  [
                    { tier: 1 as CategoryTier, groups: tier1Groups },
                    { tier: 2 as CategoryTier, groups: tier2Groups },
                    { tier: 3 as CategoryTier, groups: tier3Groups },
                  ] as const
                ).map(({ tier, groups }) => (
                  <ArchiveTierColumn
                    key={`archive-tier-col-${tier}`}
                    tier={tier}
                    groups={groups}
                    expandedSubKeys={expandedSubKeys}
                    isCascadeActive={cascadeTier === tier && !isSearching}
                    isSearching={isSearching}
                    isExpandedColumn={expandedTierColumn === tier}
                    isCompactRail={
                      expandedTierColumn !== null && expandedTierColumn !== tier
                    }
                    selectedFootageTagIds={selectedFootageTagIds}
                    tagEpisodeCounts={tagEpisodeCounts}
                    onToggleTierSubs={handleToggleTierSubs}
                    onToggleSubCategory={handleToggleSubCategory}
                    onExpandAndOpenSubCategory={handleExpandAndOpenSubCategory}
                    onToggleExpandColumn={handleToggleExpandColumn}
                    onToggleFootageTag={onToggleFootageTag}
                  />
                ))}
              </div>
            </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
