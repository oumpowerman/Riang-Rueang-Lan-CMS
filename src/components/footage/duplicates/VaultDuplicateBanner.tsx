import React from 'react';
import { CopyCheck, Filter, GitMerge, RotateCcw } from 'lucide-react';
import {
  DuplicateMatchReason,
  DuplicateScanSummary,
  getDuplicateReasonLabel,
} from '../../../utils/duplicateClusterScanner';
import { FootageActionFilter } from '../../ui/SearchFilterBar';

interface VaultDuplicateBannerProps {
  duplicateScan: DuplicateScanSummary;
  actionFilter: FootageActionFilter;
  onActionFilterChange: (filter: FootageActionFilter) => void;
  onOpenMergeModal: () => void;
}

export const VaultDuplicateBanner: React.FC<VaultDuplicateBannerProps> = ({
  duplicateScan,
  actionFilter,
  onActionFilterChange,
  onOpenMergeModal,
}) => {
  if (duplicateScan.duplicateClusterCount === 0) return null;

  const isFilteredByDuplicates = actionFilter === 'DUPLICATES_ONLY';

  const reasonCounts: Record<DuplicateMatchReason, number> = {
    TITLE: 0,
    DRIVE_LINK: 0,
    ORIGINAL_LINK: 0,
  };
  duplicateScan.clusters.forEach((c) => {
    c.reasons.forEach((r) => {
      reasonCounts[r] += 1;
    });
  });

  const activeReasons = (
    Object.entries(reasonCounts) as Array<[DuplicateMatchReason, number]>
  ).filter(([, count]) => count > 0);

  return (
    <div className="bg-[#FEF6EC] border border-[#F2D5B3] rounded-2xl px-3.5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-2xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-xl bg-[#FADDB8] border border-[#ECC08C] text-[#7A4112] flex items-center justify-center shrink-0">
          <CopyCheck className="w-3.5 h-3.5" />
        </div>

        <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs sm:text-sm">
          <span className="font-extrabold text-[#5D320E] whitespace-nowrap">
            พบฟุตเทจเข้าข่ายซ้ำ{' '}
            <span className="font-mono tabular-nums">
              {duplicateScan.duplicateClusterCount}
            </span>{' '}
            กลุ่ม
          </span>

          <span className="text-xs text-[#85582E] font-medium font-mono tabular-nums">
            · รวม {duplicateScan.totalItemsInClusters} คลิป (ซ้ำเกิน{' '}
            {duplicateScan.redundantCount})
            {activeReasons.map(([reason, count]) => (
              <span key={reason}>
                {' '}
                · {getDuplicateReasonLabel(reason)} {count}
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={onOpenMergeModal}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E89B4C] hover:bg-[#DC8B38] text-[#2F1A07] font-extrabold text-xs transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <GitMerge className="w-3.5 h-3.5 shrink-0" />
          <span>จัดการตัวซ้ำ ({duplicateScan.duplicateClusterCount})</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onActionFilterChange(
              isFilteredByDuplicates ? 'ALL' : 'DUPLICATES_ONLY'
            )
          }
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            isFilteredByDuplicates
              ? 'bg-[#3D332A] text-white border-[#3D332A]'
              : 'bg-white hover:bg-[#FDECD6] text-[#5D320E] border-[#ECC08C]'
          }`}
        >
          {isFilteredByDuplicates ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>แสดงทั้งหมด</span>
            </>
          ) : (
            <>
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span>ดูเฉพาะคลิปซ้ำ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
