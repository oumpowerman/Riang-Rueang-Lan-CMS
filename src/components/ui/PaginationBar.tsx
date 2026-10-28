import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  compact?: boolean;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 12, 24],
  itemLabel = 'รายการ',
  compact = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  if (totalItems === 0) return null;

  const startIndex = (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, safePage * pageSize);

  // Build visible page numbers with ellipsis
  const getPageNumbers = (): (number | 'ELLIPSIS_LEFT' | 'ELLIPSIS_RIGHT')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, 4, 'ELLIPSIS_RIGHT', totalPages];
    }
    if (safePage >= totalPages - 2) {
      return [1, 'ELLIPSIS_LEFT', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'ELLIPSIS_LEFT', safePage - 1, safePage, safePage + 1, 'ELLIPSIS_RIGHT', totalPages];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2.5 ${
        compact
          ? 'pt-2.5 border-t border-slate-100 text-[11px]'
          : 'studio-card border border-slate-200/90 rounded-2xl px-4 py-3 text-xs'
      }`}
    >
      {/* Left: Item Range + Optional Page Size Picker */}
      <div className="flex flex-wrap items-center gap-2.5 text-slate-600">
        <span className="font-mono tabular-nums">
          แสดง <span className="font-bold text-slate-900">{startIndex}</span>–
          <span className="font-bold text-slate-900">{endIndex}</span> จาก{' '}
          <span className="font-bold text-slate-900">{totalItems}</span> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">·</span>
            <label className="text-slate-500 whitespace-nowrap">ต่อหน้า:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2 py-1 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-slate-900 focus:outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-400 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors"
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {!compact && <span>ก่อนหน้า</span>}
          </motion.button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((pageItem) => {
              if (pageItem === 'ELLIPSIS_LEFT' || pageItem === 'ELLIPSIS_RIGHT') {
                return (
                  <span
                    key={pageItem}
                    className="px-1.5 text-slate-400 font-mono select-none"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = pageItem === safePage;
              return (
                <motion.button
                  key={pageItem}
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onPageChange(pageItem)}
                  className={`min-w-[30px] h-7 px-2 font-mono font-bold rounded-xl transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-400'
                  }`}
                >
                  {pageItem}
                </motion.button>
              );
            })}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-400 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors"
            title="หน้าถัดไป"
          >
            {!compact && <span>ถัดไป</span>}
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      )}
    </div>
  );
};
