import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  ArrowRight,
  RotateCcw,
  ClipboardPaste,
  Film,
  FileSpreadsheet,
  HelpCircle,
  X,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { firestoreService } from '../../../firebase/firestoreService';
import { Episode } from '../../../types/episode.types';
import {
  parseAndMatchYouTubeDateData,
  SAMPLE_YOUTUBE_AI_DATE_DATA,
} from './youtubeDateSyncParser';

type FilterTab = 'ALL' | 'MATCHED' | 'UNMATCHED';

interface SyncCompletionSummary {
  updatedEpisodesCount: number;
  updatedFootagesCreatedAtCount: number;
  recalculatedFootagesCount: number;
}

export interface YouTubeDateSyncTabContentProps {
  onClose: () => void;
  onSwitchToSheetTab?: () => void;
  onGoToMasterEpisodes?: () => void;
}

export const YouTubeDateSyncTabContent: React.FC<
  YouTubeDateSyncTabContentProps
> = ({ onClose, onSwitchToSheetTab, onGoToMasterEpisodes }) => {
  const {
    episodes,
    computedFootageMap,
    batchUpsertEpisodes,
    batchSyncFootageCreatedAtByMap,
  } = useCMS();

  // Start completely blank (Clean Zero-State) just like Step 1
  const [pastedText, setPastedText] = useState<string>('');
  const [isPasteExpanded, setIsPasteExpanded] = useState<boolean>(true);
  const [isGuideExpanded, setIsGuideExpanded] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Per-row manual Episode override and custom date override
  const [manualEpisodeIdByRowIndex, setManualEpisodeIdByRowIndex] = useState<
    Record<number, string | null>
  >({});
  const [customDateByRowIndex, setCustomDateByRowIndex] = useState<
    Record<number, string>
  >({});
  const [excludedRowIndices, setExcludedRowIndices] = useState<Set<number>>(
    new Set()
  );

  // Sync option: also align sub-footage createdAt if it was bulk-imported later than the real publish date
  const [syncSubFootageCreatedAt, setSyncSubFootageCreatedAt] =
    useState<boolean>(true);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>('');
  const [completionSummary, setCompletionSummary] =
    useState<SyncCompletionSummary | null>(null);

  const { rows, stats } = useMemo(
    () =>
      parseAndMatchYouTubeDateData({
        pastedText,
        episodes,
        manualEpisodeIdByRowIndex,
        customDateByRowIndex,
      }),
    [pastedText, episodes, manualEpisodeIdByRowIndex, customDateByRowIndex]
  );

  const hasData = rows.length > 0;

  const handleChangePastedText = (nextText: string) => {
    const wasEmpty = !pastedText.trim();
    const isMajorPaste =
      nextText.trim().length > 0 &&
      Math.abs(nextText.length - pastedText.length) > 15;

    setPastedText(nextText);
    setManualEpisodeIdByRowIndex({});
    setCustomDateByRowIndex({});
    setExcludedRowIndices(new Set());
    setCompletionSummary(null);

    if (!nextText.trim()) {
      setIsPasteExpanded(true);
    } else if (wasEmpty || isMajorPaste) {
      setIsPasteExpanded(false);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterTab === 'MATCHED' && !r.matchedEpisode) return false;
      if (filterTab === 'UNMATCHED' && r.matchedEpisode) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRaw = r.rawYouTubeTitle.toLowerCase().includes(q);
        const matchEp =
          r.matchedEpisode?.title.toLowerCase().includes(q) ||
          r.matchedEpisode?.id.toLowerCase().includes(q);
        const matchDate =
          r.publishDate.includes(q) || r.rawDateTimeStr.includes(q);
        return Boolean(matchRaw || matchEp || matchDate);
      }
      return true;
    });
  }, [rows, filterTab, searchQuery]);

  // Actionable matched rows that are checked
  const selectedMatchedRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.matchedEpisode !== null && !excludedRowIndices.has(r.rowIndex)
      ),
    [rows, excludedRowIndices]
  );

  // Sort episodes for dropdown selection
  const sortedEpisodesForDropdown = useMemo(
    () =>
      [...episodes].sort((a, b) =>
        a.title.localeCompare(b.title, 'th')
      ),
    [episodes]
  );

  const handleToggleRow = (rowIndex: number) => {
    setExcludedRowIndices((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  };

  const handleLoadSampleData = () => {
    handleChangePastedText(SAMPLE_YOUTUBE_AI_DATE_DATA);
  };

  const handleClearPaste = () => {
    handleChangePastedText('');
  };

  const handleManualSelectEpisode = (
    rowIndex: number,
    selectedEpId: string
  ) => {
    setManualEpisodeIdByRowIndex((prev) => ({
      ...prev,
      [rowIndex]: selectedEpId ? selectedEpId : null,
    }));
    if (selectedEpId) {
      setExcludedRowIndices((prev) => {
        const next = new Set(prev);
        next.delete(rowIndex);
        return next;
      });
    }
  };

  const handleExecuteDateSync = async () => {
    if (selectedMatchedRows.length === 0) return;

    setIsSyncing(true);
    setSyncStatusText('กำลังอัปเดตวันที่เผยแพร่ EP และคำนวณวันพักฟุตเทจใหม่...');

    try {
      await firestoreService.withBatchWriteLock(async () => {
        const updatedEpisodeMap = new Map<string, Episode>();
        const earliestDateByFootageId: Record<string, string> = {};
        const allRecalculatedFootageIds = new Set<string>();

        selectedMatchedRows.forEach((row) => {
          const ep = row.matchedEpisode;
          if (!ep) return;

          const baseEp = updatedEpisodeMap.get(ep.id) || ep;
          const updatedEp: Episode = {
            ...baseEp,
            publishDate: row.publishDate,
            publishSlot: row.publishSlot,
          };
          updatedEpisodeMap.set(ep.id, updatedEp);

          row.affectedFootageIds.forEach((fid) => {
            allRecalculatedFootageIds.add(fid);
            const currentFt = computedFootageMap[fid];
            const currentMinDate =
              earliestDateByFootageId[fid] || currentFt?.createdAt || '9999-12-31';
            if (row.publishDate < currentMinDate) {
              earliestDateByFootageId[fid] = row.publishDate;
            }
          });
        });

        const episodesToSave = Array.from(updatedEpisodeMap.values());
        await batchUpsertEpisodes(episodesToSave, (prog) => {
          setSyncStatusText(
            `กำลังบันทึกข้อมูล EP ขึ้น Cloud (${prog.completedOps}/${prog.totalOps})...`
          );
        });

        let updatedFootagesCreatedAtCount = 0;
        if (
          syncSubFootageCreatedAt &&
          Object.keys(earliestDateByFootageId).length > 0
        ) {
          setSyncStatusText(
            'กำลังปรับวันนำเข้าคลัง (createdAt) ของฟุตเทจย่อยให้สอดคล้องกับวันเผยแพร่จริง...'
          );
          updatedFootagesCreatedAtCount = await batchSyncFootageCreatedAtByMap(
            earliestDateByFootageId
          );
        }

        setCompletionSummary({
          updatedEpisodesCount: episodesToSave.length,
          updatedFootagesCreatedAtCount,
          recalculatedFootagesCount: allRecalculatedFootageIds.size,
        });
      });
    } catch (err) {
      console.error('YouTubeDateSyncTabContent execute error:', err);
    } finally {
      setIsSyncing(false);
      setSyncStatusText('');
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#FAF8F5]">
      {/* 1. Clean Full-Canvas Paste Section (When empty) OR Collapsible Top Drawer (When editing existing paste) */}
      <AnimatePresence initial={false}>
        {(!hasData || isPasteExpanded) && (
          <motion.div
            initial={hasData ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={
              hasData
                ? 'border-b border-[#E8DFD3] bg-[#FDFBF7] px-5 py-3.5 shadow-sm shrink-0 z-20'
                : 'flex-1 min-h-0 flex flex-col p-4 sm:p-5 bg-[#FAF8F5]'
            }
          >
            <div
              className={
                hasData
                  ? 'space-y-2.5'
                  : 'flex-1 min-h-0 flex flex-col rounded-2xl bg-[#FFFFFF] border border-[#E8DFD3] p-4 shadow-2xs gap-3'
              }
            >
              {/* Top Row: Collapsible Guide Trigger & Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsGuideExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EEF5EE] hover:bg-[#E2EFE2] text-[#1C4824] border border-[#BAD8BF] transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#3B6845]" />
                    <span>คำอธิบายวิธีเตรียมข้อมูล 2 คอลัมน์ (วันที่ + ชื่อคลิป EP)</span>
                    {isGuideExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-[#3B6845]" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[#3B6845]" />
                    )}
                  </button>

                  <span className="text-xs text-[#7D6E61] hidden sm:inline">
                    วางตาราง 2 คอลัมน์ (วันที่เผยแพร่ และ ชื่อคลิปหลัก EP) เพื่ออัปเดตวันลงจริงและคำนวณวันพักฟุตใหม่
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {onSwitchToSheetTab && (
                    <button
                      type="button"
                      onClick={onSwitchToSheetTab}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#3B6845]" />
                      <span>← ย้อนไปขั้นที่ 1 (Sheet)</span>
                    </button>
                  )}

                  {!hasData && (
                    <button
                      type="button"
                      onClick={handleLoadSampleData}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#FEF8ED] hover:bg-[#FAEED6] text-[#734B17] border border-[#EDD7AF] transition-colors cursor-pointer whitespace-nowrap"
                      title="ทดลองวางตัวอย่างตารางวันที่และชื่อคลิปจาก YouTube"
                    >
                      ลองวางตัวอย่าง 2 คอลัมน์ (วันที่ + ชื่อ EP)
                    </button>
                  )}

                  {pastedText && (
                    <button
                      type="button"
                      onClick={handleClearPaste}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#8C7B6C] hover:text-[#B44335] hover:bg-[#FDF4EB] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      ล้างข้อมูล
                    </button>
                  )}

                  {hasData && (
                    <button
                      type="button"
                      onClick={() => setIsPasteExpanded(false)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#3B6845] hover:bg-[#2D5236] text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>ซ่อนช่องวางข้อมูล</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Guide (Collapsed by Default) */}
              <AnimatePresence initial={false}>
                {isGuideExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden shrink-0"
                  >
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-[#6E5F52]">
                      <div className="p-2.5 rounded-lg bg-white border border-[#E8DFD3] space-y-1">
                        <div className="font-bold text-[#1C4824] flex items-center gap-1.5">
                          <span>📅 คอลัมน์ที่ 1: วันที่และเวลาเผยแพร่</span>
                        </div>
                        <div className="text-[11px] text-[#524538] leading-relaxed">
                          • รองรับรูปแบบ <code className="bg-[#FAF8F5] px-1 py-0.5 rounded text-[#254B2D] font-bold border border-[#E2D5C4]">DD/MM/YYYY HH:mm</code> หรือ <code className="bg-[#FAF8F5] px-1 py-0.5 rounded text-[#254B2D] font-bold border border-[#E2D5C4]">YYYY-MM-DD</code><br />
                          • แปลงเวลาเป็นรอบเช้า (06:00) และรอบเย็น (18:00) ให้อัตโนมัติ
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-[#E8DFD3] space-y-1">
                        <div className="font-bold text-[#1E40AF] flex items-center gap-1.5">
                          <span>🎬 คอลัมน์ที่ 2: ชื่อคลิปหลัก EP</span>
                        </div>
                        <div className="text-[11px] text-[#524538] leading-relaxed">
                          • เช่น <code className="bg-[#EEF5EE] px-1 py-0.5 rounded text-[#1C4824] font-bold border border-[#BAD8BF]">5 อันดับคลิปน้ำท่วมสุดฮา! EP.2 #ตลก #มีม</code><br />
                          • ระบบตัด <code className="font-bold">#แฮชแท็ก</code> ท้ายชื่อคลิปและจับคู่กับ EP ในคลังให้อัตโนมัติ
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Paste Textarea */}
              <div
                className={
                  hasData
                    ? 'flex flex-col gap-1.5'
                    : 'flex-1 min-h-0 flex flex-col gap-1.5'
                }
              >
                <label className="text-xs font-extrabold text-[#3D332A] flex items-center gap-1.5 shrink-0">
                  <ClipboardPaste className="w-3.5 h-3.5 text-[#3B6845]" />
                  <span>
                    วางข้อมูลวันที่และชื่อคลิปจาก YouTube หรือตารางวันที่ที่นี่ (Ctrl+V / Cmd+V):
                  </span>
                </label>

                <textarea
                  rows={hasData ? 4 : 10}
                  value={pastedText}
                  onChange={(e) => handleChangePastedText(e.target.value)}
                  placeholder={`ก๊อปปี้ตาราง วันที่เผยแพร่ + ชื่อคลิป มาวางที่นี่ได้เลย เช่น:\n29/09/2026 06:06\t5 อันดับคลิปน้ำท่วมสุดฮา! EP.2 #ตลก #มีม #ฮาๆ\n29/09/2026 18:05\t5 อันดับแก๊งน้ำตาลตกสุดฮา! EP.1 #ตลก #funny #ฮาๆ`}
                  className={`w-full p-3.5 rounded-xl border border-[#E3D8CB] bg-[#FDFBF7] text-xs font-mono text-[#3D332A] placeholder:text-[#A89B8D] focus:outline-none focus:ring-1.5 focus:ring-[#8FA892] focus:border-[#8FA892] transition-colors leading-relaxed scrollbar-thin ${
                    hasData ? 'resize-y max-h-44' : 'flex-1 min-h-[200px] resize-none'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Summary KPI Strip + Interactive Preview Table (Shown ONLY when data is pasted) */}
      {hasData && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 sm:p-5 space-y-4">
          {/* Completion Banner */}
          {completionSummary && (
            <div className="p-4 rounded-2xl bg-[#EEF7EE] border border-[#A8D5AE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-extrabold text-[#1C4824]">
                    อัปเดตวันที่เผยแพร่จริงและคำนวณวันพัก (Cooldown) ใหม่สำเร็จ!
                  </h4>
                  <p className="text-xs text-[#2E5A35] mt-0.5">
                    อัปเดตคลิปหลัก <strong>{completionSummary.updatedEpisodesCount} ตอน</strong> ·
                    คำนวณวันพัก (Cooldown 🔵 🟢 🟡 🔴) ใหม่ให้ฟุตเทจย่อยรวม{' '}
                    <strong>{completionSummary.recalculatedFootagesCount} ช็อต</strong>
                    {completionSummary.updatedFootagesCreatedAtCount > 0 &&
                      ` (ปรับวันที่นำเข้าคลังย้อนหลัง ${completionSummary.updatedFootagesCreatedAtCount} ช็อต)`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onGoToMasterEpisodes && (
                  <button
                    type="button"
                    onClick={onGoToMasterEpisodes}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#3B6845] hover:bg-[#2C5235] text-white transition-colors cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>เปิดดูคลังคลิปหลัก (EP) ➔</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCompletionSummary(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#E2EFE2] text-[#1C4824] border border-[#A8D5AE] transition-colors cursor-pointer"
                >
                  รับทราบ
                </button>
              </div>
            </div>
          )}

          {/* Summary KPI Strip & Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E8DFD3] shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-[#3D332A] text-white'
                    : 'bg-[#FAF7F2] text-[#5C5349] hover:bg-[#F2ECE1]'
                }`}
              >
                ทั้งหมด ({stats.totalRows})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('MATCHED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterTab === 'MATCHED'
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-[#EEF5EE] text-[#1C4824] hover:bg-[#E2EFE2]'
                }`}
              >
                จับคู่กับ EP สำเร็จ ({stats.matchedRowsCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('UNMATCHED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterTab === 'UNMATCHED'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                ยังไม่พบคู่ในคลัง ({stats.unmatchedRowsCount})
              </button>

              <span className="text-xs text-[#6E5F52] ml-2">
                ฟุตเทจย่อยที่จะคำนวณวันพักใหม่:{' '}
                <strong className="font-mono font-extrabold text-[#1C4824]">
                  {stats.uniqueAffectedFootagesCount} ช็อต
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Toggle Paste Box Button */}
              <button
                type="button"
                onClick={() => setIsPasteExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF5EC] hover:bg-[#F2E8D8] text-[#5C4D3C] border border-[#E2D5C4] transition-colors cursor-pointer shrink-0"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-[#3B6845]" />
                <span>{isPasteExpanded ? 'ย่อช่องวางข้อความ' : 'แก้ไขข้อมูลที่วาง'}</span>
                {isPasteExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleClearPaste}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF7F2] hover:bg-[#FDF4EB] text-[#7D6E61] hover:text-[#B44335] border border-[#E2D5C4] transition-colors cursor-pointer shrink-0"
                title="ล้างข้อมูลที่วางทั้งหมด"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างข้อมูล</span>
              </button>

              {/* Search input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#8C7E70] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อคลิป หรือ วันที่..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E2D5C4] text-xs text-[#2D2926] focus:outline-none focus:bg-white focus:border-[#3B6845]"
                />
              </div>
            </div>
          </div>

          {/* Interactive Preview Table */}
          <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF7F2] text-[11px] font-bold text-[#6E5F52] border-b border-[#E8DFD3] sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-10 text-center">เลือก</th>
                    <th className="p-3 w-48">วันที่ & รอบเวลาจาก YouTube</th>
                    <th className="p-3 min-w-[230px]">ชื่อคลิปจาก YouTube (ตัด #แท็ก อัตโนมัติ)</th>
                    <th className="p-3 min-w-[250px]">จับคู่กับ EP ในระบบ (เลือกเปลี่ยนได้)</th>
                    <th className="p-3 w-52">การอัปเดตวันที่ & ฟุตเทจย่อย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E9DE] text-xs">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-xs text-[#8C7E70]"
                      >
                        ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const isMatched = row.matchedEpisode !== null;
                      const isChecked =
                        isMatched && !excludedRowIndices.has(row.rowIndex);

                      return (
                        <tr
                          key={row.rowIndex}
                          className={`transition-colors ${
                            isChecked
                              ? 'bg-[#F6FAF6] hover:bg-[#EDF6ED]'
                              : 'bg-white hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {/* 1. Checkbox */}
                          <td className="p-3 text-center align-top">
                            <input
                              type="checkbox"
                              disabled={!isMatched}
                              checked={isChecked}
                              onChange={() => handleToggleRow(row.rowIndex)}
                              className="w-4 h-4 rounded text-[#3B6845] focus:ring-[#8FA892] border-slate-300 cursor-pointer disabled:opacity-40"
                            />
                          </td>

                          {/* 2. Parsed Date & Slot */}
                          <td className="p-3 align-top">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                value={row.publishDate}
                                onChange={(e) =>
                                  setCustomDateByRowIndex((prev) => ({
                                    ...prev,
                                    [row.rowIndex]: e.target.value,
                                  }))
                                }
                                className="px-2 py-1 rounded-lg border border-[#E2D5C4] bg-white font-mono text-xs font-bold text-[#2D2926] focus:outline-none focus:border-[#3B6845]"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6E5F52] font-mono">
                              {row.publishSlot === 'MORNING_0600' ? (
                                <>
                                  <Sun className="w-3 h-3 text-amber-600" />
                                  <span>{row.publishTime} น. (รอบเช้า)</span>
                                </>
                              ) : (
                                <>
                                  <Moon className="w-3 h-3 text-indigo-600" />
                                  <span>{row.publishTime} น. (รอบเย็น)</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* 3. YouTube Title */}
                          <td className="p-3 align-top">
                            <div className="font-bold text-[#2D2926] leading-snug">
                              {row.cleanTitleNoHashtags}
                            </div>
                            <div className="text-[11px] text-[#8C7E70] truncate max-w-xs mt-0.5">
                              ต้นฉบับ: {row.rawYouTubeTitle}
                            </div>
                          </td>

                          {/* 4. Matched Episode Selector */}
                          <td className="p-3 align-top">
                            <select
                              value={row.matchedEpisode?.id || ''}
                              onChange={(e) =>
                                handleManualSelectEpisode(
                                  row.rowIndex,
                                  e.target.value
                                )
                              }
                              className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                                row.matchedEpisode
                                  ? 'bg-[#EEF5EE] border-[#A8D5AE] text-[#1C4824]'
                                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
                              }`}
                            >
                              <option value="">
                                -- ยังไม่จับคู่ (คลิกเพื่อเลือก EP ในคลัง) --
                              </option>
                              {sortedEpisodesForDropdown.map((ep) => (
                                <option key={ep.id} value={ep.id}>
                                  [{ep.id}] {ep.title} (เดิม: {ep.publishDate})
                                </option>
                              ))}
                            </select>

                            <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                              {row.matchConfidence === 'EXACT' && (
                                <span className="text-[#2E7D32] font-semibold">
                                  ✓ ชื่อตรงกัน 100%
                                </span>
                              )}
                              {row.matchConfidence === 'SERIES_EP' && (
                                <span className="text-[#2E7D32] font-semibold">
                                  ✓ จับคู่จากชื่อซีรีส์ + EP.{row.extractedEpNo}
                                </span>
                              )}
                              {row.matchConfidence === 'FUZZY_EP' && (
                                <span className="text-teal-700 font-semibold">
                                  ≈ จับคู่ใกล้เคียง + EP.{row.extractedEpNo}
                                </span>
                              )}
                              {row.matchConfidence === 'MANUAL' && (
                                <span className="text-indigo-700 font-semibold">
                                  ✎ เลือกจับคู่ด้วยตนเอง
                                </span>
                              )}
                              {row.matchConfidence === 'UNMATCHED' && (
                                <span className="text-amber-700 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>ไม่พบชื่อ EP นี้ในคลัง (หากยังไม่ได้สร้าง EP ให้ทำขั้นที่ 1 ก่อน)</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 5. Date Comparison & Sub-Footage Impact */}
                          <td className="p-3 align-top">
                            {row.matchedEpisode ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                  <span className="text-slate-400 line-through">
                                    {row.matchedEpisode.publishDate}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-[#3B6845]" />
                                  <span className="font-bold text-[#1C4824]">
                                    {row.publishDate}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#5C5349] flex items-center gap-1">
                                  <Film className="w-3 h-3 text-[#3B6845]" />
                                  <span>
                                    คำนวณ Cooldown ฟุตเทจย่อยใหม่{' '}
                                    <strong>{row.affectedFootageIds.length} ช็อต</strong>
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Sticky Bottom Action Bar (Matches BaseModal Footer Aesthetic) */}
      <div className="px-4 sm:px-6 py-3 bg-[#F6F1E9] border-t border-[#E6DDD0] shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isSyncing}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer disabled:opacity-50"
          >
            ยกเลิก
          </button>

          <label className="inline-flex items-center gap-2 text-xs text-[#4A4138] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={syncSubFootageCreatedAt}
              onChange={(e) => setSyncSubFootageCreatedAt(e.target.checked)}
              className="w-4 h-4 rounded text-[#3B6845] focus:ring-[#8FA892] border-slate-300 cursor-pointer"
            />
            <span>
              ปรับวันนำเข้าคลัง (<strong>createdAt</strong>) ของฟุตเทจย่อยใน EP ให้ตรงกับวันเผยแพร่จริงด้วย
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isSyncing && (
            <span className="text-xs font-bold text-[#2E7D32] animate-pulse">
              {syncStatusText}
            </span>
          )}
          <button
            type="button"
            disabled={isSyncing || selectedMatchedRows.length === 0}
            onClick={handleExecuteDateSync}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              selectedMatchedRows.length > 0 && !isSyncing
                ? 'bg-[#3B6845] hover:bg-[#2D5236] text-white shadow-xs hover:shadow-md'
                : 'bg-[#E5DED4] text-[#8E8174] border border-[#D8CFC3] cursor-not-allowed opacity-70'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {selectedMatchedRows.length > 0
                ? `ยืนยันอัปเดตวันที่ & คำนวณวันพักฟุตเทจใหม่ (${selectedMatchedRows.length} ตอน) ➔`
                : 'กรุณาวางข้อมูลวันที่และชื่อคลิปเพื่อซิงค์'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
