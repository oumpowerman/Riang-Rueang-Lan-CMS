import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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
  pageSizeOptions = [6, 12, 24, 48, 96],
  itemLabel = 'รายการ',
  compact = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const [jumpInput, setJumpInput] = useState<string>(String(safePage));

  useEffect(() => {
    setJumpInput(String(safePage));
  }, [safePage]);

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

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpInput, 10);
    if (!Number.isNaN(parsed)) {
      const target = Math.min(Math.max(1, parsed), totalPages);
      onPageChange(target);
      setJumpInput(String(target));
    } else {
      setJumpInput(String(safePage));
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${
        compact
          ? 'pt-2.5 border-t border-[#E8DFD3] text-[11px]'
          : 'bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl px-4 py-3 text-xs shadow-2xs'
      }`}
    >
      {/* Left: Item Range + Optional Page Size Picker */}
      <div className="flex flex-wrap items-center gap-2.5 text-[#6E665E]">
        <span className="font-mono tabular-nums">
          แสดง{' '}
          <span className="font-bold text-[#2D2926]">
            {startIndex.toLocaleString()}
          </span>
          –
          <span className="font-bold text-[#2D2926]">
            {endIndex.toLocaleString()}
          </span>{' '}
          จากทั้งหมด{' '}
          <span className="font-bold text-[#356140]">
            {totalItems.toLocaleString()}
          </span>{' '}
          {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[#C8BCAE]">·</span>
            <label className="text-[#787066] whitespace-nowrap">แสดงหน้าละ:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2 py-1 text-xs font-mono font-bold bg-[#F5EFE6] hover:bg-[#EDE3D5] border border-[#DFD3C3] rounded-lg text-[#3D3731] focus:outline-none cursor-pointer transition-colors"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} {itemLabel}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Controls + Direct Jump Input for Large Archives */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {/* First Page Button */}
          {!compact && totalPages > 4 && (
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => onPageChange(1)}
              className="inline-flex items-center justify-center w-7 h-7 font-semibold text-[#5C544C] bg-white border border-[#E2D8C9] hover:bg-[#F5EFE6] hover:border-[#C8B9A6] disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors cursor-pointer"
              title="หน้าแรกสุด (หน้า 1)"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold text-[#4D4740] bg-white border border-[#E2D8C9] hover:bg-[#F5EFE6] hover:border-[#C8B9A6] disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors cursor-pointer"
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
                    className="px-1.5 text-[#9C9286] font-mono select-none"
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
                  className={`min-w-[30px] h-7 px-2 font-mono font-bold rounded-xl transition-colors cursor-pointer border ${
                    isCurrent
                      ? 'bg-[#E6F0E6] text-[#244B2F] border-[#9BBF99] shadow-2xs'
                      : 'bg-white text-[#5C544C] border-[#E2D8C9] hover:bg-[#FAF6F0] hover:border-[#C8B9A6]'
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
            className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold text-[#4D4740] bg-white border border-[#E2D8C9] hover:bg-[#F5EFE6] hover:border-[#C8B9A6] disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors cursor-pointer"
            title="หน้าถัดไป"
          >
            {!compact && <span>ถัดไป</span>}
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>

          {/* Last Page Button */}
          {!compact && totalPages > 4 && (
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              className="inline-flex items-center justify-center w-7 h-7 font-semibold text-[#5C544C] bg-white border border-[#E2D8C9] hover:bg-[#F5EFE6] hover:border-[#C8B9A6] disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors cursor-pointer"
              title={`หน้าสุดท้าย (หน้า ${totalPages})`}
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Direct Jump-to-Page Form for multi-page archives */}
          {!compact && totalPages > 3 && (
            <form
              onSubmit={handleJumpSubmit}
              className="flex items-center gap-1 pl-1.5 ml-0.5 border-l border-[#E8DFD3]"
            >
              <span className="text-[11px] text-[#787066] whitespace-nowrap">
                ไปหน้า:
              </span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                onBlur={handleJumpSubmit}
                className="w-12 h-7 px-1.5 text-center font-mono font-bold text-xs bg-[#F5EFE6] border border-[#DFD3C3] rounded-lg text-[#2D2926] focus:outline-none focus:border-[#9BBF99] focus:bg-white transition-colors"
                title={`พิมพ์เลขหน้าระหว่าง 1 ถึง ${totalPages} แล้วกด Enter`}
              />
              <span className="text-[11px] font-mono text-[#8C8277]">
                /{totalPages}
              </span>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
