import React from 'react';
import {
  CheckSquare,
  Inbox,
  LayoutGrid,
  List,
  Square,
  X,
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
  stagingCount,
  selectedBatchCount,
  isAllPaginatedSelected,
  isAllStagingSelected,
  onToggleSelectAllInPage,
  onSelectAllInStaging,
  onClearBatchSelection,
  viewMode,
  onViewModeChange,
}) => {
  const isCustomScope = activeScopeDescription.key !== 'ALL_VAULT';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
      {/* Left: Concise Scope & Count */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        {isCustomScope && (
          <>
            <span className="font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
              {activeScopeDescription.label}
            </span>
            <span className="text-slate-300">·</span>
          </>
        )}
        <span className="font-extrabold text-sm text-slate-900 tabular-nums">
          <AnimatedMetricNumber value={filteredCount} suffix=" คลิป" />
        </span>
      </div>

      {/* Right: Multi-Select Action Buttons + View Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {paginatedCount > 0 && (
            <button
              type="button"
              onClick={onToggleSelectAllInPage}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                isAllPaginatedSelected
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200'
              }`}
            >
              {isAllPaginatedSelected ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>เลือกหน้านี้ ({paginatedCount})</span>
            </button>
          )}

          {stagingCount > 0 && (
            <button
              type="button"
              onClick={onSelectAllInStaging}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                isAllStagingSelected
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>เลือกไม่มีหมวด ({stagingCount})</span>
            </button>
          )}

          {selectedBatchCount > 0 && (
            <button
              type="button"
              onClick={onClearBatchSelection}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้าง ({selectedBatchCount})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 border border-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => onViewModeChange('GRID')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'GRID'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>การ์ด</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('TABLE')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'TABLE'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>ตาราง</span>
          </button>
        </div>
      </div>
    </div>
  );
};
