import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import {
  isStagingTagId,
  normalizeFootageTags,
} from '../../services/seedData';
import { Episode, EpisodeRankingSlot } from '../../types/episode.types';
import { CategoryTag } from '../../types/tag.types';
import { getReferenceTodayDate } from '../../utils/cooldownCalculator';
import {
  generateMasterEpisodeFileName,
  generateNextId,
} from '../../utils/fileNameGenerator';
import { BaseModal } from '../ui/BaseModal';
import { SheetCollapsiblePasteSection } from './sheetImport/SheetCollapsiblePasteSection';
import { SheetEpisodeGroupsPreview } from './sheetImport/SheetEpisodeGroupsPreview';
import { SheetFootageRowsTable } from './sheetImport/SheetFootageRowsTable';
import { SheetHeaderRightControls } from './sheetImport/SheetInspectionHeaderBar';
import {
  normalizeCompareKey,
  parseSheetClipboardData,
  SAMPLE_4COL_SHEET_DATA,
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

const CHUNK_SIZE = 150;

const yieldToBrowser = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 18));

export const SheetTagImportModal: React.FC = () => {
  const {
    isSheetTagImportModalOpen,
    setIsSheetTagImportModalOpen,
    computedFootage,
    tags,
    tagMap,
    episodes,
    batchAddTags,
    batchAddDirectFootage,
    batchSyncFootageTagsByMap,
    batchUpsertEpisodes,
    setActiveTab,
  } = useCMS();

  const [pastedText, setPastedText] = useState('');
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const [isAnalyzingPaste, setIsAnalyzingPaste] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
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
    useState(true);

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

  // Auto-switch to FOOTAGE_ROWS tab if EP sync is turned off while on EPISODE_GROUPS tab
  useEffect(() => {
    if (!syncEpisodesFromColD && activePreviewTab === 'EPISODE_GROUPS') {
      setActivePreviewTab('FOOTAGE_ROWS');
    }
  }, [syncEpisodesFromColD, activePreviewTab]);

  // Handle paste changes & trigger 0.8s Step Morphing transition into the table
  const handleChangePastedText = (nextText: string) => {
    const wasEmpty = !pastedText.trim();
    const isMajorPaste =
      nextText.trim().length > 0 &&
      Math.abs(nextText.length - pastedText.length) > 15;

    setPastedText(nextText);
    setExcludedRowIndices(new Set());
    setExcludedEpisodeKeys(new Set());

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
      }, 780);
    }
  };

  // Parse clipboard rows + Episode groups with O(1) lookup maps
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
      }),
    [
      pastedText,
      computedFootage,
      tags,
      tagMap,
      episodes,
      rankingOrder,
      includeSeriesTagOnFootage,
    ]
  );

  // Row & Episode Selection Handlers
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

  // Active (non-excluded) rows and episodes
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

  // Execute Chunked Batch Sync
  const handleExecuteImport = async () => {
    if (actionableClipsCount === 0) return;

    setIsProcessing(true);

    try {
      const todayIso = getReferenceTodayDate();

      const totalEstimatedWork = Math.max(
        1,
        activeRows.length +
          (syncEpisodesFromColD ? activeEpisodeGroups.length : 0)
      );
      let completedWork = 0;

      const updateProgress = (
        phaseIndex: 1 | 2 | 3 | 4,
        phaseLabel: string,
        delta = 0
      ) => {
        completedWork = Math.min(totalEstimatedWork, completedWork + delta);
        const percent = Math.min(
          99,
          Math.round((completedWork / totalEstimatedWork) * 100)
        );
        setSyncProgress({
          phaseIndex,
          phaseLabel,
          completedItems: completedWork,
          totalItems: totalEstimatedWork,
          percent,
        });
      };

      // PHASE 1: Ensure all required Tags exist
      updateProgress(1, 'กำลังตรวจสอบและสร้างแท็กหมวดหมู่ใหม่...', 0);
      await yieldToBrowser();

      const tagIdByLowerName = new Map<string, string>();
      tags.forEach((t) => {
        if (!isStagingTagId(t.id)) {
          tagIdByLowerName.set(t.name.toLowerCase(), t.id);
        }
      });

      const newTagsToPersist: CategoryTag[] = [];
      const accumulatedTagIds = tags.map((t) => t.id);

      const ensureTagExists = (
        rawTagName: string,
        isSeriesTag = false
      ): string => {
        const cleaned = rawTagName.trim();
        const lower = cleaned.toLowerCase();
        if (tagIdByLowerName.has(lower)) {
          return tagIdByLowerName.get(lower)!;
        }

        const nextId = generateNextId('TAG', accumulatedTagIds);
        accumulatedTagIds.push(nextId);

        const newTag: CategoryTag = {
          id: nextId,
          name: cleaned,
          groupType: 'THEME',
          groupId: 'GRP-THEME',
          tier: 1,
          parentId: null,
          color: isSeriesTag ? 'emerald' : 'amber',
          description: isSeriesTag
            ? 'สร้างอัตโนมัติจากชื่อรายการจัดอันดับใน Google Sheets'
            : 'นำเข้าอัตโนมัติจาก Google Sheets',
          createdAt: todayIso,
        };

        newTagsToPersist.push(newTag);
        tagIdByLowerName.set(lower, nextId);
        return nextId;
      };

      activeRows.forEach((row) => {
        if (!row.matchedFootage && !autoCreateMissingFootage) return;
        row.tagNames.forEach((tName) => {
          ensureTagExists(tName, false);
        });
      });

      if (syncEpisodesFromColD && activeEpisodeGroups.length > 0) {
        activeEpisodeGroups.forEach((group) => {
          if (group.primaryTagName) {
            ensureTagExists(group.primaryTagName, true);
          }
        });
      }

      if (newTagsToPersist.length > 0) {
        for (let i = 0; i < newTagsToPersist.length; i += CHUNK_SIZE) {
          const chunk = newTagsToPersist.slice(i, i + CHUNK_SIZE);
          batchAddTags(chunk);
          await yieldToBrowser();
        }
      }

      // PHASE 2: Auto-create missing Footages in chunks if enabled
      updateProgress(2, 'กำลังสร้างรายการฟุตเทจใหม่เข้าคลัง...', 0);
      await yieldToBrowser();

      const footageIdByNormTitle = new Map<string, string>();
      const existingTagsByFootageId = new Map<string, string[]>();

      activeRows.forEach((row) => {
        if (row.matchedFootage) {
          const normKey = normalizeCompareKey(row.title);
          footageIdByNormTitle.set(normKey, row.matchedFootage.id);
          existingTagsByFootageId.set(
            row.matchedFootage.id,
            row.matchedFootage.tags
          );
        }
      });

      let createdClipsCount = 0;

      if (autoCreateMissingFootage) {
        const missingByNormTitle = new Map<
          string,
          {
            title: string;
            tagIds: Set<string>;
            episodeNote: string;
          }
        >();

        activeRows.forEach((row) => {
          if (row.matchedFootage) return;
          const normKey = normalizeCompareKey(row.title);
          const resolvedTagIds = row.tagNames
            .map((tName) => tagIdByLowerName.get(tName.toLowerCase()))
            .filter((id): id is string => Boolean(id));

          const existingEntry = missingByNormTitle.get(normKey);
          if (existingEntry) {
            resolvedTagIds.forEach((id) => existingEntry.tagIds.add(id));
          } else {
            missingByNormTitle.set(normKey, {
              title: row.title,
              tagIds: new Set(resolvedTagIds),
              episodeNote: row.episodeTitle
                ? `ซิงค์จากชีท (${row.episodeTitle})`
                : 'ซิงค์จากชีท',
            });
          }
        });

        if (missingByNormTitle.size > 0) {
          const missingEntries = Array.from(missingByNormTitle.entries());
          for (let i = 0; i < missingEntries.length; i += CHUNK_SIZE) {
            const chunkEntries = missingEntries.slice(i, i + CHUNK_SIZE);
            const createdChunk = batchAddDirectFootage(
              chunkEntries.map(([, val]) => ({
                title: val.title,
                tags: Array.from(val.tagIds),
                duration: 15,
                driveUrl: '',
                jokeSummary: val.episodeNote,
              })),
              'FT'
            );

            createdChunk.forEach((ft, idx) => {
              const [normKey] = chunkEntries[idx];
              footageIdByNormTitle.set(normKey, ft.id);
              existingTagsByFootageId.set(ft.id, ft.tags);
            });

            createdClipsCount += createdChunk.length;
            updateProgress(
              2,
              `สร้างฟุตเทจใหม่แล้ว ${createdClipsCount.toLocaleString()} / ${missingEntries.length.toLocaleString()} คลิป...`,
              chunkEntries.length
            );
            await yieldToBrowser();
          }
        }
      }

      // PHASE 3: Merge tags for all matched footages in chunks
      updateProgress(3, 'กำลังผสานแท็กและย้ายฟุตเทจออกจากพื้นที่พัก...', 0);
      await yieldToBrowser();

      const mergedTagSetByFootageId = new Map<string, Set<string>>();
      const movedFromStagingFootageIds = new Set<string>();

      activeRows.forEach((row) => {
        if (!row.matchedFootage) return;
        const ftId = row.matchedFootage.id;

        if (!mergedTagSetByFootageId.has(ftId)) {
          const baseSet = new Set<string>();
          (existingTagsByFootageId.get(ftId) || []).forEach((tid) => {
            if (!isStagingTagId(tid)) {
              baseSet.add(tid);
            }
          });
          mergedTagSetByFootageId.set(ftId, baseSet);
        }

        const targetSet = mergedTagSetByFootageId.get(ftId)!;
        row.tagNames.forEach((tName) => {
          const tagId = tagIdByLowerName.get(tName.toLowerCase());
          if (tagId) {
            targetSet.add(tagId);
          }
        });

        if (row.isInStaging && targetSet.size > 0) {
          movedFromStagingFootageIds.add(ftId);
        }
      });

      const footageIdEntries = Array.from(mergedTagSetByFootageId.entries());
      const updatedClipsCount = footageIdEntries.length;

      for (let i = 0; i < footageIdEntries.length; i += CHUNK_SIZE) {
        const chunk = footageIdEntries.slice(i, i + CHUNK_SIZE);
        const chunkPayload: Record<string, string[]> = {};
        chunk.forEach(([ftId, tagSet]) => {
          chunkPayload[ftId] = normalizeFootageTags(Array.from(tagSet));
        });
        batchSyncFootageTagsByMap(chunkPayload, 'REPLACE');
        updateProgress(
          3,
          `อัปเดตแท็กฟุตเทจแล้ว ${Math.min(
            footageIdEntries.length,
            i + chunk.length
          ).toLocaleString()} / ${footageIdEntries.length.toLocaleString()} คลิป...`,
          chunk.length
        );
        await yieldToBrowser();
      }

      // PHASE 4: Build and Upsert 5-Rank Episodes in chunks
      let createdEpisodesCount = 0;
      let updatedEpisodesCount = 0;
      const syncedEpisodeTitles: string[] = [];

      if (syncEpisodesFromColD && activeEpisodeGroups.length > 0) {
        updateProgress(4, 'กำลังจัดอันดับและบันทึกคลังคลิปหลัก (EP)...', 0);
        await yieldToBrowser();

        const accumulatedEpIds = episodes.map((e) => e.id);
        const episodesToUpsert: Episode[] = [];

        const rankSequence: Array<5 | 4 | 3 | 2 | 1> =
          rankingOrder === 'RANK_5_TO_1' ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5];

        activeEpisodeGroups.forEach((group) => {
          const groupActiveRows = group.rows.filter(
            (r) => !excludedRowIndices.has(r.rowIndex)
          );
          if (groupActiveRows.length === 0) return;

          const existingEp = group.existingEpisode;
          const epId = existingEp
            ? existingEp.id
            : generateNextId('EP', accumulatedEpIds);

          if (!existingEp) {
            accumulatedEpIds.push(epId);
            createdEpisodesCount += 1;
          } else {
            updatedEpisodesCount += 1;
          }

          const primaryTagId =
            tagIdByLowerName.get(group.primaryTagName.toLowerCase()) ||
            tags.find((t) => !isStagingTagId(t.id))?.id ||
            'TAG-0001';

          const rankings: EpisodeRankingSlot[] = (
            [5, 4, 3, 2, 1] as const
          ).map((rankSlot) => {
            const seqIndex = rankSequence.indexOf(rankSlot);
            const rowForSlot =
              seqIndex >= 0 ? groupActiveRows[seqIndex] || null : null;

            let resolvedFootageId: string | null = null;
            if (rowForSlot) {
              if (rowForSlot.matchedFootage) {
                resolvedFootageId = rowForSlot.matchedFootage.id;
              } else {
                const normKey = normalizeCompareKey(rowForSlot.title);
                resolvedFootageId = footageIdByNormTitle.get(normKey) || null;
              }
            }

            if (!resolvedFootageId && existingEp) {
              const prevSlot = existingEp.rankings.find(
                (r) => r.rank === rankSlot
              );
              if (prevSlot?.footageId) {
                resolvedFootageId = prevSlot.footageId;
              }
            }

            const existingMascotScript =
              existingEp?.rankings.find((r) => r.rank === rankSlot)
                ?.mascotScript || '';

            return {
              rank: rankSlot,
              footageId: resolvedFootageId,
              mascotScript:
                existingMascotScript ||
                (rowForSlot
                  ? `อันดับที่ ${rankSlot} — ${rowForSlot.title}`
                  : `อันดับที่ ${rankSlot}`),
              snapshotNote: rowForSlot?.isInStaging
                ? 'ซิงค์จากฟุตเทจไร้หมวดหมู่ผ่าน Google Sheets'
                : 'ซิงค์จัดอันดับจาก Google Sheets',
            };
          });

          const publishDate = existingEp?.publishDate || todayIso;
          const publishSlot = existingEp?.publishSlot || 'EVENING_1800';
          const youtubeUrl =
            group.youtubeUrl || existingEp?.masterVideoInfo?.youtubeUrl || '';

          const autoMasterFileName = generateMasterEpisodeFileName(
            epId,
            publishDate,
            publishSlot,
            group.episodeTitle
          );

          const epPayload: Episode = {
            id: epId,
            title: group.episodeTitle,
            categoryEpisodeNo: group.episodeNo,
            categoryEpisodeScope: 'MAIN_CATEGORY',
            seriesId: primaryTagId,
            seriesTitle: group.seriesBaseName || group.episodeTitle,
            categoryGroupId: existingEp?.categoryGroupId || 'GRP-THEME',
            mainCategoryTagId: primaryTagId,
            productionTarget:
              existingEp?.productionTarget || 'MAIN_CATEGORY_VARIETY',
            targetSubcategoryId: existingEp?.targetSubcategoryId || null,
            publishDate,
            publishSlot,
            workflowStage: '4_PUBLISHED',
            introMascotScript:
              existingEp?.introMascotScript ||
              `สวัสดีครับ วันนี้พบกับ ${group.episodeTitle} ไปดูกันเลย!`,
            outroMascotScript:
              existingEp?.outroMascotScript ||
              `ชอบอันดับไหนใน ${group.episodeTitle} คอมเมนต์บอกกันได้เลย!`,
            rankings,
            masterVideoInfo: {
              masterFileName:
                existingEp?.masterVideoInfo?.masterFileName ||
                autoMasterFileName,
              masterDriveUrl:
                existingEp?.masterVideoInfo?.masterDriveUrl ||
                `https://drive.google.com/file/d/MASTER-${epId}/view`,
              youtubeUrl,
              facebookUrl: existingEp?.masterVideoInfo?.facebookUrl || '',
              viewsCount: existingEp?.masterVideoInfo?.viewsCount || 0,
              performanceNote:
                existingEp?.masterVideoInfo?.performanceNote ||
                `ซิงค์จาก Google Sheets (${groupActiveRows.length} ฟุตเทจ)`,
            },
            createdAt: existingEp?.createdAt || todayIso,
          };

          episodesToUpsert.push(epPayload);
          syncedEpisodeTitles.push(group.episodeTitle);
        });

        for (let i = 0; i < episodesToUpsert.length; i += CHUNK_SIZE) {
          const epChunk = episodesToUpsert.slice(i, i + CHUNK_SIZE);
          batchUpsertEpisodes(epChunk);
          updateProgress(
            4,
            `บันทึกคลังคลิปหลักแล้ว ${Math.min(
              episodesToUpsert.length,
              i + epChunk.length
            ).toLocaleString()} / ${episodesToUpsert.length.toLocaleString()} ตอน...`,
            epChunk.length
          );
          await yieldToBrowser();
        }
      }

      setSyncProgress({
        phaseIndex: 4,
        phaseLabel: 'ซิงค์ฐานข้อมูลเสร็จสมบูรณ์!',
        completedItems: totalEstimatedWork,
        totalItems: totalEstimatedWork,
        percent: 100,
      });

      setSuccessReport({
        updatedClipsCount,
        createdClipsCount,
        movedFromStagingCount: movedFromStagingFootageIds.size,
        skippedRowsCount: excludedRowIndices.size,
        createdTagsCount: newTagsToPersist.length,
        createdTagNames: newTagsToPersist.map((t) => t.name),
        createdEpisodesCount,
        updatedEpisodesCount,
        skippedEpisodesCount: excludedEpisodeKeys.size,
        syncedEpisodeTitles,
      });
    } catch (err) {
      console.error('Sheet tag & episode sync error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setIsSheetTagImportModalOpen(false);
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
  };

  const handleGoToMasterEpisodes = () => {
    handleClose();
    setActiveTab('MASTER_ARCHIVE');
  };

  const hasData = parsedRows.length > 0;

  // Minimalist Single-Row Header Right Controls (Main Tab Pill Switcher + Icon-Only Buttons with Hover Tooltips)
  const modalHeaderRight = !isProcessing && !successReport && (
    <SheetHeaderRightControls
      hasData={hasData}
      stats={stats}
      activePreviewTab={activePreviewTab}
      onChangeActivePreviewTab={setActivePreviewTab}
      isInputExpanded={isInputExpanded}
      onToggleInputExpanded={() => setIsInputExpanded((prev) => !prev)}
      onClearPastedText={() => handleChangePastedText('')}
      onLoadSampleData={() => handleChangePastedText(SAMPLE_4COL_SHEET_DATA)}
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
    />
  );

  const modalFooter =
    !successReport && !isProcessing ? (
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
                  (เฉพาะแท็กฟุตเทจ A–B · ปิดสร้าง EP)
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FEF8ED] hover:bg-[#FAEED6] text-[#734B17] border border-[#EDD7AF] transition-colors cursor-pointer whitespace-nowrap"
              >
                ดูพรีวิวจัดอันดับ {activeEpisodeGroups.length.toLocaleString()} EP
                ก่อนบันทึก
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
                  ? `ยืนยันซิงค์ ${actionableClipsCount.toLocaleString()} แถว & จัดอันดับ ${activeEpisodeGroups.length.toLocaleString()} EP ➔`
                  : `ยืนยันจับคู่แท็ก (${actionableClipsCount.toLocaleString()} รายการ) ➔`
                : 'กรุณาวางข้อมูลหรือติ๊กเลือกรายการเพื่อซิงค์'}
            </span>
          </button>
        </div>
      </div>
    ) : undefined;

  return (
    <BaseModal
      isOpen={isSheetTagImportModalOpen}
      onClose={handleClose}
      fullScreen={isFullScreen}
      maxWidthClass="max-w-[96vw] xl:max-w-[1680px]"
      heightClass="h-[94dvh] sm:h-[92vh]"
      icon={<FileSpreadsheet className="w-5 h-5 text-[#3B6845]" />}
      title={
        syncEpisodesFromColD
          ? 'ซิงค์แท็ก & จัดอันดับ EP จาก Sheet'
          : 'ซิงค์แท็กฟุตเทจจาก Sheet (คอลัมน์ A–B)'
      }
      badge={
        syncEpisodesFromColD ? (
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#EEF5EE] text-[#254B2D] border border-[#BAD8BF] font-bold">
            4-Col Sync
          </span>
        ) : (
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#F0F7FF] text-[#1E40AF] border border-[#BFDBFE] font-bold">
            2-Col Tag Sync
          </span>
        )
      }
      subtitle={
        !hasData
          ? syncEpisodesFromColD
            ? 'ก๊อปปี้แถว 4 คอลัมน์ (A–D) จาก Google Sheets มาวางเพื่อจับคู่แท็กและจัดอันดับคลังคลิปหลัก'
            : 'ก๊อปปี้คอลัมน์ A (ชื่อคลิป) และ B (แท็ก) จาก Google Sheets มาวางเพื่อจับคู่หมวดหมู่ฟุตเทจ'
          : undefined
      }
      headerRight={modalHeaderRight}
      footer={modalFooter}
      bodyClassName="p-0 bg-[#FAF8F5] flex flex-col overflow-hidden"
    >
      {isProcessing ? (
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto scrollbar-thin">
          <SheetSyncProgressView progress={syncProgress} />
        </div>
      ) : successReport ? (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <SheetSyncSuccessReportView
            report={successReport}
            onClose={handleClose}
            onGoToMasterEpisodes={handleGoToMasterEpisodes}
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
          {/* 1. Paste Input Canvas (Full-screen when empty, or Slide-Down Drawer when editing existing paste) */}
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

          {/* 2. Full-Bleed Table / Episode Accordion Flushed Directly Against the Single-Row Modal Header */}
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
  );
};
