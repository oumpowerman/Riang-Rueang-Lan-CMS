import { ComputedFootage, Footage } from '../../../types/footage.types';

export type FootagePunchlineFilter = 'ALL' | 'MISSING' | 'HAS_PUNCHLINE';

export interface VaultPunchlineCounts {
  all: number;
  missing: number;
  hasPunchline: number;
}

/**
 * Matches all system auto-generated import/staging placeholder notes across the app
 * (Google Drive batch import, manual paste, LINE OA, Direct quick-save, Drive 1:N, Sheet sync).
 * Used strictly by the Footage Library filter & counter without mutating or hiding original notes.
 */
const AUTO_IMPORT_PLACEHOLDER_PATTERNS: RegExp[] = [
  /^พักรอจัดหมวดหมู่/i,
  /^นำเข้าจากโฟลเดอร์/i,
  /^นำเข้าแบบข้อความ/i,
  /^ส่งลิงก์ผ่าน\s*LINE\s*OA/i,
  /^บันทึกด่วนจาก\s+/i,
  /^หั่นจากโฟลเดอร์/i,
  /^ช็อตจากโฟลเดอร์ย่อย/i,
  /^ซิงค์จากตาราง/i,
  /^EP\s*:/i,
];

export function isAutoImportPlaceholderNote(rawText: string): boolean {
  const trimmed = (rawText || '').trim();
  if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed === 'ไม่มี') {
    return true;
  }
  return AUTO_IMPORT_PLACEHOLDER_PATTERNS.some((pattern) =>
    pattern.test(trimmed)
  );
}

/**
 * Determines whether a Footage item in the Footage Library has a genuine human-written
 * punchline (คำสร้อย). Empty strings, dashes, and all system auto-import placeholder notes
 * (such as `พักรอจัดหมวดหมู่ (จากโฟลเดอร์ "...")`) return `false`.
 */
export function hasRealVaultPunchline(
  footage: ComputedFootage | Footage | null | undefined
): boolean {
  if (!footage) return false;

  // 1. Explicit punchlineNote field takes priority when present
  if (typeof footage.punchlineNote === 'string') {
    const cleanPunch = footage.punchlineNote.trim();
    if (!cleanPunch) return false;
    return !isAutoImportPlaceholderNote(cleanPunch);
  }

  // 2. Fallback inspection of legacy/combined mascotNotes
  const rawNotes = (footage.mascotNotes || '').trim();
  if (!rawNotes) return false;

  const punchMatch = rawNotes.match(/คำสร้อย\s*:\s*([^·|\n]+)/i);
  if (punchMatch) {
    const extracted = punchMatch[1].trim();
    return !isAutoImportPlaceholderNote(extracted);
  }

  const rankMatch = rawNotes.match(/ชื่ออันดับ\s*:\s*([^·|\n]+)/i);
  if (rankMatch) {
    // Has structured rankTitle only, no คำสร้อย segment
    return false;
  }

  if (isAutoImportPlaceholderNote(rawNotes)) {
    return false;
  }

  return true;
}

export function computeVaultPunchlineCounts(
  items: ComputedFootage[]
): VaultPunchlineCounts {
  let hasPunchline = 0;
  let missing = 0;
  for (let i = 0; i < items.length; i++) {
    if (hasRealVaultPunchline(items[i])) {
      hasPunchline += 1;
    } else {
      missing += 1;
    }
  }
  return {
    all: items.length,
    missing,
    hasPunchline,
  };
}
