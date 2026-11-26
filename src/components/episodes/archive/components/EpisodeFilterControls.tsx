import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Search,
  RotateCcw,
  LayoutGrid,
  List,
  X,
  ArrowUpDown,
  Filter,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Tag,
  Film,
  Check,
  Wrench,
} from 'lucide-react';
import { useCMS } from '../../../../context/CMSContext';
import type { EpisodeProductionTarget } from '../../../../types/episode.types';
import type { EpisodeCompletenessFilter } from '../../../../utils/episodeValidator';
import type {
  CategoryTag,
  ArchiveSeriesCategory,
} from '../../../../types/tag.types';
import type {
  CategoryRankingItem,
  ArchiveCategorySummary,
} from '../hooks/useMasterArchiveMetrics';
import type { ViewMode, SortOption } from '../hooks/useMasterArchiveFilter';

interface EpisodeFilterControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  categoryFilter: string;
  onCategoryChange: (catId: string) => void;
  subcategoryFilter: string;
  onSubcategoryChange: (subId: string) => void;
  availableSubcategories: CategoryTag[];
  productionTargetFilter: 'ALL' | EpisodeProductionTarget;
  onProductionTargetChange: (target: 'ALL' | EpisodeProductionTarget) => void;
  completenessFilter: EpisodeCompletenessFilter;
  onCompletenessFilterChange: (filter: EpisodeCompletenessFilter) => void;
  completenessCounts: Record<EpisodeCompletenessFilter, number>;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  archiveCategoryMap: Record<string, ArchiveSeriesCategory>;
  archiveCategoryStats: ArchiveCategorySummary[];
  categoriesInGroup: CategoryRankingItem[];
  categoryRanking: CategoryRankingItem[];
  selectedFootageTagIds: string[];
  onToggleFootageTag: (tagId: string) => void;
  isThreeTierDrawerOpen?: boolean;
  onToggleThreeTierDrawer?: () => void;
}

const COMPLETENESS_FILTER_LABELS: Record<EpisodeCompletenessFilter, string> = {
  ALL: 'ทั้งหมด',
  COMPLETE: 'พร้อมสมบูรณ์',
  INCOMPLETE: 'ข้อมูลไม่ครบ',
  INCOMPLETE_FOOTAGE: 'ฟุตไม่ครบ 5',
  NEEDS_STANDARD_FIX: 'ต้องปรับมาตรฐานชื่อ/สล็อต',
};

const COMPLETENESS_TABS: Array<{
  id: EpisodeCompletenessFilter;
  label: string;
  mobileLabel: string;
  titleHint: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  countBg: string;
  countText: string;
}> = [
  {
    id: 'ALL',
    label: 'ทั้งหมด',
    mobileLabel: 'ทั้งหมด',
    titleHint: 'แสดงคลิปทั้งหมดตามเงื่อนไขที่เลือก',
    activeBg: 'bg-[#FFFDF9]',
    activeText: 'text-[#2D2926]',
    activeBorder: 'border-[#C5AB84]',
    countBg: 'bg-[#EFE8DC]',
    countText: 'text-[#5C5349]',
  },
  {
    id: 'COMPLETE',
    label: 'พร้อมสมบูรณ์',
    mobileLabel: 'พร้อม',
    titleHint: 'ครบ 5 ฟุต ชื่อ 5 อันดับ และมีลิงก์ Master Drive จริง',
    activeBg: 'bg-[#E8F3E8]',
    activeText: 'text-[#224A2D]',
    activeBorder: 'border-[#9EC49C]',
    countBg: 'bg-[#D3E8D3]',
    countText: 'text-[#224A2D]',
  },
  {
    id: 'INCOMPLETE',
    label: 'ข้อมูลหรือลิงก์ไม่ครบ',
    mobileLabel: 'ไม่ครบ',
    titleHint: 'ขาดลิงก์ Drive ฟุตไม่ครบ 5 หรือชื่อยังไม่มาตรฐาน',
    activeBg: 'bg-[#FAF0E1]',
    activeText: 'text-[#7A3F17]',
    activeBorder: 'border-[#E5CFA6]',
    countBg: 'bg-[#F2DEC1]',
    countText: 'text-[#7A3F17]',
  },
  {
    id: 'INCOMPLETE_FOOTAGE',
    label: 'ฟุตไม่ครบ 5',
    mobileLabel: 'ฟุต < 5',
    titleHint: 'ใส่ฟุตเทจน้อยกว่า 5 สล็อต (0-4 ฟุต)',
    activeBg: 'bg-[#FBECE8]',
    activeText: 'text-[#7E3224]',
    activeBorder: 'border-[#E7BDBA]',
    countBg: 'bg-[#F4D7D0]',
    countText: 'text-[#7E3224]',
  },
  {
    id: 'NEEDS_STANDARD_FIX',
    label: 'ต้องปรับมาตรฐานชื่อ/สล็อต',
    mobileLabel: 'ต้องแก้',
    titleHint: 'ยังไม่ตั้งชื่อ ชื่อไม่เป็น "5 อันดับ" หรือฟุตไม่ครบ 5',
    activeBg: 'bg-[#FDF2E9]',
    activeText: 'text-[#8A4A18]',
    activeBorder: 'border-[#E8C2A0]',
    countBg: 'bg-[#F7DEC6]',
    countText: 'text-[#8A4A18]',
  },
];

export const EpisodeFilterControls: React.FC<EpisodeFilterControlsProps> = ({
  searchQuery,
  onSearchChange,
  selectedGroupId,
  onGroupChange,
  categoryFilter,
  onCategoryChange,
  subcategoryFilter,
  onSubcategoryChange,
  availableSubcategories,
  productionTargetFilter,
  onProductionTargetChange,
  completenessFilter,
  onCompletenessFilterChange,
  completenessCounts,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  filteredCount,
  totalCount,
  hasActiveFilters,
  onResetFilters,
  archiveCategoryMap,
  archiveCategoryStats,
  categoriesInGroup,
  categoryRanking,
  selectedFootageTagIds,
  onToggleFootageTag,
  isThreeTierDrawerOpen = false,
  onToggleThreeTierDrawer,
}) => {
  const { tagMap, episodes } = useCMS();
  const prefersReducedMotion = useReducedMotion();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isStatusMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setIsStatusMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStatusMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isStatusMenuOpen]);

  const activeStatusTab =
    COMPLETENESS_TABS.find((tab) => tab.id === completenessFilter) ||
    COMPLETENESS_TABS[0];
  const activeStatusCount = completenessCounts[activeStatusTab.id] ?? 0;

  const renderStatusIcon = (
    iconType: EpisodeCompletenessFilter,
    isActive: boolean
  ) => {
    if (iconType === 'COMPLETE') {
      return (
        <CheckCircle2
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-[#2E7D32]' : 'text-[#738A74]'
          }`}
        />
      );
    }
    if (iconType === 'INCOMPLETE') {
      return (
        <AlertTriangle
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-[#B56722]' : 'text-[#A08164]'
          }`}
        />
      );
    }
    if (iconType === 'INCOMPLETE_FOOTAGE') {
      return (
        <Film
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-[#A63D2C]' : 'text-[#9F7870]'
          }`}
        />
      );
    }
    if (iconType === 'NEEDS_STANDARD_FIX') {
      return (
        <Wrench
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-[#8A4A18]' : 'text-[#9F7D62]'
          }`}
        />
      );
    }
    return (
      <Layers
        className={`w-3.5 h-3.5 shrink-0 ${
          isActive ? 'text-[#6B4616]' : 'text-[#8C8277]'
        }`}
      />
    );
  };

  const seriesNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoryRanking.forEach((item) => {
      map[item.seriesKey] = item.seriesName;
    });
    return map;
  }, [categoryRanking]);

  const activeSeriesDisplayName =
    seriesNameMap[categoryFilter] ||
    tagMap[categoryFilter]?.name ||
    categoryFilter.replace(/^SERIES::/, '');

  const activeSecondaryCount =
    (selectedGroupId !== 'ALL' ? 1 : 0) +
    (categoryFilter !== 'ALL' ? 1 : 0) +
    (subcategoryFilter !== 'ALL' ? 1 : 0) +
    (productionTargetFilter !== 'ALL' ? 1 : 0);

  const showContextualRow = isAdvancedOpen;

  return (
    <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-3.5 shadow-2xs space-y-2.5">
      {/* Row 1: Search Input + 3-Tier Tag Drawer + Sub-filter Trigger */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#8C8277] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหา EP, ชื่อรายการ, แท็ก หรือรหัสฟุต..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-[13px] bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#D5C2A5]/40 focus:border-[#C5AB84] focus:bg-[#FFFDF9] text-[#2D2926] placeholder:text-[#968B7E] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#8C8277] hover:text-[#2D2926] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
              aria-label="ล้างคำค้นหา"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleThreeTierDrawer && (
            <button
              type="button"
              onClick={onToggleThreeTierDrawer}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                isThreeTierDrawerOpen || selectedFootageTagIds.length > 0
                  ? 'bg-[#E8F3E8] text-[#224A2D] border-[#9EC49C] shadow-2xs'
                  : 'bg-[#FAF7F2] text-[#5C5349] border-[#E2D8C9] hover:bg-[#F4EFE6] hover:text-[#2D2926]'
              }`}
              title="กรองด้วยแท็กฟุตเทจ 3 ชั้น"
            >
              <Tag className="w-3.5 h-3.5 text-[#2D633B] shrink-0" />
              <span>แท็ก 3 ชั้น</span>
              {selectedFootageTagIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-[#CFE6CF] text-[#1D4227] font-mono tabular-nums text-[11px] font-bold">
                  {selectedFootageTagIds.length}
                </span>
              )}
              <motion.span
                animate={{ rotate: isThreeTierDrawerOpen ? 180 : 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
                className="inline-flex opacity-70"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAdvancedOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
              showContextualRow
                ? 'bg-[#FAF2E1] text-[#6B4616] border-[#DEC190]'
                : 'bg-[#FAF7F2] text-[#5C5349] border-[#E2D8C9] hover:bg-[#F4EFE6] hover:text-[#2D2926]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#8A5A22]" />
            <span>ตัวกรองย่อย</span>
            {activeSecondaryCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-[#E6D0A7] text-[#59380E] font-mono tabular-nums text-[11px] font-bold">
                {activeSecondaryCount}
              </span>
            )}
            <motion.span
              animate={{ rotate: showContextualRow ? 180 : 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
              className="inline-flex opacity-70"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        </div>
      </div>

      {/* Collapsible Secondary Filters (Production Target + Subcategory) */}
      <AnimatePresence initial={false}>
        {showContextualRow && (
          <motion.div
            key="secondary-filters"
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
              duration: prefersReducedMotion ? 0.08 : 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="overflow-hidden"
          >
            <div className="pt-2.5 border-t border-[#EFE8DC] flex flex-wrap items-center gap-x-4 gap-y-2.5 bg-[#FAF6EE]/70 -mx-3.5 px-3.5 py-2.5">
              {/* Archive Category Dropdown */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-semibold text-[#785324] whitespace-nowrap">
                  หมวด:
                </span>
                <select
                  value={selectedGroupId}
                  onChange={(e) => {
                    onGroupChange(e.target.value);
                    onCategoryChange('ALL');
                  }}
                  aria-label="กรองตามหมวดคลังคลิป"
                  className="bg-[#FFFDF9] border border-[#DFD4C3] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#2D2926] focus:outline-hidden focus:border-[#C5AB84] cursor-pointer max-w-[210px] truncate tabular-nums"
                >
                  <option value="ALL">
                    ทุกหมวด ({episodes.length.toLocaleString()})
                  </option>
                  {archiveCategoryStats.map((stat) => (
                    <option key={stat.category.id} value={stat.category.id}>
                      {stat.category.name} ({stat.episodeCount})
                    </option>
                  ))}
                </select>
              </div>

              {/* 5-Rank Series Dropdown */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-semibold text-[#244B2F] whitespace-nowrap">
                  รายการ:
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  aria-label="กรองตามรายการ 5 อันดับ"
                  className="bg-[#FFFDF9] border border-[#DFD4C3] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#2D2926] focus:outline-hidden focus:border-[#9EC49C] cursor-pointer max-w-[230px] truncate tabular-nums"
                >
                  <option value="ALL">
                    ทั้งหมด ({categoriesInGroup.length} รายการ)
                  </option>
                  {categoriesInGroup.map((item) => (
                    <option key={item.seriesKey} value={item.seriesKey}>
                      {item.seriesName} ({item.episodeCount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Production Target */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#6E665E] whitespace-nowrap">
                  รูปแบบ:
                </span>
                <div className="inline-flex items-center gap-0.5 bg-[#F2ECE1] p-0.5 rounded-lg border border-[#E2D8C9]">
                  {(
                    [
                      { id: 'ALL', label: 'ทั้งหมด' },
                      { id: 'MAIN_CATEGORY_VARIETY', label: 'รวมหลากประเด็น' },
                      { id: 'SINGLE_SUBCATEGORY_SPECIAL', label: 'เจาะจงหมวดย่อย' },
                    ] as const
                  ).map((item) => {
                    const isActive = productionTargetFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onProductionTargetChange(item.id)}
                        className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-[#FFFDF9] text-[#2D2926] shadow-2xs border border-[#D5C7B2]'
                            : 'text-[#6E665E] hover:text-[#2D2926] border border-transparent'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {availableSubcategories.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#6E665E] whitespace-nowrap">
                    หมวดย่อย:
                  </span>
                  <select
                    value={subcategoryFilter}
                    onChange={(e) => onSubcategoryChange(e.target.value)}
                    aria-label="กรองตามหมวดย่อย"
                    className="bg-[#FFFDF9] border border-[#DFD4C3] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#2D2926] focus:outline-hidden focus:border-[#C5AB84] cursor-pointer max-w-[200px] truncate"
                  >
                    <option value="ALL">
                      ทั้งหมด ({availableSubcategories.length})
                    </option>
                    {availableSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        #{sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 2: Unified Status Dropdown + Count (Left) & Sort + View Switcher (Right) */}
      <div className="pt-2.5 border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div ref={statusMenuRef} className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isStatusMenuOpen}
              onClick={() => setIsStatusMenuOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                completenessFilter !== 'ALL'
                  ? `${activeStatusTab.activeBg} ${activeStatusTab.activeText} ${activeStatusTab.activeBorder} shadow-2xs`
                  : isStatusMenuOpen
                  ? 'bg-[#FFFDF9] text-[#2D2926] border-[#C5AB84] shadow-2xs'
                  : 'bg-[#FAF7F2] text-[#2D2926] border-[#E5DDD0] hover:bg-[#F3EDE2]'
              }`}
              title={activeStatusTab.titleHint}
            >
              {renderStatusIcon(activeStatusTab.id, true)}
              <span className="text-[#787066] font-medium">สถานะ:</span>
              <span className="sm:hidden">{activeStatusTab.mobileLabel}</span>
              <span className="hidden sm:inline">{activeStatusTab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] sm:text-[11px] font-mono tabular-nums font-bold ${
                  completenessFilter !== 'ALL'
                    ? `${activeStatusTab.countBg} ${activeStatusTab.countText}`
                    : 'bg-[#EDE6DA] text-[#5C5349]'
                }`}
              >
                {activeStatusCount.toLocaleString()}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-70 transition-transform duration-150 ${
                  isStatusMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isStatusMenuOpen && (
                <motion.div
                  role="listbox"
                  aria-label="ตัวกรองสถานะความสมบูรณ์คลิป"
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full mt-1.5 z-40 w-[300px] sm:w-[340px] max-w-[calc(100vw-2rem)] bg-[#FFFDF9] border border-[#DFD4C3] rounded-2xl shadow-lg p-1.5 space-y-1"
                >
                  {COMPLETENESS_TABS.map((tab) => {
                    const isSelected = completenessFilter === tab.id;
                    const count = completenessCounts[tab.id] ?? 0;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onCompletenessFilterChange(tab.id);
                          setIsStatusMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer border ${
                          isSelected
                            ? `${tab.activeBg} ${tab.activeBorder}`
                            : 'border-transparent hover:bg-[#FAF6EE]'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? `${tab.countBg} border-transparent`
                              : 'bg-[#FAF7F2] border-[#E8DFD3]'
                          }`}
                        >
                          {renderStatusIcon(tab.id, true)}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-xs font-bold truncate ${
                                isSelected ? tab.activeText : 'text-[#2D2926]'
                              }`}
                            >
                              {tab.label}
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`px-1.5 py-0.2 rounded-md text-[10px] sm:text-[11px] font-mono tabular-nums font-bold ${
                                  isSelected
                                    ? `${tab.countBg} ${tab.countText}`
                                    : 'bg-[#EFE8DC] text-[#5C5349]'
                                }`}
                              >
                                {count.toLocaleString()}
                              </span>
                              {isSelected && (
                                <Check
                                  className={`w-3.5 h-3.5 shrink-0 ${tab.activeText}`}
                                />
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-[#787066] leading-snug mt-0.5">
                            {tab.titleHint}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-xs text-[#6E665E] font-mono tabular-nums whitespace-nowrap">
            <span>พบ </span>
            <strong className="text-[#224A2D] font-bold">
              {filteredCount.toLocaleString()}
            </strong>
            <span className="hidden sm:inline text-[#9C9286]">
              {' '}
              / {totalCount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <div className="inline-flex items-center gap-1 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8A7E70] shrink-0" />
            <span className="hidden sm:inline text-xs font-medium text-[#787066] whitespace-nowrap">
              เรียง:
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs font-bold text-[#2D2926] focus:outline-hidden cursor-pointer max-w-[135px] sm:max-w-none truncate"
            >
              <option value="DATE_DESC">ล่าสุด</option>
              <option value="DATE_ASC">เก่าสุด</option>
              <option value="TITLE_ASC">ชื่อ ก-ฮ</option>
              <option value="TITLE_DESC">ชื่อ ฮ-ก</option>
              <option value="ID_DESC">รหัส ใหม่→เก่า</option>
              <option value="ID_ASC">รหัส เก่า→ใหม่</option>
              <option value="SERIES_EP_DESC">EP ซีรีส์สูงสุด</option>
              <option value="NEW_MIX_DESC">ฟุตใหม่มากสุด</option>
            </select>
          </div>

          <div className="flex items-center gap-0.5 bg-[#F4EFE6] p-1 rounded-xl border border-[#E5DDD0]">
            <button
              type="button"
              onClick={() => onViewModeChange('CARDS')}
              title="การ์ด"
              className={`relative inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'CARDS'
                  ? 'text-[#224A2D]'
                  : 'text-[#6E665E] hover:text-[#2D2926]'
              }`}
            >
              {viewMode === 'CARDS' && (
                <motion.span
                  layoutId="archiveViewModePill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-[#FFFDF9] border border-[#D8CEBE] shadow-2xs"
                />
              )}
              <LayoutGrid className="relative z-10 w-3.5 h-3.5" />
              <span className="relative z-10 hidden sm:inline">การ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('TABLE')}
              title="ตาราง"
              className={`relative inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'TABLE'
                  ? 'text-[#224A2D]'
                  : 'text-[#6E665E] hover:text-[#2D2926]'
              }`}
            >
              {viewMode === 'TABLE' && (
                <motion.span
                  layoutId="archiveViewModePill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-[#FFFDF9] border border-[#D8CEBE] shadow-2xs"
                />
              )}
              <List className="relative z-10 w-3.5 h-3.5" />
              <span className="relative z-10 hidden sm:inline">ตาราง</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Concise Active Filter Strip */}
      <AnimatePresence initial={false}>
        {hasActiveFilters && (
          <motion.div
            key="active-filters-strip"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { height: 0, opacity: 0, y: -4 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { height: 'auto', opacity: 1, y: 0 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { height: 0, opacity: 0, y: -4 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.08 : 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="overflow-hidden"
          >
            <div className="pt-2 border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedGroupId !== 'ALL' && (
              <button
                type="button"
                onClick={() => onGroupChange('ALL')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF2E1] hover:bg-[#F4E6C8] text-[#6B4616] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>
                  หมวด: {archiveCategoryMap[selectedGroupId]?.name || selectedGroupId}
                </span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}

            {categoryFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => onCategoryChange('ALL')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#E8F3E8] hover:bg-[#D7EAD7] text-[#224A2D] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>รายการ: {activeSeriesDisplayName}</span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}

            {selectedFootageTagIds.map((tagId) => {
              const t = tagMap[tagId];
              return (
                <button
                  key={tagId}
                  type="button"
                  onClick={() => onToggleFootageTag(tagId)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EDF5F9] hover:bg-[#DCECF4] text-[#1D4E68] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>#{t?.name || tagId}</span>
                  <X className="w-3 h-3 opacity-75" />
                </button>
              );
            })}

            {subcategoryFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => onSubcategoryChange('ALL')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FBF0DC] hover:bg-[#F5E3C1] text-[#664214] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>
                  ย่อย: #{tagMap[subcategoryFilter]?.name || subcategoryFilter}
                </span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}

            {productionTargetFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => onProductionTargetChange('ALL')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EDF5F8] hover:bg-[#DCEBF2] text-[#23546E] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>
                  {productionTargetFilter === 'SINGLE_SUBCATEGORY_SPECIAL'
                    ? 'เจาะจงหมวดย่อย'
                    : 'รวมหลากประเด็น'}
                </span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}

            {completenessFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => onCompletenessFilterChange('ALL')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F3EFEA] hover:bg-[#E7E0D6] text-[#4D4740] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{COMPLETENESS_FILTER_LABELS[completenessFilter]}</span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}

            {searchQuery.trim() !== '' && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF2E1] hover:bg-[#F4E6C8] text-[#6B4616] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>&ldquo;{searchQuery}&rdquo;</span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#8E3B3B] bg-[#FDF2F2] hover:bg-[#F9E2E2] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ล้างทั้งหมด</span>
          </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
