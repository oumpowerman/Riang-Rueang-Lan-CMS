import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Filter,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Wand2,
  X,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
} from '../../../types/tag.types';
import { TIER_THEME_CONFIGS } from '../../tags/three-tier/IndependentTierColumn';
import { getEntityIcon } from '../../ui/TagPill';
import {
  BuilderScopeMatchMode,
  BuilderTagClickActionMode,
  LiveCategoryStock,
  TagLiveStockSummary,
  TierSubCategoryGroup,
} from './builder.types';

interface BuilderStep1CategoryTargetProps {
  isOpen: boolean;
  onToggle: () => void;
  onNextStep: () => void;
  onAutoFillAndNextStep?: () => void;
  mainCategoryTagId: string;
  activeCategoryStat: CategoryMatrixStat | null;
  liveCategoryStock: LiveCategoryStock;
  tagMap: Record<string, CategoryTag>;
  tagStockMap: Record<string, TagLiveStockSummary>;
  tier1Groups: TierSubCategoryGroup[];
  tier2Groups: TierSubCategoryGroup[];
  tier3Groups: TierSubCategoryGroup[];
  selectedFacetTagIds: string[];
  scopeMatchMode: BuilderScopeMatchMode;
  onChangeScopeMatchMode: (mode: BuilderScopeMatchMode) => void;
  step1SearchQuery: string;
  onChangeStep1SearchQuery: (q: string) => void;
  tagClickMode: BuilderTagClickActionMode;
  onChangeTagClickMode: (mode: BuilderTagClickActionMode) => void;
  onSelectCategory: (tagId: string, autoFillWithRecipe?: boolean) => void;
  onToggleFacetTag: (tagId: string) => void;
  onClearFacetTags: () => void;
  onOpenThreeTierManager: () => void;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const BuilderStep1CategoryTarget: React.FC<
  BuilderStep1CategoryTargetProps
> = ({
  isOpen,
  onToggle,
  onNextStep,
  onAutoFillAndNextStep,
  mainCategoryTagId,
  activeCategoryStat,
  liveCategoryStock,
  tagMap,
  tagStockMap,
  tier1Groups,
  tier2Groups,
  tier3Groups,
  selectedFacetTagIds,
  scopeMatchMode,
  onChangeScopeMatchMode,
  step1SearchQuery,
  onChangeStep1SearchQuery,
  tagClickMode,
  onChangeTagClickMode,
  onSelectCategory,
  onToggleFacetTag,
  onClearFacetTags,
  onOpenThreeTierManager,
}) => {
  // Default: ALL sub-category frames across Tier 1, Tier 2, Tier 3 start collapsed ({})
  const [expandedSubKeys, setExpandedSubKeys] = useState<
    Record<string, boolean>
  >({});
  const [isAdvancedModeOpen, setIsAdvancedModeOpen] = useState(false);

  const handleToggleTierSubs = (
    tier: CategoryTier,
    groups: TierSubCategoryGroup[]
  ) => {
    const tierKeys = groups.map((g) => `${tier}__${g.subCategory}`);
    const allExpandedInTier =
      tierKeys.length > 0 && tierKeys.every((k) => Boolean(expandedSubKeys[k]));

    setExpandedSubKeys((prev) => {
      const next = { ...prev };
      tierKeys.forEach((k) => {
        next[k] = !allExpandedInTier;
      });
      return next;
    });
  };

  const primaryTag = tagMap[mainCategoryTagId] || activeCategoryStat?.tag || null;
  const primaryTier: CategoryTier =
    primaryTag?.tier === 2 || primaryTag?.tier === 3 ? primaryTag.tier : 1;
  const primaryTierTheme = TIER_THEME_CONFIGS[primaryTier];

  const totalScopeUsable =
    liveCategoryStock.totalNew + liveCategoryStock.totalFresh;
  const producibleScopeEpisodes = Math.floor(totalScopeUsable / 5);

  const handleTagClick = (tagId: string) => {
    if (tagClickMode === 'TOGGLE_FACET') {
      if (tagId === mainCategoryTagId) return;
      onToggleFacetTag(tagId);
    } else {
      onSelectCategory(tagId, false);
    }
  };

  const renderTierColumn = (
    tier: CategoryTier,
    groups: TierSubCategoryGroup[]
  ) => {
    const theme = TIER_THEME_CONFIGS[tier];
    const totalInTier = groups.reduce((acc, g) => acc + g.tags.length, 0);
    const tierKeys = groups.map((g) => `${tier}__${g.subCategory}`);
    const isTierAllExpanded =
      tierKeys.length > 0 && tierKeys.every((k) => Boolean(expandedSubKeys[k]));

    return (
      <div
        key={`builder-step1-tier-${tier}`}
        className="flex flex-col rounded-2xl border border-[#E5DED4] bg-white overflow-hidden shadow-2xs"
      >
        {/* Tier Column Header */}
        <div
          className={`px-3 sm:px-3.5 py-2 sm:py-2.5 border-b ${theme.headerBorder} ${theme.headerBg} flex items-center justify-between gap-1.5 sm:gap-2`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
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
            <p className="hidden md:block text-[10px] text-[#5C5042] truncate mt-0.5">
              {theme.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {groups.length > 0 && (
              <button
                type="button"
                onClick={() => handleToggleTierSubs(tier, groups)}
                className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-lg bg-white/90 hover:bg-white text-[#4A3F31] border border-black/10 transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0"
                title={
                  isTierAllExpanded
                    ? `พับหมวดย่อยทั้งหมดใน ${theme.badgeText}`
                    : `กางหมวดย่อยทั้งหมดใน ${theme.badgeText}`
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
            <span className="text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-lg bg-white/90 text-[#524538] border border-black/5 tabular-nums shrink-0">
              {totalInTier}
            </span>
          </div>
        </div>

        {/* Collapsible Sub-Category Frames (All Collapsed by Default) */}
        <div className="p-2.5 space-y-2 max-h-80 overflow-y-auto scrollbar-thin bg-[#FAF8F5]">
          {groups.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#8C7B6C]">
              ไม่พบแท็กในชั้นนี้ตามคำค้นหา
            </div>
          ) : (
            groups.map(({ subCategory, tags: subTags }) => {
              const subKey = `${tier}__${subCategory}`;
              const isSearching = step1SearchQuery.trim().length > 0;
              const isCollapsed =
                !isSearching && !Boolean(expandedSubKeys[subKey]);
              const isUnclassified =
                subCategory === DEFAULT_UNCLASSIFIED_SUBCATEGORY;

              const hasPrimaryInSub = subTags.some(
                (t) => t.id === mainCategoryTagId
              );
              const facetCountInSub = subTags.filter((t) =>
                selectedFacetTagIds.includes(t.id)
              ).length;

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
                      setExpandedSubKeys((prev) => ({
                        ...prev,
                        [subKey]: !prev[subKey],
                      }))
                    }
                    className={`w-full px-2.5 py-1.5 border-b flex items-center justify-between gap-1.5 text-left cursor-pointer transition-colors ${
                      isCollapsed ? 'border-b-transparent' : ''
                    } ${
                      isUnclassified
                        ? 'bg-[#FEF6E6] border-[#E8D2AE] hover:bg-[#FCEFD6]'
                        : `${theme.subHeaderBg} ${theme.subHeaderBorder} hover:brightness-98`
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#524538] transition-transform shrink-0 ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                      <span className="text-[11px] font-extrabold text-[#3D332A] truncate">
                        {subCategory}
                      </span>

                      {/* Active selection indicators when sub-category is collapsed */}
                      {hasPrimaryInSub && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#3B6845] text-white text-[9px] font-extrabold shrink-0">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>แกนหลัก</span>
                        </span>
                      )}
                      {facetCountInSub > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#8A5A22] text-white text-[9px] font-extrabold shrink-0">
                          <Check className="w-2.5 h-2.5" />
                          <span>ผสม {facetCountInSub}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white text-[#6E5F52] border border-black/10 tabular-nums shrink-0">
                      {subTags.length}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="p-2">
                      {subTags.length === 0 ? (
                        <p className="text-[11px] text-[#8C7B6C] italic text-center py-1.5">
                          ยังไม่มีแท็กในหมวดย่อยนี้
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {subTags.map((tag) => {
                            const isPrimary = tag.id === mainCategoryTagId;
                            const isFacet = selectedFacetTagIds.includes(tag.id);
                            const stock = tagStockMap[tag.id] || {
                              total: 0,
                              usable: 0,
                              newCount: 0,
                              freshCount: 0,
                              producibleEpisodes: 0,
                            };

                            return (
                              <div
                                key={tag.id}
                                className={`group inline-flex items-stretch rounded-xl border transition-all overflow-hidden ${
                                  isPrimary
                                    ? 'bg-[#EDF4ED] border-[#3B6845] ring-2 ring-[#A4C5A1]/60 shadow-2xs'
                                    : isFacet
                                    ? 'bg-[#FDF5E8] border-[#C99749] ring-1 ring-[#E8CFA6] shadow-2xs'
                                    : 'bg-[#FAF8F5] border-[#DFD7CA] hover:bg-white hover:border-[#BAD8B9]'
                                }`}
                              >
                                {/* Main Tag Click Button */}
                                <button
                                  type="button"
                                  onClick={() => handleTagClick(tag.id)}
                                  className="px-2.5 py-1.5 text-left flex items-center gap-1.5 cursor-pointer min-w-0"
                                  title={`#${tag.name} — ใหม่ ${stock.newCount} | พร้อมใช้ ${stock.usable}/${stock.total} ฟุต (${stock.producibleEpisodes} EP)`}
                                >
                                  {isPrimary ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#3B6845] text-white text-[9px] font-extrabold shrink-0">
                                      <Star className="w-2.5 h-2.5 fill-current" />
                                      <span>หลัก</span>
                                    </span>
                                  ) : isFacet ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#8A5A22] text-white text-[9px] font-extrabold shrink-0">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>ผสม</span>
                                    </span>
                                  ) : (
                                    <span className="text-xs shrink-0">
                                      {getEntityIcon(tag)}
                                    </span>
                                  )}

                                  <span
                                    className={`text-xs truncate max-w-[130px] ${
                                      isPrimary
                                        ? 'font-extrabold text-[#1E4628]'
                                        : isFacet
                                        ? 'font-extrabold text-[#6B4415]'
                                        : 'font-semibold text-[#3D332A]'
                                    }`}
                                  >
                                    #{tag.name}
                                  </span>

                                  <span
                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums shrink-0 ${
                                      isPrimary
                                        ? 'bg-[#3B6845]/15 text-[#1E4628] font-bold'
                                        : isFacet
                                        ? 'bg-[#8A5A22]/15 text-[#6B4415] font-bold'
                                        : stock.usable >= 5
                                        ? 'bg-[#EAF5ED] text-[#245233] font-bold'
                                        : 'bg-[#EFECE6] text-[#786B5C]'
                                    }`}
                                  >
                                    {stock.usable > 0
                                      ? `${stock.usable}`
                                      : `${stock.total}`}
                                  </span>
                                </button>

                                {/* Quick Secondary Action Button (+Facet or ★Primary) */}
                                {!isPrimary && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (tagClickMode === 'SET_PRIMARY') {
                                        onToggleFacetTag(tag.id);
                                      } else {
                                        onSelectCategory(tag.id, false);
                                      }
                                    }}
                                    className={`px-1.5 border-l flex items-center justify-center transition-colors cursor-pointer ${
                                      isFacet
                                        ? 'border-[#E2C699] bg-[#F8E9CE] text-[#6B4415] hover:bg-[#F2DCB3]'
                                        : 'border-[#EAE2D6] bg-[#F4F0E8] text-[#6E5F52] hover:bg-[#E5EFE6] hover:text-[#244B2F]'
                                    }`}
                                    title={
                                      tagClickMode === 'SET_PRIMARY'
                                        ? isFacet
                                          ? 'เอาออกจากป้ายที่ผสม'
                                          : 'กด + เพื่อผสมแท็กนี้เพิ่ม (Cross-Tier Filter)'
                                        : 'ตั้งป้ายนี้เป็นแกนหลักของตอน (Primary Series)'
                                    }
                                  >
                                    {tagClickMode === 'SET_PRIMARY' ? (
                                      isFacet ? (
                                        <X className="w-3 h-3" />
                                      ) : (
                                        <Plus className="w-3 h-3" />
                                      )
                                    ) : (
                                      <Star className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.section
      layout="position"
      transition={{ duration: 0.28, ease: SLIDE_EASE }}
      className={`rounded-2xl border p-3.5 sm:p-4 transition-colors duration-200 ${
        isOpen
          ? 'border-[#bad8b9] bg-[#f9fbf8]'
          : 'border-[#e8dfd3] bg-[#fdfbf7] shadow-xs hover:border-[#bad8b9]'
      }`}
    >
      {/* Persistent Accordion Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div
          onClick={!isOpen ? onToggle : undefined}
          className={`flex flex-wrap items-center gap-2 text-xs ${
            !isOpen ? 'cursor-pointer' : ''
          }`}
        >
          <span
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              isOpen
                ? 'bg-[#3b6845] text-white'
                : 'bg-[#edf4ed] text-[#2b5435]'
            }`}
          >
            ขั้นที่ 1
          </span>

          {isOpen ? (
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-[#2d2926]">
                เลือกหมวดและแท็ก 3 ชั้น
              </h2>
              <span className="text-[11px] text-[#787066] hidden lg:inline">
                คลิกเลือกแกนหลัก หรือกด + ผสมแท็กข้ามชั้น
              </span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-1.5"
            >
              {primaryTag && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold ${primaryTierTheme.badgeBg} ${primaryTierTheme.badgeTextCls}`}
                >
                  {primaryTierTheme.badgeText}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#edf4ed] text-[#2b5435] border border-[#cfdece] font-bold text-xs">
                <Star className="w-3 h-3 fill-current text-[#3b6845]" />
                <span>#{primaryTag?.name || 'เลือกแท็กหลัก'}</span>
              </span>

              {selectedFacetTagIds.map((fid) => {
                const fTag = tagMap[fid];
                if (!fTag) return null;
                return (
                  <React.Fragment key={fid}>
                    <span className="text-[#8a5a22] font-mono font-bold text-[11px]">
                      {scopeMatchMode === 'AND' ? '+' : 'หรือ'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#fdf5e8] text-[#6b4415] border border-[#e8cfa6] font-bold text-xs">
                      <span>#{fTag.name}</span>
                    </span>
                  </React.Fragment>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Header Right: Live Stock Count Badge + 3-Tier Studio Modal Button */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          <div
            className={`rounded-xl px-2.5 py-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono tabular-nums ${
              isOpen
                ? 'bg-white border border-[#e2d8cb] shadow-2xs'
                : 'text-[11px] text-[#716960]'
            }`}
          >
            <span
              className={`inline-flex items-center gap-1 ${
                isOpen ? 'text-[#855621] font-bold' : ''
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#b37731]" />
              <span>ใหม่ {liveCategoryStock.remainingNew}</span>
            </span>
            <span className="text-[#d5cbc0]">·</span>
            <span
              className={`inline-flex items-center gap-1 ${
                isOpen ? 'text-[#2b5435] font-bold' : ''
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-[#3d6e49]" />
              <span>สด {liveCategoryStock.remainingFresh}</span>
            </span>
            {isOpen && (
              <>
                <span className="text-[#d5cbc0]">·</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[11px] font-extrabold ${
                    producibleScopeEpisodes > 0
                      ? 'bg-[#edf4ed] text-[#244b2f] border border-[#bad8b9]'
                      : 'bg-[#f4eee4] text-[#787066]'
                  }`}
                >
                  {producibleScopeEpisodes} EP
                </span>
              </>
            )}
          </div>

          {isOpen ? (
            <button
              type="button"
              onClick={onOpenThreeTierManager}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#f2ebd9] hover:bg-[#eae0cb] text-[#5c4426] border border-[#dfd4be] font-bold transition-colors cursor-pointer whitespace-nowrap"
              title="เปิดสตูดิโอระบบแท็ก 3 ชั้นอิสระ & ตั้งค่าเกณฑ์สีพักฟุต"
            >
              <Settings className="w-3.5 h-3.5 text-[#7d5630]" />
              <span className="sm:hidden">จัดการแท็ก</span>
              <span className="hidden sm:inline">จัดการแท็ก 3 ชั้น</span>
            </button>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onToggle}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f4eee4] hover:bg-[#eae1d4] text-[#4d4740] font-bold transition-colors cursor-pointer"
            >
              <span>เปลี่ยนหมวด</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Animated Slide Up / Down Accordion Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="step1-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: SLIDE_EASE }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="pt-3.5 space-y-3"
            >
              {/* Active Scope Summary & Interactive Mode Controls Bar */}
              <div className="bg-[#fdfbf7] border border-[#e5ded4] rounded-2xl p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Left: Active Primary Tag + Combined Facet Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="text-xs font-extrabold text-[#3d332a] flex items-center gap-1 mr-0.5">
                      <Target className="w-3.5 h-3.5 text-[#3b6845]" />
                      <span>เป้าหมาย:</span>
                    </span>

                    {primaryTag && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#edf4ed] border border-[#93b390] text-[#1e4628] text-xs font-extrabold shadow-2xs">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold ${primaryTierTheme.badgeBg} ${primaryTierTheme.badgeTextCls}`}
                        >
                          {primaryTierTheme.badgeText}
                        </span>
                        <Star className="w-3 h-3 fill-current text-[#3b6845]" />
                        <span>#{primaryTag.name}</span>
                      </div>
                    )}

                    {selectedFacetTagIds.map((fid) => {
                      const fTag = tagMap[fid];
                      if (!fTag) return null;
                      const fTier: CategoryTier =
                        fTag.tier === 2 || fTag.tier === 3 ? fTag.tier : 1;
                      const fTheme = TIER_THEME_CONFIGS[fTier];
                      return (
                        <React.Fragment key={fid}>
                          <span className="text-xs font-mono font-extrabold text-[#8a5a22] px-0.5">
                            {scopeMatchMode === 'AND' ? '+' : 'หรือ'}
                          </span>
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#fdf5e8] border border-[#dfc192] text-[#6b4415] text-xs font-bold">
                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-mono font-extrabold ${fTheme.badgeBg} ${fTheme.badgeTextCls}`}
                            >
                              T{fTier}
                            </span>
                            <span>#{fTag.name}</span>
                            <button
                              type="button"
                              onClick={() => onSelectCategory(fid, false)}
                              className="ml-0.5 p-0.5 rounded hover:bg-[#e8d4b4] text-[#7c531d] cursor-pointer"
                              title="สลับป้ายนี้ขึ้นเป็นแกนหลักของตอน (Primary Series)"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleFacetTag(fid)}
                              className="p-0.5 rounded hover:bg-[#e8d4b4] text-[#8e4537] cursor-pointer"
                              title="นำป้ายเสริมนี้ออก"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </React.Fragment>
                      );
                    })}

                    {selectedFacetTagIds.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearFacetTags}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-[#8e4537] bg-[#fdf3ec] hover:bg-[#f9e3d4] border border-[#f5d7cf] cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>ล้าง ({selectedFacetTagIds.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Collapsible Advanced Mixing Mode Button */}
                  <button
                    type="button"
                    onClick={() => setIsAdvancedModeOpen((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer shrink-0 ${
                      isAdvancedModeOpen ||
                      tagClickMode !== 'SET_PRIMARY' ||
                      scopeMatchMode !== 'AND'
                        ? 'bg-[#edf4ed] text-[#244b2f] border-[#bad8b9]'
                        : 'bg-white text-[#524538] border-[#ded3c5] hover:bg-[#faf7f2]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3 text-[#3b6845]" />
                    <span>ตั้งค่าการผสม</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        isAdvancedModeOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Collapsible Click Behavior Mode + AND/OR Match Mode */}
                <AnimatePresence initial={false}>
                  {isAdvancedModeOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#eee6da]">
                        {/* Click Behavior Mode */}
                        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#f3ede3] border border-[#e2d8cb]">
                          <button
                            type="button"
                            onClick={() => onChangeTagClickMode('SET_PRIMARY')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                              tagClickMode === 'SET_PRIMARY'
                                ? 'bg-white text-[#244b2f] shadow-2xs'
                                : 'text-[#6b645b] hover:text-[#2d2926]'
                            }`}
                            title="คลิกที่ป้ายแท็กเพื่อเปลี่ยนเป็นแกนหลักของตอน"
                          >
                            <Star className="w-3 h-3 text-[#3b6845]" />
                            <span>คลิก = เลือกแกนหลัก</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onChangeTagClickMode('TOGGLE_FACET')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                              tagClickMode === 'TOGGLE_FACET'
                                ? 'bg-[#fdf5e8] text-[#6b4415] border border-[#e8cfa6] shadow-2xs'
                                : 'text-[#6b645b] hover:text-[#2d2926]'
                            }`}
                            title="คลิกที่ป้ายแท็กเพื่อผสมป้ายเสริมข้ามชั้น (+Facet)"
                          >
                            <Plus className="w-3 h-3 text-[#8a5a22]" />
                            <span>คลิก = ผสมแท็กข้ามชั้น</span>
                          </button>
                        </div>

                        {/* AND / OR Toggle when combining tags */}
                        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-[#ded3c5]">
                          <button
                            type="button"
                            onClick={() => onChangeScopeMatchMode('AND')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                              scopeMatchMode === 'AND'
                                ? 'bg-[#3b6845] text-white shadow-2xs'
                                : 'text-[#524538] hover:bg-[#faf7f2]'
                            }`}
                            title="คัดเฉพาะฟุตเทจที่มีครบทุกแท็กที่เลือก"
                          >
                            <Filter className="w-3 h-3" />
                            <span>ครบทุกแท็ก (AND)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onChangeScopeMatchMode('OR')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                              scopeMatchMode === 'OR'
                                ? 'bg-[#8a5a22] text-white shadow-2xs'
                                : 'text-[#524538] hover:bg-[#faf7f2]'
                            }`}
                            title="คัดฟุตเทจที่มีอย่างน้อย 1 แท็กที่เลือก"
                          >
                            <Layers className="w-3 h-3" />
                            <span>บางแท็ก (OR)</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search Input Row */}
                <div className="pt-2 border-t border-[#eee6da]">
                  <div className="relative w-full max-w-md">
                    <Search className="w-3.5 h-3.5 text-[#8c7b6c] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={step1SearchQuery}
                      onChange={(e) => onChangeStep1SearchQuery(e.target.value)}
                      placeholder="ค้นหาแท็ก (เช่น พูดผิด, พี่แจ๊ส)..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#ded3c5] text-xs text-[#3d332a] placeholder:text-[#a39485] focus:outline-none focus:border-[#3b6845]"
                    />
                    {step1SearchQuery && (
                      <button
                        type="button"
                        onClick={() => onChangeStep1SearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c7b6c] hover:text-[#3d332a] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 Independent Tier Columns (Tier 1 | Tier 2 | Tier 3) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {renderTierColumn(1, tier1Groups)}
                {renderTierColumn(2, tier2Groups)}
                {renderTierColumn(3, tier3Groups)}
              </div>

              {/* Step 1 Action Footer */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {onAutoFillAndNextStep && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onAutoFillAndNextStep}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#edf4ed] hover:bg-[#dceadd] text-[#244b2f] border border-[#bad8b9] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-[#3b6845]" />
                    <span>สุ่มจัด 5 อันดับทันที</span>
                  </motion.button>
                )}

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onNextStep}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3b6845] hover:bg-[#2c5234] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <span>ไปขั้นที่ 2: จัดอันดับ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
