import { Episode } from '../types/episode.types';

export interface TemplateStandardizeOptions {
  /** Whether to put a space before "สุดฮา!" -> "5 อันดับ [ชื่อ] สุดฮา! EP.n" vs "5 อันดับ [ชื่อ]สุดฮา! EP.n" */
  spaceBeforeSudHa: boolean;
  /** List of base series names exempt from adding "สุดฮา!" */
  exemptKeywords: string[];
  /** Whether to keep existing #hashtags at the end of the title */
  preserveHashtags: boolean;
  /** Whether to normalize known missing-word/typo series names (e.g. คนไทยคนตลก / คนไทยเป้นคนตลก -> คนไทยเป็นคนตลก) */
  fixKnownSeriesTypos: boolean;
}

export const DEFAULT_EXEMPT_SERIES_KEYWORDS = [
  'คนไทยเป็นคนตลก',
  'คนไทยเป้นคนตลก',
  'คนไทยคนตลก',
  'คนไทยในตำนาน',
];

export const DEFAULT_TEMPLATE_OPTIONS: TemplateStandardizeOptions = {
  spaceBeforeSudHa: true,
  exemptKeywords: DEFAULT_EXEMPT_SERIES_KEYWORDS,
  preserveHashtags: true,
  fixKnownSeriesTypos: true,
};

/**
 * Normalizes known typo / missing-word variants of series titles into canonical spelling.
 * e.g. "คนไทยคนตลก" or "คนไทยเป้นคนตลก" -> "คนไทยเป็นคนตลก"
 */
export function normalizeKnownSeriesAliases(text: string): string {
  if (!text) return '';
  return text
    .replace(/คนไทย\s*เป้น\s*คนตลก/gi, 'คนไทยเป็นคนตลก')
    .replace(/คนไทย\s*คนตลก/gi, 'คนไทยเป็นคนตลก')
    .replace(/คนไทย\s*เป็น\s*คนตลก/gi, 'คนไทยเป็นคนตลก');
}

export interface EpisodeTemplatePreview {
  episode: Episode;
  beforeTitle: string;
  afterTitle: string;
  beforeSeriesTitle: string;
  afterSeriesTitle: string;
  isExempt: boolean;
  needsUpdate: boolean;
  parsedEpNo: number;
}

function extractTrailingHashtags(raw: string): string[] {
  if (!raw) return [];
  const matches = raw.match(/#([^\s#,\t\n\r"']+)/g);
  if (!matches) return [];
  const tags: string[] = [];
  for (const m of matches) {
    const word = m.replace(/^#+/, '').trim();
    if (!word || /^\d+$/.test(word) || /^(?:ep\.?|ตอนที่)\d+$/i.test(word)) {
      continue;
    }
    const formatted = `#${word}`;
    if (!tags.includes(formatted)) {
      tags.push(formatted);
    }
  }
  return tags;
}

/**
 * Checks whether a base series title matches any user-configured exemption (e.g. คนไทยเป็นคนตลก, คนไทยในตำนาน).
 */
export function isExemptSeriesName(
  text: string,
  exemptKeywords: string[] = DEFAULT_EXEMPT_SERIES_KEYWORDS
): boolean {
  const normText = (text || '').toLowerCase().replace(/\s+/g, '');
  if (!normText) return false;
  return exemptKeywords.some((kw) => {
    const normKw = kw.toLowerCase().replace(/\s+/g, '');
    return normKw.length > 0 && normText.includes(normKw);
  });
}

/**
 * Computes the standardized Template title & seriesTitle for a given Episode:
 * - Standard: "5 อันดับ {ชื่อเรื่อง} สุดฮา! EP.{n}" (or without space if configured)
 * - Exempt ("คนไทยเป็นคนตลก", "คนไทยในตำนาน"): "5 อันดับ {ชื่อเรื่อง} EP.{n}"
 */
export function formatEpisodeToStandardTemplate(
  ep: Episode,
  options: TemplateStandardizeOptions = DEFAULT_TEMPLATE_OPTIONS
): EpisodeTemplatePreview {
  const beforeTitle = (ep.title || '').trim();
  const beforeSeriesTitle = (ep.seriesTitle || '').trim();
  const hashtags = options.preserveHashtags
    ? extractTrailingHashtags(beforeTitle)
    : [];

  // Strip URLs and non-numeric hashtags for clean parsing
  let cleanText = beforeTitle
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/#([^\s#,\t\n\r"']+)/g, (full, word) => {
      if (/^\d+$/.test(word)) return full;
      return '';
    })
    .replace(/\s+/g, ' ')
    .trim();

  const isPlaceholderId =
    !cleanText || cleanText === ep.id || /^EP-\d+$/i.test(cleanText);
  if (isPlaceholderId) {
    cleanText = beforeSeriesTitle || 'คลิปเด็ด';
  }

  // Extract EP number ("EP.1", "EP 1", "(EP.1)", "ตอนที่ 1", "#1")
  let parsedEpNo =
    ep.categoryEpisodeNo && ep.categoryEpisodeNo > 0 ? ep.categoryEpisodeNo : 1;
  const epMatch = cleanText.match(
    /^(.*?)\s*\(?(?:EP\.?\s*|ตอนที่\s*|#)(\d+)\b\)?(.*)$/i
  );
  let coreName = cleanText;

  if (epMatch) {
    coreName = epMatch[1].trim();
    const num = parseInt(epMatch[2], 10);
    if (Number.isFinite(num) && num > 0) {
      parsedEpNo = num;
    }
    const trailingAfterEp = (epMatch[3] || '').trim();
    // Preserve extra non-boilerplate text if coreName was empty
    if (!coreName && trailingAfterEp) {
      coreName = trailingAfterEp;
    }
  }

  // Strip leading rank prefix ("5 อันดับ", "5อันดับ", "6 อันดับ", "๕ อันดับ", "Top 5", "จัดอันดับ")
  coreName = coreName
    .replace(/^(?:รวม\s*)?[5๕\d]+\s*(?:อันดับ|จัดอันดับ|ดับ)\s*/i, '')
    .replace(/^(?:top\s*5|ท็อป\s*5|จัดอันดับ)\s*/i, '')
    .replace(/\s+[-–—]\s*$/, '')
    .trim();

  if (!coreName && beforeSeriesTitle) {
    coreName = beforeSeriesTitle
      .replace(/^(?:รวม\s*)?[5๕\d]+\s*(?:อันดับ|จัดอันดับ|ดับ)\s*/i, '')
      .trim();
  }
  if (!coreName) {
    coreName = 'คลิปเด็ด';
  }

  if (options.fixKnownSeriesTypos) {
    coreName = normalizeKnownSeriesAliases(coreName);
  }

  // Check if exempt (e.g. คนไทยเป็นคนตลก / คนไทยในตำนาน)
  const exempt = isExemptSeriesName(coreName, options.exemptKeywords);

  // Strip trailing ! from coreName first
  let normalizedSubject = coreName.replace(/[!！]+$/g, '').trim();

  let afterSeriesTitle = '';
  if (exempt) {
    // Also strip accidental trailing "สุดฮา!" if it was previously appended to an exempt series
    normalizedSubject = normalizedSubject
      .replace(/\s*สุดฮา[!！\s]*$/i, '')
      .replace(/[!！]+$/g, '')
      .trim();
    afterSeriesTitle = `5 อันดับ ${normalizedSubject}`;
  } else {
    // Strip trailing "สุดฮา" (with optional spaces or !) so we never get "สุดฮา สุดฮา!"
    normalizedSubject = normalizedSubject
      .replace(/\s*สุดฮา[!！\s]*$/i, '')
      .replace(/[!！]+$/g, '')
      .trim();

    if (!normalizedSubject) {
      normalizedSubject = 'คลิปเด็ด';
    }

    const suffix = options.spaceBeforeSudHa ? ' สุดฮา!' : 'สุดฮา!';
    afterSeriesTitle = `5 อันดับ ${normalizedSubject}${suffix}`;
  }

  const hashtagSuffix = hashtags.length > 0 ? ` ${hashtags.join(' ')}` : '';
  const afterTitle = `${afterSeriesTitle} EP.${parsedEpNo}${hashtagSuffix}`;

  const needsUpdate =
    beforeTitle !== afterTitle ||
    beforeSeriesTitle !== afterSeriesTitle ||
    ep.categoryEpisodeNo !== parsedEpNo;

  return {
    episode: {
      ...ep,
      title: afterTitle,
      seriesTitle: afterSeriesTitle,
      categoryEpisodeNo: parsedEpNo,
    },
    beforeTitle,
    afterTitle,
    beforeSeriesTitle,
    afterSeriesTitle,
    isExempt: exempt,
    needsUpdate,
    parsedEpNo,
  };
}
