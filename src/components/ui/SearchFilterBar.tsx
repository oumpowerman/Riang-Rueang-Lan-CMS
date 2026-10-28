import React from 'react';
import { ArrowUpDown, Filter, RotateCcw, Search } from 'lucide-react';
import { CategoryMatrixStat } from '../../context/CMSContext';
import { CooldownStatus, IngestionFlow } from '../../types/footage.types';
import { CategoryTag } from '../../types/tag.types';

export type FootageActionFilter =
  | 'ALL'
  | 'CATEGORY_READY_5'
  | 'RECIPE_ALL_NEW'
  | 'RECIPE_SMART_MIX'
  | 'UNTAGGED_ONLY'
  | 'MISSING_DRIVE_ONLY';

export type FootageLibrarySortBy =
  | 'REST_DAYS_DESC'
  | 'USAGE_90D_ASC'
  | 'NEWEST_CREATED'
  | 'ID_ASC';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  statusFilter: CooldownStatus | 'ALL';
  onStatusFilterChange: (status: CooldownStatus | 'ALL') => void;
  flowFilter: IngestionFlow | 'ALL';
  onFlowFilterChange: (flow: IngestionFlow | 'ALL') => void;
  actionFilter: FootageActionFilter;
  onActionFilterChange: (filter: FootageActionFilter) => void;
  sortBy: FootageLibrarySortBy;
  onSortByChange: (sort: FootageLibrarySortBy) => void;
  tags: CategoryTag[];
  categoryMatrix?: CategoryMatrixStat[];
  untaggedCount?: number;
  missingDriveCount?: number;
  hasCustomFilter?: boolean;
  onResetFilters: () => void;
  totalResultCount: number;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  statusFilter,
  onStatusFilterChange,
  flowFilter,
  onFlowFilterChange,
  actionFilter,
  onActionFilterChange,
  sortBy,
  onSortByChange,
  untaggedCount = 0,
  missingDriveCount = 0,
  hasCustomFilter = false,
  onResetFilters,
}) => {
  const hasActiveFilters =
    hasCustomFilter ||
    searchQuery.trim() !== '' ||
    selectedTags.length > 0 ||
    statusFilter !== 'ALL' ||
    flowFilter !== 'ALL' ||
    actionFilter !== 'ALL';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
      {/* Left: Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหารหัส FT-XXXX หรือชื่อคลิป..."
          className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
        />
      </div>

      {/* Right: Compact Enterprise Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Selector */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as CooldownStatus | 'ALL')}
          className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
          aria-label="กรองตามสถานะความพร้อมใช้"
        >
          <option value="ALL">สถานะ: ทั้งหมด</option>
          <option value="NEW_UNTOUCHED">คลิปใหม่แกะกล่อง (New)</option>
          <option value="READY_FRESH">พร้อมใช้งาน / พักครบ (Ready)</option>
          <option value="HIGH_VELOCITY_WARNING">เฝ้าระวัง / ใช้ถี่ (Warning)</option>
          <option value="RECENT_COOLDOWN">พักคูลดาวน์ (Cooldown)</option>
        </select>

        {/* Quick Production Readiness / Exception Filter */}
        <div className="inline-flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <select
            value={actionFilter}
            onChange={(e) => onActionFilterChange(e.target.value as FootageActionFilter)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
            aria-label="ตัวกรองเงื่อนไขการผลิต"
          >
            <option value="ALL">เงื่อนไข: ทั้งหมด</option>
            <option value="CATEGORY_READY_5">หมวดพร้อมผลิต (≥ 5 คลิป)</option>
            <option value="RECIPE_ALL_NEW">สูตรคลิปใหม่ล้วน (5:0)</option>
            <option value="RECIPE_SMART_MIX">สูตรผสมอัจฉริยะ (2 ใหม่ + 3 สด)</option>
            <option value="UNTAGGED_ONLY">พื้นที่พักรอจัดหมวดหมู่ ({untaggedCount})</option>
            <option value="MISSING_DRIVE_ONLY">รอลิงก์ไฟล์ Drive ({missingDriveCount})</option>
          </select>
        </div>

        {/* Sort Selector */}
        <div className="inline-flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as FootageLibrarySortBy)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
            aria-label="เรียงลำดับรายการ"
          >
            <option value="REST_DAYS_DESC">เรียง: พักนานสุดขึ้นก่อน</option>
            <option value="NEWEST_CREATED">เรียง: นำเข้าล่าสุด</option>
            <option value="USAGE_90D_ASC">เรียง: ใช้น้อยสุดใน 90 วัน</option>
            <option value="ID_ASC">เรียง: รหัส FT-XXXX</option>
          </select>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างตัวกรอง</span>
          </button>
        )}
      </div>
    </div>
  );
};
