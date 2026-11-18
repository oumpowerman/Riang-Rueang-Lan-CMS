import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import {
  FootageRowFilterMode,
  ParsedEpisodeGroup,
  ParsedSheetRow,
  SheetColumnSyncConfig,
  SheetSyncSummaryStats,
  TableRowDensity,
} from './sheetImport.types';
import { SheetFootageTableRow } from './SheetFootageTableRow';

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
  columnSyncConfig: SheetColumnSyncConfig;
  syncEpisodesFromColD: boolean;
  episodeGroupByRowIndex: Map<number, ParsedEpisodeGroup>;
}

export const SheetFootageRowsTable: React.FC<SheetFootageRowsTableProps> = ({
  parsedRows,
  stats,
  filterMode,
  searchQuery,
  excludedRowIndices,
  onToggleRowSelection,
  onBatchSetRowSelection,
  autoCreateMissingFootage,
  rowDensity,
  columnSyncConfig,
  syncEpisodesFromColD,
  episodeGroupByRowIndex,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(50);
  const [expandedTagRows, setExpandedTagRows] = useState<Set<number>>(
    new Set()
  );

  const isRankLocked = !columnSyncConfig.syncColC_RankTitle;
  const isPunchlineLocked = !columnSyncConfig.syncColD_Punchline;
  const isRankAndPunchlineAllLocked = isRankLocked && isPunchlineLocked;

  const isTier1Locked = !columnSyncConfig.syncColE_Tier1Tags;
  const isTier2Locked = !columnSyncConfig.syncColF_Tier2Tags;
  const isTier3Locked = !columnSyncConfig.syncColG_Tier3Tags;
  const isAllTagsLocked = isTier1Locked && isTier2Locked && isTier3Locked;

  const isEpTitleLocked =
    !syncEpisodesFromColD || !columnSyncConfig.syncColB_EpTitle;
  const isEpUrlLocked =
    !syncEpisodesFromColD || !columnSyncConfig.syncColH_Url;
  const isEpDateLocked =
    !syncEpisodesFromColD || !columnSyncConfig.syncColIJ_DateAndTime;
  const isAllEpColLocked =
    !syncEpisodesFromColD ||
    (isEpTitleLocked && isEpUrlLocked && isEpDateLocked);

  const hasAnyLockedCol =
    isRankLocked ||
    isPunchlineLocked ||
    isTier1Locked ||
    isTier2Locked ||
    isTier3Locked ||
    isEpTitleLocked ||
    isEpUrlLocked ||
    isEpDateLocked;

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

      const epGroup = episodeGroupByRowIndex.get(row.rowIndex);
      const effectiveEpTitle = epGroup?.episodeTitle || row.episodeTitle;

      const matchTitle = row.title.toLowerCase().includes(q);
      const matchFtId =
        row.matchedFootage?.id.toLowerCase().includes(q) || false;
      const matchEp =
        row.episodeTitle.toLowerCase().includes(q) ||
        effectiveEpTitle.toLowerCase().includes(q);
      const matchRank = row.rankTitle.toLowerCase().includes(q);
      const matchPunchline = row.punchlineNote.toLowerCase().includes(q);
      const matchTag = row.finalTagNames.some((t) =>
        t.toLowerCase().includes(q)
      );

      return (
        matchTitle ||
        matchFtId ||
        matchEp ||
        matchRank ||
        matchPunchline ||
        matchTag
      );
    });
  }, [parsedRows, filterMode, searchQuery, episodeGroupByRowIndex]);

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
    rowDensity === 'COMPACT' ? 'py-2 px-3' : 'py-3 px-3.5';

  const transitionKey = `${filterMode}-p${safePage}-s${pageSize}-${
    searchQuery.trim() ? 'q' : 'all'
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden"
    >
      {/* Full-Bleed 3-Column iOS Summary Table */}
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
        <table className="w-full min-w-[720px] text-left border-collapse text-xs">
          <thead className="bg-[#FDFBF7] text-[#6E5F52] sticky top-0 border-b border-[#E8DFD3] font-bold z-10 shadow-2xs">
            <tr>
              <th className="py-2.5 px-3 w-16">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleToggleAllFiltered}
                    className="rounded border-[#C5B49E] text-[#3B6845] focus:ring-[#3B6845] cursor-pointer"
                    title="เลือก/ยกเลิกทั้งหมดในผลลัพธ์ที่กรอง"
                  />
                  <span className="font-mono tabular-nums">#</span>
                </div>
              </th>
              <th className="py-2.5 px-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span>Col A: ชื่อฟุตเทจ &amp; สถานะในคลัง</span>
                  {stats.newTagsCount > 0 && !isAllTagsLocked && (
                    <span className="text-[11px] font-normal text-[#6E5F52] tabular-nums">
                      (แท็กใหม่ +{stats.newTagsCount})
                    </span>
                  )}
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">
                <div className="inline-flex items-center justify-end gap-2">
                  {hasAnyLockedCol && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8A4D1F]">
                      <Lock className="w-3 h-3" />
                      <span>มีคอลัมน์ล็อกไม่ทับ</span>
                    </span>
                  )}
                  <span>สรุปข้อมูลที่จะซิงก์ (คลิกแถวเพื่อกางดูครบ 10 คอลัมน์)</span>
                </div>
              </th>
            </tr>
          </thead>

          <AnimatePresence mode="wait">
            <motion.tbody
              key={transitionKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="divide-y divide-[#F2EBE0]"
            >
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-[#8C7B6C]">
                    ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <SheetFootageTableRow
                    key={row.rowIndex}
                    row={row}
                    cellPadClass={cellPadClass}
                    isSelected={!excludedRowIndices.has(row.rowIndex)}
                    isTagsExpanded={expandedTagRows.has(row.rowIndex)}
                    autoCreateMissingFootage={autoCreateMissingFootage}
                    epGroup={episodeGroupByRowIndex.get(row.rowIndex)}
                    syncEpisodesFromColD={syncEpisodesFromColD}
                    lockFlags={{
                      isRankLocked,
                      isPunchlineLocked,
                      isRankAndPunchlineAllLocked,
                      isTier1Locked,
                      isTier2Locked,
                      isTier3Locked,
                      isAllTagsLocked,
                      isEpTitleLocked,
                      isEpUrlLocked,
                      isEpDateLocked,
                      isAllEpColLocked,
                    }}
                    onToggleRowSelection={onToggleRowSelection}
                    onToggleExpandTags={toggleExpandTagsForRow}
                  />
                ))
              )}
            </motion.tbody>
          </AnimatePresence>
        </table>
      </div>

      {/* Pinned Pagination Footer Bar */}
      <div className="px-4 sm:px-5 py-2 bg-[#FDFBF7] border-t border-[#E8DFD3] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E5F52] shrink-0 mt-auto">
        <div className="flex items-center gap-3 flex-wrap tabular-nums">
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
            รายการ (เลือกซิงก์{' '}
            <strong className="font-mono text-[#1C4824]">
              {selectedCountInFiltered.toLocaleString()}
            </strong>{' '}
            แถว)
          </span>

          <div className="flex items-center gap-1.5">
            <span>หน้าละ:</span>
            <select
              value={pageSize}
              onChange={(e) =>
                setPageSize(Number(e.target.value) as 25 | 50 | 100)
              }
              className="px-2 py-0.5 rounded-lg bg-white border border-[#E2D5C4] text-[#3D332A] font-mono font-bold focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 tabular-nums">
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
