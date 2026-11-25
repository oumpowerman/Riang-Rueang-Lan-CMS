import React from 'react';
import {
  CheckSquare,
  LayoutGrid,
  List,
  Square,
} from 'lucide-react';
import { AnimatedMetricNumber } from './AnimatedMetricNumber';
import { ActiveScopeDescription, VaultViewMode } from './vault.types';
import type {
  FootagePunchlineFilter,
  VaultPunchlineCounts,
} from './vaultPunchlineFilter';

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
  punchlineFilter?: FootagePunchlineFilter;
  punchlineCounts?: VaultPunchlineCounts;
  onPunchlineFilterChange?: (filter: FootagePunchlineFilter) => void;
}

export const VaultResultsHeaderBar: React.FC<VaultResultsHeaderBarProps> = ({
  activeScopeDescription,
  filteredCount,
  paginatedCount,
  isAllPaginatedSelected,
  onToggleSelectAllInPage,
  viewMode,
  onViewModeChange,
  punchlineFilter = 'ALL',
  punchlineCounts,
  onPunchlineFilterChange,
}) => {
  const isCustomScope = activeScopeDescription.key !== 'ALL_VAULT';
  const missingPunchlineCount = punchlineCounts?.missing ?? 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
      {/* Left: Concise Scope, Total Count & Live Missing-Punchline Readout */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 min-w-0">
        {isCustomScope && (
          <>
            <span className="font-bold text-indigo-800 truncate max-w-[160px] sm:max-w-[280px]">
              {activeScopeDescription.label}
            </span>
            <span className="text-slate-300 shrink-0" aria-hidden="true">
              ·
            </span>
          </>
        )}
        <span className="font-extrabold text-xs sm:text-sm text-slate-900 font-mono tabular-nums whitespace-nowrap">
          <AnimatedMetricNumber value={filteredCount} suffix=" คลิป" />
        </span>

        {punchlineCounts && onPunchlineFilterChange && (
          <>
            <span className="text-slate-300 shrink-0" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={() =>
                onPunchlineFilterChange(
                  punchlineFilter === 'MISSING' ? 'ALL' : 'MISSING'
                )
              }
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap font-mono tabular-nums border ${
                punchlineFilter === 'MISSING'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : missingPunchlineCount > 0
                    ? 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-800 border-amber-200/90'
                    : 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-700 border-emerald-200/80'
              }`}
              title={
                punchlineFilter === 'MISSING'
                  ? 'คลิกเพื่อกลับไปดูทั้งหมด'
                  : 'คลิกเพื่อกรองเฉพาะฟุตที่ยังไม่มีคำสร้อย (รวมข้อความพักรอจัดหมวดหมู่/นำเข้าอัตโนมัติ)'
              }
            >
              <span className="font-sans">
                {missingPunchlineCount > 0 ? 'ยังไม่มีคำสร้อย' : 'ครบคำสร้อยแล้ว'}
              </span>
              {missingPunchlineCount > 0 && (
                <span>{missingPunchlineCount.toLocaleString()}</span>
              )}
            </button>
          </>
        )}
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
