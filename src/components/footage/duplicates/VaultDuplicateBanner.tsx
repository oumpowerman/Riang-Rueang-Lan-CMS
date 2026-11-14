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
    <div className="bg-[#FEF6EC] border border-[#F2D5B3] rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shadow-2xs">
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-[#FADDB8] border border-[#ECC08C] text-[#7A4112] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <CopyCheck className="w-4 h-4" />
        </div>

        <div className="min-w-0 space-y-1">
          <div className="text-xs sm:text-sm font-extrabold text-[#5D320E] flex flex-wrap items-center gap-1.5">
            <span>
              ตรวจพบฟุตเทจเข้าข่ายซ้ำ{' '}
              <span className="font-mono tabular-nums">
                {duplicateScan.duplicateClusterCount}
              </span>{' '}
              กลุ่ม
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-white/90 border border-[#ECC08C] text-[#7A4112] font-mono tabular-nums text-[11px] font-bold">
              รวม {duplicateScan.totalItemsInClusters} คลิป (ซ้ำเกิน{' '}
              {duplicateScan.redundantCount})
            </span>

            {activeReasons.map(([reason, count]) => (
              <span
                key={reason}
                className="px-2 py-0.5 rounded-lg bg-[#FFFDF9] border border-[#EFE0CC] text-[#7D5622] text-[11px] font-semibold tabular-nums"
              >
                {getDuplicateReasonLabel(reason)} {count}
              </span>
            ))}
          </div>

          <p className="text-[11px] sm:text-xs text-[#85582E]">
            ตรวจสอบเปรียบเทียบ เลือกตัวหลัก และยุบรวมพร้อมย้ายประวัติ EP กับแท็กทั้งหมดได้ทันทีโดยข้อมูลไม่สูญหาย
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={onOpenMergeModal}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E89B4C] hover:bg-[#DC8B38] text-[#2F1A07] font-extrabold text-xs transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <GitMerge className="w-3.5 h-3.5 shrink-0" />
          <span>
            จัดการและรวมตัวซ้ำ ({duplicateScan.duplicateClusterCount})
          </span>
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
              <span>
                ดูเฉพาะคลิปซ้ำ ({duplicateScan.totalItemsInClusters})
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
