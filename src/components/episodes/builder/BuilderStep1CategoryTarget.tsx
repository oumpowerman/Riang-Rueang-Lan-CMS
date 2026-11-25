import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
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
import { CategoryTag, CategoryTier } from '../../../types/tag.types';
import { TIER_THEME_CONFIGS } from '../../tags/three-tier/IndependentTierColumn';
import {
  BuilderScopeMatchMode,
  BuilderSeriesCatalogItem,
  BuilderSeriesMode,
  BuilderTagClickActionMode,
  LiveCategoryStock,
  TagLiveStockSummary,
  TierSubCategoryGroup,
} from './builder.types';
import { BuilderSeriesSelectorBar } from './BuilderSeriesSelectorBar';
import { BuilderTierColumn } from './BuilderTierColumn';

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
  onSelectCategory: (
    tagId: string,
    autoFillWithRecipe?: boolean,
    options?: { preserveFacets?: boolean }
  ) => void;
  onToggleFacetTag: (tagId: string) => void;
  onClearFacetTags: () => void;
  onOpenThreeTierManager: () => void;
  // Series Target & Auto-EP Props
  seriesCatalog: BuilderSeriesCatalogItem[];
  seriesMode: BuilderSeriesMode;
  activeExistingSeries: BuilderSeriesCatalogItem | null;
  customSeriesName: string;
  effectiveSeriesName: string;
  autoEpisodeNo: number;
  effectiveEpisodeNo: number;
  isManualEpisodeNo: boolean;
  isDuplicateEpisodeNo: boolean;
  existingSeriesEpisodesCount: number;
  latestSeriesEpisodeNo: number;
  matchingExistingSeriesForNewName: BuilderSeriesCatalogItem | null;
  suggestedSeriesForActiveTag: BuilderSeriesCatalogItem[];
  onSelectExistingSeries: (seriesKey: string) => void;
  onSwitchToNewSeries: (initialName?: string) => void;
  onChangeCustomSeriesName: (val: string) => void;
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
  seriesCatalog,
  seriesMode,
  activeExistingSeries,
  customSeriesName,
  effectiveSeriesName,
  autoEpisodeNo,
  effectiveEpisodeNo,
  isManualEpisodeNo,
  isDuplicateEpisodeNo,
  existingSeriesEpisodesCount,
  latestSeriesEpisodeNo,
  matchingExistingSeriesForNewName,
  suggestedSeriesForActiveTag,
  onSelectExistingSeries,
  onSwitchToNewSeries,
  onChangeCustomSeriesName,
}) => {
  // Default: ALL sub-category frames across Tier 1, Tier 2, Tier 3 start collapsed ({})
  const [expandedSubKeys, setExpandedSubKeys] = useState<
    Record<string, boolean>
  >({});
  const [cascadeTier, setCascadeTier] = useState<CategoryTier | null>(null);
  const [expandedTierColumn, setExpandedTierColumn] =
    useState<CategoryTier | null>(null);
  const [isAdvancedModeOpen, setIsAdvancedModeOpen] = useState(false);

  const handleToggleTierSubs = (
    tier: CategoryTier,
    groups: TierSubCategoryGroup[]
  ) => {
    const tierKeys = groups.map((g) => `${tier}__${g.subCategory}`);
    const allExpandedInTier =
      tierKeys.length > 0 && tierKeys.every((k) => Boolean(expandedSubKeys[k]));

    // Trigger sequential cascade animation only when expanding all sub-categories in this Tier
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

  const primaryTag = tagMap[mainCategoryTagId] || activeCategoryStat?.tag || null;
  const primaryTier: CategoryTier =
    primaryTag?.tier === 2 || primaryTag?.tier === 3 ? primaryTag.tier : 1;
  const primaryTierTheme = TIER_THEME_CONFIGS[primaryTier];

  const totalScopeUsable =
    liveCategoryStock.totalNew + liveCategoryStock.totalFresh;
  const producibleScopeEpisodes = Math.floor(totalScopeUsable / 5);

  const isSearching = step1SearchQuery.trim().length > 0;

  const handleTagClick = (tagId: string) => {
    if (tagClickMode === 'TOGGLE_FACET') {
      if (tagId === mainCategoryTagId) return;
      onToggleFacetTag(tagId);
    } else {
      onSelectCategory(tagId, false);
    }
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
              {seriesMode === 'EXISTING' && activeExistingSeries && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1e4628] mr-1">
                  <span className="truncate max-w-[200px]">
                    {activeExistingSeries.fullSeriesTitle}
                  </span>
                  <span className="font-mono tabular-nums text-[#3b6845]">
                    EP.{effectiveEpisodeNo}
                  </span>
                  <span className="text-[#c7bdb2]" aria-hidden="true">
                    ·
                  </span>
                </span>
              )}
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
              {/* Step 1 Series Quick-Selector Strip */}
              <BuilderSeriesSelectorBar
                variant="step1"
                seriesCatalog={seriesCatalog}
                seriesMode={seriesMode}
                activeExistingSeries={activeExistingSeries}
                customSeriesName={customSeriesName}
                effectiveSeriesName={effectiveSeriesName}
                autoEpisodeNo={autoEpisodeNo}
                effectiveEpisodeNo={effectiveEpisodeNo}
                isManualEpisodeNo={isManualEpisodeNo}
                isDuplicateEpisodeNo={isDuplicateEpisodeNo}
                existingSeriesEpisodesCount={existingSeriesEpisodesCount}
                latestSeriesEpisodeNo={latestSeriesEpisodeNo}
                matchingExistingSeriesForNewName={matchingExistingSeriesForNewName}
                suggestedSeriesForActiveTag={suggestedSeriesForActiveTag}
                onSelectExistingSeries={onSelectExistingSeries}
                onSwitchToNewSeries={onSwitchToNewSeries}
                onChangeCustomSeriesName={onChangeCustomSeriesName}
              />

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
                              onClick={() =>
                                onSelectCategory(fid, false, {
                                  preserveFacets: true,
                                })
                              }
                              className="ml-0.5 p-0.5 rounded hover:bg-[#e8d4b4] text-[#7c531d] cursor-pointer"
                              title="สลับป้ายนี้ขึ้นเป็นแกนหลักของตอน (คงป้ายผสมเดิมไว้)"
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
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-[#8e4537] bg-[#fdf3ec] hover:bg-[#f9e3d4] border border-[#f5d7cf] cursor-pointer transition-colors whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>ล้าง ({selectedFacetTagIds.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Auto-revealed Inline OR/AND Switcher (when >=1 facet) + Collapsible Click Mode */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {selectedFacetTagIds.length > 0 && (
                      <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-white border border-[#ded3c5]">
                        <button
                          type="button"
                          onClick={() => onChangeScopeMatchMode('OR')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                            scopeMatchMode === 'OR'
                              ? 'bg-[#8a5a22] text-white shadow-2xs'
                              : 'text-[#524538] hover:bg-[#faf7f2]'
                          }`}
                          title="คัดฟุตเทจที่มีอย่างน้อย 1 แท็กที่เลือก (ค่าเริ่มต้น)"
                        >
                          <Layers className="w-3 h-3" />
                          <span>บางแท็ก (OR)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangeScopeMatchMode('AND')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                            scopeMatchMode === 'AND'
                              ? 'bg-[#3b6845] text-white shadow-2xs'
                              : 'text-[#524538] hover:bg-[#faf7f2]'
                          }`}
                          title="คัดเฉพาะฟุตเทจที่มีครบทุกแท็กที่เลือก"
                        >
                          <Filter className="w-3 h-3" />
                          <span>ครบทุกแท็ก (AND)</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsAdvancedModeOpen((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                        isAdvancedModeOpen ||
                        tagClickMode !== 'SET_PRIMARY' ||
                        scopeMatchMode !== 'OR'
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
                </div>

                {/* Collapsible Click Behavior Mode + OR/AND Match Mode */}
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
                            title="คลิกที่ป้ายแท็กเพื่อเปลี่ยนเป็นแกนหลักของตอน (ล้างแท็กผสมเก่า)"
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

                        {/* OR / AND Toggle when combining tags */}
                        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-[#ded3c5]">
                          <button
                            type="button"
                            onClick={() => onChangeScopeMatchMode('OR')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                              scopeMatchMode === 'OR'
                                ? 'bg-[#8a5a22] text-white shadow-2xs'
                                : 'text-[#524538] hover:bg-[#faf7f2]'
                            }`}
                            title="คัดฟุตเทจที่มีอย่างน้อย 1 แท็กที่เลือก (ค่าเริ่มต้น)"
                          >
                            <Layers className="w-3 h-3" />
                            <span>บางแท็ก (OR)</span>
                          </button>
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
                      onChange={(e) => {
                        setCascadeTier(null);
                        onChangeStep1SearchQuery(e.target.value);
                      }}
                      placeholder="ค้นหาแท็ก (เช่น พูดผิด, พี่แจ๊ส)..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#ded3c5] text-xs text-[#3d332a] placeholder:text-[#a39485] focus:outline-none focus:border-[#3b6845]"
                    />
                    {step1SearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setCascadeTier(null);
                          onChangeStep1SearchQuery('');
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c7b6c] hover:text-[#3d332a] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 Independent Tier Columns (Tier 1 | Tier 2 | Tier 3) */}
              <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                {(
                  [
                    { tier: 1 as CategoryTier, groups: tier1Groups },
                    { tier: 2 as CategoryTier, groups: tier2Groups },
                    { tier: 3 as CategoryTier, groups: tier3Groups },
                  ] as const
                ).map(({ tier, groups }) => (
                  <BuilderTierColumn
                    key={`builder-step1-tier-${tier}`}
                    tier={tier}
                    groups={groups}
                    expandedSubKeys={expandedSubKeys}
                    isCascadeActive={cascadeTier === tier && !isSearching}
                    isSearching={isSearching}
                    isExpandedColumn={expandedTierColumn === tier}
                    isCompactRail={
                      expandedTierColumn !== null && expandedTierColumn !== tier
                    }
                    mainCategoryTagId={mainCategoryTagId}
                    selectedFacetTagIds={selectedFacetTagIds}
                    tagStockMap={tagStockMap}
                    tagClickMode={tagClickMode}
                    onToggleTierSubs={handleToggleTierSubs}
                    onToggleSubCategory={handleToggleSubCategory}
                    onExpandAndOpenSubCategory={handleExpandAndOpenSubCategory}
                    onToggleExpandColumn={handleToggleExpandColumn}
                    onTagClick={handleTagClick}
                    onToggleFacetTag={onToggleFacetTag}
                    onSelectCategory={onSelectCategory}
                  />
                ))}
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
