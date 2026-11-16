import React from 'react';
import { GitMerge, Loader2, SkipForward, Sparkles } from 'lucide-react';
import { DuplicateCluster, DuplicateMergePlan } from '../../../utils/duplicateClusterScanner';

export type DuplicateModalViewMode = 'SINGLE_QUEUE' | 'ALL_LIST';

interface DuplicateMergeFooterProps {
  viewMode: DuplicateModalViewMode;
  totalClustersCount: number;
  queueClustersCount: number;
  skippedCount: number;
  allPendingPlansCount: number;
  totalPendingDuplicatesCount: number;
  activeCluster: DuplicateCluster | null;
  activeClusterPlan: DuplicateMergePlan | null;
  isMerging: boolean;
  isConfirmingAutoMergeAll: boolean;
  onSetConfirmingAutoMergeAll: (confirm: boolean) => void;
  onExecuteAutoMergeAll: () => void;
  onMergeActiveCluster: (cluster: DuplicateCluster) => void;
  onSkipActiveCluster: (clusterId: string) => void;
  onClose: () => void;
}

export const DuplicateMergeFooter: React.FC<DuplicateMergeFooterProps> = ({
  viewMode,
  totalClustersCount,
  queueClustersCount,
  skippedCount,
  allPendingPlansCount,
  totalPendingDuplicatesCount,
  activeCluster,
  activeClusterPlan,
  isMerging,
  isConfirmingAutoMergeAll,
  onSetConfirmingAutoMergeAll,
  onExecuteAutoMergeAll,
  onMergeActiveCluster,
  onSkipActiveCluster,
  onClose,
}) => {
  if (viewMode === 'SINGLE_QUEUE') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="text-[11px] sm:text-xs text-[#6F6053] font-medium">
          {totalClustersCount > 0 ? (
            <span>
              รอตรวจ{' '}
              <strong className="font-mono tabular-nums text-[#3D332A]">
                {queueClustersCount}
              </strong>{' '}
              กลุ่ม
              {skippedCount > 0 && (
                <>
                  {' '}
                  · ข้ามชั่วคราว{' '}
                  <strong className="font-mono tabular-nums text-[#8A4A18]">
                    {skippedCount}
                  </strong>{' '}
                  กลุ่ม
                </>
              )}
            </span>
          ) : (
            <span>ไม่พบคลิปที่ชื่อซ้ำหรือลิงก์ซ้ำในคลังแล้ว</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          {activeCluster && (
            <>
              <button
                type="button"
                disabled={isMerging}
                onClick={() => onSkipActiveCluster(activeCluster.clusterId)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF5EE] hover:bg-[#EFE7DC] disabled:opacity-50 border border-[#E2D5C4] text-[#5D4938] font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <SkipForward className="w-3.5 h-3.5 shrink-0" />
                <span>ข้ามชั่วคราว</span>
              </button>

              <button
                type="button"
                disabled={isMerging || !activeClusterPlan}
                onClick={() => onMergeActiveCluster(activeCluster)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#DDF0E2] hover:bg-[#CBE7D2] disabled:opacity-50 disabled:cursor-not-allowed border border-[#A8D5BA] text-[#1E5631] font-extrabold text-xs transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              >
                {isMerging ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <GitMerge className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>
                  {activeClusterPlan
                    ? `รวมกลุ่มนี้ (${activeClusterPlan.duplicateIds.length} ตัวซ้ำ ➔ ${activeClusterPlan.survivorId})`
                    : 'เลือกตัวซ้ำอย่างน้อย 1 คลิป'}
                </span>
              </button>
            </>
          )}

          <button
            type="button"
            disabled={isMerging}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#F3ECE2] border border-[#DFD4C7] text-[#3D332A] font-bold text-xs transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="text-[11px] sm:text-xs text-[#6F6053] font-medium">
        {totalClustersCount > 0 ? (
          <span>
            เลือกแสดง{' '}
            <strong className="font-mono tabular-nums text-[#3D332A]">
              {allPendingPlansCount}
            </strong>{' '}
            กลุ่ม · พร้อมยุบรวมและลบตัวซ้ำ{' '}
            <strong className="font-mono tabular-nums text-[#9B2C38]">
              {totalPendingDuplicatesCount}
            </strong>{' '}
            คลิป
          </span>
        ) : (
          <span>ไม่พบคลิปที่ชื่อซ้ำหรือลิงก์ซ้ำในคลังแล้ว</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 flex-wrap">
        {allPendingPlansCount > 0 && !isConfirmingAutoMergeAll && (
          <button
            type="button"
            disabled={isMerging}
            onClick={() => onSetConfirmingAutoMergeAll(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#E89B4C] hover:bg-[#DC8B38] disabled:opacity-50 text-[#2F1A07] font-extrabold text-xs transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>
              รวมทั้งหมดอัตโนมัติ ({allPendingPlansCount} กลุ่ม · ลบ{' '}
              {totalPendingDuplicatesCount} ตัวซ้ำ)
            </span>
          </button>
        )}

        {isConfirmingAutoMergeAll && (
          <div className="flex items-center gap-1.5 bg-[#FDF1F2] border border-[#F0C8CE] px-2.5 py-1 rounded-xl">
            <span className="text-xs font-bold text-[#9B2C38]">
              ยืนยันรวม {allPendingPlansCount} กลุ่ม (ลบ{' '}
              {totalPendingDuplicatesCount} คลิป)?
            </span>
            <button
              type="button"
              disabled={isMerging}
              onClick={onExecuteAutoMergeAll}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#C9404F] hover:bg-[#B23240] text-white font-extrabold text-xs cursor-pointer whitespace-nowrap"
            >
              {isMerging ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <GitMerge className="w-3.5 h-3.5" />
              )}
              <span>ยืนยันรวมทั้งหมด</span>
            </button>
            <button
              type="button"
              disabled={isMerging}
              onClick={() => onSetConfirmingAutoMergeAll(false)}
              className="px-2 py-1 rounded-lg bg-white border border-[#E2D5C4] text-[#5D4938] text-xs font-bold cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={isMerging}
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white hover:bg-[#F3ECE2] border border-[#DFD4C7] text-[#3D332A] font-bold text-xs transition-colors cursor-pointer"
        >
          ปิด
        </button>
      </div>
    </div>
  );
};
