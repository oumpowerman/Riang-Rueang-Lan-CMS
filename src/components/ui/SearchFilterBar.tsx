import React from 'react';
import { Filter, RotateCcw, Search, X } from 'lucide-react';
import { CooldownStatus, IngestionFlow } from '../../types/footage.types';
import type { FootagePunchlineFilter } from '../footage/vault/vaultPunchlineFilter';

export type FootageActionFilter =
  | 'ALL'
  | 'CATEGORY_READY_5'
  | 'RECIPE_ALL_NEW'
  | 'RECIPE_SMART_MIX'
  | 'HIGH_VELOCITY_WARNING'
  | 'UNTAGGED_ONLY'
  | 'MISSING_DRIVE_ONLY'
  | 'DUPLICATES_ONLY';

export type FootageLibrarySortBy =
  | 'REST_DAYS_DESC'
  | 'REST_DAYS_ASC'
  | 'NEWEST_CREATED'
  | 'OLDEST_CREATED'
  | 'TITLE_ASC'
  | 'TITLE_DESC'
  | 'ID_ASC'
  | 'ID_DESC'
  | 'USAGE_90D_ASC'
  | 'USAGE_90D_DESC';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTags: string[];
  statusFilter: CooldownStatus | 'ALL';
  flowFilter: IngestionFlow | 'ALL';
  actionFilter: FootageActionFilter;
  onActionFilterChange: (filter: FootageActionFilter) => void;
  punchlineFilter?: FootagePunchlineFilter;
  hasCustomFilter?: boolean;
  onResetFilters: () => void;
}

const EXTERNAL_ACTION_FILTERS: ReadonlySet<FootageActionFilter> = new Set([
  'UNTAGGED_ONLY',
  'MISSING_DRIVE_ONLY',
  'DUPLICATES_ONLY',
]);

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  statusFilter,
  flowFilter,
  actionFilter,
  onActionFilterChange,
  punchlineFilter = 'ALL',
  hasCustomFilter = false,
  onResetFilters,
}) => {
  const hasActiveFilters =
    hasCustomFilter ||
    searchQuery.trim() !== '' ||
    selectedTags.length > 0 ||
    statusFilter !== 'ALL' ||
    flowFilter !== 'ALL' ||
    actionFilter !== 'ALL' ||
    punchlineFilter !== 'ALL';

  const selectActionValue: FootageActionFilter = EXTERNAL_ACTION_FILTERS.has(
    actionFilter
  )
    ? 'ALL'
    : actionFilter;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-2xs">
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
            aria-label="ล้างคำค้นหา"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right: Non-Duplicate Action/Recipe Filter + Single Global Reset Button */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="inline-flex items-center gap-1.5 flex-1 sm:flex-initial">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
          <select
            value={selectActionValue}
            onChange={(e) =>
              onActionFilterChange(e.target.value as FootageActionFilter)
            }
            className={`w-full sm:w-auto px-2.5 py-1.5 text-xs font-semibold border rounded-xl focus:outline-none cursor-pointer truncate transition-colors ${
              selectActionValue !== 'ALL'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 focus:border-indigo-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
            }`}
            aria-label="ตัวกรองเงื่อนไข"
          >
            <option value="ALL">ตัวกรอง: ทั้งหมด</option>
            <option value="CATEGORY_READY_5">พร้อมผลิต (≥5 คลิป)</option>
            <option value="RECIPE_ALL_NEW">สูตร 5 คลิปใหม่</option>
            <option value="RECIPE_SMART_MIX">สูตรผสม (2 ใหม่ + 3 สด)</option>
            <option value="HIGH_VELOCITY_WARNING">คลิปใช้ถี่ / เฝ้าระวัง</option>
          </select>
        </div>

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
