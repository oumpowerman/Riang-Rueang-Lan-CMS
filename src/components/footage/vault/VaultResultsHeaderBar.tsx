import React from 'react';
import {
  CheckSquare,
  LayoutGrid,
  List,
  Square,
} from 'lucide-react';
import { AnimatedMetricNumber } from './AnimatedMetricNumber';
import { ActiveScopeDescription, VaultViewMode } from './vault.types';

export interface VaultResultsHeaderBarProps {
  activeScopeDescription: ActiveScopeDescription;
  filteredCount: number;
  scopedTotalCount: number;
  totalVaultCount: number;
  paginatedCount: number;
  stagingCount: number;
  selectedBatchCount: number;
  isAllPaginatedSelected: boolean;
  isAllStagingSelected: boolean;
  onToggleSelectAllInPage: () => void;
  onSelectAllInStaging: () => void;
  onClearBatchSelection: () => void;
  viewMode: VaultViewMode;
  onViewModeChange: (mode: VaultViewMode) => void;
}

export const VaultResultsHeaderBar: React.FC<VaultResultsHeaderBarProps> = ({
  activeScopeDescription,
  filteredCount,
  paginatedCount,
  isAllPaginatedSelected,
  onToggleSelectAllInPage,
  viewMode,
  onViewModeChange,
}) => {
  const isCustomScope = activeScopeDescription.key !== 'ALL_VAULT';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-2xs">
      {/* Left: Concise Scope & Count */}
      <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
        {isCustomScope && (
          <>
            <span className="font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md truncate max-w-[140px] sm:max-w-[260px]">
              {activeScopeDescription.label}
            </span>
            <span className="text-slate-300 shrink-0">·</span>
          </>
        )}
        <span className="font-extrabold text-xs sm:text-sm text-slate-900 tabular-nums whitespace-nowrap">
          <AnimatedMetricNumber value={filteredCount} suffix=" คลิป" />
        </span>
      </div>

      {/* Right: Select Current Page + View Mode Switcher */}
      <div className="flex items-center gap-2 shrink-0">
        {paginatedCount > 0 && (
          <button
            type="button"
            onClick={onToggleSelectAllInPage}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
              isAllPaginatedSelected
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200'
            }`}
          >
            {isAllPaginatedSelected ? (
              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span>
              <span className="hidden sm:inline">เลือกหน้านี้</span>
              <span className="sm:hidden">หน้านี้</span> ({paginatedCount})
            </span>
          </button>
        )}

        <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 border border-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => onViewModeChange('GRID')}
            className={`inline-flex items-center gap-1 px-2 md:px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'GRID'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="มุมมองการ์ด"
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">การ์ด</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('TABLE')}
            className={`inline-flex items-center gap-1 px-2 md:px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'TABLE'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="มุมมองตาราง"
          >
            <List className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">ตาราง</span>
          </button>
        </div>
      </div>
    </div>
  );
};
