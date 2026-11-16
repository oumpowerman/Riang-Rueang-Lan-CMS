import { Episode } from '../types/episode.types';

/**
 * Shared high-performance Intl.Collator singletons for 10,000+ row sorting
 * (5-10x faster than calling String.prototype.localeCompare inside sort loops)
 */
export const THAI_COLLATOR = new Intl.Collator('th', {
  sensitivity: 'base',
  numeric: true,
});

export const NUMERIC_ID_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export type EpisodeStandardIssue =
  | 'MISSING_TITLE'
  | 'NON_5_RANK'
  | 'INCOMPLETE_SLOTS';

export interface EpisodeValidationResult {
  isStandard: boolean;
  issues: EpisodeStandardIssue[];
  filledSlotCount: number;
  hasMissingTitle: boolean;
  hasNon5Rank: boolean;
  hasIncompleteSlots: boolean;
  suggestedTitle: string;
  suggestedSeriesTitle: string;
}

const validationCache = new WeakMap<
  Episode,
  { sig: string; result: EpisodeValidationResult }
>();

function getEpisodeValidationSignature(ep: Episode): string {
  const r = ep.rankings || [];
  let slotMask = '';
  for (let i = 0; i < r.length; i++) {
    slotMask += r[i].footageId ? '1' : '0';
  }
  return `${ep.id}|${ep.title || ''}|${ep.seriesTitle || ''}|${ep.categoryEpisodeNo || 0}|${slotMask}`;
}

/**
 * Strips hashtags (#word), URLs, and trailing boilerplate from an episode title
 * while preserving numeric EP markers like #1 or EP.1 for parsing.
 */
function stripNonEpHashtags(raw: string): string {
  return (raw || '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/#([^\s#,\t\n\r"']+)/g, (full, word) => {
      if (/^\d+$/.test(word)) return full;
      return '';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Derives a clean Series Title (without EP number or hashtags) directly from an Episode Title.
 * Example: "5 อันดับ คนไทยเป็นคนตลก EP.12 #ตลก" -> "5 อันดับ คนไทยเป็นคนตลก"
 */
export function deriveSeriesTitleFromEpisodeTitle(
  episodeTitle: string,
  fallbackSeriesTitle?: string
): string {
  const cleaned = stripNonEpHashtags(episodeTitle || fallbackSeriesTitle || '');
  if (!cleaned) return '';

  // Remove EP.1 / EP 1 / ตอนที่ 1 / #1 and anything trailing after EP number
  let base = cleaned
    .replace(/\s*(?:EP\.?\s*|ตอนที่\s*|#)(\d+)\b.*$/i, '')
    .replace(/\s+[-–—]\s*$/, '')
    .trim();

  if (!base) {
    base = cleaned;
  }

  // Normalize leading rank prefix to "5 อันดับ"
  base = normalizeFiveRankPrefix(base);
  return base.replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes any variant of ranking prefix (e.g. "6 อันดับ", "๕ อันดับ", "Top 5", "จัดอันดับ")
 * or missing prefix into clean "5 อันดับ ...".
 */
export function normalizeFiveRankPrefix(rawTitle: string): string {
  const trimmed = (rawTitle || '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';

  // Normalize "5อันดับ" (no space) or "๕ อันดับ" (Thai digit) -> "5 อันดับ "
  if (/^[5๕]\s*อันดับ\s*/i.test(trimmed)) {
    const rest = trimmed.replace(/^[5๕]\s*อันดับ\s*/i, '').trim();
    return rest ? `5 อันดับ ${rest}` : '5 อันดับ';
  }

  // Normalize "รวม 5 อันดับ ..." -> keep or normalize
  if (/^รวม\s*[5๕]\s*อันดับ/i.test(trimmed)) {
    const rest = trimmed.replace(/^รวม\s*[5๕]\s*อันดับ\s*/i, '').trim();
    return rest ? `5 อันดับ ${rest}` : '5 อันดับ';
  }

  // Fix auto-incremented prefixes from Google Sheets (e.g. "6 อันดับ...", "7 อันดับ...", "10 อันดับ...")
  if (/^\d+\s*(?:อันดับ|จัดอันดับ|ดับ)\s+/i.test(trimmed)) {
    const rest = trimmed.replace(/^\d+\s*(?:อันดับ|จัดอันดับ|ดับ)\s*/i, '').trim();
    return rest ? `5 อันดับ ${rest}` : '5 อันดับ';
  }

  // Fix "Top 5 ..." / "TOP5 ..." / "จัดอันดับ ..."
  if (/^(?:top\s*5|ท็อป\s*5|จัดอันดับ)\s*/i.test(trimmed)) {
    const rest = trimmed.replace(/^(?:top\s*5|ท็อป\s*5|จัดอันดับ)\s*/i, '').trim();
    return rest ? `5 อันดับ ${rest}` : '5 อันดับ';
  }

  // If "5 อันดับ" already exists elsewhere in the title, keep as-is
  if (/5\s*อันดับ/i.test(trimmed)) {
    return trimmed;
  }

  // Otherwise prepend "5 อันดับ "
  return `5 อันดับ ${trimmed}`;
}

/**
 * Validates an Episode against the standard 5-Rank production rules:
 * 1. Must have a real title (not empty, not just an ID like "EP-0001")
 * 2. The episode title (`ep.title`) must explicitly contain "5 อันดับ"
 * 3. Must have all 5 ranking slots filled with a valid footage ID
 */
export function validateEpisodeStandard(ep: Episode): EpisodeValidationResult {
  const sig = getEpisodeValidationSignature(ep);
  const cached = validationCache.get(ep);
  if (cached && cached.sig === sig) {
    return cached.result;
  }

  const issues: EpisodeStandardIssue[] = [];

  const rawTitle = (ep.title || '').trim();
  const rawSeriesTitle = (ep.seriesTitle || '').trim();

  // 1. Check Missing Title
  const isTitleEmpty =
    !rawTitle || rawTitle === ep.id || /^EP-\d+$/i.test(rawTitle);
  if (isTitleEmpty) {
    issues.push('MISSING_TITLE');
  }

  // 2. Check 5-Rank Format directly on Episode Title
  const has5RankInTitle = /5\s*อันดับ/i.test(rawTitle);

  if (!has5RankInTitle) {
    issues.push('NON_5_RANK');
  }

  // 3. Check Slot Completeness (All 5 ranks must have footageId)
  const rankings = ep.rankings || [];
  let filledSlotCount = 0;
  for (let i = 0; i < rankings.length; i++) {
    if (rankings[i].footageId) filledSlotCount++;
  }

  if (filledSlotCount < 5) {
    issues.push('INCOMPLETE_SLOTS');
  }

  // Generate Suggested Title & Suggested Series Title
  let suggestedTitle = rawTitle;
  if (isTitleEmpty) {
    suggestedTitle = rawSeriesTitle
      ? `${normalizeFiveRankPrefix(rawSeriesTitle)} EP.${ep.categoryEpisodeNo || 1}`
      : `5 อันดับ คลิปเด็ด EP.${ep.categoryEpisodeNo || 1}`;
  } else if (!has5RankInTitle) {
    suggestedTitle = normalizeFiveRankPrefix(rawTitle);
  }

  const suggestedSeriesTitle = deriveSeriesTitleFromEpisodeTitle(
    suggestedTitle,
    rawSeriesTitle
  );

  const result: EpisodeValidationResult = {
    isStandard: issues.length === 0,
    issues,
    filledSlotCount,
    hasMissingTitle: isTitleEmpty,
    hasNon5Rank: !has5RankInTitle,
    hasIncompleteSlots: filledSlotCount < 5,
    suggestedTitle,
    suggestedSeriesTitle,
  };

  validationCache.set(ep, { sig, result });
  return result;
}

/**
 * Produces a fixed copy of an Episode with normalized "5 อันดับ ..." title
 * and synchronized seriesTitle.
 */
export function buildFixedFiveRankEpisode(ep: Episode): Episode {
  const validation = validateEpisodeStandard(ep);
  const nextTitle = validation.suggestedTitle || ep.title;
  const nextSeriesTitle =
    validation.suggestedSeriesTitle ||
    deriveSeriesTitleFromEpisodeTitle(nextTitle, ep.seriesTitle);

  return {
    ...ep,
    title: nextTitle,
    seriesTitle: nextSeriesTitle,
  };
}

/**
 * Summarizes validation metrics across a list of episodes.
 */
export interface EpisodeQualityAuditSummary {
  totalEpisodes: number;
  standardCount: number;
  issueCount: number;
  missingTitleCount: number;
  non5RankCount: number;
  incompleteSlotsCount: number;
}

export function auditEpisodesQuality(
  episodes: Episode[]
): EpisodeQualityAuditSummary {
  let standardCount = 0;
  let issueCount = 0;
  let missingTitleCount = 0;
  let non5RankCount = 0;
  let incompleteSlotsCount = 0;

  for (let i = 0; i < episodes.length; i++) {
    const res = validateEpisodeStandard(episodes[i]);
    if (res.isStandard) {
      standardCount++;
    } else {
      issueCount++;
      if (res.hasMissingTitle) missingTitleCount++;
      if (res.hasNon5Rank) non5RankCount++;
      if (res.hasIncompleteSlots) incompleteSlotsCount++;
    }
  }

  return {
    totalEpisodes: episodes.length,
    standardCount,
    issueCount,
    missingTitleCount,
    non5RankCount,
    incompleteSlotsCount,
  };
}

export type EpisodeCompletenessFilter =
  | 'ALL'
  | 'COMPLETE'
  | 'INCOMPLETE'
  | 'INCOMPLETE_FOOTAGE';

export interface EpisodeCompletenessResult {
  isComplete: boolean;
  hasRealMasterDrive: boolean;
  hasStandardTitle: boolean;
  hasFullFiveSlots: boolean;
  filledSlotCount: number;
  missingItems: string[];
  shortLabel: string;
  detailText: string;
  isPlaceholderDrive: boolean;
}

const PLACEHOLDER_MASTER_DRIVE_PATTERN =
  /drive\.google\.com\/file\/d\/MASTER-/i;

/**
 * Checks whether a Master Video Google Drive URL is a real user-provided URL
 * (excludes empty values and auto-generated placeholder links like .../MASTER-EP-0001/view).
 */
export function hasRealMasterDriveLink(url?: string | null): boolean {
  const trimmed = (url || '').trim();
  if (!trimmed) return false;
  if (!/^https?:\/\/\S+/i.test(trimmed)) return false;
  if (PLACEHOLDER_MASTER_DRIVE_PATTERN.test(trimmed)) return false;
  return true;
}

export function isPlaceholderMasterDriveLink(url?: string | null): boolean {
  const trimmed = (url || '').trim();
  if (!trimmed) return false;
  return PLACEHOLDER_MASTER_DRIVE_PATTERN.test(trimmed);
}

const completenessCache = new WeakMap<
  Episode,
  { sig: string; result: EpisodeCompletenessResult }
>();

/**
 * Evaluates full readiness of a Master Episode against all 3 production criteria:
 * 1. All 5 ranking slots are filled with valid footage
 * 2. Episode title is real and follows the "5 อันดับ" standard
 * 3. A real Google Drive Master video link is present (non-placeholder)
 */
export function evaluateEpisodeCompleteness(
  ep: Episode
): EpisodeCompletenessResult {
  const driveUrl = ep.masterVideoInfo?.masterDriveUrl || '';
  const sig = `${getEpisodeValidationSignature(ep)}|${driveUrl}`;
  const cached = completenessCache.get(ep);
  if (cached && cached.sig === sig) {
    return cached.result;
  }

  const std = validateEpisodeStandard(ep);
  const hasRealMasterDrive = hasRealMasterDriveLink(driveUrl);
  const isPlaceholderDrive = isPlaceholderMasterDriveLink(driveUrl);
  const hasStandardTitle = !std.hasMissingTitle && !std.hasNon5Rank;
  const hasFullFiveSlots = !std.hasIncompleteSlots;

  const missingItems: string[] = [];
  if (std.hasMissingTitle) {
    missingItems.push('ยังไม่ตั้งชื่อคลิป');
  } else if (std.hasNon5Rank) {
    missingItems.push('ชื่อยังไม่เป็น "5 อันดับ"');
  }
  if (std.hasIncompleteSlots) {
    missingItems.push(`ฟุตไม่ครบ (${std.filledSlotCount}/5)`);
  }
  if (!hasRealMasterDrive) {
    missingItems.push(
      isPlaceholderDrive
        ? 'ยังเป็นลิงก์ Drive จำลอง (รอวางลิงก์จริง)'
        : 'ขาดลิงก์ Master Drive'
    );
  }

  const isComplete = missingItems.length === 0;

  let shortLabel = 'พร้อมสมบูรณ์';
  if (!isComplete) {
    if (missingItems.length === 1) {
      if (!hasRealMasterDrive) {
        shortLabel = 'ขาดลิงก์ Drive';
      } else if (std.hasIncompleteSlots) {
        shortLabel = `ฟุตไม่ครบ (${std.filledSlotCount}/5)`;
      } else if (std.hasMissingTitle) {
        shortLabel = 'ยังไม่ตั้งชื่อ';
      } else {
        shortLabel = 'ชื่อยังไม่ 5 อันดับ';
      }
    } else {
      shortLabel = `ไม่ครบ ${missingItems.length} จุด`;
    }
  }

  const detailText = isComplete
    ? 'พร้อมสมบูรณ์: ครบ 5 ฟุต, ชื่อมาตรฐาน และมีลิงก์ Master Drive จริง'
    : `จุดที่ยังไม่ครบ: ${missingItems.join(' · ')}`;

  const result: EpisodeCompletenessResult = {
    isComplete,
    hasRealMasterDrive,
    hasStandardTitle,
    hasFullFiveSlots,
    filledSlotCount: std.filledSlotCount,
    missingItems,
    shortLabel,
    detailText,
    isPlaceholderDrive,
  };

  completenessCache.set(ep, { sig, result });
  return result;
}

