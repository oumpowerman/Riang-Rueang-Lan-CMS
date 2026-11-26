import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CategoryTag, CategoryTier } from '../../../../types/tag.types';
import { TIER_THEME_CONFIGS } from '../../../tags/three-tier/IndependentTierColumn';
import { ArchiveTagSubCategoryAccordion } from './ArchiveTagSubCategoryAccordion';

export interface ArchiveTierSubCategoryGroup {
  subCategory: string;
  tags: CategoryTag[];
}

export interface ArchiveTierColumnProps {
  tier: CategoryTier;
  groups: ArchiveTierSubCategoryGroup[];
  expandedSubKeys: Record<string, boolean>;
  isCascadeActive: boolean;
  isSearching: boolean;
  isExpandedColumn: boolean;
  isCompactRail: boolean;
  selectedFootageTagIds: string[];
  tagEpisodeCounts: Record<string, number>;
  onToggleTierSubs: (
    tier: CategoryTier,
    groups: ArchiveTierSubCategoryGroup[]
  ) => void;
  onToggleSubCategory: (subKey: string) => void;
  onExpandAndOpenSubCategory: (tier: CategoryTier, subKey: string) => void;
  onToggleExpandColumn: (tier: CategoryTier) => void;
  onToggleFootageTag: (tagId: string) => void;
}

export const ArchiveTierColumn: React.FC<ArchiveTierColumnProps> = ({
  tier,
  groups,
  expandedSubKeys,
  isCascadeActive,
  isSearching,
  isExpandedColumn,
  isCompactRail,
  selectedFootageTagIds,
  tagEpisodeCounts,
  onToggleTierSubs,
  onToggleSubCategory,
  onExpandAndOpenSubCategory,
  onToggleExpandColumn,
  onToggleFootageTag,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const theme = TIER_THEME_CONFIGS[tier];
  const totalInTier = groups.reduce((acc, g) => acc + g.tags.length, 0);
  const tierKeys = groups.map((g) => `${tier}__${g.subCategory}`);
  const isTierAllExpanded =
    tierKeys.length > 0 && tierKeys.every((k) => Boolean(expandedSubKeys[k]));

  const columnFlexCls = isExpandedColumn
    ? 'w-full lg:flex-[3.2_1_0%] lg:min-w-0'
    : isCompactRail
    ? 'w-full lg:flex-[0.75_1_0%] lg:min-w-[172px]'
    : 'w-full lg:flex-[1_1_0%] lg:min-w-0';

  const flexTransitionCls = prefersReducedMotion
    ? ''
    : 'lg:transition-[flex-grow,min-width] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)]';

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white overflow-hidden shadow-2xs ${
        isExpandedColumn
          ? 'border-[#9FC09D] ring-1 ring-[#DCEADD]'
          : 'border-[#E5DED4]'
      } ${columnFlexCls} ${flexTransitionCls}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isCompactRail ? (
          <motion.div
            key={`archive-tier-rail-${tier}`}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.16,
              ease: 'easeOut',
            }}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Compact Rail Header */}
            <div
              className={`px-2.5 py-2 border-b ${theme.headerBorder} ${theme.headerBg} flex items-center justify-between gap-1.5`}
            >
              <div className="min-w-0 flex items-center gap-1.5 flex-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold whitespace-nowrap shrink-0 ${theme.badgeBg} ${theme.badgeTextCls}`}
                >
                  T{tier}
                </span>
                <span
                  className={`text-[11px] font-extrabold ${theme.accentText} truncate min-w-0`}
                >
                  {theme.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onToggleExpandColumn(tier)}
                className="inline-flex items-center gap-1 px-1.5 py-1 rounded-lg bg-white/90 hover:bg-white text-[#4A3F31] border border-black/10 transition-colors cursor-pointer shrink-0 text-[10px] font-bold"
                title={`ขยาย ${theme.badgeText}`}
              >
                <Maximize2 className="w-3 h-3 shrink-0" />
                <span className="lg:hidden">ขยาย</span>
              </button>
            </div>

            {/* Compact Rail Sub-category Shortcuts */}
            <div className="p-2 space-y-1.5 max-h-44 lg:max-h-72 overflow-y-auto scrollbar-thin bg-[#FAF8F5] flex-1">
              {groups.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-[#8C7B6C]">
                  ไม่พบแท็ก
                </div>
              ) : (
                groups.map(({ subCategory, tags: subTags }) => {
                  const subKey = `${tier}__${subCategory}`;
                  const selectedInSub = subTags.filter((t) =>
                    selectedFootageTagIds.includes(t.id)
                  ).length;

                  return (
                    <button
                      key={subKey}
                      type="button"
                      onClick={() => onExpandAndOpenSubCategory(tier, subKey)}
                      className={`w-full px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-1.5 ${
                        selectedInSub > 0
                          ? 'bg-[#EDF4ED] border-[#93B390] hover:bg-[#E2EFE2]'
                          : 'bg-white border-[#E5DED4] hover:border-[#C2B29F]'
                      }`}
                      title={`ขยาย ${theme.badgeText} และเปิด "${subCategory}"`}
                    >
                      <div className="min-w-0 flex items-center gap-1 flex-1">
                        {selectedInSub > 0 && (
                          <Check className="w-2.5 h-2.5 text-[#245233] shrink-0" />
                        )}
                        <span className="text-[11px] font-bold text-[#3D332A] truncate">
                          {subCategory}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#6E5F52] border border-black/5 tabular-nums shrink-0">
                        {subTags.length}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`archive-tier-full-${tier}`}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.18,
              ease: 'easeOut',
            }}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Full / Expanded Header */}
            <div
              className={`px-3 py-2 border-b ${theme.headerBorder} ${theme.headerBg} flex items-center justify-between gap-1.5`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold whitespace-nowrap shrink-0 ${theme.badgeBg} ${theme.badgeTextCls}`}
                >
                  <span className="md:hidden">T{tier}</span>
                  <span className="hidden md:inline">{theme.badgeText}</span>
                </span>
                <span
                  className={`text-xs font-extrabold ${theme.accentText} truncate min-w-0`}
                >
                  {theme.title}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {groups.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onToggleTierSubs(tier, groups)}
                    className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-lg bg-white/90 hover:bg-white text-[#4A3F31] border border-black/10 transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                    title={
                      isTierAllExpanded
                        ? `พับทั้งหมดใน ${theme.badgeText}`
                        : `กางทั้งหมดใน ${theme.badgeText}`
                    }
                  >
                    {isTierAllExpanded ? (
                      <>
                        <ChevronsDownUp className="w-3 h-3 shrink-0" />
                        <span className="hidden md:inline">พับ</span>
                      </>
                    ) : (
                      <>
                        <ChevronsUpDown className="w-3 h-3 shrink-0" />
                        <span className="hidden md:inline">กาง</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onToggleExpandColumn(tier)}
                  className={`hidden lg:inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-lg border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                    isExpandedColumn
                      ? 'bg-[#3D332A] text-white border-[#3D332A] hover:bg-[#2B231C]'
                      : 'bg-white/90 hover:bg-white text-[#4A3F31] border-black/10'
                  }`}
                  title={
                    isExpandedColumn
                      ? `ย่อ ${theme.badgeText}`
                      : `ขยาย ${theme.badgeText}`
                  }
                >
                  {isExpandedColumn ? (
                    <>
                      <Minimize2 className="w-3 h-3 shrink-0" />
                      <span>ย่อ</span>
                    </>
                  ) : (
                    <Maximize2 className="w-3 h-3 shrink-0" />
                  )}
                </button>

                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-lg bg-white/90 text-[#524538] border border-black/5 tabular-nums shrink-0 whitespace-nowrap">
                  {totalInTier}
                </span>
              </div>
            </div>

            {/* Sub-categories */}
            <div className="p-2.5 space-y-2 max-h-72 overflow-y-auto scrollbar-thin bg-[#FAF8F5] flex-1">
              {groups.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8C7B6C]">
                  ไม่พบแท็กในชั้นนี้
                </div>
              ) : (
                groups.map(({ subCategory, tags: subTags }, groupIdx) => {
                  const subKey = `${tier}__${subCategory}`;
                  const isCollapsed =
                    !isSearching && !Boolean(expandedSubKeys[subKey]);

                  return (
                    <ArchiveTagSubCategoryAccordion
                      key={subKey}
                      tier={tier}
                      theme={theme}
                      subCategory={subCategory}
                      subTags={subTags}
                      isCollapsed={isCollapsed}
                      cascadeIndex={groupIdx}
                      isCascadeActive={isCascadeActive}
                      selectedFootageTagIds={selectedFootageTagIds}
                      tagEpisodeCounts={tagEpisodeCounts}
                      onToggleSubCategory={onToggleSubCategory}
                      onToggleFootageTag={onToggleFootageTag}
                    />
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
