import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface DuplicateQueueNavigatorProps {
  currentIndex: number;
  totalInQueue: number;
  skippedCount: number;
  isMerging: boolean;
  onPrev: () => void;
  onNext: () => void;
  onRestoreSkipped: () => void;
}

export const DuplicateQueueNavigator: React.FC<DuplicateQueueNavigatorProps> = ({
  currentIndex,
  totalInQueue,
  skippedCount,
  isMerging,
  onPrev,
  onNext,
  onRestoreSkipped,
}) => {
  const safeTotal = Math.max(1, totalInQueue);
  const progressPct = Math.round(((currentIndex + 1) / safeTotal) * 100);

  return (
    <div className="bg-white border border-[#E8DFD3] rounded-2xl px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-bold text-[#3D332A]">
          <span className="px-2.5 py-1 rounded-lg bg-[#FAF2E1] border border-[#DEC190] text-[#6E4919] font-mono tabular-nums font-extrabold">
            กลุ่มที่ {currentIndex + 1} / {totalInQueue}
          </span>
          <span className="text-[#7D6E61] font-medium">
            โหมดตรวจทีละกลุ่ม
          </span>
        </div>

        {/* Subtle Queue Progress Bar */}
        <div className="w-24 sm:w-32 h-1.5 bg-[#EFE7DC] rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-[#386B46] rounded-full transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {skippedCount > 0 && (
          <button
            type="button"
            disabled={isMerging}
            onClick={onRestoreSkipped}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FEF6E8] hover:bg-[#F9EBD0] border border-[#F0DFC8] text-[#7D5622] text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="นำกลุ่มที่กดข้ามชั่วคราวกลับมาแสดงในคิวตรวจ"
          >
            <RotateCcw className="w-3 h-3 shrink-0" />
            <span>คืนค่าที่ข้าม ({skippedCount})</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 shrink-0">
        <button
          type="button"
          disabled={isMerging || currentIndex <= 0}
          onClick={onPrev}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed border border-[#E2D5C4] text-[#4D4237] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>ก่อนหน้า</span>
        </button>

        <button
          type="button"
          disabled={isMerging || currentIndex >= totalInQueue - 1}
          onClick={onNext}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed border border-[#E2D5C4] text-[#4D4237] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>ถัดไป</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
