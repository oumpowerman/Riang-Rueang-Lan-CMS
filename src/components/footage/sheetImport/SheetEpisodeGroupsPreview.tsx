import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Film,
  Inbox,
  ListOrdered,
  MessageSquareQuote,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  Tag,
  Trophy,
  X,
} from 'lucide-react';
import { PublishSlot } from '../../../types/episode.types';
import {
  EpisodeGroupFilterMode,
  ParsedEpisodeGroup,
  RankingOrderDirection,
  TableRowDensity,
} from './sheetImport.types';

interface SheetEpisodeGroupsPreviewProps {
  episodeGroups: ParsedEpisodeGroup[];
  rankingOrder: RankingOrderDirection;
  onChangeRankingOrder: (dir: RankingOrderDirection) => void;
  autoCreateMissingFootage: boolean;
  filterMode: EpisodeGroupFilterMode;
  onChangeFilterMode: (mode: EpisodeGroupFilterMode) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  excludedEpisodeKeys: Set<string>;
  onToggleEpisodeSelection: (groupKey: string) => void;
  onBatchSetEpisodeSelection: (groupKeys: string[], include: boolean) => void;
  excludedRowIndices: Set<number>;
  rowDensity: TableRowDensity;
  onChangeCustomGroupPublishDate?: (groupKey: string, dateIso: string) => void;
  onChangeCustomGroupPublishSlot?: (
    groupKey: string,
    slot: PublishSlot
  ) => void;
}

export const SheetEpisodeGroupsPreview: React.FC<
  SheetEpisodeGroupsPreviewProps
> = ({
  episodeGroups,
  rankingOrder,
  onChangeRankingOrder,
  autoCreateMissingFootage,
  filterMode,
  onChangeFilterMode,
  searchQuery,
  onChangeSearchQuery,
  excludedEpisodeKeys,
  onToggleEpisodeSelection,
  onBatchSetEpisodeSelection,
  excludedRowIndices,
  rowDensity,
  onChangeCustomGroupPublishDate,
  onChangeCustomGroupPublishSlot,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);

  const hasGroupIssue = (group: ParsedEpisodeGroup): boolean => {
    const activeRowsCount = group.rows.filter(
      (r) => !excludedRowIndices.has(r.rowIndex)
    ).length;
    if (activeRowsCount !== 5) return true;
    if (!autoCreateMissingFootage && group.missingFootageCount > 0) return true;
    if (group.hasDuplicateClipsInGroup) return true;
    return false;
  };

  const filterCounts = useMemo(() => {
    let issues = 0;
    let complete = 0;
    let newEp = 0;
    let updateEp = 0;

    episodeGroups.forEach((g) => {
      if (hasGroupIssue(g)) {
        issues += 1;
      } else {
        complete += 1;
      }
      if (g.existingEpisode) {
        updateEp += 1;
      } else {
        newEp += 1;
      }
    });

    return { issues, complete, newEp, updateEp };
  }, [episodeGroups, autoCreateMissingFootage, excludedRowIndices]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return episodeGroups.filter((g) => {
      const isIssue = hasGroupIssue(g);
      if (filterMode === 'ISSUES_ONLY' && !isIssue) return false;
      if (filterMode === 'COMPLETE_ONLY' && isIssue) return false;
      if (filterMode === 'NEW_EP_ONLY' && g.existingEpisode !== null)
        return false;
      if (filterMode === 'UPDATE_EP_ONLY' && g.existingEpisode === null)
        return false;

      if (!q) return true;

      const matchEpTitle = g.episodeTitle.toLowerCase().includes(q);
      const matchSeries = g.primaryTagName.toLowerCase().includes(q);
      const matchExistingId =
        g.existingEpisode?.id.toLowerCase().includes(q) || false;
      const matchClipInside = g.rows.some(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.rankTitle.toLowerCase().includes(q) ||
          r.punchlineNote.toLowerCase().includes(q) ||
          r.matchedFootage?.id.toLowerCase().includes(q)
      );

      return matchEpTitle || matchSeries || matchExistingId || matchClipInside;
    });
  }, [
    episodeGroups,
    filterMode,
    searchQuery,
    autoCreateMissingFootage,
    excludedRowIndices,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, searchQuery, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedGroups = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredGroups.slice(start, start + pageSize);
  }, [filteredGroups, safePage, pageSize]);

  const selectedCountInFiltered = useMemo(() => {
    let count = 0;
    filteredGroups.forEach((g) => {
      if (!excludedEpisodeKeys.has(g.groupKey)) {
        count += 1;
      }
    });
    return count;
  }, [filteredGroups, excludedEpisodeKeys]);

  const allFilteredSelected =
    filteredGroups.length > 0 &&
    selectedCountInFiltered === filteredGroups.length;

  const handleToggleAllFiltered = () => {
    const keys = filteredGroups.map((g) => g.groupKey);
    onBatchSetEpisodeSelection(keys, !allFilteredSelected);
  };

  const toggleExpandOne = (groupKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const allPageExpanded =
    paginatedGroups.length > 0 &&
    paginatedGroups.every((g) => expandedKeys.has(g.groupKey));

  const handleToggleExpandCurrentPage = () => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (allPageExpanded) {
        paginatedGroups.forEach((g) => next.delete(g.groupKey));
      } else {
        paginatedGroups.forEach((g) => next.add(g.groupKey));
      }
      return next;
    });
  };

  if (episodeGroups.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center bg-white space-y-2">
        <Film className="w-8 h-8 text-[#A39485] mx-auto" />
        <p className="text-sm font-bold text-[#3D332A]">
          ไม่พบข้อมูลคอลัมน์ B (ชื่อคลิปหลัก EP)
        </p>
        <p className="text-xs text-[#7D6E61] max-w-md mx-auto">
          ก๊อปปี้ตาราง 10 คอลัมน์ (A–J) ที่มีคอลัมน์ B (ชื่อคลิป เช่น 5 อันดับพี่เสกสุดฮา EP.1) เพื่อให้ระบบจัดกลุ่ม 5 อันดับเข้าคลังคลิปหลักให้อัตโนมัติ
        </p>
      </div>
    );
  }

  const displayRanks =
    rankingOrder === 'RANK_5_TO_1'
      ? ([5, 4, 3, 2, 1] as const)
      : ([1, 2, 3, 4, 5] as const);

  const rowPadClass =
    rowDensity === 'COMPACT' ? 'px-4 py-1.5' : 'px-4 py-2.5';

  const epFilterButtons: Array<{
    mode: EpisodeGroupFilterMode;
    label: string;
    count: number;
    activeTextClass: string;
    hasWarningIcon?: boolean;
    show?: boolean;
  }> = [
    {
      mode: 'ALL',
      label: 'ทั้งหมด',
      count: episodeGroups.length,
      activeTextClass: 'text-[#3D332A]',
      show: true,
    },
    {
      mode: 'ISSUES_ONLY',
      label: 'ไม่ครบ 5 อันดับ',
      count: filterCounts.issues,
      activeTextClass: 'text-[#8A4D1F]',
      hasWarningIcon: true,
      show: true,
    },
    {
      mode: 'COMPLETE_ONLY',
      label: 'ครบ 5 อันดับ',
      count: filterCounts.complete,
      activeTextClass: 'text-[#1C4824]',
      show: true,
    },
    {
      mode: 'NEW_EP_ONLY',
      label: 'สร้างใหม่',
      count: filterCounts.newEp,
      activeTextClass: 'text-[#1C4824]',
      show: true,
    },
    {
      mode: 'UPDATE_EP_ONLY',
      label: 'อัปเดตซ้ำ',
      count: filterCounts.updateEp,
      activeTextClass: 'text-[#734B17]',
      show: filterCounts.updateEp > 0,
    },
  ];

  const transitionKey = `${filterMode}-${rankingOrder}-p${safePage}-s${pageSize}-${
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
      {/* Unified Single-Bar Filter & Ranking Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 px-4 sm:px-5 py-2 bg-[#FAF8F5] border-b border-[#E8DFD3] shrink-0">
        {/* Left: Anomaly Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EFE7DC] rounded-xl text-xs">
          {epFilterButtons
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
                      layoutId="sheetEpFilterPill"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1">
                    {btn.hasWarningIcon && (
                      <AlertTriangle className="w-3 h-3 text-[#8A4D1F]" />
                    )}
                    <span>{btn.label}</span>
                    <span className="font-mono">
                      ({btn.count.toLocaleString()})
                    </span>
                  </span>
                </button>
              );
            })}
        </div>

        {/* Right: Ranking Order + Search + Expand Page + Select All */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#EFE7DC] rounded-xl text-xs">
            <ListOrdered className="w-3.5 h-3.5 text-[#3B6845] ml-1.5" />
            <button
              type="button"
              onClick={() => onChangeRankingOrder('RANK_5_TO_1')}
              className={`relative px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                rankingOrder === 'RANK_5_TO_1'
                  ? 'text-[#1C4824]'
                  : 'text-[#6E5F52] hover:text-[#3D332A]'
              }`}
              title="แถวแรกในชีทคืออันดับ 5 ไล่ลงไปอันดับ 1"
            >
              {rankingOrder === 'RANK_5_TO_1' && (
                <motion.span
                  layoutId="sheetRankDirectionPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                />
              )}
              <span className="relative z-10">5 ➔ 1</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeRankingOrder('RANK_1_TO_5')}
              className={`relative px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                rankingOrder === 'RANK_1_TO_5'
                  ? 'text-[#1C4824]'
                  : 'text-[#6E5F52] hover:text-[#3D332A]'
              }`}
              title="แถวแรกในชีทคืออันดับ 1 ไล่ลงไปอันดับ 5"
            >
              {rankingOrder === 'RANK_1_TO_5' && (
                <motion.span
                  layoutId="sheetRankDirectionPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                />
              )}
              <span className="relative z-10">1 ➔ 5</span>
            </button>
          </div>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ EP, ชื่ออันดับ, คำสร้อย..."
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
            onClick={handleToggleExpandCurrentPage}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#F2EBE0] text-[#3D332A] border border-[#E2D5C4] transition-colors cursor-pointer whitespace-nowrap"
          >
            {allPageExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>พับหน้านี้</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>กางทั้งหน้า</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleAllFiltered}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer whitespace-nowrap"
          >
            {allFilteredSelected
              ? `ยกเลิกเลือก (${filteredGroups.length.toLocaleString()})`
              : `เลือกทั้งหมด (${filteredGroups.length.toLocaleString()})`}
          </button>
        </div>
      </div>

      {/* Full-Bleed Accordion Episode List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          <motion.div
            key={transitionKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="divide-y divide-[#F2EBE0]"
          >
            {paginatedGroups.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#8C7B6C]">
                ไม่พบรายการ EP ที่ตรงกับตัวกรองหรือคำค้นหา
              </div>
            ) : (
              paginatedGroups.map((group, idx) => {
                const globalIndex = (safePage - 1) * pageSize + idx + 1;
                const isSelected = !excludedEpisodeKeys.has(group.groupKey);
                const isExpanded = expandedKeys.has(group.groupKey);
                const isUpdateExisting = group.existingEpisode !== null;
                const activeRows = group.rows.filter(
                  (r) => !excludedRowIndices.has(r.rowIndex)
                );
                const isIssue = hasGroupIssue(group);

                return (
                  <div
                    key={group.groupKey}
                    className={`transition-colors ${
                      !isSelected
                        ? 'bg-[#F7F3EE]/60 opacity-55'
                        : isIssue
                        ? 'bg-[#FFFBF8]'
                        : 'bg-white'
                    }`}
                  >
                    {/* 1-Line Compact Accordion Header with Inline Col I/J Date & Slot Controls */}
                    <div
                      className={`${rowPadClass} flex flex-wrap items-center justify-between gap-2.5 hover:bg-[#FAF7F2] transition-colors`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            onToggleEpisodeSelection(group.groupKey)
                          }
                          className="rounded border-[#C5B49E] text-[#3B6845] focus:ring-[#3B6845] cursor-pointer shrink-0"
                          title="เลือกซิงค์หรือข้าม EP นี้"
                        />

                        <span className="w-8 text-right font-mono text-xs text-[#998A7C] tabular-nums shrink-0">
                          #{globalIndex}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleExpandOne(group.groupKey)}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                          title={`คลิกเพื่อดูรายละเอียด 5 อันดับของ ${group.episodeTitle}`}
                        >
                          <span className="font-extrabold text-xs sm:text-sm text-[#3D332A] truncate">
                            {group.episodeTitle}
                          </span>

                          {isUpdateExisting ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#FEF8ED] text-[#734B17] border border-[#EDD7AF] shrink-0">
                              <RefreshCw className="w-3 h-3 text-[#8A5A22]" />
                              <span>อัปเดต {group.existingEpisode?.id}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] shrink-0">
                              <Plus className="w-3 h-3 text-[#3B6845]" />
                              <span>สร้าง EP ใหม่</span>
                            </span>
                          )}

                          <span className="hidden lg:inline-flex items-center gap-1 text-xs text-[#6E5F52] shrink-0">
                            <Tag className="w-3 h-3 text-[#3B6845]" />
                            <span>#{group.primaryTagName}</span>
                          </span>
                        </button>
                      </div>

                      {/* Right: Inline Col I (วันที่) + Col J (เวลา/รอบ) + Status Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {/* Inline Publish Date & Slot Picker (Col I & Col J) */}
                        <div
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#E2D5C4]"
                          onClick={(e) => e.stopPropagation()}
                          title="วันที่เผยแพร่จริง (Col I) และรอบเวลาลงคลิป (Col J) — แก้ไขได้โดยตรง"
                        >
                          <Calendar className="w-3 h-3 text-[#3B6845] shrink-0" />
                          <input
                            type="date"
                            value={group.publishDate}
                            onChange={(e) =>
                              onChangeCustomGroupPublishDate?.(
                                group.groupKey,
                                e.target.value
                              )
                            }
                            className="bg-transparent font-mono text-[11px] font-bold text-[#3D332A] focus:outline-none cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onChangeCustomGroupPublishSlot?.(
                                group.groupKey,
                                group.publishSlot === 'MORNING_0600'
                                  ? 'EVENING_1800'
                                  : 'MORNING_0600'
                              )
                            }
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              group.publishSlot === 'MORNING_0600'
                                ? 'bg-[#FEF6E8] text-[#8A4D1F] border border-[#EAD5AE]'
                                : 'bg-[#EEF5FB] text-[#1E40AF] border border-[#C6DDF2]'
                            }`}
                            title="คลิกเพื่อสลับรอบเช้า (06:00) / รอบเย็น (18:00)"
                          >
                            {group.publishSlot === 'MORNING_0600' ? (
                              <>
                                <Sun className="w-2.5 h-2.5" />
                                <span>{group.publishTime || 'เช้า'}</span>
                              </>
                            ) : (
                              <>
                                <Moon className="w-2.5 h-2.5" />
                                <span>{group.publishTime || 'เย็น'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {activeRows.length === 5 && !isIssue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF]">
                            <Check className="w-3 h-3 text-[#3B6845]" />
                            <span>ครบ 5/5</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#FDF4EB] text-[#8A4D1F] border border-[#EBD1BE]">
                            <AlertTriangle className="w-3 h-3 text-[#8A4D1F]" />
                            <span>
                              {activeRows.length !== 5
                                ? `${activeRows.length}/5 อันดับ`
                                : group.hasDuplicateClipsInGroup
                                ? 'คลิปซ้ำใน EP'
                                : `ไม่พบฟุต ${group.missingFootageCount}`}
                            </span>
                          </span>
                        )}

                        {group.youtubeUrl && (
                          <a
                            href={group.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors"
                            title={group.youtubeUrl}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleExpandOne(group.groupKey)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#3D332A] border border-[#E2D5C4] transition-colors cursor-pointer"
                        >
                          <span className="hidden sm:inline">
                            {isExpanded ? 'ซ่อน' : 'ดู 5 อันดับ'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Framer Motion Animated 5-Rank Slots Detail */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 pt-1.5 bg-[#FAF8F5] border-t border-[#EFE7DC]">
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                              {displayRanks.map((rankNum, slotIdx) => {
                                const rowItem = activeRows[slotIdx] || null;
                                const ft = rowItem?.matchedFootage || null;

                                return (
                                  <div
                                    key={rankNum}
                                    className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between gap-1.5 ${
                                      rowItem
                                        ? 'bg-white border-[#E8DFD3]'
                                        : 'bg-[#FDF4EB]/60 border-dashed border-[#EBD1BE]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-[#FAF7F2] text-[#524538] border border-[#E3D8CB]">
                                        อันดับ {rankNum}
                                      </span>

                                      {rowItem && (
                                        <span className="font-mono text-[11px] text-[#998A7C]">
                                          แถว #{rowItem.rowIndex}
                                        </span>
                                      )}
                                    </div>

                                    {rowItem ? (
                                      <div className="space-y-1">
                                        <div
                                          className="font-extrabold text-[#3D332A] line-clamp-2 leading-snug"
                                          title={rowItem.title}
                                        >
                                          {rowItem.title}
                                        </div>
                                        {rowItem.rankTitle && (
                                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#8A5A22] truncate">
                                            <Trophy className="w-2.5 h-2.5 shrink-0" />
                                            <span className="truncate">
                                              {rowItem.rankTitle}
                                            </span>
                                          </div>
                                        )}
                                        {rowItem.punchlineNote && (
                                          <div className="flex items-center gap-1 text-[11px] text-[#3B6845] italic truncate">
                                            <MessageSquareQuote className="w-2.5 h-2.5 shrink-0" />
                                            <span className="truncate">
                                              "{rowItem.punchlineNote}"
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="italic text-[#8A4D1F] py-1">
                                        (ขาดฟุตเทจอันดับที่ {rankNum})
                                      </div>
                                    )}

                                    {rowItem && (
                                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                        {ft ? (
                                          <>
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-mono font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF]">
                                              <Check className="w-2.5 h-2.5" />
                                              <span>{ft.id}</span>
                                            </span>
                                            {rowItem.isInStaging && (
                                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#FEF8ED] text-[#734B17] border border-[#EDD7AF] font-semibold">
                                                <Inbox className="w-2.5 h-2.5" />
                                                <span>พัก➔จัดหมวด</span>
                                              </span>
                                            )}
                                          </>
                                        ) : autoCreateMissingFootage ? (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-bold bg-[#FEF8ED] text-[#734B17] border border-[#EDD7AF]">
                                            <Plus className="w-2.5 h-2.5" />
                                            <span>สร้างฟุตใหม่</span>
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.2 rounded bg-[#FDF4EB] text-[#8A4D1F] border border-[#EBD1BE]">
                                            ไม่พบฟุต
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {activeRows.length > 5 && (
                              <div className="mt-2 px-3 py-1.5 rounded-lg bg-[#FEF8ED] border border-[#EDD7AF] text-xs text-[#734B17] flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  พบฟุตเทจในกลุ่มชื่อเดียวกันนี้{' '}
                                  {activeRows.length} แถว (เกิน 5 อันดับ
                                  ระบบจะนำ 5 แถวแรกมาจัดลงอันดับ 5–1)
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pinned Pagination Footer Bar */}
      <div className="px-4 sm:px-5 py-2 bg-[#FDFBF7] border-t border-[#E8DFD3] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E5F52] shrink-0 mt-auto">
        <div className="flex items-center gap-3 flex-wrap">
          <span>
            แสดง EP ที่{' '}
            <strong className="font-mono text-[#3D332A]">
              {filteredGroups.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filteredGroups.length)}
            </strong>{' '}
            จาก{' '}
            <strong className="font-mono text-[#3D332A]">
              {filteredGroups.length.toLocaleString()}
            </strong>{' '}
            ตอน (เลือกซิงค์{' '}
            <strong className="font-mono text-[#1C4824]">
              {selectedCountInFiltered.toLocaleString()}
            </strong>{' '}
            ตอน)
          </span>

          <div className="flex items-center gap-1.5">
            <span>แสดงหน้าละ:</span>
            <select
              value={pageSize}
              onChange={(e) =>
                setPageSize(Number(e.target.value) as 20 | 50 | 100)
              }
              className="px-2 py-0.5 rounded-lg bg-white border border-[#E2D5C4] text-[#3D332A] font-mono font-bold focus:outline-none"
            >
              <option value={20}>20 ตอน</option>
              <option value={50}>50 ตอน</option>
              <option value={100}>100 ตอน</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="p-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] disabled:opacity-40 border border-[#E2D5C4] text-[#3D332A] cursor-pointer disabled:cursor-not-allowed"
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
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
