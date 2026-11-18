import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FileSpreadsheet, CheckCircle2, CalendarClock } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { PublishSlot } from '../../types/episode.types';
import { BaseModal } from '../ui/BaseModal';
import { JunkTagCleanupModal } from '../tags/JunkTagCleanupModal';
import { YouTubeDateSyncTabContent } from '../episodes/youtubeDateSync/YouTubeDateSyncModal';
import { executeSheetUnifiedSync } from './sheetImport/executeSheetUnifiedSync';
import { SheetCollapsiblePasteSection } from './sheetImport/SheetCollapsiblePasteSection';
import { SheetColumnSelectorBar } from './sheetImport/SheetColumnSelectorBar';
import { SheetEpisodeGroupsPreview } from './sheetImport/SheetEpisodeGroupsPreview';
import { SheetFootageRowsTable } from './sheetImport/SheetFootageRowsTable';
import {
  SheetHeaderSubNavBar,
  SheetHeaderUtilityActions,
  UnifiedSyncMainTab,
} from './sheetImport/SheetInspectionHeaderBar';
import {
  parseSheetClipboardData,
} from './sheetImport/sheetImportParser';
import {
  SheetPasteAnalyzingView,
  SheetSyncProgressView,
  SheetSyncSuccessReportView,
} from './sheetImport/SheetSyncProgressAndReport';
import {
  DEFAULT_SHEET_COLUMN_SYNC_CONFIG,
  EpisodeGroupFilterMode,
  FootageRowFilterMode,
  ParsedEpisodeGroup,
  RankingOrderDirection,
  SheetColumnSyncConfig,
  SheetSyncSuccessReport,
  SyncProgressState,
  TableRowDensity,
} from './sheetImport/sheetImport.types';

const mainTabContentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 36 : direction < 0 ? -36 : 0,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -36 : direction < 0 ? 36 : 0,
    opacity: 0,
  }),
};

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
  const [tabDirection, setTabDirection] = useState<number>(0);

  const handleMainTabChange = (nextTab: UnifiedSyncMainTab) => {
    if (nextTab === activeMainSyncTab) return;
    const currentIdx = activeMainSyncTab === 'SHEET_SYNC' ? 0 : 1;
    const nextIdx = nextTab === 'SHEET_SYNC' ? 0 : 1;
    setTabDirection(nextIdx > currentIdx ? 1 : -1);
    setSuccessReport(null);
    setActiveMainSyncTab(nextTab);
  };

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
  const [columnSyncConfig, setColumnSyncConfig] =
    useState<SheetColumnSyncConfig>(() => ({
      ...DEFAULT_SHEET_COLUMN_SYNC_CONFIG,
    }));

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
        columnSyncConfig,
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
      columnSyncConfig,
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

  const episodeGroupByRowIndex = useMemo(() => {
    const map = new Map<number, ParsedEpisodeGroup>();
    episodeGroups.forEach((group) => {
      group.rows.forEach((r) => {
        map.set(r.rowIndex, group);
      });
    });
    return map;
  }, [episodeGroups]);

  const {
    actionableClipsCount,
    matchedActiveCount,
    newClipsActiveCount,
    activeNewTagsCount,
  } = useMemo(() => {
    let matched = 0;
    let newClips = 0;
    const newTagsSet = new Set<string>();
    const hasAnyTagTierEnabled =
      columnSyncConfig.syncColE_Tier1Tags ||
      columnSyncConfig.syncColF_Tier2Tags ||
      columnSyncConfig.syncColG_Tier3Tags;

    activeRows.forEach((r) => {
      if (r.matchedFootage !== null) {
        matched += 1;
      } else if (autoCreateMissingFootage) {
        newClips += 1;
      } else {
        return;
      }

      if (hasAnyTagTierEnabled) {
        r.resolvedTags.forEach((rt) => {
          const tierAllowed =
            (rt.tier === 1 && columnSyncConfig.syncColE_Tier1Tags) ||
            (rt.tier === 2 && columnSyncConfig.syncColF_Tier2Tags) ||
            (rt.tier === 3 && columnSyncConfig.syncColG_Tier3Tags);
          if (tierAllowed && rt.isNew) {
            newTagsSet.add(rt.name.toLowerCase());
          }
        });
      }
    });

    return {
      actionableClipsCount: matched + newClips,
      matchedActiveCount: matched,
      newClipsActiveCount: newClips,
      activeNewTagsCount: newTagsSet.size,
    };
  }, [activeRows, autoCreateMissingFootage, columnSyncConfig]);

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
        columnSyncConfig,
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
    <SheetHeaderUtilityActions
      activeMainSyncTab={activeMainSyncTab}
      hasData={hasData}
      isInputExpanded={isInputExpanded}
      onToggleInputExpanded={() => setIsInputExpanded((prev) => !prev)}
      onClearPastedText={() => handleChangePastedText('')}
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
      rankingOrder={rankingOrder}
      onChangeRankingOrder={setRankingOrder}
      onOpenJunkTagCleanup={() => setIsJunkTagCleanupOpen(true)}
    />
  );

  const modalHeaderSubNav = !isProcessing && (
    <SheetHeaderSubNavBar
      activeMainSyncTab={activeMainSyncTab}
      onChangeMainSyncTab={handleMainTabChange}
      hasData={hasData}
      stats={stats}
      activePreviewTab={activePreviewTab}
      onChangeActivePreviewTab={setActivePreviewTab}
      syncEpisodesFromColD={syncEpisodesFromColD}
    />
  );

  const modalFooter =
    activeMainSyncTab === 'SHEET_SYNC' && !successReport && !isProcessing ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-[#6E5F52] min-w-0 flex-wrap">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl font-semibold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer shrink-0"
          >
            ยกเลิก
          </button>

          {hasData && (
            <div className="hidden sm:flex items-center gap-1.5 flex-wrap tabular-nums">
              <span>พร้อมซิงก์:</span>
              <strong className="text-[#1C4824]">
                อัปเดตคลัง {matchedActiveCount.toLocaleString()} คลิป
              </strong>
              {newClipsActiveCount > 0 && (
                <>
                  <span>+</span>
                  <strong className="text-[#734B17]">
                    คลิปใหม่ {newClipsActiveCount.toLocaleString()}
                  </strong>
                </>
              )}
              {activeNewTagsCount > 0 && (
                <>
                  <span className="text-[#C5B49E]">·</span>
                  <strong className="text-[#1E40AF]">
                    แท็กใหม่ +{activeNewTagsCount.toLocaleString()}
                  </strong>
                </>
              )}
              <span className="text-[#C5B49E]">·</span>
              {syncEpisodesFromColD && episodeGroups.length > 0 ? (
                <strong className="text-[#3D332A]">
                  {activeEpisodeGroups.length.toLocaleString()} EP
                </strong>
              ) : (
                <span className="text-[#7A6E60]">ไม่สร้าง EP</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {syncEpisodesFromColD &&
            episodeGroups.length > 0 &&
            activePreviewTab === 'FOOTAGE_ROWS' && (
              <button
                type="button"
                onClick={() => setActivePreviewTab('EPISODE_GROUPS')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FEF6E8] hover:bg-[#FAEBD0] text-[#734B17] border border-[#EAD5AE] transition-colors cursor-pointer whitespace-nowrap tabular-nums"
              >
                ดูพรีวิวจัดอันดับ & วันที่ {activeEpisodeGroups.length.toLocaleString()} EP
              </button>
            )}

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={actionableClipsCount === 0 || isAnalyzingPaste}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap tabular-nums ${
              actionableClipsCount > 0 && !isAnalyzingPaste
                ? 'bg-[#3B6845] hover:bg-[#2D5236] text-white shadow-xs hover:shadow-md active:scale-98'
                : 'bg-[#E5DED4] text-[#8E8174] border border-[#D8CFC3] cursor-not-allowed opacity-70'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {actionableClipsCount > 0
                ? syncEpisodesFromColD && activeEpisodeGroups.length > 0
                  ? `ยืนยันซิงก์ ${actionableClipsCount.toLocaleString()} แถว + ${activeEpisodeGroups.length.toLocaleString()} EP ➔`
                  : `ยืนยันซิงก์แท็กฟุตเทจ (${actionableClipsCount.toLocaleString()} รายการ) ➔`
                : 'กรุณาวางข้อมูลหรือติ๊กเลือกรายการเพื่อซิงก์'}
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
            ? 'สตูดิโอซิงก์ตารางหลัก (10 คอลัมน์ A–J)'
            : 'ซิงก์แท็กฟุตเทจจาก Sheet (เฉพาะแท็ก 3 ชั้น)'
        }
        subtitle={
          activeMainSyncTab === 'YOUTUBE_DATE_SYNC'
            ? 'วางตาราง วันที่ลงคลิป + ชื่อคลิปหลัก EP เพื่ออัปเดตเฉพาะวันเผยแพร่จริงและคำนวณวันพักฟุต (Cooldown) ใหม่'
            : !hasData
            ? 'วางตาราง 10 คอลัมน์จาก Google Sheets เพื่อจับคู่คลังฟุตเทจ แท็ก 3 ชั้น คำสร้อย และจัดกลุ่ม EP ครบในครั้งเดียว'
            : undefined
        }
        headerRight={modalHeaderRight}
        headerContent={modalHeaderSubNav}
        footer={modalFooter}
        bodyClassName="p-0 bg-[#FAF8F5] flex flex-col overflow-hidden"
      >
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative w-full h-full">
          <AnimatePresence mode="wait" custom={tabDirection} initial={false}>
            <motion.div
              key={activeMainSyncTab}
              custom={tabDirection}
              variants={mainTabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 380, damping: 32 },
                opacity: { duration: 0.18, ease: 'easeInOut' },
              }}
              className="flex-1 min-h-0 flex flex-col overflow-hidden w-full h-full"
            >
              {activeMainSyncTab === 'YOUTUBE_DATE_SYNC' ? (
                <YouTubeDateSyncTabContent
                  onClose={handleClose}
                  onSwitchToSheetTab={() => handleMainTabChange('SHEET_SYNC')}
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
                    onGoToYouTubeDateSyncTab={() =>
                      handleMainTabChange('YOUTUBE_DATE_SYNC')
                    }
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
                    <>
                      <SheetColumnSelectorBar
                        columnSyncConfig={columnSyncConfig}
                        onChangeColumnSyncConfig={setColumnSyncConfig}
                        syncEpisodesFromColD={syncEpisodesFromColD}
                        stats={stats}
                        activePreviewTab={activePreviewTab}
                        onChangeActivePreviewTab={setActivePreviewTab}
                        rowFilterMode={rowFilterMode}
                        onChangeRowFilterMode={setRowFilterMode}
                        rowSearchQuery={rowSearchQuery}
                        onChangeRowSearchQuery={setRowSearchQuery}
                        epFilterMode={epFilterMode}
                        onChangeEpFilterMode={setEpFilterMode}
                        epSearchQuery={epSearchQuery}
                        onChangeEpSearchQuery={setEpSearchQuery}
                        episodeGroups={episodeGroups}
                        excludedRowIndices={excludedRowIndices}
                        autoCreateMissingFootage={autoCreateMissingFootage}
                      />

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
                              onBatchSetEpisodeSelection={
                                handleBatchSetEpisodeSelection
                              }
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
                              columnSyncConfig={columnSyncConfig}
                              syncEpisodesFromColD={syncEpisodesFromColD}
                              episodeGroupByRowIndex={episodeGroupByRowIndex}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </BaseModal>
      <JunkTagCleanupModal
        isOpen={isJunkTagCleanupOpen}
        onClose={() => setIsJunkTagCleanupOpen(false)}
      />
    </>
  );
};
