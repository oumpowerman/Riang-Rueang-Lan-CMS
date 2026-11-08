import { isFootageInStaging, isStagingTagId } from '../../../services/seedData';
import { Episode } from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag } from '../../../types/tag.types';
import {
  ParsedEpisodeGroup,
  ParsedSheetRow,
  RankingOrderDirection,
  SheetSyncSummaryStats,
} from './sheetImport.types';

export const SAMPLE_4COL_SHEET_DATA = `ร้องเพลงหมาสี่แม่มึง\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด\thttps://youtube.com/shorts/W0iciqjFznc?si=pO2gckyQ9PAh0SEV\tพี่เสกสุดฮา EP.1
อยากเล่นกีต้าร์เก่งแบบพี่เสก\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด\thttps://youtube.com/shorts/W0iciqjFznc?si=pO2gckyQ9PAh0SEV\tพี่เสกสุดฮา EP.1
อย่านอนข้างคนหลายใจก็พอ\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด\thttps://youtube.com/shorts/W0iciqjFznc?si=pO2gckyQ9PAh0SEV\tพี่เสกสุดฮา EP.1
มึงโง่ อยู่แต่ในกระลา\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด\thttps://youtube.com/shorts/W0iciqjFznc?si=pO2gckyQ9PAh0SEV\tพี่เสกสุดฮา EP.1
เทียนเราสวยดี\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด\thttps://youtube.com/shorts/W0iciqjFznc?si=pO2gckyQ9PAh0SEV\tพี่เสกสุดฮา EP.1

คณะออทิสติก\t#สัมภาษณ์ #พูดผิด\thttps://youtube.com/shorts/jbQiVD493wE?si=dH3kE3F3fhS08rKh\tคนไทยคนตลก EP.1
เรือตีลังกา\t#น้ำท่วม\thttps://youtube.com/shorts/jbQiVD493wE?si=dH3kE3F3fhS08rKh\tคนไทยคนตลก EP.1
ผมจะเอาโรตี\t#คนดัง #อินฟลู\thttps://youtube.com/shorts/jbQiVD493wE?si=dH3kE3F3fhS08rKh\tคนไทยคนตลก EP.1
เราอยากเต้นหรอเนี่ย\t#ร้องเต้น\thttps://youtube.com/shorts/jbQiVD493wE?si=dH3kE3F3fhS08rKh\tคนไทยคนตลก EP.1
พี่หนุ่มอยากโดนอม\t#รายการ #โหนกระแส #คนดัง #ดารา\thttps://youtube.com/shorts/jbQiVD493wE?si=dH3kE3F3fhS08rKh\tคนไทยคนตลก EP.1

เสียงสัมมาลี\t#สตรีมเมอร์ #ไลฟ์สด #คนดัง\thttps://youtube.com/shorts/H3794tvxho0?si=tFH7ZeUmlmlwFtAG\tแก๊งโบ้สุดฮา EP.1
ลูกอมรูปตีน\t#สตรีมเมอร์ #ไลฟ์สด #คนดัง\thttps://youtube.com/shorts/H3794tvxho0?si=tFH7ZeUmlmlwFtAG\tแก๊งโบ้สุดฮา EP.1
จัสติน เสิ่นเจิ้น\t#สตรีมเมอร์ #ไลฟ์สด #คนดัง\thttps://youtube.com/shorts/H3794tvxho0?si=tFH7ZeUmlmlwFtAG\tแก๊งโบ้สุดฮา EP.1
ขนมรูปสามเหลี่ยม\t#สตรีมเมอร์ #ไลฟ์สด #คนดัง\thttps://youtube.com/shorts/H3794tvxho0?si=tFH7ZeUmlmlwFtAG\tแก๊งโบ้สุดฮา EP.1
โอ๊ยใครเหยียบ\t#สตรีมเมอร์ #ไลฟ์สด #คนดัง\thttps://youtube.com/shorts/H3794tvxho0?si=tFH7ZeUmlmlwFtAG\tแก๊งโบ้สุดฮา EP.1`;

export const SAMPLE_2COL_SHEET_DATA = `ร้องเพลงหมาสี่แม่มึง\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด
อยากเล่นกีต้าร์เก่งแบบพี่เสก\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด
อย่านอนข้างคนหลายใจก็พอ\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด
มึงโง่ อยู่แต่ในกระลา\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด
เทียนเราสวยดี\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด
คณะออทิสติก\t#สัมภาษณ์ #พูดผิด
เรือตีลังกา\t#น้ำท่วม #กู้ภัย
ผมจะเอาโรตี\t#คนดัง #อินฟลู #ร้านอาหาร
เราอยากเต้นหรอเนี่ย\t#ร้องเต้น #ไวรัล
พี่หนุ่มอยากโดนอม\t#รายการ #โหนกระแส #คนดัง #ดารา
เสียงสัมมาลี\t#สตรีมเมอร์ #ไลฟ์สด #คนดัง
ลูกอมรูปตีน\t#สตรีมเมอร์ #ไลฟ์สด #คนดัง
จัสติน เสิ่นเจิ้น\t#สตรีมเมอร์ #ไลฟ์สด #คนดัง
ขนมรูปสามเหลี่ยม\t#สตรีมเมอร์ #ไลฟ์สด #คนดัง
โอ๊ยใครเหยียบ\t#สตรีมเมอร์ #ไลฟ์สด #คนดัง`;

export function normalizeCompareKey(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\.(mp4|mov|mkv|avi|webm)$/i, '')
    .replace(/\s+/g, ' ');
}

export function parseEpisodeTitleAndNumber(rawEpTitle: string): {
  seriesBaseName: string;
  episodeNo: number;
} {
  const cleaned = rawEpTitle.trim();
  const match = cleaned.match(/^(.*?)\s*(?:EP\.?|ตอนที่|#|Ep\.?)\s*(\d+)\s*$/i);
  if (match) {
    const base = match[1].trim() || cleaned;
    const epNo = parseInt(match[2], 10);
    return {
      seriesBaseName: base,
      episodeNo: Number.isFinite(epNo) && epNo > 0 ? epNo : 1,
    };
  }
  return {
    seriesBaseName: cleaned,
    episodeNo: 1,
  };
}

function isUrlLike(str: string): boolean {
  const s = str.trim().toLowerCase();
  return (
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.includes('youtube.com/') ||
    s.includes('youtu.be/') ||
    s.includes('tiktok.com/') ||
    s.includes('facebook.com/') ||
    s.includes('drive.google.com/')
  );
}

export function parseSheetClipboardData(params: {
  pastedText: string;
  computedFootage: ComputedFootage[];
  tags: CategoryTag[];
  tagMap: Record<string, CategoryTag>;
  episodes: Episode[];
  rankingOrder: RankingOrderDirection;
  includeSeriesTagOnFootage: boolean;
}): {
  parsedRows: ParsedSheetRow[];
  episodeGroups: ParsedEpisodeGroup[];
  stats: SheetSyncSummaryStats;
} {
  const {
    pastedText,
    computedFootage,
    tags,
    tagMap,
    episodes,
    rankingOrder,
    includeSeriesTagOnFootage,
  } = params;

  if (!pastedText.trim()) {
    return {
      parsedRows: [],
      episodeGroups: [],
      stats: {
        totalRows: 0,
        matchedCount: 0,
        stagingMatchedCount: 0,
        unmatchedCount: 0,
        duplicateRowsInSheetCount: 0,
        newTagsCount: 0,
        newTagNames: [],
        episodeGroupsCount: 0,
        completeEpisodesCount: 0,
        incompleteEpisodesCount: 0,
        newEpisodesCount: 0,
        existingEpisodesToUpdateCount: 0,
      },
    };
  }

  const rawLines = pastedText.split(/\r?\n/);

  // 1. Pre-index existing Tags by lowercase name for O(1) lookup across 1,000+ rows
  const tagByLowerName = new Map<string, CategoryTag>();
  tags.forEach((t) => {
    if (!isStagingTagId(t.id)) {
      tagByLowerName.set(t.name.toLowerCase(), t);
    }
  });

  // 2. Pre-index existing Footages by normalized title (prioritizing Staging footages)
  const footageByNormalizedTitle = new Map<string, ComputedFootage>();
  computedFootage.forEach((ft) => {
    const key = normalizeCompareKey(ft.title);
    if (!footageByNormalizedTitle.has(key)) {
      footageByNormalizedTitle.set(key, ft);
    }
  });
  computedFootage.forEach((ft) => {
    if (isFootageInStaging(ft.tags)) {
      const key = normalizeCompareKey(ft.title);
      footageByNormalizedTitle.set(key, ft);
    }
  });

  // 3. Pre-index existing Episodes by normalized title for O(1) lookup
  const episodeByNormalizedTitle = new Map<string, Episode>();
  episodes.forEach((ep) => {
    episodeByNormalizedTitle.set(normalizeCompareKey(ep.title), ep);
  });

  // First pass: extract columns and count title occurrences across the sheet
  const titleOccurrenceCounts = new Map<string, number>();
  const preliminaryLines: Array<{
    rawLine: string;
    title: string;
    rawColB: string;
    episodeUrl: string;
    episodeTitle: string;
  }> = [];

  rawLines.forEach((line, idx) => {
    if (!line.trim()) return;

    let parts = line.split('\t');
    if (parts.length < 2 && line.includes(',')) {
      parts = line.split(',');
    }

    const rawColA = (parts[0] || '').replace(/^["']|["']$/g, '').trim();
    const rawColB = (parts[1] || '').replace(/^["']|["']$/g, '').trim();
    const rawColC = (parts[2] || '').replace(/^["']|["']$/g, '').trim();
    const rawColD = parts
      .slice(3)
      .join(' ')
      .replace(/^["']|["']$/g, '')
      .trim();

    if (!rawColA) return;

    // Skip header row if copied from Google Sheets
    if (
      idx === 0 &&
      (rawColA === 'ชื่อคลิป' ||
        rawColA.toLowerCase() === 'title' ||
        rawColB === 'แท็ก' ||
        rawColB.toLowerCase() === 'tags' ||
        rawColC === 'ลิงค์')
    ) {
      return;
    }

    let episodeUrl = '';
    let episodeTitle = '';

    if (parts.length >= 4) {
      episodeUrl = rawColC;
      episodeTitle = rawColD;
    } else if (parts.length === 3) {
      if (isUrlLike(rawColC)) {
        episodeUrl = rawColC;
      } else {
        episodeTitle = rawColC;
      }
    }

    const normTitle = normalizeCompareKey(rawColA);
    titleOccurrenceCounts.set(
      normTitle,
      (titleOccurrenceCounts.get(normTitle) || 0) + 1
    );

    preliminaryLines.push({
      rawLine: line,
      title: rawColA,
      rawColB,
      episodeUrl,
      episodeTitle,
    });
  });

  const parsedRows: ParsedSheetRow[] = [];

  preliminaryLines.forEach((item, index) => {
    const { rawLine, title, rawColB, episodeUrl, episodeTitle } = item;
    const normTitle = normalizeCompareKey(title);

    // Extract tags from Column B
    const extractedTags = rawColB
      .split(/[#,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    // Optionally include seriesBaseName from Column D as a tag on the footage
    if (episodeTitle && includeSeriesTagOnFootage) {
      const { seriesBaseName } = parseEpisodeTitleAndNumber(episodeTitle);
      if (seriesBaseName) {
        extractedTags.push(seriesBaseName);
      }
    }

    const tagNames = Array.from(new Set(extractedTags));

    // O(1) exact title lookup first; fallback substring check only if vault is small or needed
    let matchedFootage = footageByNormalizedTitle.get(normTitle) || null;
    if (!matchedFootage && computedFootage.length <= 2000) {
      matchedFootage =
        computedFootage.find((ft) => {
          const ftNorm = normalizeCompareKey(ft.title);
          const fileNorm = normalizeCompareKey(ft.standardFileName);
          return (
            fileNorm.includes(normTitle) ||
            (ftNorm.length >= 4 && normTitle.includes(ftNorm))
          );
        }) || null;
    }

    const isInStaging = matchedFootage
      ? isFootageInStaging(matchedFootage.tags)
      : false;

    const existingTags: CategoryTag[] = [];
    if (matchedFootage) {
      matchedFootage.tags.forEach((tid) => {
        if (!isStagingTagId(tid) && tagMap[tid]) {
          existingTags.push(tagMap[tid]);
        }
      });
    }

    const tagsToCreate: string[] = [];
    tagNames.forEach((tName) => {
      if (!tagByLowerName.has(tName.toLowerCase())) {
        tagsToCreate.push(tName);
      }
    });

    const existingNames = existingTags.map((t) => t.name);
    const finalTagNames = Array.from(new Set([...existingNames, ...tagNames]));

    parsedRows.push({
      rowIndex: index + 1,
      rawLine,
      title,
      tagNames,
      episodeUrl,
      episodeTitle,
      matchedFootage,
      isInStaging,
      occurrenceCountInSheet: titleOccurrenceCounts.get(normTitle) || 1,
      existingTags,
      tagsToCreate,
      finalTagNames,
    });
  });

  // Group rows by Column D (episodeTitle) to form Ranked Episodes
  const episodeGroupMap = new Map<string, ParsedSheetRow[]>();
  parsedRows.forEach((row) => {
    if (!row.episodeTitle) return;
    const key = normalizeCompareKey(row.episodeTitle);
    const existingList = episodeGroupMap.get(key) || [];
    existingList.push(row);
    episodeGroupMap.set(key, existingList);
  });

  const episodeGroups: ParsedEpisodeGroup[] = [];
  const rankSequence: Array<5 | 4 | 3 | 2 | 1> =
    rankingOrder === 'RANK_5_TO_1' ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5];

  episodeGroupMap.forEach((groupRows, groupKey) => {
    const firstRow = groupRows[0];
    const episodeTitle = firstRow.episodeTitle;
    const { seriesBaseName, episodeNo } = parseEpisodeTitleAndNumber(episodeTitle);

    const youtubeUrl =
      groupRows.find((r) => Boolean(r.episodeUrl))?.episodeUrl || '';

    // O(1) lookup by normalized title, fallback to URL + series match
    let existingEpisode = episodeByNormalizedTitle.get(groupKey) || null;
    if (!existingEpisode && youtubeUrl) {
      const cleanUrl = youtubeUrl.trim();
      const normSeries = normalizeCompareKey(seriesBaseName);
      existingEpisode =
        episodes.find(
          (ep) =>
            ep.masterVideoInfo?.youtubeUrl?.trim() === cleanUrl &&
            normalizeCompareKey(ep.title).includes(normSeries)
        ) || null;
    }

    const primaryTagName =
      seriesBaseName || firstRow.tagNames[0] || 'ทั่วไป';

    // Anomaly checks for this Episode group
    const isCompleteFiveRanks = groupRows.length === 5;
    const missingFootageCount = groupRows.filter(
      (r) => r.matchedFootage === null
    ).length;

    const seenTitlesInEp = new Set<string>();
    let hasDuplicateClipsInGroup = false;
    groupRows.forEach((r) => {
      const k = normalizeCompareKey(r.title);
      if (seenTitlesInEp.has(k)) {
        hasDuplicateClipsInGroup = true;
      }
      seenTitlesInEp.add(k);
    });

    const rankingsPreview: Array<{
      rank: 5 | 4 | 3 | 2 | 1;
      row: ParsedSheetRow | null;
    }> = ([5, 4, 3, 2, 1] as const).map((rankSlot) => {
      const seqIdx = rankSequence.indexOf(rankSlot);
      const correspondingRow = seqIdx >= 0 ? groupRows[seqIdx] || null : null;
      return {
        rank: rankSlot,
        row: correspondingRow,
      };
    });

    episodeGroups.push({
      groupKey,
      episodeTitle,
      seriesBaseName,
      episodeNo,
      youtubeUrl,
      rows: groupRows,
      existingEpisode,
      primaryTagName,
      isCompleteFiveRanks,
      missingFootageCount,
      hasDuplicateClipsInGroup,
      rankingsPreview,
    });
  });

  // Compute summary stats
  let matchedCount = 0;
  let stagingMatchedCount = 0;
  let unmatchedCount = 0;
  let duplicateRowsInSheetCount = 0;
  const uniqueNewTags = new Set<string>();

  parsedRows.forEach((r) => {
    if (r.matchedFootage !== null) {
      matchedCount += 1;
      if (r.isInStaging) {
        stagingMatchedCount += 1;
      }
    } else {
      unmatchedCount += 1;
    }

    if (r.occurrenceCountInSheet > 1) {
      duplicateRowsInSheetCount += 1;
    }

    r.tagsToCreate.forEach((t) => uniqueNewTags.add(t));
  });

  episodeGroups.forEach((eg) => {
    if (
      eg.primaryTagName &&
      !tagByLowerName.has(eg.primaryTagName.toLowerCase())
    ) {
      uniqueNewTags.add(eg.primaryTagName);
    }
  });

  const existingEpisodesToUpdateCount = episodeGroups.filter(
    (g) => g.existingEpisode !== null
  ).length;
  const newEpisodesCount = episodeGroups.length - existingEpisodesToUpdateCount;
  const completeEpisodesCount = episodeGroups.filter(
    (g) => g.isCompleteFiveRanks
  ).length;
  const incompleteEpisodesCount =
    episodeGroups.length - completeEpisodesCount;

  return {
    parsedRows,
    episodeGroups,
    stats: {
      totalRows: parsedRows.length,
      matchedCount,
      stagingMatchedCount,
      unmatchedCount,
      duplicateRowsInSheetCount,
      newTagsCount: uniqueNewTags.size,
      newTagNames: Array.from(uniqueNewTags),
      episodeGroupsCount: episodeGroups.length,
      completeEpisodesCount,
      incompleteEpisodesCount,
      newEpisodesCount,
      existingEpisodesToUpdateCount,
    },
  };
}
