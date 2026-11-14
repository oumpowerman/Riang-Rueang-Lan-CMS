import React from 'react';
import {
  AlertCircle,
  Filter,
  FolderCheck,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import { ComputedFootage } from '../../../types/footage.types';
import { FootageActionFilter } from '../../ui/SearchFilterBar';

interface MissingDriveQueueBannerProps {
  missingDriveFootages: ComputedFootage[];
  actionFilter: FootageActionFilter;
  onActionFilterChange: (filter: FootageActionFilter) => void;
  onOpenQuickDriveLinker: () => void;
  onOpenLineOaModal: () => void;
}

export const MissingDriveQueueBanner: React.FC<
  MissingDriveQueueBannerProps
> = ({
  missingDriveFootages,
  actionFilter,
  onActionFilterChange,
  onOpenQuickDriveLinker,
  onOpenLineOaModal,
}) => {
  if (missingDriveFootages.length === 0) return null;

  const socialOnlyMissingCount = missingDriveFootages.filter((ft) =>
    Boolean(ft.originalUrl?.trim())
  ).length;

  const isFilteredByMissingDrive = actionFilter === 'MISSING_DRIVE_ONLY';

  return (
    <div className="bg-amber-50/90 border border-amber-300/90 rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-amber-400/90 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <AlertCircle className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-extrabold text-amber-950 flex flex-wrap items-center gap-1.5">
            <span>
              มีฟุตเทจรอลิงก์ Google Drive {missingDriveFootages.length} รายการ
            </span>
            {socialOnlyMissingCount > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-white/90 border border-amber-300 text-amber-900 font-mono text-[11px] font-bold">
                มีแต่ลิงก์ Social / ส่งจาก LINE {socialOnlyMissingCount} คลิป
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-amber-900/80 truncate">
            กดเปิดคิววางลิงก์ Drive ด่วนเพื่อเปิดลิงก์ต้นฉบับ คัดลอกชื่อไฟล์มาตรฐาน และวางลิงก์ Drive เรียงรายการได้ทันที
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={onOpenQuickDriveLinker}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
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

        <button
          type="button"
          onClick={onOpenLineOaModal}
          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-amber-300 hover:border-emerald-300 text-emerald-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          title="เปิดหน้าต่างโค้ดเชื่อม LINE OA"
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden md:inline">ตั้งค่า LINE OA</span>
        </button>
      </div>
    </div>
  );
};
