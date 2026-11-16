import React from 'react';
import {
  AlertCircle,
  Filter,
  FolderCheck,
  RotateCcw,
} from 'lucide-react';
import { ComputedFootage } from '../../../types/footage.types';
import { FootageActionFilter } from '../../ui/SearchFilterBar';

interface MissingDriveQueueBannerProps {
  missingDriveFootages: ComputedFootage[];
  actionFilter: FootageActionFilter;
  onActionFilterChange: (filter: FootageActionFilter) => void;
  onOpenQuickDriveLinker: () => void;
}

export const MissingDriveQueueBanner: React.FC<
  MissingDriveQueueBannerProps
> = ({
  missingDriveFootages,
  actionFilter,
  onActionFilterChange,
  onOpenQuickDriveLinker,
}) => {
  if (missingDriveFootages.length === 0) return null;

  const socialOnlyMissingCount = missingDriveFootages.filter((ft) =>
    Boolean(ft.originalUrl?.trim())
  ).length;

  const isFilteredByMissingDrive = actionFilter === 'MISSING_DRIVE_ONLY';

  return (
    <div className="bg-amber-50/90 border border-amber-300/90 rounded-2xl px-3.5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-2xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-xl bg-amber-300/80 text-amber-950 flex items-center justify-center shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
        </div>

        <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs sm:text-sm">
          <span className="font-extrabold text-amber-950 whitespace-nowrap">
            มีฟุตเทจรอลิงก์ Google Drive{' '}
            <span className="font-mono tabular-nums">
              {missingDriveFootages.length}
            </span>{' '}
            รายการ
          </span>

          {socialOnlyMissingCount > 0 && (
            <span className="text-xs text-amber-900/80 font-medium font-mono tabular-nums">
              · ส่งจาก LINE / Social {socialOnlyMissingCount} คลิป
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={onOpenQuickDriveLinker}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <FolderCheck className="w-3.5 h-3.5 shrink-0" />
          <span>วางลิงก์ Drive ด่วน ({missingDriveFootages.length})</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onActionFilterChange(
              isFilteredByMissingDrive ? 'ALL' : 'MISSING_DRIVE_ONLY'
            )
          }
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            isFilteredByMissingDrive
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white hover:bg-amber-100/60 text-amber-950 border-amber-300'
          }`}
        >
          {isFilteredByMissingDrive ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>แสดงทั้งหมด</span>
            </>
          ) : (
            <>
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span>กรองดูในคลัง</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
