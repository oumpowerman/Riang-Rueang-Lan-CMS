import React from 'react';
import { ArrowUpDown, Filter, RotateCcw, Search, X } from 'lucide-react';
import { CategoryMatrixStat } from '../../context/CMSContext';
import { CooldownStatus, IngestionFlow } from '../../types/footage.types';
import { CategoryTag } from '../../types/tag.types';

export type FootageActionFilter =
  | 'ALL'
  | 'CATEGORY_READY_5'
  | 'RECIPE_ALL_NEW'
  | 'RECIPE_SMART_MIX'
  | 'UNTAGGED_ONLY'
  | 'MISSING_DRIVE_ONLY'
  | 'DUPLICATES_ONLY';

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
  duplicateCount?: number;
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
  actionFilter,
  onActionFilterChange,
  sortBy,
  onSortByChange,
  untaggedCount = 0,
  missingDriveCount = 0,
  duplicateCount = 0,
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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5 shadow-2xs">
      {/* Left: Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหารหัส หรือชื่อคลิป..."
          className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            title="ล้างคำค้นหา"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right: Compact Selectors (2-col grid on mobile, inline flex on sm+) */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        {/* Status Selector */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as CooldownStatus | 'ALL')}
          className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
          aria-label="กรองตามสถานะ"
        >
          <option value="ALL">สถานะ: ทั้งหมด</option>
          <option value="NEW_UNTOUCHED">คลิปใหม่</option>
          <option value="READY_FRESH">พร้อมใช้</option>
          <option value="HIGH_VELOCITY_WARNING">ใช้ถี่ / เฝ้าระวัง</option>
          <option value="RECENT_COOLDOWN">ติดคูลดาวน์</option>
        </select>

        {/* Quick Production Readiness / Exception Filter */}
        <div className="inline-flex items-center gap-1 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => onActionFilterChange(e.target.value as FootageActionFilter)}
            className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
            aria-label="ตัวกรองเงื่อนไข"
          >
            <option value="ALL">ตัวกรอง: ทั้งหมด</option>
            <option value="CATEGORY_READY_5">พร้อมผลิต (≥5 คลิป)</option>
            <option value="RECIPE_ALL_NEW">สูตร 5 คลิปใหม่</option>
            <option value="RECIPE_SMART_MIX">สูตรผสม (2 ใหม่ + 3 สด)</option>
            <option value="UNTAGGED_ONLY">ไม่มีหมวดหมู่ ({untaggedCount})</option>
            <option value="MISSING_DRIVE_ONLY">ไม่มีลิงก์ Drive ({missingDriveCount})</option>
            <option value="DUPLICATES_ONLY">เฉพาะคลิปซ้ำ ({duplicateCount})</option>
          </select>
        </div>

        {/* Sort Selector */}
        <div
          className={`inline-flex items-center gap-1 ${
            hasActiveFilters ? 'col-span-1' : 'col-span-2'
          } sm:w-auto`}
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as FootageLibrarySortBy)}
            className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
            aria-label="เรียงลำดับ"
          >
            <option value="REST_DAYS_DESC">เรียง: พักนานสุด</option>
            <option value="NEWEST_CREATED">เรียง: เพิ่มล่าสุด</option>
            <option value="USAGE_90D_ASC">เรียง: ใช้น้อยสุด</option>
            <option value="ID_ASC">เรียง: ตามรหัส</option>
          </select>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            title="ล้างตัวกรองทั้งหมด"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>ล้างตัวกรอง</span>
          </button>
        )}
      </div>
    </div>
  );
};
