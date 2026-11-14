import { ComputedFootage } from '../types/footage.types';

export interface DuplicateMatch {
  footage: ComputedFootage;
  matchType: 'TITLE_EXACT' | 'LINK_ORIGINAL' | 'LINK_DRIVE' | 'BOTH';
  matchedField: 'title' | 'originalUrl' | 'driveFileUrl';
  message: string;
}

/**
 * Normalizes URL for consistent comparison (removes protocol difference, trailing slashes, tracking params)
 */
export function normalizeUrlForComparison(url?: string | null): string {
  if (!url) return '';
  let cleaned = url.trim().toLowerCase();
  // Strip protocol
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  // Strip www.
  cleaned = cleaned.replace(/^www\./i, '');
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Strip common social share tracking query parameters (fbclid, igshid, si, utm_*)
  try {
    const dummyUrl = new URL(`https://${cleaned}`);
    dummyUrl.searchParams.delete('fbclid');
    dummyUrl.searchParams.delete('igshid');
    dummyUrl.searchParams.delete('si');
    dummyUrl.searchParams.delete('utm_source');
    dummyUrl.searchParams.delete('utm_medium');
    dummyUrl.searchParams.delete('utm_campaign');
    return `${dummyUrl.hostname}${dummyUrl.pathname}${dummyUrl.search ? dummyUrl.search : ''}`.replace(/\/+$/, '');
  } catch {
    return cleaned;
  }
}

/**
 * Extracts Google Drive file ID if present (e.g. /file/d/12345/ or ?id=12345)
 */
export function extractDriveFileId(url?: string | null): string | null {
  if (!url) return null;
  const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];
  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];
  return null;
}

/**
 * Normalizes title for comparison (case-insensitive, trims extra whitespace)
 */
export function normalizeTitleForComparison(title?: string | null): string {
  if (!title) return '';
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks whether an incoming link or title already exists in the computedFootage list
 */
export function findDuplicateFootage(
  computedFootage: ComputedFootage[],
  params: {
    title?: string;
    originalUrl?: string;
    driveFileUrl?: string;
  }
): DuplicateMatch | null {
  if (!computedFootage || computedFootage.length === 0) return null;

  const inputTitle = normalizeTitleForComparison(params.title);
  const inputOriginalUrl = normalizeUrlForComparison(params.originalUrl);
  const inputDriveUrl = normalizeUrlForComparison(params.driveFileUrl);
  const inputDriveId = extractDriveFileId(params.driveFileUrl);

  // 1. Check for combined match (both title and link match)
  if (inputTitle && (inputOriginalUrl || inputDriveUrl || inputDriveId)) {
    const bothMatch = computedFootage.find((f) => {
      const fTitle = normalizeTitleForComparison(f.title);
      if (fTitle !== inputTitle) return false;

      const fOrig = normalizeUrlForComparison(f.originalUrl);
      const fDrive = normalizeUrlForComparison(f.driveFileUrl);
      const fDriveId = extractDriveFileId(f.driveFileUrl);

      const origMatch = inputOriginalUrl && fOrig && fOrig === inputOriginalUrl;
      const driveMatch =
        (inputDriveId && fDriveId && inputDriveId === fDriveId) ||
        (inputDriveUrl && fDrive && fDrive === inputDriveUrl);

      return origMatch || driveMatch;
    });

    if (bothMatch) {
      return {
        footage: bothMatch,
        matchType: 'BOTH',
        matchedField: 'title',
        message: `พบฟุตเทจที่มีทั้งชื่อและลิงก์ตรงกัน: ${bothMatch.id} (${bothMatch.title})`,
      };
    }
  }

  // 2. Check for link duplicate (originalUrl or driveFileUrl)
  if (inputOriginalUrl || inputDriveUrl || inputDriveId) {
    const linkMatch = computedFootage.find((f) => {
      const fOrig = normalizeUrlForComparison(f.originalUrl);
      const fDrive = normalizeUrlForComparison(f.driveFileUrl);
      const fDriveId = extractDriveFileId(f.driveFileUrl);

      if (inputOriginalUrl && fOrig && fOrig === inputOriginalUrl) {
        return true;
      }
      if (inputDriveId && fDriveId && inputDriveId === fDriveId) {
        return true;
      }
      if (inputDriveUrl && fDrive && fDrive === inputDriveUrl) {
        return true;
      }
      return false;
    });

    if (linkMatch) {
      const isDriveMatch =
        (inputDriveId && extractDriveFileId(linkMatch.driveFileUrl) === inputDriveId) ||
        (inputDriveUrl && normalizeUrlForComparison(linkMatch.driveFileUrl) === inputDriveUrl);

      return {
        footage: linkMatch,
        matchType: isDriveMatch ? 'LINK_DRIVE' : 'LINK_ORIGINAL',
        matchedField: isDriveMatch ? 'driveFileUrl' : 'originalUrl',
        message: `พบคลิปที่มีลิงก์${isDriveMatch ? ' Google Drive' : 'ต้นฉบับ'}นี้ในคลังแล้ว: ${linkMatch.id} (${linkMatch.title})`,
      };
    }
  }

  // 3. Check for exact title duplicate
  if (inputTitle && inputTitle.length >= 2) {
    const titleMatch = computedFootage.find((f) => {
      const fTitle = normalizeTitleForComparison(f.title);
      return fTitle === inputTitle;
    });

    if (titleMatch) {
      return {
        footage: titleMatch,
        matchType: 'TITLE_EXACT',
        matchedField: 'title',
        message: `พบคลิปที่มีชื่อตรงกันในคลังแล้ว: ${titleMatch.id} (${titleMatch.title})`,
      };
    }
  }

  return null;
}
