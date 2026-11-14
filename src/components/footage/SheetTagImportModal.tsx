import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { FileSpreadsheet, CheckCircle2, CalendarClock } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { PublishSlot } from '../../types/episode.types';
import { BaseModal } from '../ui/BaseModal';
import { JunkTagCleanupModal } from '../tags/JunkTagCleanupModal';
import { YouTubeDateSyncTabContent } from '../episodes/youtubeDateSync/YouTubeDateSyncModal';
import { executeSheetUnifiedSync } from './sheetImport/executeSheetUnifiedSync';
import { SheetCollapsiblePasteSection } from './sheetImport/SheetCollapsiblePasteSection';
import { SheetEpisodeGroupsPreview } from './sheetImport/SheetEpisodeGroupsPreview';
import { SheetFootageRowsTable } from './sheetImport/SheetFootageRowsTable';
import {
  SheetHeaderRightControls,
  UnifiedSyncMainTab,
} from './sheetImport/SheetInspectionHeaderBar';
import {
  parseSheetClipboardData,
  SAMPLE_10COL_SHEET_DATA,
} from './sheetImport/sheetImportParser';
import {
  SheetPasteAnalyzingView,
  SheetSyncProgressView,
  SheetSyncSuccessReportView,
} from './sheetImport/SheetSyncProgressAndReport';
import {
  EpisodeGroupFilterMode,
  FootageRowFilterMode,
  RankingOrderDirection,
  SheetSyncSuccessReport,
  SyncProgressState,
  TableRowDensity,
} from './sheetImport/sheetImport.types';

export const SheetTagImportModal: React.FC = () => {
  const {
    isSheetTagImportModalOpen,
    setIsSheetTagImportModalOpen,
    isYouTubeDateSyncModalOpen,
    setIsYouTubeDateSyncModalOpen,
    computedFootage,
    computedFootageMap,
    tags,
    tagMap,
    episodes,
    batchAddTags,
    batchAddDirectFootage,
    batchSyncFootageTagsByMap,
    batchUpsertEpisodes,
    batchSyncFootageCreatedAtByMap,
    setActiveTab,
  } = useCMS();

  const [activeMainSyncTab, setActiveMainSyncTab] =
    useState<UnifiedSyncMainTab>('SHEET_SYNC');
  const [pastedText, setPastedText] = useState('');
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const [isAnalyzingPaste, setIsAnalyzingPaste] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isJunkTagCleanupOpen, setIsJunkTagCleanupOpen] = useState(false);
  const [rowDensity, setRowDensity] = useState<TableRowDensity>('COMPACT');
  const [activePreviewTab, setActivePreviewTab] = useState<
    'FOOTAGE_ROWS' | 'EPISODE_GROUPS'
  >('FOOTAGE_ROWS');

  const analyzeTimerRef = useRef<number | null>(null);

  // Filter & Search States for both tabs
  const [rowFilterMode, setRowFilterMode] =
    useState<FootageRowFilterMode>('ALL');
  const [rowSearchQuery, setRowSearchQuery] = useState('');
  const [epFilterMode, setEpFilterMode] =
    useState<EpisodeGroupFilterMode>('ALL');
  const [epSearchQuery, setEpSearchQuery] = useState('');
  const [rankingOrder, setRankingOrder] =
    useState<RankingOrderDirection>('RANK_5_TO_1');

  // Inline overrides for Episode Group Publish Date (Col I) and Publish Slot (Col J)
  const [customPublishDateByGroupKey, setCustomPublishDateByGroupKey] =
    useState<Record<string, string>>({});
  const [customPublishSlotByGroupKey, setCustomPublishSlotByGroupKey] =
    useState<Record<string, PublishSlot>>({});

  // Selection States (Exclusions)
  const [excludedRowIndices, setExcludedRowIndices] = useState<Set<number>>(
    new Set()
  );
  const [excludedEpisodeKeys, setExcludedEpisodeKeys] = useState<Set<string>>(
    new Set()
  );

  // Sync Options
  const [syncEpisodesFromColD, setSyncEpisodesFromColD] = useState(true);
  const [autoCreateMissingFootage, setAutoCreateMissingFootage] =
    useState(true);
  const [includeSeriesTagOnFootage, setIncludeSeriesTagOnFootage] =
    useState(false);

  // Processing & Chunked Progress States
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressState>({
    phaseIndex: 1,
    phaseLabel: 'เตรียมข้อมูลสำหรับการซิงค์...',
    completedItems: 0,
    totalItems: 0,
    percent: 0,
  });
  const [successReport, setSuccessReport] =
    useState<SheetSyncSuccessReport | null>(null);

  useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) {
        window.clearTimeout(analyzeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isSheetTagImportModalOpen) {
      setActiveMainSyncTab('SHEET_SYNC');
    }
  }, [isSheetTagImportModalOpen]);

  useEffect(() => {
    if (isYouTubeDateSyncModalOpen) {
      setActiveMainSyncTab('YOUTUBE_DATE_SYNC');
    }
  }, [isYouTubeDateSyncModalOpen]);

  useEffect(() => {
    if (!syncEpisodesFromColD && activePreviewTab === 'EPISODE_GROUPS') {
      setActivePreviewTab('FOOTAGE_ROWS');
    }
  }, [syncEpisodesFromColD, activePreviewTab]);

  const handleChangePastedText = (nextText: string) => {
    const wasEmpty = !pastedText.trim();
    const isMajorPaste =
      nextText.trim().length > 0 &&
      Math.abs(nextText.length - pastedText.length) > 15;

    setPastedText(nextText);
    setExcludedRowIndices(new Set());
    setExcludedEpisodeKeys(new Set());
    setCustomPublishDateByGroupKey({});
    setCustomPublishSlotByGroupKey({});

    if (!nextText.trim()) {
      setIsInputExpanded(true);
      setIsAnalyzingPaste(false);
    } else if (wasEmpty || isMajorPaste) {
      setIsInputExpanded(false);
      setIsAnalyzingPaste(true);
      if (analyzeTimerRef.current) {
        window.clearTimeout(analyzeTimerRef.current);
      }
      analyzeTimerRef.current = window.setTimeout(() => {
        setIsAnalyzingPaste(false);
      }, 720);
    }
  };

  // Parse 10-Column Master Sheet (plus Legacy 4-Col / 2-Col) with O(1) lookup maps
  const { parsedRows, episodeGroups, stats } = useMemo(
    () =>
      parseSheetClipboardData({
        pastedText,
        computedFootage,
        tags,
        tagMap,
        episodes,
        rankingOrder,
        includeSeriesTagOnFootage,
        customPublishDateByGroupKey,
        customPublishSlotByGroupKey,
      }),
    [
      pastedText,
      computedFootage,
      tags,
      tagMap,
      episodes,
      rankingOrder,
      includeSeriesTagOnFootage,
      customPublishDateByGroupKey,
      customPublishSlotByGroupKey,
    ]
  );

  const handleToggleRowSelection = (rowIndex: number) => {
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

  const handleBatchSetRowSelection = (
    rowIndices: number[],
    include: boolean
  ) => {
    setExcludedRowIndices((prev) => {
      const next = new Set(prev);
      rowIndices.forEach((idx) => {
        if (include) {
          next.delete(idx);
        } else {
          next.add(idx);
        }
      });
      return next;
    });
  };

  const handleToggleEpisodeSelection = (groupKey: string) => {
    setExcludedEpisodeKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleBatchSetEpisodeSelection = (
    groupKeys: string[],
    include: boolean
  ) => {
    setExcludedEpisodeKeys((prev) => {
      const next = new Set(prev);
      groupKeys.forEach((k) => {
        if (include) {
          next.delete(k);
        } else {
          next.add(k);
        }
      });
      return next;
    });
  };

  const activeRows = useMemo(
    () => parsedRows.filter((r) => !excludedRowIndices.has(r.rowIndex)),
    [parsedRows, excludedRowIndices]
  );

  const activeEpisodeGroups = useMemo(
    () => episodeGroups.filter((g) => !excludedEpisodeKeys.has(g.groupKey)),
    [episodeGroups, excludedEpisodeKeys]
  );

  const actionableClipsCount = useMemo(
    () =>
      activeRows.filter(
        (r) => r.matchedFootage !== null || autoCreateMissingFootage
      ).length,
    [activeRows, autoCreateMissingFootage]
  );

  const handleExecuteImport = async () => {
    if (actionableClipsCount === 0) return;

    setIsProcessing(true);

    try {
      const report = await executeSheetUnifiedSync({
        activeRows,
        activeEpisodeGroups,
        excludedRowIndices,
        excludedEpisodeKeys,
        syncEpisodesFromColD,
        autoCreateMissingFootage,
        includeSeriesTagOnFootage,
        rankingOrder,
        tags,
        episodes,
        computedFootageMap,
        batchAddTags,
        batchAddDirectFootage,
        batchSyncFootageTagsByMap,
        batchUpsertEpisodes,
        batchSyncFootageCreatedAtByMap,
        onProgressUpdate: setSyncProgress,
      });

      setSuccessReport(report);
    } catch (err) {
      console.error('Unified 10-Column Sheet sync error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setIsSheetTagImportModalOpen(false);
    setIsYouTubeDateSyncModalOpen(false);
    setPastedText('');
    setIsInputExpanded(true);
    setIsAnalyzingPaste(false);
    setSuccessReport(null);
    setActivePreviewTab('FOOTAGE_ROWS');
    setRowFilterMode('ALL');
    setRowSearchQuery('');
    setEpFilterMode('ALL');
    setEpSearchQuery('');
    setExcludedRowIndices(new Set());
    setExcludedEpisodeKeys(new Set());
    setCustomPublishDateByGroupKey({});
    setCustomPublishSlotByGroupKey({});
  };

  const handleGoToMasterEpisodes = () => {
    handleClose();
    setActiveTab('MASTER_ARCHIVE');
  };

  const isModalOpen = isSheetTagImportModalOpen || isYouTubeDateSyncModalOpen;
  const hasData = parsedRows.length > 0;

  const modalHeaderRight = !isProcessing && (
    <SheetHeaderRightControls
      activeMainSyncTab={activeMainSyncTab}
      onChangeMainSyncTab={(tab) => {
        setSuccessReport(null);
        setActiveMainSyncTab(tab);
      }}
      hasData={hasData}
      stats={stats}
      activePreviewTab={activePreviewTab}
      onChangeActivePreviewTab={setActivePreviewTab}
      isInputExpanded={isInputExpanded}
      onToggleInputExpanded={() => setIsInputExpanded((prev) => !prev)}
      onClearPastedText={() => handleChangePastedText('')}
      onLoadSampleData={() => handleChangePastedText(SAMPLE_10COL_SHEET_DATA)}
      rowDensity={rowDensity}
      onToggleRowDensity={() =>
        setRowDensity((prev) => (prev === 'COMPACT' ? 'NORMAL' : 'COMPACT'))
      }
      isFullScreen={isFullScreen}
      onToggleFullScreen={() => setIsFullScreen((prev) => !prev)}
      syncEpisodesFromColD={syncEpisodesFromColD}
      onChangeSyncEpisodesFromColD={setSyncEpisodesFromColD}
      autoCreateMissingFootage={autoCreateMissingFootage}
      onChangeAutoCreateMissingFootage={setAutoCreateMissingFootage}
      includeSeriesTagOnFootage={includeSeriesTagOnFootage}
      onChangeIncludeSeriesTagOnFootage={setIncludeSeriesTagOnFootage}
      onOpenJunkTagCleanup={() => setIsJunkTagCleanupOpen(true)}
    />
  );

  const modalFooter =
    activeMainSyncTab === 'SHEET_SYNC' && !successReport && !isProcessing ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-[#6E5F52]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl font-semibold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>

          {hasData && (
            <span className="hidden sm:inline">
              เลือกซิงค์{' '}
              <strong className="font-mono text-[#1C4824]">
                {activeRows.length.toLocaleString()}
              </strong>
              /{parsedRows.length.toLocaleString()} แถว
              {syncEpisodesFromColD && episodeGroups.length > 0 ? (
                <>
                  {' · '}
                  <strong className="font-mono text-[#1C4824]">
                    {activeEpisodeGroups.length.toLocaleString()}
                  </strong>
                  /{episodeGroups.length.toLocaleString()} EP
                </>
              ) : (
                <span className="text-xs text-[#7A6E60] ml-1">
                  (เฉพาะแท็กฟุตเทจ · ปิดสร้าง EP)
                </span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {syncEpisodesFromColD &&
            episodeGroups.length > 0 &&
            activePreviewTab === 'FOOTAGE_ROWS' && (
              <button
                type="button"
                onClick={() => setActivePreviewTab('EPISODE_GROUPS')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FEF6E8] hover:bg-[#FAEBD0] text-[#734B17] border border-[#EAD5AE] transition-colors cursor-pointer whitespace-nowrap"
              >
                ดูพรีวิวจัดอันดับ & วันที่ {activeEpisodeGroups.length.toLocaleString()} EP
              </button>
            )}

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={actionableClipsCount === 0 || isAnalyzingPaste}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              actionableClipsCount > 0 && !isAnalyzingPaste
                ? 'bg-[#3B6845] hover:bg-[#2D5236] text-white shadow-xs hover:shadow-md active:scale-98'
                : 'bg-[#E5DED4] text-[#8E8174] border border-[#D8CFC3] cursor-not-allowed opacity-70'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {actionableClipsCount > 0
                ? syncEpisodesFromColD && activeEpisodeGroups.length > 0
                  ? `ยืนยันซิงค์ ${actionableClipsCount.toLocaleString()} แถว + แท็ก 3 ชั้น + ${activeEpisodeGroups.length.toLocaleString()} EP ➔`
                  : `ยืนยันจับคู่แท็ก 3 ชั้น (${actionableClipsCount.toLocaleString()} รายการ) ➔`
                : 'กรุณาวางข้อมูลหรือติ๊กเลือกรายการเพื่อซิงค์'}
            </span>
          </button>
        </div>
      </div>
    ) : undefined;

  return (
    <>
      <BaseModal
        isOpen={isModalOpen}
        onClose={handleClose}
        closeOnBackdropClick={!isProcessing}
        closeOnEsc={!isProcessing}
        fullScreen={isFullScreen}
        maxWidthClass="max-w-[96vw] xl:max-w-[1680px]"
        heightClass="h-[94dvh] sm:h-[92vh]"
        icon={
          activeMainSyncTab === 'YOUTUBE_DATE_SYNC' ? (
            <CalendarClock className="w-5 h-5 text-[#3B6845]" />
          ) : (
            <FileSpreadsheet className="w-5 h-5 text-[#3B6845]" />
          )
        }
        title={
          activeMainSyncTab === 'YOUTUBE_DATE_SYNC'
            ? 'อัปเดตเฉพาะวันที่เผยแพร่จริง (ตาราง 2 คอลัมน์)'
            : syncEpisodesFromColD
            ? 'สตูดิโอซิงก์ตารางหลัก 10 คอลัมน์ (ฟุตเทจ + แท็ก 3 ชั้น + EP + วันที่)'
            : 'ซิงก์แท็กฟุตเทจจาก Sheet (เฉพาะแท็กหมวดหมู่)'
        }
        badge={
          activeMainSyncTab === 'YOUTUBE_DATE_SYNC' ? (
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#FEF6E8] text-[#8A4D1F] border border-[#EAD5AE] font-bold">
              2-Col Date Patch
            </span>
          ) : (
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] font-bold">
              10-Col Unified (A–J)
            </span>
          )
        }
        subtitle={
          activeMainSyncTab === 'YOUTUBE_DATE_SYNC'
            ? 'วางตาราง วันที่ลงคลิป + ชื่อคลิปหลัก EP เพื่ออัปเดตเฉพาะวันเผยแพร่จริงและคำนวณวันพักฟุต (Cooldown) ใหม่'
            : !hasData
            ? 'วางตาราง 10 คอลัมน์ (ชื่อฟุต | ชื่อคลิป | ชื่ออันดับ | คำสร้อย | แท็ก Tier 1–3 | ลิงค์ | วันที่ | เวลา) เพื่อซิงก์ครบจบในครั้งเดียว'
            : undefined
        }
        headerRight={modalHeaderRight}
        footer={modalFooter}
        bodyClassName="p-0 bg-[#FAF8F5] flex flex-col overflow-hidden"
      >
        {activeMainSyncTab === 'YOUTUBE_DATE_SYNC' ? (
          <YouTubeDateSyncTabContent
            onClose={handleClose}
            onSwitchToSheetTab={() => setActiveMainSyncTab('SHEET_SYNC')}
            onGoToMasterEpisodes={handleGoToMasterEpisodes}
          />
        ) : isProcessing ? (
          <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto scrollbar-thin">
            <SheetSyncProgressView progress={syncProgress} />
          </div>
        ) : successReport ? (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <SheetSyncSuccessReportView
              report={successReport}
              onClose={handleClose}
              onGoToMasterEpisodes={handleGoToMasterEpisodes}
              onGoToYouTubeDateSyncTab={() => {
                setSuccessReport(null);
                setActiveMainSyncTab('YOUTUBE_DATE_SYNC');
              }}
            />
          </div>
        ) : isAnalyzingPaste ? (
          <SheetPasteAnalyzingView
            detectedLineCount={stats.totalRows}
            matchedCount={stats.matchedCount}
            episodeGroupsCount={stats.episodeGroupsCount}
          />
        ) : (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <AnimatePresence initial={false}>
              {(!hasData || isInputExpanded) && (
                <SheetCollapsiblePasteSection
                  pastedText={pastedText}
                  onChangePastedText={handleChangePastedText}
                  isExpanded={isInputExpanded}
                  onToggleExpanded={() => setIsInputExpanded((prev) => !prev)}
                  stats={stats}
                  syncEpisodesFromColD={syncEpisodesFromColD}
                />
              )}
            </AnimatePresence>

            {hasData && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                  {activePreviewTab === 'EPISODE_GROUPS' ? (
                    <SheetEpisodeGroupsPreview
                      key="tab-episode-groups"
                      episodeGroups={episodeGroups}
                      rankingOrder={rankingOrder}
                      onChangeRankingOrder={setRankingOrder}
                      autoCreateMissingFootage={autoCreateMissingFootage}
                      filterMode={epFilterMode}
                      onChangeFilterMode={setEpFilterMode}
                      searchQuery={epSearchQuery}
                      onChangeSearchQuery={setEpSearchQuery}
                      excludedEpisodeKeys={excludedEpisodeKeys}
                      onToggleEpisodeSelection={handleToggleEpisodeSelection}
                      onBatchSetEpisodeSelection={handleBatchSetEpisodeSelection}
                      excludedRowIndices={excludedRowIndices}
                      rowDensity={rowDensity}
                      onChangeCustomGroupPublishDate={(groupKey, dateIso) =>
                        setCustomPublishDateByGroupKey((prev) => ({
                          ...prev,
                          [groupKey]: dateIso,
                        }))
                      }
                      onChangeCustomGroupPublishSlot={(groupKey, slot) =>
                        setCustomPublishSlotByGroupKey((prev) => ({
                          ...prev,
                          [groupKey]: slot,
                        }))
                      }
                    />
                  ) : (
                    <SheetFootageRowsTable
                      key="tab-footage-rows"
                      parsedRows={parsedRows}
                      stats={stats}
                      filterMode={rowFilterMode}
                      onChangeFilterMode={setRowFilterMode}
                      searchQuery={rowSearchQuery}
                      onChangeSearchQuery={setRowSearchQuery}
                      excludedRowIndices={excludedRowIndices}
                      onToggleRowSelection={handleToggleRowSelection}
                      onBatchSetRowSelection={handleBatchSetRowSelection}
                      autoCreateMissingFootage={autoCreateMissingFootage}
                      rowDensity={rowDensity}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </BaseModal>
      <JunkTagCleanupModal
        isOpen={isJunkTagCleanupOpen}
        onClose={() => setIsJunkTagCleanupOpen(false)}
      />
    </>
  );
};
