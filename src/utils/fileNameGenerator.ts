import { PublishSlot } from '../types/episode.types';

/**
 * Utility for generating standardized Google Drive filenames for both individual Footages
 * and Master 5-Ranking Episodes.
 */

export function generateStandardFileName(footageId: string, title: string): string {
  const sanitizedTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 48);

  return `${footageId}_${sanitizedTitle || 'คลิปฟุตเทจ'}.mp4`;
}

export function generateMasterEpisodeFileName(
  episodeId: string,
  publishDate: string,
  publishSlot: PublishSlot,
  title: string
): string {
  const slotTag = publishSlot === 'MORNING_0600' ? 'MORNING' : 'EVENING';
  const sanitizedTitle = title
    .trim()
    .replace(/[\\/:*?"<>|#]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 38);

  return `${episodeId}_${publishDate}_${slotTag}_${sanitizedTitle || '5อันดับเรียงเรื่องลั่น'}.mp4`;
}

export function generateNextId(
  prefix: 'FT' | 'SRC' | 'EP' | 'TAG' | 'GRP',
  existingIds: string[]
): string {
  let maxNumber = 0;
  const regex = new RegExp(`^${prefix}-(\\d+)$`);

  for (const id of existingIds) {
    const match = id.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const nextNum = maxNumber + 1;
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

export function formatThaiDate(dateStr: string | null): string {
  if (!dateStr) return 'ยังไม่เคยใช้งาน';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const buddhistYear = (year + 543).toString().slice(-2);
    return `${day} ${months[month - 1]} ${buddhistYear}`;
  } catch {
    return dateStr;
  }
}

export function hasRealDriveLink(driveFileUrl?: string | null): boolean {
  if (!driveFileUrl) return false;
  const trimmed = driveFileUrl.trim();
  if (trimmed === '') return false;
  return true;
}

