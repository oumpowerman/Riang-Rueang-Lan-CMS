import { Episode, PublishSlot } from '../../../types/episode.types';

export type MatchConfidence = 'EXACT' | 'SERIES_EP' | 'FUZZY_EP' | 'MANUAL' | 'UNMATCHED';

export interface ParsedYouTubeDateRow {
  rowIndex: number;
  rawLine: string;
  rawDateTimeStr: string;
  publishDate: string; // YYYY-MM-DD
  publishTime: string; // HH:mm
  publishSlot: PublishSlot;
  rawYouTubeTitle: string;
  cleanTitleNoHashtags: string;
  extractedEpNo: number | null;
  coreSeriesKey: string;
  matchedEpisode: Episode | null;
  matchConfidence: MatchConfidence;
  isDateChanged: boolean;
  affectedFootageIds: string[];
}

export const SAMPLE_YOUTUBE_AI_DATE_DATA = `วันที่เผยแพร่\tชื่อคลิป
29/09/2026 06:06\t5 อันดับคลิปน้ำท่วมสุดฮา! EP.2#ตลก #มีม #ฮาๆ
29/09/2026 18:05\t5 อันดับแก๊งน้ำตาลตกสุดฮา! EP.1 #ตลก #funny #ฮาๆ
30/09/2026 10:24\t5 อันดับคนไทยเป็นคนตลก EP.14 #ตลก #มีม #มีมไทย
30/09/2026 18:06\t5 อันดับคนไทยเป็นคนตลก EP.15 #ตลก #มีม #มีมไทย
02/10/2026 06:07\t5 อันดับคนไทยเป็นคนตลก EP.16 #ตลก #มีม #มีมไทย
02/10/2026 18:05\t5 อันดับคนไทยเป็นคนตลก EP.17 #ตลก #มีม #มีมไทย
03/10/2026 06:00\t20 อันดับคนไทยเป็นคนตลกดูแบบเพลินๆ #ตลก #มีม #คนไทยเป็นคนตลก #funny #จัดอันดับ
03/10/2026 06:06\t5 อันดับน้าค่อม&โก๊ะตี๋ EP.1 สุดฮา! #ตลก #ฮาๆ #funny
03/10/2026 18:05\t5 อันดับคนไทยเป็นคนตลก EP.18 #ตลก #มีม #มีมไทย
04/10/2026 06:06\t5 อันดับคนไทยเป็นคนตลก EP.19 #ตลก #มีม #มีมไทย
04/10/2026 18:05\t5 อันดับไลฟ์สดสุดฮา! EP.1 #ตลก #ฮาๆ #funny
05/10/2026 10:32\t5 อันดับทหารไทยสุดฮา! EP.1 #ตลก #มีม #ฮาๆ
05/10/2026 18:18\t5 อันดับพาวเวอร์พัฟเกย์ EP.1 #ตลก #ฮาๆ #funny
06/10/2026 06:09\t5 อันดับล่าท้าผีสุดฮา! EP.2 #ตลก #ฮาๆ #funny
06/10/2026 18:05\t5 อันดับโฆษณาเก่า EP.4 #ตลกไทย #ฮาๆ
07/10/2026 06:07\t5 อันดับสัมภาษณ์ข่าวสุดฮา! EP.5 #ตลก #มีม #ฮาๆ
07/10/2026 18:04\t5 อันดับโดเนทสุดฮา! แก๊ปโบ้ EP.2 #ตลก #ฮาๆ #แก๊บโบ้
08/10/2026 06:07\t5 อันดับคลิปคนไทยในตำนาน EP.2 #ตลก #มีม #มีมไทย
08/10/2026 18:06\t5 อันดับแจ๊คแปปโฮสุดฮา! EP.2 #ตลก #ฮาๆ #แจ๊คแปปโฮ
09/10/2026 06:06\t5 อันดับพูดผิดสุดฮา! EP.1 #ตลก #มีม #ฮาๆ
09/10/2026 18:05\t5 อันดับรายการผีสุดฮา! EP.2 #ตลก #มีม #ฮาๆ
10/10/2026 06:08\t5 อันดับโหนกระแสสุดฮา! EP.5 #ตลก #มีม #ฮาๆ
10/10/2026 18:08\t5 อันดับน้าค่อม EP.2 #ตลก #ฮาๆ #หนังตลก
11/10/2026 06:05\t5 อันดับคอลเซนเตอร์สุดฮา! EP.2 #ตลก #มีม #มีมไทย
11/10/2026 18:04\t5 อันดับแจ๊สกับน้าค่อม EP.1 #ตลก #มีม #ฮาๆ
11/10/2026 19:00\t20 อันดับคนไทยเป้นคนตลกดูแบบเพลินฯ #ตลก #ฮาๆ #funny
12/10/2026 06:05\t5 อันดับแอนนาชวนชื่น EP.1 #ตลก #ฮา #หนังตลก
12/10/2026 19:24\t5 อันดับคนไทยเป็นคนตลก EP.20 #ตลก #มีม #ฮาๆ
13/10/2026 12:04\t5 อันดับหมูเติ้ลสุดฮา! EP.1 #ตลก #ฮาๆ #funny
13/10/2026 18:00\t5 อันดับ นิว โย ฝน สุดฮา EP.1 #ตลก #มีม #คนไทยเป็นคนตลก
14/10/2026 06:00\t5 อันดับพาวเวอร์พัฟเกย์ EP.2 #ตลก #funny #มีม #มีมไทย
14/10/2026 18:06\t5 อันดับให้อาหารสัตว์สุดฮา EP.1#ตลก #ฮาๆ #funny
15/10/2026 06:08\t5 ดับ นิว โย ฝน สุดฮา! EP.2 #ตลก #ฮาๆ #funny
15/10/2026 18:05\t5 อันดับแจ๊สล้อเลียนสุดฮา! EP.1 #แจ๊ส #ตลก #ฮาๆ
16/10/2026 06:10\t5 อันดับคนไทยเป็นคนตลก EP.21 #ตลก #มีม #ฮาๆ
16/10/2026 18:05\t5 อันดับชิงร้อยชิงล้านสุดฮา! EP.1 #ตลก #ฮาๆ #funny
17/10/2026 06:07\t5 อันดับแจ๊สล้อเลียนสุดฮา! Ep.2 #แจ๊ส #ตลก #ฮาๆ
17/10/2026 18:06\t5 อันดับมายเมทเนทสุดฮา! EP.1 #ตลก #funny #ฮาๆ
18/10/2026 06:07\t5 ดับ นิว โย ฝน สุดฮา! EP.3 #ตลก #ฮาๆ #funny
18/10/2026 18:05\t5 อันดับขนเพชรบ้าจี้สุดฮา! EP.1 #ตลก #มีม #ฮาๆ
19/10/2026 06:06\t5 อันดับโตโน่สุดฮา! EP.1 #โตโน่ #ตลก #ฮา
19/10/2026 18:05\t5 ดับ นิว โย ฝน สุดฮา! EP.4 #ตลก #ฮาๆ #funny
20/10/2026 06:05\t5 ดับ นิว โย ฝน สุดฮา! EP.5 #ตลก #ฮาๆ #funny
20/10/2026 18:05\t5 ดับ นิว โย ฝน สุดฮา! EP.6 #ตลก #ฮาๆ #funny
21/10/2026 06:08\t5 อันดับแจ๊สบอลสุดฮา! EP.1 #ตลก #มีม #ฮาๆ
21/10/2026 18:06\t5 อันดับเตะบอลสุดฮา! EP.1 #ฟุตบอล #ตลก #ฮาๆ
22/10/2026 06:09\t5 อันดับนักเรียนไทยสุดฮา! EP.1 #ตลก #ฮาๆ #funny
22/10/2026 18:06\t5 อันดับคนไทยเป็นคนตลก EP.23 #ตลก #มีม #ฮาๆ
23/10/2026 06:07\t5 อันดับคนไทยเป็นคนตลก EP.24 #ตลก #มีม #ฮาๆ
23/10/2026 18:06\t5 อันดับคนไทยเป็นคนตลก EP.25 #ตลก #มีม #ฮาๆ
24/10/2026 06:08\t5 อันดับหนูรัตน์สุดฮา! EP.1 #ตลก #ฮาๆ #มีม
24/10/2026 18:06\t5 อันดับลีน่าจังสุดฮา! EP.1 #ตลก #ฮาๆ #มีม
25/10/2026 18:43\t5 อันดับพระสุดฮา! EP.1 #ตลก #ฮาๆ #funny
26/10/2026 10:33\t5 อันดับพากย์ บอลสุดฮา! EP.2 #ตลก #ฮาๆ #มีมไทย
26/10/2026 18:08\t5 อันดับขนเพชรสุดฮา! EP.2 #ตลก #ฮาๆ #มีม
27/10/2026 06:05\t5 อันดับป้ารัตนาสุดฮา! EP.1 #ตลก #ฮาๆ #มีม
27/10/2026 19:09\t5 อันดับแจ๊สล้อเลียนสุดฮา! EP.3 #ตลก #ฮาๆ #มีมไทย
28/10/2026 06:00\t5 อันดับตำรวจไทยสุดฮา EP.1 #ตลก #ฮาๆ #มีมไทย #funny
28/10/2026 18:09\t5 อันดับคนไทยเป็นคนตลก EP.26 #ตลก #มีม #ฮาๆ
29/10/2026 06:06\t5 อันดับคนไทยเป็นคนตลก EP.27 #ตลก #มีม #ฮาๆ
29/10/2026 11:46\t5 อันดับแจ๊สล้อเลียน EP.3 #ตลก #ฮาๆ #มีมไทย
29/10/2026 18:13\t5 อันดับเดอะแป๊ะเรดิโอ! EP.1 #ตลก #ฮาๆ #แป๊ะดูดแหนม
30/10/2026 06:06\t5 อันดับคนไทยเป็นคนตลก EP.28 #ตลก #มีม #ฮาๆ
30/10/2026 18:09\t5 อันดับคนไทยเป็นคนตลก EP.29 #ตลก #มีม #ฮาๆ
31/10/2026 06:08\t5 อันดับคนไทยเป็นคนตลก EP.30 #ตลก #มีม #ฮาๆ
31/10/2026 20:46\t5 อันดับ เดอะ โกสเรดิโอ สุดฮา! EP.1 #ตลก #ฮาๆ #มีมไทย
01/11/2026 06:07\t5 อันดับโหนกระแสสุดฮา! EP.6 #ตลก #ฮาๆ #มีมไทย
01/11/2026 13:46\t10 อันดับคลิปคนไทยสุดฮา EP.1 #คนไทยเป็นคนตลก #มีม #ไวรัล
01/11/2026 18:07\t5 อันดับคนไทยในตำนาน! EP.3 #ตลก #ฮาๆ #มีมไทย
02/11/2026 06:06\tฝรั่งพูดภาษาไทยสุดฮา! EP.1 #ตลก #ฮาๆ #funny
02/11/2026 18:08\t5 อันดับมายเมทเนทสุดฮา! EP.2 #ตลก #funny #ฮาๆ
03/11/2026 06:07\t5 อันดับครูเพ็ญศรีสุด! EP.1 #ตลก #มีม #ครูเพ็ญศรี
03/11/2026 18:08\t5 อันดับ คนออกรายการ สุดฮา! EP.1 #คนตลก #คนออกรายการ #คลิปสุดฮา
04/11/2026 06:08\t5 อันดับ คนไทยคนตลก EP.31 #ตลก #ฮาๆ #funny
05/11/2026 06:07\t5 จัดอันดับ คลิปเเกล้งเด็กสุดฮา EP.1 #ตลก #ฮาๆ #funny
06/11/2026 06:10\t5 อันดับ คนไทยในตำนาน EP. 4 #ตลก #ฮาๆ #funny
07/11/2026 06:08\t5 อันดับ แก๊งค์ไทบ้าน สุดฮา! EP.1 #ตลก #ฮาๆ #funny
08/11/2026 06:10\t5 อันดับ คนไทยเป็นคนตลก EP.32 #ตลก #ฮาๆ #funny
09/11/2026 06:00\t5 อันดับอาจาร์ยแดงสุดฮา EP.1 #ตลก #ฮาๆ #มีม #มีมไทย #อาจาร์ยแดง`;

/**
 * Strips all #hashtags from a YouTube title (even when glued without a space like `EP.2#ตลก`)
 */
export function stripHashtagsFromTitle(rawTitle: string): string {
  return rawTitle
    .replace(/#[^\s#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts Episode Number (e.g. EP.14, Ep.2, EP. 4, ตอนที่ 3) and Core Series Keyword
 */
export function extractSeriesAndEpNo(titleWithoutHashtags: string): {
  epNo: number | null;
  coreSeriesKey: string;
  normalizedFullTitle: string;
} {
  const clean = titleWithoutHashtags.trim();
  const normalizedFullTitle = clean
    .toLowerCase()
    .replace(/[!?.،,"'’“”()[\]]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Find EP.X / Ep. X / ตอนที่ X
  let epNo: number | null = null;
  const epMatch = clean.match(/(?:EP\.?|Ep\.?|ep\.?|ตอนที่)\s*(\d+)/i);
  if (epMatch && epMatch[1]) {
    const parsed = parseInt(epMatch[1], 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      epNo = parsed;
    }
  }

  // Strip ranking prefixes ("5 อันดับ", "5 ดับ", "5 จัดอันดับ", "10 อันดับ", "20 อันดับ"),
  // strip EP.X token, strip common filler suffixes ("สุดฮา", "สุด", "คลิป", "ดูแบบเพลินๆ")
  let core = clean
    .replace(/(?:EP\.?|Ep\.?|ep\.?|ตอนที่)\s*\d+/gi, ' ')
    .replace(/^\s*\d+\s*(?:จัดอันดับ|อันดับ|ดับ)\s*/i, '')
    .replace(/ดูแบบเพลิน[ๆฯ]/g, '')
    .replace(/สุดฮา/g, '')
    .replace(/สุด!/g, '')
    .replace(/^คลิป/g, '')
    // Normalize common Thai spelling variations in the user's dataset
    .replace(/เเกล้ง/g, 'แกล้ง')
    .replace(/คนไทยเป้นคนตลก/g, 'คนไทยคนตลก')
    .replace(/คนไทยเป็นคนตลก/g, 'คนไทยคนตลก')
    .replace(/แก๊ปโบ้/g, 'แก๊บโบ้')
    .replace(/อาจาร์ย/g, 'อาจารย์')
    .replace(/แก๊งค์/g, 'แก๊ง')
    .replace(/[!?.&,_\-\s]+/g, '')
    .toLowerCase()
    .trim();

  if (!core) {
    core = normalizedFullTitle.replace(/\s+/g, '');
  }

  return {
    epNo,
    coreSeriesKey: core,
    normalizedFullTitle,
  };
}

/**
 * Computes Dice bigram similarity between two strings (0 to 1)
 */
function computeBigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) {
    const minLen = Math.min(a.length, b.length);
    const maxLen = Math.max(a.length, b.length);
    if (minLen >= 3) {
      return Math.max(0.75, minLen / maxLen);
    }
  }
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const count = bigramsA.get(bg) || 0;
    if (count > 0) {
      intersection++;
      bigramsA.set(bg, count - 1);
    }
  }

  return (2 * intersection) / (a.length - 1 + (b.length - 1));
}

/**
 * Parses a single line of `DD/MM/YYYY HH:mm \t Title` or `YYYY-MM-DD HH:mm \t Title`
 */
function parseDateTimeAndTitleLine(line: string): {
  rawDateTimeStr: string;
  publishDate: string;
  publishTime: string;
  publishSlot: PublishSlot;
  rawYouTubeTitle: string;
} | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Skip header rows like "วันที่เผยแพร่ ชื่อคลิป"
  if (
    trimmed.startsWith('วันที่เผยแพร่') ||
    trimmed.toLowerCase().startsWith('publish') ||
    trimmed.toLowerCase().startsWith('date\t')
  ) {
    return null;
  }

  // Pattern 1: DD/MM/YYYY HH:mm (or D/M/YYYY H:mm) followed by tab or spaces
  const dmyMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?\s+(.+)$/
  );
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let yearNum = parseInt(dmyMatch[3], 10);
    if (yearNum >= 2500) yearNum -= 543; // Convert Buddhist Era if needed
    const year = String(yearNum);
    const hourNum = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 6;
    const minStr = dmyMatch[5] ? dmyMatch[5].padStart(2, '0') : '00';
    const hourStr = String(hourNum).padStart(2, '0');
    const publishTime = `${hourStr}:${minStr}`;
    const publishSlot: PublishSlot =
      hourNum >= 14 ? 'EVENING_1800' : 'MORNING_0600';
    const rawYouTubeTitle = dmyMatch[6].trim();

    return {
      rawDateTimeStr: `${day}/${month}/${year} ${publishTime}`,
      publishDate: `${year}-${month}-${day}`,
      publishTime,
      publishSlot,
      rawYouTubeTitle,
    };
  }

  // Pattern 2: YYYY-MM-DD HH:mm followed by tab or spaces
  const ymdMatch = trimmed.match(
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?\s+(.+)$/
  );
  if (ymdMatch) {
    let yearNum = parseInt(ymdMatch[1], 10);
    if (yearNum >= 2500) yearNum -= 543;
    const year = String(yearNum);
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    const hourNum = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 6;
    const minStr = ymdMatch[5] ? ymdMatch[5].padStart(2, '0') : '00';
    const hourStr = String(hourNum).padStart(2, '0');
    const publishTime = `${hourStr}:${minStr}`;
    const publishSlot: PublishSlot =
      hourNum >= 14 ? 'EVENING_1800' : 'MORNING_0600';
    const rawYouTubeTitle = ymdMatch[6].trim();

    return {
      rawDateTimeStr: `${day}/${month}/${year} ${publishTime}`,
      publishDate: `${year}-${month}-${day}`,
      publishTime,
      publishSlot,
      rawYouTubeTitle,
    };
  }

  return null;
}

/**
 * Parses pasted YouTube Date + Title text and matches against existing CMS Episodes
 */
export function parseAndMatchYouTubeDateData(params: {
  pastedText: string;
  episodes: Episode[];
  manualEpisodeIdByRowIndex: Record<number, string | null>;
  customDateByRowIndex: Record<number, string>;
}): {
  rows: ParsedYouTubeDateRow[];
  stats: {
    totalRows: number;
    matchedRowsCount: number;
    unmatchedRowsCount: number;
    changedDatesCount: number;
    uniqueAffectedFootagesCount: number;
  };
} {
  const {
    pastedText,
    episodes,
    manualEpisodeIdByRowIndex,
    customDateByRowIndex,
  } = params;

  if (!pastedText.trim()) {
    return {
      rows: [],
      stats: {
        totalRows: 0,
        matchedRowsCount: 0,
        unmatchedRowsCount: 0,
        changedDatesCount: 0,
        uniqueAffectedFootagesCount: 0,
      },
    };
  }

  // Pre-index CMS episodes for fast matching
  const indexedEpisodes = episodes.map((ep) => {
    const cleanEpTitle = stripHashtagsFromTitle(ep.title);
    const parsedTitle = extractSeriesAndEpNo(cleanEpTitle);
    const parsedSeries = ep.seriesTitle
      ? extractSeriesAndEpNo(stripHashtagsFromTitle(ep.seriesTitle))
      : null;

    return {
      episode: ep,
      epNo: ep.categoryEpisodeNo ?? parsedTitle.epNo,
      parsedTitleNo: parsedTitle.epNo,
      coreKey: parsedTitle.coreSeriesKey,
      seriesCoreKey: parsedSeries?.coreSeriesKey || '',
      normalizedFullTitle: parsedTitle.normalizedFullTitle,
    };
  });

  const episodeById = new Map<string, Episode>();
  episodes.forEach((ep) => episodeById.set(ep.id, ep));

  const lines = pastedText.split(/\r?\n/);
  const rows: ParsedYouTubeDateRow[] = [];
  const affectedFootageSet = new Set<string>();

  lines.forEach((rawLine, idx) => {
    const parsedLine = parseDateTimeAndTitleLine(rawLine);
    if (!parsedLine) return;

    const cleanTitleNoHashtags = stripHashtagsFromTitle(
      parsedLine.rawYouTubeTitle
    );
    const { epNo, coreSeriesKey, normalizedFullTitle } =
      extractSeriesAndEpNo(cleanTitleNoHashtags);

    const effectivePublishDate =
      customDateByRowIndex[idx] || parsedLine.publishDate;

    let matchedEp: Episode | null = null;
    let confidence: MatchConfidence = 'UNMATCHED';

    // Check if user manually selected an episode (or explicitly set null to skip)
    if (Object.prototype.hasOwnProperty.call(manualEpisodeIdByRowIndex, idx)) {
      const manualId = manualEpisodeIdByRowIndex[idx];
      if (manualId && episodeById.has(manualId)) {
        matchedEp = episodeById.get(manualId)!;
        confidence = 'MANUAL';
      } else {
        matchedEp = null;
        confidence = 'UNMATCHED';
      }
    } else {
      // Tier 1: Exact normalized title match
      const exactHit = indexedEpisodes.find(
        (item) => item.normalizedFullTitle === normalizedFullTitle
      );
      if (exactHit) {
        matchedEp = exactHit.episode;
        confidence = 'EXACT';
      }

      // Tier 2: Exact Core Series Key + Exact Episode Number
      if (!matchedEp && epNo !== null && coreSeriesKey) {
        const seriesHit = indexedEpisodes.find(
          (item) =>
            (item.parsedTitleNo === epNo || item.epNo === epNo) &&
            (item.coreKey === coreSeriesKey ||
              item.seriesCoreKey === coreSeriesKey)
        );
        if (seriesHit) {
          matchedEp = seriesHit.episode;
          confidence = 'SERIES_EP';
        }
      }

      // Tier 3: Fuzzy Core Series Similarity + Exact Episode Number
      if (!matchedEp && epNo !== null && coreSeriesKey) {
        let bestCandidate: Episode | null = null;
        let bestScore = 0;

        for (const item of indexedEpisodes) {
          if (item.parsedTitleNo !== epNo && item.epNo !== epNo) continue;
          const score1 = computeBigramSimilarity(coreSeriesKey, item.coreKey);
          const score2 = item.seriesCoreKey
            ? computeBigramSimilarity(coreSeriesKey, item.seriesCoreKey)
            : 0;
          const score = Math.max(score1, score2);
          if (score >= 0.55 && score > bestScore) {
            bestScore = score;
            bestCandidate = item.episode;
          }
        }

        if (bestCandidate) {
          matchedEp = bestCandidate;
          confidence = 'FUZZY_EP';
        }
      }
    }

    const affectedFootageIds = matchedEp
      ? matchedEp.rankings
          .map((r) => r.footageId)
          .filter((fid): fid is string => Boolean(fid))
      : [];

    const isDateChanged = Boolean(
      matchedEp &&
        (matchedEp.publishDate !== effectivePublishDate ||
          matchedEp.publishSlot !== parsedLine.publishSlot)
    );

    if (matchedEp) {
      affectedFootageIds.forEach((fid) => affectedFootageSet.add(fid));
    }

    rows.push({
      rowIndex: idx,
      rawLine,
      rawDateTimeStr: parsedLine.rawDateTimeStr,
      publishDate: effectivePublishDate,
      publishTime: parsedLine.publishTime,
      publishSlot: parsedLine.publishSlot,
      rawYouTubeTitle: parsedLine.rawYouTubeTitle,
      cleanTitleNoHashtags,
      extractedEpNo: epNo,
      coreSeriesKey,
      matchedEpisode: matchedEp,
      matchConfidence: confidence,
      isDateChanged,
      affectedFootageIds,
    });
  });

  const matchedRowsCount = rows.filter((r) => r.matchedEpisode !== null).length;
  const unmatchedRowsCount = rows.length - matchedRowsCount;
  const changedDatesCount = rows.filter((r) => r.isDateChanged).length;

  return {
    rows,
    stats: {
      totalRows: rows.length,
      matchedRowsCount,
      unmatchedRowsCount,
      changedDatesCount,
      uniqueAffectedFootagesCount: affectedFootageSet.size,
    },
  };
}
