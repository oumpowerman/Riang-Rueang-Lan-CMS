import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Inbox,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import {
  FootageRowFilterMode,
  ParsedSheetRow,
  SheetSyncSummaryStats,
  TableRowDensity,
} from './sheetImport.types';

interface SheetFootageRowsTableProps {
  parsedRows: ParsedSheetRow[];
  stats: SheetSyncSummaryStats;
  filterMode: FootageRowFilterMode;
  onChangeFilterMode: (mode: FootageRowFilterMode) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  excludedRowIndices: Set<number>;
  onToggleRowSelection: (rowIndex: number) => void;
  onBatchSetRowSelection: (rowIndices: number[], include: boolean) => void;
  autoCreateMissingFootage: boolean;
  rowDensity: TableRowDensity;
}

export const SheetFootageRowsTable: React.FC<SheetFootageRowsTableProps> = ({
  parsedRows,
  stats,
  filterMode,
  onChangeFilterMode,
  searchQuery,
  onChangeSearchQuery,
  excludedRowIndices,
  onToggleRowSelection,
  onBatchSetRowSelection,
  autoCreateMissingFootage,
  rowDensity,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(50);
  const [expandedTagRows, setExpandedTagRows] = useState<Set<number>>(
    new Set()
  );

  // Filter rows by status mode + live search query
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return parsedRows.filter((row) => {
      if (filterMode === 'MATCHED_ONLY' && row.matchedFootage === null) {
        return false;
      }
      if (filterMode === 'STAGING_ONLY' && !row.isInStaging) {
        return false;
      }
      if (filterMode === 'UNMATCHED_ONLY' && row.matchedFootage !== null) {
        return false;
      }
      if (filterMode === 'DUPLICATE_ONLY' && row.occurrenceCountInSheet <= 1) {
        return false;
      }

      if (!q) return true;

      const matchTitle = row.title.toLowerCase().includes(q);
      const matchFtId =
        row.matchedFootage?.id.toLowerCase().includes(q) || false;
      const matchEp = row.episodeTitle.toLowerCase().includes(q);
      const matchTag = row.finalTagNames.some((t) =>
        t.toLowerCase().includes(q)
      );

      return matchTitle || matchFtId || matchEp || matchTag;
    });
  }, [parsedRows, filterMode, searchQuery]);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, searchQuery, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  const selectedCountInFiltered = useMemo(() => {
    let count = 0;
    filteredRows.forEach((r) => {
      if (!excludedRowIndices.has(r.rowIndex)) {
        count += 1;
      }
    });
    return count;
  }, [filteredRows, excludedRowIndices]);

  const allFilteredSelected =
    filteredRows.length > 0 && selectedCountInFiltered === filteredRows.length;

  const handleToggleAllFiltered = () => {
    const indices = filteredRows.map((r) => r.rowIndex);
    onBatchSetRowSelection(indices, !allFilteredSelected);
  };

  const toggleExpandTagsForRow = (rowIndex: number) => {
    setExpandedTagRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  };

  const cellPadClass =
    rowDensity === 'COMPACT' ? 'py-1.5 px-3' : 'py-2.5 px-3.5';

  const filterButtons: Array<{
    mode: FootageRowFilterMode;
    label: string;
    count: number;
    activeTextClass: string;
    show?: boolean;
  }> = [
    {
      mode: 'ALL',
      label: 'ทั้งหมด',
      count: stats.totalRows,
      activeTextClass: 'text-[#3D332A]',
      show: true,
    },
    {
      mode: 'MATCHED_ONLY',
      label: 'ตรงกับคลัง',
      count: stats.matchedCount,
      activeTextClass: 'text-[#1C4824]',
      show: true,
    },
    {
      mode: 'STAGING_ONLY',
      label: 'ไร้หมวดหมู่',
      count: stats.stagingMatchedCount,
      activeTextClass: 'text-[#734B17]',
      show: true,
    },
    {
      mode: 'UNMATCHED_ONLY',
      label: 'ไม่พบในคลัง',
      count: stats.unmatchedCount,
      activeTextClass: 'text-[#8A4D1F]',
      show: true,
    },
    {
      mode: 'DUPLICATE_ONLY',
      label: 'ซ้ำข้าม EP',
      count: stats.duplicateRowsInSheetCount,
      activeTextClass: 'text-[#734B17]',
      show: stats.duplicateRowsInSheetCount > 0,
    },
  ];

  const transitionKey = `${filterMode}-p${safePage}-s${pageSize}-${
    searchQuery.trim() ? 'q' : 'all'
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden"
    >
      {/* Unified Single-Bar Filter & KPI Toolbar (Flushed directly under Modal Header) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 px-4 sm:px-5 py-2 bg-[#FAF8F5] border-b border-[#E8DFD3] shrink-0">
        {/* Status & KPI Filter Buttons with Sliding Pill Indicator */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EFE7DC] rounded-xl text-xs">
          {filterButtons
            .filter((btn) => btn.show !== false)
            .map((btn) => {
              const isActive = filterMode === btn.mode;
              return (
                <button
                  key={btn.mode}
                  type="button"
                  onClick={() => onChangeFilterMode(btn.mode)}
                  className={`relative px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? btn.activeTextClass
                      : 'text-[#6E5F52] hover:text-[#3D332A]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sheetFootageFilterPill"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1">
                    <span>{btn.label}</span>
                    <span className="font-mono">
                      ({btn.count.toLocaleString()})
                    </span>
                  </span>
                </button>
              );
            })}
        </div>

        {/* Live Search Input + Selection Summary */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อคลิป, FT-xxxx, #แท็ก หรือชื่อ EP..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#E3D8CB] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#8FA892]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onChangeSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleAllFiltered}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer whitespace-nowrap"
          >
            {allFilteredSelected
              ? `ยกเลิกเลือก (${filteredRows.length.toLocaleString()})`
              : `เลือกทั้งหมด (${filteredRows.length.toLocaleString()})`}
          </button>
        </div>
      </div>

      {/* Full-Bleed Scrollable Data Table with Framer Motion Filter Transition */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#FDFBF7] text-[#6E5F52] sticky top-0 border-b border-[#E8DFD3] font-bold z-10 shadow-2xs">
            <tr>
              <th className="py-2 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={handleToggleAllFiltered}
                  className="rounded border-[#C5B49E] text-[#3B6845] focus:ring-[#3B6845] cursor-pointer"
                  title="เลือก/ยกเลิกทั้งหมดในผลลัพธ์ที่กรอง"
                />
              </th>
              <th className="py-2 px-2.5 w-12 text-right font-mono">#</th>
              <th className="py-2 px-3">คอลัมน์ A: ชื่อฟุตเทจ</th>
              <th className="py-2 px-3">สถานะในคลัง</th>
              <th className="py-2 px-3">คอลัมน์ B: แท็กที่จะผสาน</th>
              <th className="py-2 px-3">คอลัมน์ C–D: จัดเข้าคลิปหลัก (EP)</th>
            </tr>
          </thead>

          <AnimatePresence mode="wait">
            <motion.tbody
              key={transitionKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="divide-y divide-[#F2EBE0]"
            >
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#8C7B6C]">
                    ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isMatched = row.matchedFootage !== null;
                  const isSelected = !excludedRowIndices.has(row.rowIndex);
                  const isTagsExpanded = expandedTagRows.has(row.rowIndex);
                  const visibleTagLimit = isTagsExpanded ? 999 : 3;
                  const visibleTags = row.finalTagNames.slice(
                    0,
                    visibleTagLimit
                  );
                  const hiddenTagCount =
                    row.finalTagNames.length - visibleTags.length;

                  return (
                    <tr
                      key={row.rowIndex}
                      className={`transition-colors ${
                        !isSelected
                          ? 'bg-[#F7F3EE]/60 opacity-55'
                          : isMatched
                          ? 'hover:bg-[#FAF7F2]'
                          : 'bg-[#FFFBF8] hover:bg-[#FFF7F0]'
                      }`}
                    >
                      <td className={`${cellPadClass} text-center`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleRowSelection(row.rowIndex)}
                          className="rounded border-[#C5B49E] text-[#3B6845] focus:ring-[#3B6845] cursor-pointer"
                        />
                      </td>

                      <td
                        className={`${cellPadClass} text-right text-[#998A7C] font-mono tabular-nums`}
                      >
                        {row.rowIndex}
                      </td>

                      <td className={`${cellPadClass} max-w-sm`}>
                        <div
                          className="font-extrabold text-[#3D332A] truncate"
                          title={`ชื่อฟุตเทจเต็ม: ${row.title}${
                            row.matchedFootage
                              ? ` (ตรงกับ ${row.matchedFootage.id} · ${row.matchedFootage.standardFileName})`
                              : ''
                          }`}
                        >
                          {row.title}
                        </div>
                        {row.occurrenceCountInSheet > 1 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#734B17] mt-0.5">
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>
                              ซ้ำในชีท {row.occurrenceCountInSheet} ครั้ง
                              (แชร์ฟุตเดียวกัน)
                            </span>
                          </span>
                        )}
                      </td>

                      <td className={`${cellPadClass} whitespace-nowrap`}>
                        {isMatched ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF]"
                              title={`ไฟล์ในคลัง: ${row.matchedFootage?.standardFileName}`}
                            >
                              <Check className="w-3 h-3 text-[#3B6845]" />
                              <span>{row.matchedFootage?.id}</span>
                            </span>
                            {row.isInStaging && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#FEF8ED] text-[#734B17] border border-[#EDD7AF]"
                                title="คลิปนี้ยังไม่มีหมวดหมู่ ระบบจะติดแท็กและนำออกจากพื้นที่พักทันที"
                              >
                                <Inbox className="w-3 h-3 text-[#8A5A22]" />
                                <span>พัก➔จัดหมวด</span>
                              </span>
                            )}
                          </div>
                        ) : autoCreateMissingFootage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#FEF8ED] text-[#734B17] border border-[#EDD7AF]">
                            <Plus className="w-3 h-3 text-[#734B17]" />
                            <span>สร้างฟุตใหม่</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#FDF4EB] text-[#8A4D1F] border border-[#EBD1BE]">
                            <AlertCircle className="w-3 h-3 text-[#8A4D1F]" />
                            <span>ไม่พบในคลัง (ข้าม)</span>
                          </span>
                        )}
                      </td>

                      <td className={cellPadClass}>
                        <div className="flex items-center gap-1 flex-wrap">
                          {visibleTags.map((name) => {
                            const isNew = row.tagsToCreate.includes(name);
                            return (
                              <span
                                key={name}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold border ${
                                  isNew
                                    ? 'bg-[#FEF8ED] text-[#734B17] border-[#EDD7AF]'
                                    : 'bg-[#EEF5EE] text-[#254B2D] border-[#BAD8BF]'
                                }`}
                                title={
                                  isNew
                                    ? `แท็กใหม่ #${name} (จะสร้างอัตโนมัติ)`
                                    : `แท็กที่มีในระบบ #${name}`
                                }
                              >
                                <span>#{name}</span>
                                {isNew && (
                                  <span className="text-[10px] text-[#8A4D1F]">
                                    (ใหม่)
                                  </span>
                                )}
                              </span>
                            );
                          })}

                          {hiddenTagCount > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                toggleExpandTagsForRow(row.rowIndex)
                              }
                              className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer"
                              title={`คลิกเพื่อดูแท็กทั้งหมด (${row.finalTagNames
                                .map((t) => `#${t}`)
                                .join(' ')})`}
                            >
                              +{hiddenTagCount} แท็ก
                            </button>
                          )}

                          {isTagsExpanded && row.finalTagNames.length > 3 && (
                            <button
                              type="button"
                              onClick={() =>
                                toggleExpandTagsForRow(row.rowIndex)
                              }
                              className="px-1.5 py-0.5 rounded text-xs font-bold text-[#7D6E61] hover:text-[#3D332A] underline cursor-pointer"
                            >
                              ย่อ
                            </button>
                          )}
                        </div>
                      </td>

                      <td className={cellPadClass}>
                        {row.episodeTitle ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#FAF7F2] text-[#3D332A] border border-[#E2D5C4]"
                              title={`จัดอยู่ในคลิปหลัก: ${row.episodeTitle}`}
                            >
                              <Film className="w-3 h-3 text-[#3B6845]" />
                              <span>{row.episodeTitle}</span>
                            </span>
                            {row.episodeUrl && (
                              <a
                                href={row.episodeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#3B6845] hover:text-[#1C4824]"
                                title={`เปิดลิงก์: ${row.episodeUrl}`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#A39485] italic text-xs">
                            (เฉพาะติดแท็กฟุตเทจ)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </motion.tbody>
          </AnimatePresence>
        </table>
      </div>

      {/* Pinned Pagination Footer Bar */}
      <div className="px-4 sm:px-5 py-2 bg-[#FDFBF7] border-t border-[#E8DFD3] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E5F52] shrink-0 mt-auto">
        <div className="flex items-center gap-3 flex-wrap">
          <span>
            แสดงแถวที่{' '}
            <strong className="font-mono text-[#3D332A]">
              {filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filteredRows.length)}
            </strong>{' '}
            จาก{' '}
            <strong className="font-mono text-[#3D332A]">
              {filteredRows.length.toLocaleString()}
            </strong>{' '}
            รายการ (เลือกซิงค์{' '}
            <strong className="font-mono text-[#1C4824]">
              {selectedCountInFiltered.toLocaleString()}
            </strong>{' '}
            แถว)
          </span>

          <div className="flex items-center gap-1.5">
            <span>แสดงหน้าละ:</span>
            <select
              value={pageSize}
              onChange={(e) =>
                setPageSize(Number(e.target.value) as 25 | 50 | 100)
              }
              className="px-2 py-0.5 rounded-lg bg-white border border-[#E2D5C4] text-[#3D332A] font-mono font-bold focus:outline-none"
            >
              <option value={25}>25 แถว</option>
              <option value={50}>50 แถว</option>
              <option value={100}>100 แถว</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="p-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] disabled:opacity-40 border border-[#E2D5C4] text-[#3D332A] cursor-pointer disabled:cursor-not-allowed"
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E2D5C4] font-mono font-bold text-[#3D332A]">
            หน้า {safePage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] disabled:opacity-40 border border-[#E2D5C4] text-[#3D332A] cursor-pointer disabled:cursor-not-allowed"
            title="หน้าถัดไป"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
