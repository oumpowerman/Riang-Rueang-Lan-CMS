import { isFootageInStaging, isStagingTagId } from '../../../services/seedData';
import { Episode, PublishSlot } from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag, CategoryTier } from '../../../types/tag.types';
import { cleanFootageTitle } from '../../../utils/fileNameGenerator';
import { resolveTagByDataDictionary } from '../../../utils/tagDictionaryRules';
import { stripHashtagsFromTitle } from '../../episodes/youtubeDateSync/youtubeDateSyncParser';
import {
  ParsedEpisodeGroup,
  ParsedSheetRow,
  RankingOrderDirection,
  SheetDetectedColumnFormat,
  SheetSyncSummaryStats,
  TagTierAssignment,
} from './sheetImport.types';

/**
 * ตัวอย่างตารางหลัก 10 คอลัมน์ (A–J): Col A ชื่อฟุต | Col B ชื่อคลิป | Col C ชื่ออันดับ | Col D คำสร้อย | Col E-G แท็ก Tier 1-3 | Col H ลิงค์ | Col I วันที่ | Col J เวลา
 */
export const SAMPLE_10COL_SHEET_DATA = `ชื่อฟุต\tชื่อคลิป\tชื่ออันดับ\tคำสร้อย\tแท็ก Tier 1\tแท็ก Tier 2\tแท็ก Tier 3\tลิงค์\tวันที่\tเวลา
ร้องเพลงหมาสี่แม่มึง\t5 อันดับพี่เสกสุดฮา EP.1 #ตลก #funny #memes #po\tจอมยุทธ์เสก\t-\t#คนดัง #ศิลปิน\t#ไลฟ์สด\t#พี่เสก\thttps://youtube.com/shorts/W0iciqjFznc?si=pO2gckyQ9PAh0SEV\t29/09/2026\t06:00
อยากเล่นกีต้าร์เก่งแบบพี่เสก\t5 อันดับพี่เสกสุดฮา EP.1 #ตลก #funny #memes #po\tอยากเก่งแบบพี่เสก\t-\t#คนดัง #ศิลปิน\t#ไลฟ์สด\t#พี่เสก\thttps://youtube.com/shorts/W0iciqjFznc?si=pO2gckyQ9PAh0SEV\t29/09/2026\t06:00
อย่านอนข้างคนหลายใจก็พอ\t5 อันดับพี่เสกสุดฮา EP.1 #ตลก #funny #memes #po\tนอนที่ไหนก็ได้\t-\t#คนดัง #ศิลปิน\t#ไลฟ์สด\t#พี่เสก\thttps://youtube.com/shorts/W0iciqjFznc?si=pO2gckyQ9PAh0SEV\t29/09/2026\t06:00
มึงโง่ อยู่แต่ในกระลา\t5 อันดับพี่เสกสุดฮา EP.1 #ตลก #funny #memes #po\tออกจากกะลา\t-\t#คนดัง #ศิลปิน\t#ไลฟ์สด\t#พี่เสก\thttps://youtube.com/shorts/W0iciqjFznc?si=pO2gckyQ9PAh0SEV\t29/09/2026\t06:00
เทียนเราสวยดี\t5 อันดับพี่เสกสุดฮา EP.1 #ตลก #funny #memes #po\tเทียนเราก็สวยดีนะ\t-\t#คนดัง #ศิลปิน\t#ไลฟ์สด\t#พี่เสก\thttps://youtube.com/shorts/W0iciqjFznc?si=pO2gckyQ9PAh0SEV\t29/09/2026\t06:00

คณะออทิสติก\t5 อันดับคนไทยเป็นคนตลก EP.1 #ตลก #ตลก #memes\tคณะออทิสติก\t-\t#วิถีชาวบ้าน\t#สัมภาษณ์ #พูดผิด\t-\thttps://youtube.com/shorts/jbQiVD493wE?si=dH3kE3F3fhS08rKh\t30/09/2026\t18:05
เรือตีลังกา\t5 อันดับคนไทยเป็นคนตลก EP.1 #ตลก #ตลก #memes\tเรือตีลังกา\t-\t#วิถีชาวบ้าน\t#น้ำท่วม\t-\thttps://youtube.com/shorts/jbQiVD493wE?si=dH3kE3F3fhS08rKh\t30/09/2026\t18:05
ผมจะเอาโรตี\t5 อันดับคนไทยเป็นคนตลก EP.1 #ตลก #ตลก #memes\tผมเอาโรตี\t-\t#คนดัง #อินฟลู\t#ช็อตฟีล\t-\thttps://youtube.com/shorts/jbQiVD493wE?si=dH3kE3F3fhS08rKh\t30/09/2026\t18:05
เราอยากเต้นหรอเนี่ย\t5 อันดับคนไทยเป็นคนตลก EP.1 #ตลก #ตลก #memes\tอยากเต้นหรอเนี่ย?\tไทยแท้แน่นอน\t#วิถีชาวบ้าน\t#ร้องเต้น\t-\thttps://youtube.com/shorts/jbQiVD493wE?si=dH3kE3F3fhS08rKh\t30/09/2026\t18:05
พี่หนุ่มอยากโดนอม\t5 อันดับคนไทยเป็นคนตลก EP.1 #ตลก #ตลก #memes\tพี่หนุ่มอยากโดนอม\tคิดดีไม่ได้เลย\t#คนดัง #ดารา\t#รายการ\t#โหนกระแส\thttps://youtube.com/shorts/jbQiVD493wE?si=dH3kE3F3fhS08rKh\t30/09/2026\t18:05

เสียงสัมมาลี\t5 อันดับโดเนทแก๊ปโบ้ EP.1 #ตลก #funny #memes\tมึงเอาเสียงใครมาเนี่ย\t-\t#สตรีมเมอร์ #คนดัง\t#ไลฟ์สด\t#แก๊บโบ้\thttps://youtube.com/shorts/H3794tvxho0?si=tFH7ZeUmlmlwFtAG\t\t
ลูกอมรูปตีน\t5 อันดับโดเนทแก๊ปโบ้ EP.1 #ตลก #funny #memes\tลูกอมรูปตีน\tแหม่ ทำไปได้\t#สตรีมเมอร์ #คนดัง\t#ไลฟ์สด\t#แก๊บโบ้\thttps://youtube.com/shorts/H3794tvxho0?si=tFH7ZeUmlmlwFtAG\t\t
จัสติน เสิ่นเจิ้น\t5 อันดับโดเนทแก๊ปโบ้ EP.1 #ตลก #funny #memes\tจัสตินบีเบอร์ เสิ่นเจิ้น\t-\t#สตรีมเมอร์ #คนดัง\t#ไลฟ์สด\t#แก๊บโบ้\thttps://youtube.com/shorts/H3794tvxho0?si=tFH7ZeUmlmlwFtAG\t\t
ขนมรูปสามเหลี่ยม\t5 อันดับโดเนทแก๊ปโบ้ EP.1 #ตลก #funny #memes\tขนมอะไร รูปสามเหลี่ยม\t-\t#สตรีมเมอร์ #คนดัง\t#ไลฟ์สด\t#แก๊บโบ้\thttps://youtube.com/shorts/H3794tvxho0?si=tFH7ZeUmlmlwFtAG\t\t
โอ๊ยใครเหยียบ\t5 อันดับโดเนทแก๊ปโบ้ EP.1 #ตลก #funny #memes\tโอ๊ยยใครเหยียบ...\t-\t#สตรีมเมอร์ #คนดัง\t#ไลฟ์สด\t#แก๊บโบ้\thttps://youtube.com/shorts/H3794tvxho0?si=tFH7ZeUmlmlwFtAG\t\t`;

export const SAMPLE_4COL_SHEET_DATA = SAMPLE_10COL_SHEET_DATA;

export const SAMPLE_2COL_SHEET_DATA = `ร้องเพลงหมาสี่แม่มึง\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด
อยากเล่นกีต้าร์เก่งแบบพี่เสก\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด
อย่านอนข้างคนหลายใจก็พอ\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด
มึงโง่ อยู่แต่ในกระลา\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด
เทียนเราสวยดี\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด`;

export function normalizeCompareKey(str: string): string {
  return cleanFootageTitle(str)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts strictly hashtag words (starting with #) from a string.
 * Discards plain words, URLs, and pure numbers (e.g. #1, #EP1).
 */
export function extractHashtagsOnly(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];
  const results: string[] = [];
  const matches = rawText.match(/#([^\s#,\t\n\r"']+)/g);
  if (!matches) return [];

  for (const m of matches) {
    const word = m.replace(/^#+/, '').trim();
    if (
      !word ||
      /^\d+$/.test(word) ||
      /^(ep\.?|ตอนที่)\d+$/i.test(word) ||
      word.startsWith('http')
    ) {
      continue;
    }
    results.push(word);
  }

  return Array.from(new Set(results));
}

export function parseEpisodeTitleAndNumber(rawEpTitle: string): {
  seriesBaseName: string;
  episodeNo: number;
} {
  const cleaned = stripHashtagsFromTitle(rawEpTitle).trim();
  const match = cleaned.match(/^(.*?)\s*(?:EP\.?|ตอนที่|#|Ep\.?)\s*(\d+)(.*)$/i);
  if (match) {
    let base = match[1].trim();
    base = base.replace(/^\d+\s*(?:อันดับ|จัดอันดับ|ดับ)\s*/i, '').trim();
    const epNo = parseInt(match[2], 10);
    return {
      seriesBaseName: base || cleaned,
      episodeNo: Number.isFinite(epNo) && epNo > 0 ? epNo : 1,
    };
  }
  return {
    seriesBaseName:
      cleaned.replace(/^\d+\s*(?:อันดับ|จัดอันดับ|ดับ)\s*/i, '').trim() ||
      cleaned,
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

function cleanPlaceholderText(val: string): string {
  const s = (val || '').replace(/^["']|["']$/g, '').trim();
  if (s === '-' || s === '—' || s === '–' || s.toLowerCase() === 'none') {
    return '';
  }
  return s;
}

/**
 * Parses Col I (วันที่) and Col J (เวลา) into normalized YYYY-MM-DD, HH:mm, and PublishSlot
 */
export function parseSheetDateAndTimeCols(
  rawDateCol: string,
  rawTimeCol: string
): {
  publishDate: string;
  publishTime: string;
  publishSlot: PublishSlot;
} {
  const cleanDateStr = cleanPlaceholderText(rawDateCol);
  const cleanTimeStr = cleanPlaceholderText(rawTimeCol);

  let publishDate = '';
  let hourNum = 18;
  let minStr = '00';
  let hasParsedTime = false;

  // Check if time was provided in Col J or embedded in Col I
  const timeSource = cleanTimeStr || cleanDateStr;
  const timeMatch = timeSource.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    if (Number.isFinite(h) && h >= 0 && h <= 23) {
      hourNum = h;
      minStr = timeMatch[2].padStart(2, '0');
      hasParsedTime = true;
    }
  }

  if (cleanDateStr) {
    // Pattern 1: DD/MM/YYYY or D-M-YYYY
    const dmyMatch = cleanDateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      let yearNum = parseInt(dmyMatch[3], 10);
      if (yearNum >= 2500) yearNum -= 543;
      publishDate = `${yearNum}-${month}-${day}`;
    } else {
      // Pattern 2: YYYY-MM-DD or YYYY/MM/DD
      const ymdMatch = cleanDateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      if (ymdMatch) {
        let yearNum = parseInt(ymdMatch[1], 10);
        if (yearNum >= 2500) yearNum -= 543;
        const month = ymdMatch[2].padStart(2, '0');
        const day = ymdMatch[3].padStart(2, '0');
        publishDate = `${yearNum}-${month}-${day}`;
      }
    }
  }

  const publishTime = hasParsedTime
    ? `${String(hourNum).padStart(2, '0')}:${minStr}`
    : '';
  const publishSlot: PublishSlot =
    hasParsedTime && hourNum < 14 ? 'MORNING_0600' : 'EVENING_1800';

  return {
    publishDate,
    publishTime,
    publishSlot,
  };
}

/**
 * Normalizes messy ranking prefixes in Col B if a user's spreadsheet auto-incremented "5 อันดับ", "6 อันดับ", "7 อันดับ" across rows sharing the same YouTube URL
 */
function normalizeAutoIncrementedEpisodePrefix(rawTitle: string): string {
  const clean = stripHashtagsFromTitle(rawTitle).trim();
  // Convert "6 อันดับ...", "7 อันดับ...", "8 อันดับ...", "9 อันดับ..." back to "5 อันดับ..." when Google Sheets auto-fill dragged the leading number
  return clean.replace(/^[6789]\s*(อันดับ|จัดอันดับ|ดับ)\s*/i, '5 $1 ');
}

export function parseSheetClipboardData(params: {
  pastedText: string;
  computedFootage: ComputedFootage[];
  tags: CategoryTag[];
  tagMap: Record<string, CategoryTag>;
  episodes: Episode[];
  rankingOrder: RankingOrderDirection;
  includeSeriesTagOnFootage: boolean;
  customPublishDateByGroupKey?: Record<string, string>;
  customPublishSlotByGroupKey?: Record<string, PublishSlot>;
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
    customPublishDateByGroupKey = {},
    customPublishSlotByGroupKey = {},
  } = params;

  if (!pastedText.trim()) {
    return {
      parsedRows: [],
      episodeGroups: [],
      stats: {
        totalRows: 0,
        detectedFormat: 'MASTER_10_COL',
        matchedCount: 0,
        stagingMatchedCount: 0,
        unmatchedCount: 0,
        duplicateRowsInSheetCount: 0,
        newTagsCount: 0,
        newTier1TagsCount: 0,
        newTier2TagsCount: 0,
        newTier3TagsCount: 0,
        newTagNames: [],
        episodeGroupsCount: 0,
        completeEpisodesCount: 0,
        incompleteEpisodesCount: 0,
        newEpisodesCount: 0,
        existingEpisodesToUpdateCount: 0,
        episodesWithExplicitDateCount: 0,
      },
    };
  }

  const rawLines = pastedText.split(/\r?\n/);

  // 1. Pre-index existing Tags by lowercase name for O(1) lookup
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

  // 3. Pre-index existing Episodes by normalized clean title (without hashtags)
  const episodeByNormalizedTitle = new Map<string, Episode>();
  episodes.forEach((ep) => {
    const cleanEp = stripHashtagsFromTitle(ep.title);
    episodeByNormalizedTitle.set(normalizeCompareKey(cleanEp), ep);
    episodeByNormalizedTitle.set(normalizeCompareKey(ep.title), ep);
  });

  const titleOccurrenceCounts = new Map<string, number>();

  interface PreliminaryRow {
    rawLine: string;
    detectedFormat: SheetDetectedColumnFormat;
    title: string;
    rawEpisodeColB: string;
    episodeTitle: string;
    episodeHashtags: string[];
    rankTitle: string;
    punchlineNote: string;
    tier1Raw: string;
    tier2Raw: string;
    tier3Raw: string;
    episodeUrl: string;
    publishDate: string;
    publishTime: string;
    publishSlot: PublishSlot;
  }

  const preliminaryLines: PreliminaryRow[] = [];
  let dominantFormat: SheetDetectedColumnFormat = 'MASTER_10_COL';

  rawLines.forEach((line, idx) => {
    if (!line.trim()) return;

    let parts = line.split('\t');
    if (parts.length < 2 && line.includes(',')) {
      parts = line.split(',');
    }

    const col0 = cleanPlaceholderText(parts[0] || '');
    const col1 = cleanPlaceholderText(parts[1] || '');
    const col2 = cleanPlaceholderText(parts[2] || '');
    const col3 = cleanPlaceholderText(parts[3] || '');
    const col4 = cleanPlaceholderText(parts[4] || '');
    const col5 = cleanPlaceholderText(parts[5] || '');
    const col6 = cleanPlaceholderText(parts[6] || '');
    const col7 = cleanPlaceholderText(parts[7] || '');
    const col8 = cleanPlaceholderText(parts[8] || '');
    const col9 = cleanPlaceholderText(parts[9] || '');

    if (!col0) return;

    // Skip header row if copied from Google Sheets (10-Col or 4-Col or 2-Col)
    if (
      idx === 0 &&
      (col0 === 'ชื่อฟุต' ||
        col0 === 'ชื่อคลิป' ||
        col0.toLowerCase() === 'title' ||
        col1 === 'ชื่อคลิป' ||
        col1 === 'แท็ก' ||
        col2 === 'ชื่ออันดับ' ||
        col4.includes('Tier 1'))
    ) {
      return;
    }

    let detectedFormat: SheetDetectedColumnFormat = 'MASTER_10_COL';
    let rawEpisodeColB = '';
    let episodeTitle = '';
    let episodeHashtags: string[] = [];
    let rankTitle = '';
    let punchlineNote = '';
    let tier1Raw = '';
    let tier2Raw = '';
    let tier3Raw = '';
    let episodeUrl = '';
    let publishDate = '';
    let publishTime = '';
    let publishSlot: PublishSlot = 'EVENING_1800';

    // Detect whether this row is 10-Column Master format vs Legacy 4-Col vs 2-Col Tag-Only
    const isLegacy4Col =
      parts.length >= 3 &&
      parts.length <= 4 &&
      (col1.startsWith('#') || isUrlLike(col2));
    const isTagOnly2Col = parts.length === 2 && col1.includes('#') && !/EP\.?\s*\d+/i.test(col1);

    if (isTagOnly2Col) {
      detectedFormat = 'TAG_ONLY_2_COL';
      dominantFormat = 'TAG_ONLY_2_COL';
      tier1Raw = col1;
    } else if (isLegacy4Col) {
      detectedFormat = 'LEGACY_4_COL';
      dominantFormat = 'LEGACY_4_COL';
      tier1Raw = col1;
      if (parts.length >= 4) {
        episodeUrl = col2;
        rawEpisodeColB = parts.slice(3).join(' ').trim();
      } else if (parts.length === 3) {
        if (isUrlLike(col2)) {
          episodeUrl = col2;
        } else {
          rawEpisodeColB = col2;
        }
      }
      episodeHashtags = extractHashtagsOnly(rawEpisodeColB);
      episodeTitle = normalizeAutoIncrementedEpisodePrefix(rawEpisodeColB);
    } else {
      // Unified 10-Column Master Sheet (Cols A - J)
      detectedFormat = 'MASTER_10_COL';
      dominantFormat = 'MASTER_10_COL';
      rawEpisodeColB = col1;
      episodeHashtags = extractHashtagsOnly(rawEpisodeColB);
      episodeTitle = normalizeAutoIncrementedEpisodePrefix(rawEpisodeColB);
      rankTitle = col2;
      punchlineNote = col3;
      tier1Raw = col4;
      tier2Raw = col5;
      tier3Raw = col6;
      episodeUrl = col7;

      // Fallback if user pasted fewer empty columns before URL
      if (!episodeUrl) {
        for (let c = 5; c < parts.length; c++) {
          const candidate = cleanPlaceholderText(parts[c] || '');
          if (isUrlLike(candidate)) {
            episodeUrl = candidate;
            const parsedDT = parseSheetDateAndTimeCols(
              parts[c + 1] || '',
              parts[c + 2] || ''
            );
            publishDate = parsedDT.publishDate;
            publishTime = parsedDT.publishTime;
            publishSlot = parsedDT.publishSlot;
            break;
          }
        }
      } else {
        const parsedDT = parseSheetDateAndTimeCols(col8, col9);
        publishDate = parsedDT.publishDate;
        publishTime = parsedDT.publishTime;
        publishSlot = parsedDT.publishSlot;
      }
    }

    const cleanedCol0 = cleanFootageTitle(col0);
    const normTitle = normalizeCompareKey(cleanedCol0);
    titleOccurrenceCounts.set(normTitle, (titleOccurrenceCounts.get(normTitle) || 0) + 1);

    preliminaryLines.push({
      rawLine: line,
      detectedFormat,
      title: cleanedCol0,
      rawEpisodeColB,
      episodeTitle,
      episodeHashtags,
      rankTitle,
      punchlineNote,
      tier1Raw,
      tier2Raw,
      tier3Raw,
      episodeUrl,
      publishDate,
      publishTime,
      publishSlot,
    });
  });

  // Second pass: if rows share the same non-empty YouTube URL in 10-Col mode (like when Google Sheets auto-incremented "5 อันดับ...", "6 อันดับ...", "7 อันดับ..." on rows 8-12), unify their episodeTitle to the first row's episodeTitle for that URL!
  const canonicalTitleByUrl = new Map<string, string>();
  preliminaryLines.forEach((item) => {
    if (item.episodeUrl && item.episodeTitle) {
      const cleanUrl = item.episodeUrl.trim();
      if (!canonicalTitleByUrl.has(cleanUrl)) {
        canonicalTitleByUrl.set(cleanUrl, item.episodeTitle);
      } else {
        item.episodeTitle = canonicalTitleByUrl.get(cleanUrl)!;
      }
    }
  });

  const parsedRows: ParsedSheetRow[] = [];

  preliminaryLines.forEach((item, index) => {
    const {
      rawLine,
      detectedFormat,
      title,
      rawEpisodeColB,
      episodeTitle,
      episodeHashtags,
      rankTitle,
      punchlineNote,
      tier1Raw,
      tier2Raw,
      tier3Raw,
      episodeUrl,
      publishDate,
      publishTime,
      publishSlot,
    } = item;

    const normTitle = normalizeCompareKey(title);

    const rawT1Names = extractHashtagsOnly(tier1Raw);
    const rawT2Names = extractHashtagsOnly(tier2Raw);
    const rawT3Names = extractHashtagsOnly(tier3Raw);

    if (episodeTitle && includeSeriesTagOnFootage) {
      const { seriesBaseName } = parseEpisodeTitleAndNumber(episodeTitle);
      if (seriesBaseName && !rawT1Names.includes(seriesBaseName)) {
        rawT1Names.push(seriesBaseName);
      }
    }

    // Smart 3-Tier Tag Routing + Data Dictionary Synonym & Rule 2 Resolution:
    // Automatically strips "ฮา / ฮาๆ / สุดฮา" and consolidates synonyms (e.g. #ดารา, #คนดัง ➔ #คนมีชื่อเสียง) into their canonical Tier 1-3.
    const resolvedMap = new Map<string, TagTierAssignment>();

    const registerTagWithDefaultTier = (
      tagName: string,
      defaultColumnTier: CategoryTier
    ) => {
      const ruleResults = resolveTagByDataDictionary(
        tagName,
        defaultColumnTier
      );
      for (const res of ruleResults) {
        const lower = res.name.toLowerCase();
        if (resolvedMap.has(lower)) continue;
        const existingTag = tagByLowerName.get(lower);
        if (existingTag) {
          resolvedMap.set(lower, {
            name: existingTag.name,
            tier: res.dictionarySpecId
              ? res.tier
              : existingTag.tier || defaultColumnTier,
            isNew: false,
            existingTag,
          });
        } else {
          resolvedMap.set(lower, {
            name: res.name,
            tier: res.tier,
            isNew: true,
          });
        }
      }
    };

    rawT1Names.forEach((t) => registerTagWithDefaultTier(t, 1));
    rawT2Names.forEach((t) => registerTagWithDefaultTier(t, 2));
    rawT3Names.forEach((t) => registerTagWithDefaultTier(t, 3));

    const resolvedTags = Array.from(resolvedMap.values());
    const tier1TagNames = resolvedTags
      .filter((t) => t.tier === 1)
      .map((t) => t.name);
    const tier2TagNames = resolvedTags
      .filter((t) => t.tier === 2)
      .map((t) => t.name);
    const tier3TagNames = resolvedTags
      .filter((t) => t.tier === 3)
      .map((t) => t.name);
    const tagNames = resolvedTags.map((t) => t.name);

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

    const tagsToCreate = resolvedTags
      .filter((t) => t.isNew)
      .map((t) => t.name);

    const existingNames = existingTags.map((t) => t.name);
    const finalTagNames = Array.from(new Set([...existingNames, ...tagNames]));

    parsedRows.push({
      rowIndex: index + 1,
      rawLine,
      detectedFormat,
      title,
      rawEpisodeColB,
      episodeTitle,
      episodeHashtags,
      rankTitle,
      punchlineNote,
      tier1TagNames,
      tier2TagNames,
      tier3TagNames,
      resolvedTags,
      tagNames,
      episodeUrl,
      publishDate,
      publishTime,
      publishSlot,
      matchedFootage,
      isInStaging,
      occurrenceCountInSheet: titleOccurrenceCounts.get(normTitle) || 1,
      existingTags,
      tagsToCreate,
      finalTagNames,
    });
  });

  // Group rows by episodeTitle (Col B in 10-Col mode, or Col D in legacy 4-Col mode)
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
    const { seriesBaseName, episodeNo } =
      parseEpisodeTitleAndNumber(episodeTitle);

    const youtubeUrl =
      groupRows.find((r) => Boolean(r.episodeUrl))?.episodeUrl || '';

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

    // Resolve publishDate & publishSlot from Col I & Col J, or custom override, or existingEpisode
    const rowWithDate = groupRows.find((r) => Boolean(r.publishDate));
    const rowWithTime = groupRows.find((r) => Boolean(r.publishTime));
    const customDate = customPublishDateByGroupKey[groupKey];
    const customSlot = customPublishSlotByGroupKey[groupKey];

    const effectivePublishDate =
      customDate ||
      rowWithDate?.publishDate ||
      existingEpisode?.publishDate ||
      '';
    const effectivePublishTime =
      rowWithTime?.publishTime ||
      (customSlot === 'MORNING_0600'
        ? '06:00'
        : customSlot === 'EVENING_1800'
        ? '18:00'
        : '');
    const effectivePublishSlot: PublishSlot =
      customSlot ||
      (rowWithTime ? rowWithTime.publishSlot : null) ||
      (rowWithDate ? rowWithDate.publishSlot : null) ||
      existingEpisode?.publishSlot ||
      'EVENING_1800';

    const hasExplicitDateInSheet = Boolean(
      customDate || rowWithDate?.publishDate
    );

    const primaryTagName =
      firstRow.tier3TagNames[0] ||
      firstRow.tier1TagNames[0] ||
      seriesBaseName ||
      firstRow.tagNames[0] ||
      'ทั่วไป';

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
      rawFullTitleWithTags: firstRow.rawEpisodeColB || episodeTitle,
      episodeHashtags: firstRow.episodeHashtags,
      seriesBaseName,
      episodeNo,
      youtubeUrl,
      publishDate: effectivePublishDate,
      publishTime: effectivePublishTime,
      publishSlot: effectivePublishSlot,
      hasExplicitDateInSheet,
      rows: groupRows,
      existingEpisode,
      primaryTagName,
      isCompleteFiveRanks,
      missingFootageCount,
      hasDuplicateClipsInGroup,
      rankingsPreview,
    });
  });

  // Compute summary stats including 3-Tier breakdown
  let matchedCount = 0;
  let stagingMatchedCount = 0;
  let unmatchedCount = 0;
  let duplicateRowsInSheetCount = 0;
  const uniqueNewTagsByTier = new Map<string, CategoryTier>();

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

    r.resolvedTags.forEach((rt) => {
      if (rt.isNew && !uniqueNewTagsByTier.has(rt.name.toLowerCase())) {
        uniqueNewTagsByTier.set(rt.name.toLowerCase(), rt.tier);
      }
    });
  });

  let newTier1TagsCount = 0;
  let newTier2TagsCount = 0;
  let newTier3TagsCount = 0;
  uniqueNewTagsByTier.forEach((tier) => {
    if (tier === 1) newTier1TagsCount += 1;
    else if (tier === 2) newTier2TagsCount += 1;
    else if (tier === 3) newTier3TagsCount += 1;
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
  const episodesWithExplicitDateCount = episodeGroups.filter(
    (g) => g.hasExplicitDateInSheet
  ).length;

  const uniqueNewTagDisplayNames: string[] = [];
  const seenLower = new Set<string>();
  parsedRows.forEach((r) => {
    r.tagsToCreate.forEach((name) => {
      const l = name.toLowerCase();
      if (!seenLower.has(l)) {
        seenLower.add(l);
        uniqueNewTagDisplayNames.push(name);
      }
    });
  });

  return {
    parsedRows,
    episodeGroups,
    stats: {
      totalRows: parsedRows.length,
      detectedFormat: dominantFormat,
      matchedCount,
      stagingMatchedCount,
      unmatchedCount,
      duplicateRowsInSheetCount,
      newTagsCount: uniqueNewTagDisplayNames.length,
      newTier1TagsCount,
      newTier2TagsCount,
      newTier3TagsCount,
      newTagNames: uniqueNewTagDisplayNames,
      episodeGroupsCount: episodeGroups.length,
      completeEpisodesCount,
      incompleteEpisodesCount,
      newEpisodesCount,
      existingEpisodesToUpdateCount,
      episodesWithExplicitDateCount,
    },
  };
}
