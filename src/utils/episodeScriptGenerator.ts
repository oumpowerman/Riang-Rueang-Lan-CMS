import { Episode, EpisodeRankingSlot } from '../types/episode.types';
import { ComputedFootage, Footage } from '../types/footage.types';
import { CategoryTag } from '../types/tag.types';

/**
 * Extracts default rankTitle (ชื่อฟุต) and punchlineNote (คำสร้อย) from a Footage item.
 */
export function extractDefaultRankFields(
  footage: ComputedFootage | Footage | null | undefined
): { rankTitle: string; punchlineNote: string } {
  if (!footage) {
    return { rankTitle: '', punchlineNote: '' };
  }

  const rawTitle = (footage.title || '')
    .replace(/^FT-\d+[\s_-]*/i, '')
    .trim();
  const rawNotes = (footage.mascotNotes || '').trim();

  let rankTitle =
    typeof footage.rankTitle === 'string' && footage.rankTitle.trim()
      ? footage.rankTitle.trim()
      : rawTitle;
  let punchlineNote = '';

  if (rawNotes) {
    const rankMatch = rawNotes.match(/ชื่ออันดับ\s*:\s*([^·|\n]+)/i);
    const punchMatch = rawNotes.match(/คำสร้อย\s*:\s*([^·|\n]+)/i);

    if (
      (!footage.rankTitle || !footage.rankTitle.trim()) &&
      rankMatch &&
      rankMatch[1].trim() &&
      rankMatch[1].trim() !== '-'
    ) {
      rankTitle = rankMatch[1].trim();
    }
    if (punchMatch && punchMatch[1].trim() && punchMatch[1].trim() !== '-') {
      punchlineNote = punchMatch[1].trim();
    } else if (
      !rankMatch &&
      !punchMatch &&
      !rawNotes.startsWith('ซิงค์จากตาราง') &&
      !rawNotes.startsWith('EP:') &&
      !rawNotes.startsWith('ส่งลิงก์ผ่าน LINE OA')
    ) {
      punchlineNote = rawNotes;
    }
  }

  // Explicit footage.punchlineNote takes highest priority on the Footage item (even if intentionally cleared to '')
  if (typeof footage.punchlineNote === 'string') {
    punchlineNote = footage.punchlineNote.trim();
  }

  return {
    rankTitle: rankTitle || rawTitle,
    punchlineNote,
  };
}

/**
 * Builds synchronized Footage field updates when editing rankTitle, punchlineNote, or mascotNotes
 * so that both structured fields (footage.punchlineNote / footage.rankTitle) and footage.mascotNotes stay in harmony.
 */
export function buildFootageCatchphraseUpdate(
  footage: ComputedFootage | Footage,
  updates: {
    rankTitle?: string;
    punchlineNote?: string;
    mascotNotes?: string;
  }
): Partial<Footage> {
  const currentDefaults = extractDefaultRankFields(footage);
  const nextRankTitle =
    updates.rankTitle !== undefined
      ? updates.rankTitle
      : footage.rankTitle ?? currentDefaults.rankTitle;
  let nextPunchline =
    updates.punchlineNote !== undefined
      ? updates.punchlineNote
      : footage.punchlineNote ?? currentDefaults.punchlineNote;
  let nextMascotNotes =
    updates.mascotNotes !== undefined
      ? updates.mascotNotes
      : footage.mascotNotes || '';

  // If punchlineNote or rankTitle was updated directly, keep mascotNotes synced if it used structured format or plain catchphrase
  if (updates.punchlineNote !== undefined || updates.rankTitle !== undefined) {
    const cleanPunch = (nextPunchline || '').trim();
    const cleanRank = (nextRankTitle || '').trim();
    const hasStructuredRank = /ชื่ออันดับ\s*:/i.test(nextMascotNotes);
    const hasStructuredPunch = /คำสร้อย\s*:/i.test(nextMascotNotes);

    if (hasStructuredRank || hasStructuredPunch) {
      const parts: string[] = [];
      if (cleanRank) {
        parts.push(`ชื่ออันดับ: ${cleanRank}`);
      }
      if (cleanPunch) {
        parts.push(`คำสร้อย: ${cleanPunch}`);
      }
      nextMascotNotes = parts.join(' · ');
    } else if (
      updates.punchlineNote !== undefined &&
      (!nextMascotNotes.trim() ||
        nextMascotNotes.trim() === currentDefaults.punchlineNote)
    ) {
      nextMascotNotes = cleanPunch;
    }
  } else if (updates.mascotNotes !== undefined) {
    // User edited mascotNotes directly — sync punchlineNote if structured or plain
    const raw = updates.mascotNotes.trim();
    const punchMatch = raw.match(/คำสร้อย\s*:\s*([^·|\n]+)/i);
    const rankMatch = raw.match(/ชื่ออันดับ\s*:\s*([^·|\n]+)/i);
    if (punchMatch) {
      const val = punchMatch[1].trim();
      nextPunchline = val === '-' ? '' : val;
    } else if (
      !rankMatch &&
      !raw.startsWith('ซิงค์จากตาราง') &&
      !raw.startsWith('EP:') &&
      !raw.startsWith('ส่งลิงก์ผ่าน LINE OA')
    ) {
      nextPunchline = raw;
    }
  }

  return {
    rankTitle: nextRankTitle,
    punchlineNote: nextPunchline,
    mascotNotes: nextMascotNotes,
  };
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into 6-digit Thai Buddhist Era DDMMYY (e.g. 2026-11-04 -> "041169")
 */
export function formatThaiShortDateDDMMYY(isoDate?: string): string {
  const clean = (isoDate || '').trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String((now.getFullYear() + 543) % 100).padStart(2, '0');
    return `${dd}${mm}${yy}`;
  }

  const yearAD = parseInt(match[1], 10);
  const mm = match[2];
  const dd = match[3];
  const yy = String((yearAD + 543) % 100).padStart(2, '0');
  return `${dd}${mm}${yy}`;
}

/**
 * Builds the canonical series + episode header line, e.g. "5 อันดับ คนไทยเป็นคนตลก EP.37"
 */
export function buildEpisodeSeriesHeader(
  episode: Episode,
  tagMap: Record<string, CategoryTag>
): string {
  // Check if episode.title already contains "5 อันดับ ... EP.XX"
  const epNoFromRecord = episode.categoryEpisodeNo;
  const epMatchInTitle = (episode.title || '').match(/EP\.?\s*(\d+)/i);
  const epNo =
    epNoFromRecord ?? (epMatchInTitle ? parseInt(epMatchInTitle[1], 10) : 1);

  let categoryLabel = '';

  if (episode.seriesTitle && episode.seriesTitle.trim()) {
    categoryLabel = episode.seriesTitle
      .replace(/^5\s*อันดับ\s*/i, '')
      .replace(/#+/g, '')
      .trim();
  } else if (
    episode.categoryEpisodeScope === 'SUBCATEGORY' &&
    episode.targetSubcategoryId &&
    tagMap[episode.targetSubcategoryId]
  ) {
    categoryLabel = tagMap[episode.targetSubcategoryId].name
      .replace(/#+/g, '')
      .trim();
  } else if (tagMap[episode.mainCategoryTagId]) {
    categoryLabel = tagMap[episode.mainCategoryTagId].name
      .replace(/#+/g, '')
      .trim();
  } else {
    // Fallback extract from title before EP.
    categoryLabel = (episode.title || '')
      .replace(/^5\s*อันดับ\s*/i, '')
      .replace(/\s*EP\.?\s*\d+.*$/i, '')
      .replace(/\s*#\d+.*$/i, '')
      .replace(/\s*-\s*.*$/, '')
      .replace(/#+/g, '')
      .trim();
  }

  if (!categoryLabel) {
    categoryLabel = 'รวมช็อตฮา';
  }

  return `5 อันดับ ${categoryLabel} EP.${epNo}`;
}

/**
 * Resolves the effective rankTitle (ชื่อฟุต) and punchlineNote (คำสร้อย) for a ranking slot.
 *
 * - Default Mode (`!slot?.isCustomOverride`): REALTIME SYNC — pulls live `rankTitle` and `punchlineNote`
 *   from the master `Footage` item first, with safe fallback to `slot`'s saved values if the footage field is empty.
 * - Custom Override Mode (`slot?.isCustomOverride === true`): EPISODE LOCK — uses the custom `slot.rankTitle`
 *   and `slot.punchlineNote` locked specifically for this Episode.
 */
export function resolveSlotScriptValues(
  slot: EpisodeRankingSlot | undefined,
  footage: ComputedFootage | Footage | null | undefined
): {
  rankTitle: string;
  punchlineNote: string;
  isCustomOverride: boolean;
} {
  const defaults = extractDefaultRankFields(footage);
  const slotRankTitle = (slot?.rankTitle || '').trim();
  const slotPunchline = (slot?.punchlineNote || '').trim();
  const isCustomOverride = Boolean(slot?.isCustomOverride);

  if (isCustomOverride) {
    return {
      rankTitle:
        slot?.rankTitle !== undefined
          ? slotRankTitle || defaults.rankTitle || ''
          : defaults.rankTitle || '',
      punchlineNote:
        slot?.punchlineNote !== undefined
          ? slotPunchline
          : defaults.punchlineNote || '',
      isCustomOverride: true,
    };
  }

  // REALTIME MODE (Default for all new & existing episodes)
  const hasExplicitFootagePunchline =
    footage != null && typeof footage.punchlineNote === 'string';
  const livePunchline = hasExplicitFootagePunchline
    ? (footage.punchlineNote || '').trim()
    : defaults.punchlineNote || slotPunchline || '';

  const hasExplicitFootageRankTitle =
    footage != null &&
    typeof footage.rankTitle === 'string' &&
    footage.rankTitle.trim().length > 0;
  const liveRankTitle = hasExplicitFootageRankTitle
    ? footage.rankTitle!.trim()
    : defaults.rankTitle || slotRankTitle || '';

  return {
    rankTitle: liveRankTitle,
    punchlineNote: livePunchline,
    isCustomOverride: false,
  };
}

const RANK_DESCENDING_5_TO_1: Array<5 | 4 | 3 | 2 | 1> = [5, 4, 3, 2, 1];

/**
 * Template 1: สคริปต์สำหรับทีมตัดต่อ (Template Script.txt)
 * Ordered from Rank 5 down to Rank 1
 */
export function generateEditorTemplateScript(
  episode: Episode,
  computedFootageMap: Record<string, ComputedFootage>,
  tagMap: Record<string, CategoryTag>
): string {
  const shortDate = formatThaiShortDateDDMMYY(episode.publishDate);
  const seriesHeader = buildEpisodeSeriesHeader(episode, tagMap);

  const lines: string[] = [
    `สคริปต์ ${shortDate} `,
    seriesHeader,
    '',
    `ชื่ออันดับ = ${seriesHeader}`,
    '',
  ];

  for (const rankNum of RANK_DESCENDING_5_TO_1) {
    const slot = episode.rankings.find((r) => r.rank === rankNum);
    const ft = slot?.footageId ? computedFootageMap[slot.footageId] : null;
    const { rankTitle, punchlineNote } = resolveSlotScriptValues(slot, ft);

    lines.push(`ชื่อฟุตที่ ${rankNum} = ${rankTitle}`);
    lines.push(`คำสร้อยที่ ${rankNum} = ${punchlineNote}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Template 2: สคริปต์สำหรับเจนเสียงพากย์ (สคริปต์ 041169 .txt)
 * Ordered from Rank 5 down to Rank 1
 */
export function generateVoiceoverTemplateScript(
  episode: Episode,
  computedFootageMap: Record<string, ComputedFootage>,
  tagMap: Record<string, CategoryTag>
): string {
  const seriesHeader = buildEpisodeSeriesHeader(episode, tagMap);
  const lines: string[] = [seriesHeader];

  for (const rankNum of RANK_DESCENDING_5_TO_1) {
    const slot = episode.rankings.find((r) => r.rank === rankNum);
    const ft = slot?.footageId ? computedFootageMap[slot.footageId] : null;
    const { rankTitle, punchlineNote } = resolveSlotScriptValues(slot, ft);

    lines.push(`อันดับที่ ${rankNum} ${rankTitle}`.trim());
    if (punchlineNote) {
      lines.push(punchlineNote);
    }
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Triggers a browser download of a UTF-8 .txt file
 */
export function downloadScriptTextFile(filename: string, content: string): void {
  const blob = new Blob(['\uFEFF' + content], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
