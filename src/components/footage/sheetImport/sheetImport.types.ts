import { Episode } from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag } from '../../../types/tag.types';

export type RankingOrderDirection = 'RANK_5_TO_1' | 'RANK_1_TO_5';

export type TableRowDensity = 'COMPACT' | 'NORMAL';

export type FootageRowFilterMode =
  | 'ALL'
  | 'MATCHED_ONLY'
  | 'STAGING_ONLY'
  | 'UNMATCHED_ONLY'
  | 'DUPLICATE_ONLY';

export type EpisodeGroupFilterMode =
  | 'ALL'
  | 'ISSUES_ONLY'
  | 'COMPLETE_ONLY'
  | 'NEW_EP_ONLY'
  | 'UPDATE_EP_ONLY';

export interface ParsedSheetRow {
  rowIndex: number;
  rawLine: string;
  title: string; // Column A: ชื่อฟุตเทจย่อย
  tagNames: string[]; // Column B: แท็ก (#พี่เสก #คนดัง ...)
  episodeUrl: string; // Column C: ลิงก์คลิปหลัก (YouTube Shorts / ฯลฯ)
  episodeTitle: string; // Column D: ชื่อคลิปหลักหลังจัดอันดับ (เช่น พี่เสกสุดฮา EP.1)
  matchedFootage: ComputedFootage | null;
  isInStaging: boolean; // ฟุตเทจนี้กำลังอยู่ในพื้นที่พัก (ไม่มีหมวดหมู่) หรือไม่
  occurrenceCountInSheet: number; // จำนวนครั้งที่ชื่อฟุตเทจนี้ปรากฏในชีท (กรณีฟุตซ้ำข้าม EP)
  existingTags: CategoryTag[];
  tagsToCreate: string[];
  finalTagNames: string[];
}

export interface ParsedEpisodeGroup {
  groupKey: string;
  episodeTitle: string; // เช่น "พี่เสกสุดฮา EP.1"
  seriesBaseName: string; // เช่น "พี่เสกสุดฮา"
  episodeNo: number; // เช่น 1
  youtubeUrl: string; // ลิงก์จาก Column C
  rows: ParsedSheetRow[];
  existingEpisode: Episode | null; // หากพบ EP ชื่อซ้ำหรือลิงก์ซ้ำในคลังคลิปหลัก
  primaryTagName: string; // แท็กหลักของซีรีส์ที่จะผูกกับ EP
  isCompleteFiveRanks: boolean; // มีฟุตเทจครบ 5 แถวพอดีหรือไม่
  missingFootageCount: number; // จำนวนแถวในกลุ่มนี้ที่ไม่พบฟุตเทจในคลัง
  hasDuplicateClipsInGroup: boolean; // มีฟุตเทจชื่อซ้ำกันเองภายใน EP เดียวกันหรือไม่
  rankingsPreview: Array<{
    rank: 5 | 4 | 3 | 2 | 1;
    row: ParsedSheetRow | null;
  }>;
}

export interface SheetSyncSummaryStats {
  totalRows: number;
  matchedCount: number;
  stagingMatchedCount: number;
  unmatchedCount: number;
  duplicateRowsInSheetCount: number;
  newTagsCount: number;
  newTagNames: string[];
  episodeGroupsCount: number;
  completeEpisodesCount: number;
  incompleteEpisodesCount: number;
  newEpisodesCount: number;
  existingEpisodesToUpdateCount: number;
}

export interface SyncProgressState {
  phaseIndex: 1 | 2 | 3 | 4;
  phaseLabel: string;
  completedItems: number;
  totalItems: number;
  percent: number;
}

export interface SheetSyncSuccessReport {
  updatedClipsCount: number;
  createdClipsCount: number;
  movedFromStagingCount: number;
  skippedRowsCount: number;
  createdTagsCount: number;
  createdTagNames: string[];
  createdEpisodesCount: number;
  updatedEpisodesCount: number;
  skippedEpisodesCount: number;
  syncedEpisodeTitles: string[];
}
