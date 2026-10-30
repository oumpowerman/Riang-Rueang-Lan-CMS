import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  LayoutGrid,
  List,
  X,
  ArrowUpDown,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCMS } from '../../../../context/CMSContext';
import type {
  EpisodeWorkflowStage,
  EpisodeProductionTarget,
} from '../../../../types/episode.types';
import type { CategoryTag } from '../../../../types/tag.types';
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
  workflowFilter: 'ALL' | EpisodeWorkflowStage;
  onWorkflowFilterChange: (workflow: 'ALL' | EpisodeWorkflowStage) => void;
  workflowStageCounts: Record<'ALL' | EpisodeWorkflowStage, number>;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

const WORKFLOW_STAGE_LABELS: Record<EpisodeWorkflowStage, string> = {
  '1_MIXING': '1. ผสมฟุตเทจ',
  '2_MASCOT_SCRIPTING': '2. เขียนบทมาสคอต',
  '3_VIDEO_EDITING': '3. ตัดต่อวิดีโอ',
  '4_PUBLISHED': '4. เผยแพร่แล้ว',
};

const WORKFLOW_TABS: Array<{
  id: 'ALL' | EpisodeWorkflowStage;
  label: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  countBg: string;
  countText: string;
}> = [
  {
    id: 'ALL',
    label: 'ทุกสถานะ',
    activeBg: 'bg-[#FFFDF9]',
    activeText: 'text-[#2D2926]',
    activeBorder: 'border-[#C5AB84]',
    countBg: 'bg-[#EFE8DC]',
    countText: 'text-[#5C5349]',
  },
  {
    id: '1_MIXING',
    label: '1. ผสมฟุตเทจ',
    activeBg: 'bg-[#FBF3E4]',
    activeText: 'text-[#6E4919]',
    activeBorder: 'border-[#E0C28E]',
    countBg: 'bg-[#F2E2C4]',
    countText: 'text-[#6E4919]',
  },
  {
    id: '2_MASCOT_SCRIPTING',
    label: '2. เขียนบทมาสคอต',
    activeBg: 'bg-[#F3EFEA]',
    activeText: 'text-[#4E3D66]',
    activeBorder: 'border-[#CBBCE0]',
    countBg: 'bg-[#E6DFEF]',
    countText: 'text-[#4E3D66]',
  },
  {
    id: '3_VIDEO_EDITING',
    label: '3. ตัดต่อวิดีโอ',
    activeBg: 'bg-[#EDF5F8]',
    activeText: 'text-[#21526B]',
    activeBorder: 'border-[#AED1E3]',
    countBg: 'bg-[#DCEBF2]',
    countText: 'text-[#21526B]',
  },
  {
    id: '4_PUBLISHED',
    label: '4. เผยแพร่แล้ว',
    activeBg: 'bg-[#E8F3E8]',
    activeText: 'text-[#224A2D]',
    activeBorder: 'border-[#9EC49C]',
    countBg: 'bg-[#D3E8D3]',
    countText: 'text-[#224A2D]',
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
  workflowFilter,
  onWorkflowFilterChange,
  workflowStageCounts,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  filteredCount,
  totalCount,
  hasActiveFilters,
  onResetFilters,
}) => {
  const { tagMap, categoryGroupMap } = useCMS();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const activeSecondaryCount =
    (subcategoryFilter !== 'ALL' ? 1 : 0) +
    (productionTargetFilter !== 'ALL' ? 1 : 0);

  // Contextual rule: automatically reveal secondary filters when a specific series is selected,
  // or when a secondary filter is actively applied, or when the user manually opens it.
  const showContextualRow =
    categoryFilter !== 'ALL' || activeSecondaryCount > 0 || isAdvancedOpen;

  return (
    <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-4 shadow-2xs space-y-3">
      {/* ROW 1: Full-Width Search + Contextual Filter Trigger + Matched Count & View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Full-Width Flex Search Bar + Optional Secondary Filter Toggle */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#8C8277] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหารหัส EP, ชื่อตอน, หมวดย่อย, ชื่อไฟล์ หรือรหัสฟุตเทจ (FT-xxxx)..."
              className="w-full pl-10 pr-8 py-2 text-xs sm:text-[13px] bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#D5C2A5]/40 focus:border-[#C5AB84] focus:bg-[#FFFDF9] text-[#2D2926] placeholder:text-[#968B7E] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#8C8277] hover:text-[#2D2926] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle button for secondary filters when no main series is selected */}
          {categoryFilter === 'ALL' && (
            <button
              type="button"
              onClick={() => setIsAdvancedOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
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
              {showContextualRow ? (
                <ChevronUp className="w-3.5 h-3.5 opacity-70" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              )}
            </button>
          )}
        </div>

        {/* Right: Clean Unboxed Count Metadata + View Mode Segmented Control */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="text-xs text-[#6E665E] font-mono tabular-nums whitespace-nowrap">
            <span>พบ </span>
            <strong className="text-[#224A2D] font-bold text-[13px]">
              {filteredCount.toLocaleString()}
            </strong>
            <span className="text-[#9C9286]"> / </span>
            <span>{totalCount.toLocaleString()} ตอน</span>
          </div>

          <span className="text-[#E2D8C9] select-none hidden sm:inline" aria-hidden="true">
            |
          </span>

          <div className="flex items-center gap-1 bg-[#F4EFE6] p-1 rounded-xl border border-[#E5DDD0]">
            <button
              type="button"
              onClick={() => onViewModeChange('CARDS')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'CARDS'
                  ? 'bg-[#FFFDF9] text-[#224A2D] shadow-2xs border border-[#D8CEBE]'
                  : 'text-[#6E665E] hover:text-[#2D2926] border border-transparent'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>การ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('TABLE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'TABLE'
                  ? 'bg-[#FFFDF9] text-[#224A2D] shadow-2xs border border-[#D8CEBE]'
                  : 'text-[#6E665E] hover:text-[#2D2926] border border-transparent'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>ตาราง</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTEXTUAL SECONDARY FILTERS (Subcategory & Production Format) */}
      {showContextualRow && (
        <div className="pt-2.5 border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-3 bg-[#FAF6EE]/70 -mx-4 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Production Target Segmented Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6E665E] whitespace-nowrap">
                รูปแบบตอน:
              </span>
              <div className="inline-flex items-center gap-1 bg-[#F2ECE1] p-0.5 rounded-lg border border-[#E2D8C9]">
                {(
                  [
                    { id: 'ALL', label: 'ทุกรูปแบบ' },
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
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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

            {/* Subcategory Filter (when subcategories exist for current series/group) */}
            {availableSubcategories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#6E665E] whitespace-nowrap">
                  หมวดย่อยในซีรีส์:
                </span>
                <select
                  value={subcategoryFilter}
                  onChange={(e) => onSubcategoryChange(e.target.value)}
                  className="bg-[#FFFDF9] border border-[#DFD4C3] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#2D2926] focus:outline-hidden focus:border-[#C5AB84] cursor-pointer max-w-[220px] truncate"
                >
                  <option value="ALL">
                    ทุกหมวดย่อย ({availableSubcategories.length})
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

          {categoryFilter !== 'ALL' && (
            <span className="text-[11px] text-[#7D7367] whitespace-nowrap">
              กำลังกรองเฉพาะซีรีส์{' '}
              <strong className="text-[#224A2D]">
                #{tagMap[categoryFilter]?.name || categoryFilter}
              </strong>
            </span>
          )}
        </div>
      )}

      {/* ROW 2: Workflow Stage Segmented Tabs + Sort Selector */}
      <div className="pt-2.5 border-t border-[#EFE8DC] flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
        {/* Left: Interactive Workflow Stage Tabs with Live Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto thin-scrollbar pb-0.5">
          {WORKFLOW_TABS.map((tab) => {
            const isActive = workflowFilter === tab.id;
            const count = workflowStageCounts[tab.id] ?? 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onWorkflowFilterChange(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  isActive
                    ? `${tab.activeBg} ${tab.activeText} ${tab.activeBorder} shadow-2xs`
                    : 'bg-[#FAF7F2] text-[#6E665E] border-transparent hover:bg-[#F3EDE2] hover:text-[#2D2926]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[11px] font-mono tabular-nums font-bold ${
                    isActive
                      ? `${tab.countBg} ${tab.countText}`
                      : 'bg-[#EDE6DA] text-[#787066]'
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Clean Sort Selector */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl px-3 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8A7E70] shrink-0" />
            <span className="text-xs font-medium text-[#787066] whitespace-nowrap">
              เรียงลำดับ:
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs font-bold text-[#2D2926] focus:outline-hidden cursor-pointer"
            >
              <option value="DATE_DESC">วันที่สร้าง (ล่าสุดก่อน)</option>
              <option value="DATE_ASC">วันที่สร้าง (เก่าสุดก่อน)</option>
              <option value="ID_DESC">รหัส EP (ใหม่ → เก่า)</option>
              <option value="ID_ASC">รหัส EP (เก่า → ใหม่)</option>
              <option value="SERIES_EP_DESC">ลำดับ EP ซีรีส์สูงสุด</option>
              <option value="NEW_MIX_DESC">ฟุตเทจใหม่มากสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* ROW 3: Active Filter Summary Strip (only shown when filters are applied) */}
      {hasActiveFilters && (
        <div className="pt-2.5 border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#8A7E70] mr-0.5">
              ตัวกรองที่ใช้งาน:
            </span>

            {selectedGroupId !== 'ALL' && (
              <button
                type="button"
                onClick={() => onGroupChange('ALL')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#FAF2E1] hover:bg-[#F4E6C8] text-[#6B4616] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="คลิกเพื่อยกเลิกตัวกรองกลุ่ม"
              >
                <span>
                  กลุ่ม: {categoryGroupMap[selectedGroupId]?.name || selectedGroupId}
                </span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}

            {categoryFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => onCategoryChange('ALL')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#E8F3E8] hover:bg-[#D7EAD7] text-[#224A2D] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="คลิกเพื่อยกเลิกตัวกรองซีรีส์"
              >
                <span>ซีรีส์: #{tagMap[categoryFilter]?.name || categoryFilter}</span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}

            {subcategoryFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => onSubcategoryChange('ALL')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#FBF0DC] hover:bg-[#F5E3C1] text-[#664214] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="คลิกเพื่อยกเลิกตัวกรองหมวดย่อย"
              >
                <span>
                  หมวดย่อย: #{tagMap[subcategoryFilter]?.name || subcategoryFilter}
                </span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}

            {productionTargetFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => onProductionTargetChange('ALL')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#EDF5F8] hover:bg-[#DCEBF2] text-[#23546E] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="คลิกเพื่อยกเลิกตัวกรองรูปแบบ"
              >
                <span>
                  รูปแบบ:{' '}
                  {productionTargetFilter === 'SINGLE_SUBCATEGORY_SPECIAL'
                    ? 'เจาะจงหมวดย่อย'
                    : 'รวมหลากประเด็น'}
                </span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}

            {workflowFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => onWorkflowFilterChange('ALL')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#F3EFEA] hover:bg-[#E7E0D6] text-[#4D4740] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="คลิกเพื่อยกเลิกตัวกรองสถานะ"
              >
                <span>สถานะ: {WORKFLOW_STAGE_LABELS[workflowFilter]}</span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            )}

            {searchQuery.trim() !== '' && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#FAF2E1] hover:bg-[#F4E6C8] text-[#6B4616] font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="คลิกเพื่อล้างคำค้นหา"
              >
                <span>ค้นหา: &ldquo;{searchQuery}&rdquo;</span>
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
            <span>ล้างตัวกรองทั้งหมด</span>
          </button>
        </div>
      )}
    </div>
  );
};
