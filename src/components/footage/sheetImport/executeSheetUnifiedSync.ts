import { firestoreService } from '../../../firebase/firestoreService';
import {
  isStagingTagId,
  normalizeFootageTags,
} from '../../../services/seedData';
import { Episode, EpisodeRankingSlot } from '../../../types/episode.types';
import { ComputedFootage, Footage } from '../../../types/footage.types';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_TIER_SUBCATEGORIES,
} from '../../../types/tag.types';
import { getReferenceTodayDate } from '../../../utils/cooldownCalculator';
import {
  generateMasterEpisodeFileName,
  generateNextId,
} from '../../../utils/fileNameGenerator';
import { resolveTagByDataDictionary } from '../../../utils/tagDictionaryRules';
import { normalizeCompareKey } from './sheetImportParser';
import {
  ParsedEpisodeGroup,
  ParsedSheetRow,
  RankingOrderDirection,
  SheetSyncSuccessReport,
  SyncProgressState,
} from './sheetImport.types';

const yieldToBrowser = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 18));

export interface ExecuteSheetUnifiedSyncParams {
  activeRows: ParsedSheetRow[];
  activeEpisodeGroups: ParsedEpisodeGroup[];
  excludedRowIndices: Set<number>;
  excludedEpisodeKeys: Set<string>;
  syncEpisodesFromColD: boolean;
  autoCreateMissingFootage: boolean;
  includeSeriesTagOnFootage: boolean;
  rankingOrder: RankingOrderDirection;
  tags: CategoryTag[];
  episodes: Episode[];
  computedFootageMap: Record<string, ComputedFootage>;
  batchAddTags: (
    newTags: CategoryTag[],
    onProgress?: (prog: {
      completedOps: number;
      totalOps: number;
      completedChunks: number;
      totalChunks: number;
    }) => void
  ) => Promise<void>;
  batchAddDirectFootage: (
    items: Array<{
      title: string;
      tags?: string[];
      durationSec?: number;
      driveFileUrl?: string;
      mascotNotes?: string;
    }>,
    idPrefix?: 'CLP' | 'FT',
    onProgress?: (prog: {
      completedOps: number;
      totalOps: number;
      completedChunks: number;
      totalChunks: number;
    }) => void
  ) => Promise<Footage[]>;
  batchSyncFootageTagsByMap: (
    tagsByFootageId: Record<string, string[]>,
    mode?: 'APPEND' | 'REPLACE',
    onProgress?: (prog: {
      completedOps: number;
      totalOps: number;
      completedChunks: number;
      totalChunks: number;
    }) => void,
    mascotNotesByFootageId?: Record<string, string>
  ) => Promise<void>;
  batchUpsertEpisodes: (
    episodesToUpsert: Episode[],
    onProgress?: (prog: {
      completedOps: number;
      totalOps: number;
      completedChunks: number;
      totalChunks: number;
    }) => void
  ) => Promise<void>;
  batchSyncFootageCreatedAtByMap: (
    createdAtByFootageId: Record<string, string>
  ) => Promise<number>;
  onProgressUpdate: (state: SyncProgressState) => void;
}

export async function executeSheetUnifiedSync(
  params: ExecuteSheetUnifiedSyncParams
): Promise<SheetSyncSuccessReport> {
  const {
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
    onProgressUpdate,
  } = params;

  return firestoreService.withBatchWriteLock(async () => {
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
      absoluteCompleted?: number
    ) => {
      if (absoluteCompleted !== undefined) {
        completedWork = Math.min(totalEstimatedWork, absoluteCompleted);
      }
      const percent = Math.min(
        99,
        Math.round((completedWork / totalEstimatedWork) * 100)
      );
      onProgressUpdate({
        phaseIndex,
        phaseLabel,
        completedItems: completedWork,
        totalItems: totalEstimatedWork,
        percent,
      });
    };

    // PHASE 1: Ensure all required Tags exist in their target Tier (1, 2, or 3)
    updateProgress(
      1,
      'กำลังตรวจสอบและสร้างแท็ก 3 ชั้น (Tier 1 / 2 / 3) ขึ้น Cloud...',
      0
    );
    await yieldToBrowser();

    const tagIdByLowerName = new Map<string, string>();
    tags.forEach((t) => {
      if (!isStagingTagId(t.id)) {
        tagIdByLowerName.set(t.name.toLowerCase(), t.id);
      }
    });

    const newTagsToPersist: CategoryTag[] = [];
    const accumulatedTagIds = tags.map((t) => t.id);

    let createdTier1TagsCount = 0;
    let createdTier2TagsCount = 0;
    let createdTier3TagsCount = 0;

    const ensureTagExistsWithTier = (
      rawTagName: string,
      targetTier: CategoryTier = 1,
      isSeriesTag = false
    ): string => {
      const ruleMatch = resolveTagByDataDictionary(rawTagName, targetTier)[0];
      const cleaned = ruleMatch?.name || rawTagName.trim();
      const lower = cleaned.toLowerCase();
      if (tagIdByLowerName.has(lower)) {
        return tagIdByLowerName.get(lower)!;
      }

      const resolvedTier: CategoryTier = ruleMatch?.dictionarySpecId
        ? ruleMatch.tier
        : targetTier;

      const nextId =
        ruleMatch?.dictionarySpecId &&
        !accumulatedTagIds.includes(ruleMatch.dictionarySpecId)
          ? ruleMatch.dictionarySpecId
          : generateNextId('TAG', accumulatedTagIds);
      accumulatedTagIds.push(nextId);

      const defaultSubCategory =
        ruleMatch?.subCategory ||
        (resolvedTier === 1
          ? DEFAULT_TIER_SUBCATEGORIES.tier1[0]
          : resolvedTier === 2
          ? DEFAULT_TIER_SUBCATEGORIES.tier2[0]
          : DEFAULT_TIER_SUBCATEGORIES.tier3[0]);

      const tierColor =
        ruleMatch?.color ||
        (resolvedTier === 1 ? 'blue' : resolvedTier === 2 ? 'amber' : 'emerald');

      const newTag: CategoryTag = {
        id: nextId,
        name: cleaned,
        groupType:
          resolvedTier === 3 ? 'PERSON' : resolvedTier === 2 ? 'ACTION' : 'THEME',
        groupId:
          resolvedTier === 3
            ? 'GRP-PERSON'
            : resolvedTier === 2
            ? 'GRP-ACTION'
            : 'GRP-THEME',
        tier: resolvedTier,
        subCategory: defaultSubCategory,
        parentId: null,
        entityType: ruleMatch?.entityType,
        color: isSeriesTag && !ruleMatch?.dictionarySpecId ? 'emerald' : tierColor,
        description:
          ruleMatch?.description ||
          (isSeriesTag
            ? 'สร้างอัตโนมัติจากชื่อรายการจัดอันดับใน Google Sheets'
            : `นำเข้าอัตโนมัติเข้า Tier ${resolvedTier} จากตารางหลัก 10 คอลัมน์`),
        createdAt: todayIso,
      };

      newTagsToPersist.push(newTag);
      tagIdByLowerName.set(lower, nextId);

      if (resolvedTier === 1) createdTier1TagsCount += 1;
      else if (resolvedTier === 2) createdTier2TagsCount += 1;
      else if (resolvedTier === 3) createdTier3TagsCount += 1;

      return nextId;
    };

    activeRows.forEach((row) => {
      if (!row.matchedFootage && !autoCreateMissingFootage) return;
      row.resolvedTags.forEach((rt) => {
        ensureTagExistsWithTier(rt.name, rt.tier, false);
      });
    });

    if (
      syncEpisodesFromColD &&
      includeSeriesTagOnFootage &&
      activeEpisodeGroups.length > 0
    ) {
      activeEpisodeGroups.forEach((group) => {
        if (group.primaryTagName) {
          ensureTagExistsWithTier(group.primaryTagName, 1, true);
        }
      });
    }

    if (newTagsToPersist.length > 0) {
      await batchAddTags(newTagsToPersist, (chunkProg) => {
        updateProgress(
          1,
          `กำลังบันทึกแท็ก 3 ชั้นใหม่ขึ้น Cloud ก้อนที่ ${chunkProg.completedChunks}/${chunkProg.totalChunks} (${chunkProg.completedOps.toLocaleString()}/${chunkProg.totalOps.toLocaleString()} แท็ก)...`
        );
      });
    }

    // PHASE 2: Auto-create missing Footages with rankTitle & punchlineNote
    updateProgress(
      2,
      'กำลังสร้างรายการฟุตเทจใหม่เข้าคลังพร้อมชื่ออันดับ/คำสร้อย...'
    );
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
          earliestPublishDate: string;
        }
      >();

      activeRows.forEach((row) => {
        if (row.matchedFootage) return;
        const normKey = normalizeCompareKey(row.title);
        const resolvedTagIds = row.tagNames
          .map((tName) => tagIdByLowerName.get(tName.toLowerCase()))
          .filter((id): id is string => Boolean(id));

        const noteParts: string[] = [];
        if (row.rankTitle) noteParts.push(`ชื่ออันดับ: ${row.rankTitle}`);
        if (row.punchlineNote) noteParts.push(`คำสร้อย: ${row.punchlineNote}`);
        if (row.episodeTitle) noteParts.push(`EP: ${row.episodeTitle}`);
        const builtNote =
          noteParts.length > 0 ? noteParts.join(' · ') : 'ซิงค์จากตารางหลัก 10 คอลัมน์';

        const existingEntry = missingByNormTitle.get(normKey);
        if (existingEntry) {
          resolvedTagIds.forEach((id) => existingEntry.tagIds.add(id));
          if (
            row.publishDate &&
            (!existingEntry.earliestPublishDate ||
              row.publishDate < existingEntry.earliestPublishDate)
          ) {
            existingEntry.earliestPublishDate = row.publishDate;
          }
        } else {
          missingByNormTitle.set(normKey, {
            title: row.title,
            tagIds: new Set(resolvedTagIds),
            episodeNote: builtNote,
            earliestPublishDate: row.publishDate || todayIso,
          });
        }
      });

      if (missingByNormTitle.size > 0) {
        const missingEntries = Array.from(missingByNormTitle.entries());
        const createdAll = await batchAddDirectFootage(
          missingEntries.map(([, val]) => ({
            title: val.title,
            tags: Array.from(val.tagIds),
            durationSec: 15,
            driveFileUrl: '',
            mascotNotes: val.episodeNote,
          })),
          'FT',
          (chunkProg) => {
            updateProgress(
              2,
              `กำลังบันทึกฟุตเทจใหม่ขึ้น Cloud ก้อนที่ ${chunkProg.completedChunks}/${chunkProg.totalChunks} (${chunkProg.completedOps.toLocaleString()}/${chunkProg.totalOps.toLocaleString()} คลิป)...`,
              chunkProg.completedOps
            );
          }
        );

        createdAll.forEach((ft, idx) => {
          const entry = missingEntries[idx];
          if (entry) {
            footageIdByNormTitle.set(entry[0], ft.id);
            existingTagsByFootageId.set(ft.id, ft.tags);
          }
        });

        createdClipsCount = createdAll.length;
      }
    }

    // PHASE 3: Merge 3-Tier tags AND update mascotNotes (rankTitle / punchlineNote) for all matched footages
    updateProgress(
      3,
      'กำลังผสานแท็ก 3 ชั้นและบันทึกชื่ออันดับ/คำสร้อยให้ฟุตเทจในคลังขึ้น Cloud...'
    );
    await yieldToBrowser();

    const mergedTagSetByFootageId = new Map<string, Set<string>>();
    const mascotNotesByFootageId: Record<string, string> = {};
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

      // Also build mascotNotes from Col C (rankTitle) and Col D (punchlineNote) if provided (non-'-')
      const noteParts: string[] = [];
      if (row.rankTitle) noteParts.push(`ชื่ออันดับ: ${row.rankTitle}`);
      if (row.punchlineNote) noteParts.push(`คำสร้อย: ${row.punchlineNote}`);
      if (noteParts.length > 0) {
        mascotNotesByFootageId[ftId] = noteParts.join(' · ');
      }

      if (row.isInStaging && targetSet.size > 0) {
        movedFromStagingFootageIds.add(ftId);
      }
    });

    const footageIdEntries = Array.from(mergedTagSetByFootageId.entries());
    const updatedClipsCount = footageIdEntries.length;

    if (
      footageIdEntries.length > 0 ||
      Object.keys(mascotNotesByFootageId).length > 0
    ) {
      const fullPayload: Record<string, string[]> = {};
      footageIdEntries.forEach(([ftId, tagSet]) => {
        fullPayload[ftId] = normalizeFootageTags(Array.from(tagSet));
      });

      await batchSyncFootageTagsByMap(
        fullPayload,
        'REPLACE',
        (chunkProg) => {
          updateProgress(
            3,
            `กำลังอัปเดตแท็กและหมายเหตุฟุตเทจขึ้น Cloud ก้อนที่ ${chunkProg.completedChunks}/${chunkProg.totalChunks} (${chunkProg.completedOps.toLocaleString()}/${chunkProg.totalOps.toLocaleString()} คลิป)...`,
            createdClipsCount + chunkProg.completedOps
          );
        },
        mascotNotesByFootageId
      );
    }

    // PHASE 4: Build and Upsert 5-Rank Episodes + Sync Publish Date/Slot & Cooldown createdAt
    let createdEpisodesCount = 0;
    let updatedEpisodesCount = 0;
    let syncedDatesEpisodeCount = 0;
    let alignedFootageCreatedAtCount = 0;
    const syncedEpisodeTitles: string[] = [];

    if (syncEpisodesFromColD && activeEpisodeGroups.length > 0) {
      updateProgress(
        4,
        'กำลังจัดอันดับคลังคลิปหลัก (EP) พร้อมซิงก์วันที่เผยแพร่และคำนวณวันพักฟุตเทจ...'
      );
      await yieldToBrowser();

      const accumulatedEpIds = episodes.map((e) => e.id);
      const episodesToUpsert: Episode[] = [];
      const earliestDateByFootageId: Record<string, string> = {};

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

        if (group.hasExplicitDateInSheet) {
          syncedDatesEpisodeCount += 1;
        }

        let resolvedTagIdForGroup: string | null = null;
        for (const r of groupActiveRows) {
          for (const tName of r.tagNames) {
            const foundId = tagIdByLowerName.get(tName.toLowerCase());
            if (foundId) {
              resolvedTagIdForGroup = foundId;
              break;
            }
          }
          if (resolvedTagIdForGroup) break;
        }

        const primaryTagId =
          resolvedTagIdForGroup ||
          (existingEp?.seriesId ? existingEp.seriesId : null) ||
          tagIdByLowerName.get(group.primaryTagName.toLowerCase()) ||
          tags.find((t) => !isStagingTagId(t.id))?.id ||
          'TAG-0001';

        const publishDate =
          group.publishDate || existingEp?.publishDate || todayIso;
        const publishSlot =
          group.publishSlot || existingEp?.publishSlot || 'EVENING_1800';
        const youtubeUrl =
          group.youtubeUrl || existingEp?.masterVideoInfo?.youtubeUrl || '';

        const rankings: EpisodeRankingSlot[] = (
          [5, 4, 3, 2, 1] as const
        ).map((rankSlot) => {
          const seqIndex = rankSequence.indexOf(rankSlot);
          const rowForSlot =
            seqIndex >= 0 ? groupActiveRows[seqIndex] || null : null;
          const prevSlot = existingEp?.rankings.find(
            (r) => r.rank === rankSlot
          );

          let resolvedFootageId: string | null = null;
          if (rowForSlot) {
            if (rowForSlot.matchedFootage) {
              resolvedFootageId = rowForSlot.matchedFootage.id;
            } else {
              const normKey = normalizeCompareKey(rowForSlot.title);
              resolvedFootageId = footageIdByNormTitle.get(normKey) || null;
            }
          }

          if (!resolvedFootageId && prevSlot?.footageId) {
            resolvedFootageId = prevSlot.footageId;
          }

          // Align sub-footage createdAt if publishDate is earlier so Cooldown is 100% accurate
          if (resolvedFootageId && publishDate) {
            const currentFt = computedFootageMap[resolvedFootageId];
            const currentMinDate =
              earliestDateByFootageId[resolvedFootageId] ||
              currentFt?.createdAt ||
              '9999-12-31';
            if (publishDate < currentMinDate) {
              earliestDateByFootageId[resolvedFootageId] = publishDate;
            }
          }

          const effectiveRankTitle =
            rowForSlot?.rankTitle || prevSlot?.rankTitle || '';
          const effectivePunchlineNote =
            rowForSlot?.punchlineNote || prevSlot?.punchlineNote || '';

          // Build rich mascotScript from Col C (ชื่ออันดับ) and Col D (คำสร้อย)
          let slotMascotScript = '';
          if (rowForSlot) {
            const rankCallout = effectiveRankTitle || rowForSlot.title;
            slotMascotScript = effectivePunchlineNote
              ? `อันดับที่ ${rankSlot}: ${rankCallout} — "${effectivePunchlineNote}"`
              : `อันดับที่ ${rankSlot}: ${rankCallout}`;
          } else {
            slotMascotScript =
              prevSlot?.mascotScript || `อันดับที่ ${rankSlot}`;
          }

          const noteSegments: string[] = [];
          if (effectiveRankTitle) {
            noteSegments.push(`ชื่ออันดับ: ${effectiveRankTitle}`);
          }
          if (effectivePunchlineNote) {
            noteSegments.push(`คำสร้อย: ${effectivePunchlineNote}`);
          }

          return {
            rank: rankSlot,
            footageId: resolvedFootageId,
            rankTitle: effectiveRankTitle,
            punchlineNote: effectivePunchlineNote,
            mascotScript: slotMascotScript,
            snapshotNote:
              noteSegments.length > 0
                ? noteSegments.join(' · ')
                : rowForSlot?.isInStaging
                ? 'ซิงค์จากฟุตเทจไร้หมวดหมู่ผ่านตารางหลัก 10 คอลัมน์'
                : 'ซิงค์จัดอันดับจากตารางหลัก 10 คอลัมน์',
          };
        });

        const autoMasterFileName = generateMasterEpisodeFileName(
          epId,
          publishDate,
          publishSlot,
          group.episodeTitle
        );

        const hashtagsSuffix =
          group.episodeHashtags.length > 0
            ? ` ${group.episodeHashtags.map((h) => `#${h}`).join(' ')}`
            : '';

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
            performanceNote: `ซิงค์ตารางหลัก 10 คอลัมน์ (${groupActiveRows.length} ฟุตเทจ)${hashtagsSuffix}`,
          },
          createdAt: existingEp?.createdAt || publishDate || todayIso,
        };

        episodesToUpsert.push(epPayload);
        syncedEpisodeTitles.push(group.episodeTitle);
      });

      if (episodesToUpsert.length > 0) {
        await batchUpsertEpisodes(episodesToUpsert, (chunkProg) => {
          updateProgress(
            4,
            `กำลังบันทึกคลังคลิปหลักขึ้น Cloud ก้อนที่ ${chunkProg.completedChunks}/${chunkProg.totalChunks} (${chunkProg.completedOps.toLocaleString()}/${chunkProg.totalOps.toLocaleString()} ตอน)...`,
            activeRows.length + chunkProg.completedOps
          );
        });
      }

      if (Object.keys(earliestDateByFootageId).length > 0) {
        alignedFootageCreatedAtCount = await batchSyncFootageCreatedAtByMap(
          earliestDateByFootageId
        );
      }
    }

    onProgressUpdate({
      phaseIndex: 4,
      phaseLabel: 'ซิงค์ฐานข้อมูลตารางหลัก 10 คอลัมน์ขึ้น Cloud เสร็จสมบูรณ์ 100%!',
      completedItems: totalEstimatedWork,
      totalItems: totalEstimatedWork,
      percent: 100,
    });

    return {
      updatedClipsCount,
      createdClipsCount,
      movedFromStagingCount: movedFromStagingFootageIds.size,
      skippedRowsCount: excludedRowIndices.size,
      createdTagsCount: newTagsToPersist.length,
      createdTier1TagsCount,
      createdTier2TagsCount,
      createdTier3TagsCount,
      createdTagNames: newTagsToPersist.map((t) => t.name),
      createdEpisodesCount,
      updatedEpisodesCount,
      skippedEpisodesCount: excludedEpisodeKeys.size,
      syncedDatesEpisodeCount,
      alignedFootageCreatedAtCount,
      syncedEpisodeTitles,
    };
  });
}
