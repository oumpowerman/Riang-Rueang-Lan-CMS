import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
} from 'lucide-react';

interface SupabasePaginationBarProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalFilteredCount: number;
  currentPageItemCount: number;
  isAllCurrentPageSelected: boolean;
  isAllFilteredSelected: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectAllFiltered: () => void;
}

export const PAGE_SIZE_OPTIONS = [50, 100, 250, 500] as const;

export const SupabasePaginationBar: React.FC<SupabasePaginationBarProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalFilteredCount,
  currentPageItemCount,
  isAllCurrentPageSelected,
  isAllFilteredSelected,
  onPageChange,
  onPageSizeChange,
  onSelectAllFiltered,
}) => {
  if (totalFilteredCount === 0) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalFilteredCount);

  return (
    <div className="bg-white border-t border-[#E8DFD3] shrink-0">
      {/* Cross-page bulk selection banner when user checks the current page header */}
      {totalPages > 1 && isAllCurrentPageSelected && !isAllFilteredSelected && (
        <div className="px-4 py-1.5 bg-[#EEF5EE] border-b border-[#BAD8BF] flex flex-wrap items-center justify-center gap-2 text-xs text-[#1C4824]">
          <span>
            เลือกทั้งหน้าปัจจุบันแล้ว{' '}
            <strong className="font-mono tabular-nums">
              {currentPageItemCount}
            </strong>{' '}
            รายการ
          </span>
          <button
            type="button"
            onClick={onSelectAllFiltered}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold bg-[#3B6845] text-white hover:bg-[#2D5236] transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>
              เลือกทั้งหมดทุกหน้า ({totalFilteredCount.toLocaleString()} รายการ)
            </span>
          </button>
        </div>
      )}

      {/* Main Pagination Control Row */}
      <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E5F52]">
        {/* Left: Range Summary & Page Size Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span>
            แสดง{' '}
            <strong className="font-mono tabular-nums text-[#2D241E]">
              {startIdx.toLocaleString()}–{endIdx.toLocaleString()}
            </strong>{' '}
            จาก{' '}
            <strong className="font-mono tabular-nums text-[#2D241E]">
              {totalFilteredCount.toLocaleString()}
            </strong>{' '}
            รายการ
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">แถวต่อหน้า:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-[#E3D8CB] bg-[#FAF8F5] text-xs font-mono tabular-nums font-semibold text-[#3D332A] focus:outline-none focus:ring-1 focus:ring-[#8FA892] cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} รายการ
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Page Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-[#E3D8CB] bg-white hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="หน้าแรก"
          >
            <ChevronsLeft className="w-3.5 h-3.5 text-[#524538]" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-[#E3D8CB] bg-white hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#524538]" />
          </button>

          <span className="px-3 py-1 font-mono tabular-nums text-xs font-bold text-[#2D241E]">
            หน้า {currentPage.toLocaleString()} / {totalPages.toLocaleString()}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-[#E3D8CB] bg-white hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="หน้าถัดไป"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#524538]" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-[#E3D8CB] bg-white hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="หน้าสุดท้าย"
          >
            <ChevronsRight className="w-3.5 h-3.5 text-[#524538]" />
          </button>
        </div>
      </div>
    </div>
  );
};
