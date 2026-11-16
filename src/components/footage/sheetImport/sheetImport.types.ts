import { Episode, PublishSlot } from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag, CategoryTier } from '../../../types/tag.types';

export type RankingOrderDirection = 'RANK_5_TO_1' | 'RANK_1_TO_5';

export type TableRowDensity = 'COMPACT' | 'NORMAL';

export type SheetDetectedColumnFormat =
  | 'MASTER_10_COL'
  | 'LEGACY_4_COL'
  | 'TAG_ONLY_2_COL';

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

export interface SheetColumnSyncConfig {
  syncColB_EpTitle: boolean; // Col B: ชื่อคลิปหลัก EP (ถ้าปิด = คงชื่อคลิปหลักและคำสร้อยชื่อคลิปเดิมในระบบไว้)
  syncColC_RankTitle: boolean; // Col C: ชื่ออันดับ (แต่ละสล็อต 5-1 + โน้ตฟุตเทจ)
  syncColD_Punchline: boolean; // Col D: คำสร้อยประจำอันดับ (แต่ละสล็อต 5-1 + โน้ตฟุตเทจ)
  syncColE_Tier1Tags: boolean; // Col E: แท็ก Tier 1 (วงการ)
  syncColF_Tier2Tags: boolean; // Col F: แท็ก Tier 2 (บริบท)
  syncColG_Tier3Tags: boolean; // Col G: แท็ก Tier 3 (ชื่อบุคคล/รายการ)
  syncColH_Url: boolean; // Col H: ลิงก์ YouTube Shorts
  syncColIJ_DateAndTime: boolean; // Col I-J: วันที่และเวลาเผยแพร่
}

export const DEFAULT_SHEET_COLUMN_SYNC_CONFIG: SheetColumnSyncConfig = {
  syncColB_EpTitle: true,
  syncColC_RankTitle: true,
  syncColD_Punchline: true,
  syncColE_Tier1Tags: true,
  syncColF_Tier2Tags: true,
  syncColG_Tier3Tags: true,
  syncColH_Url: true,
  syncColIJ_DateAndTime: true,
};

export interface TagTierAssignment {
  name: string;
  tier: CategoryTier; // 1 | 2 | 3
  isNew: boolean;
  existingTag?: CategoryTag;
}

export interface ParsedSheetRow {
  rowIndex: number;
  rawLine: string;
  detectedFormat: SheetDetectedColumnFormat;
  title: string; // Col A: ชื่อฟุตเทจย่อย (footageTitle)
  rawEpisodeColB: string; // Col B: ชื่อคลิปเต็มพร้อมแฮชแท็ก (เช่น 5 อันดับพี่เสกสุดฮา EP.1 #ตลก #funny)
  episodeTitle: string; // ชื่อคลิปหลักหลังตัด #แฮชแท็ก (เช่น 5 อันดับพี่เสกสุดฮา EP.1)
  episodeHashtags: string[]; // แฮชแท็กท้ายชื่อคลิปหลักใน Col B (เช่น ['ตลก', 'funny', 'memes'])
  rankTitle: string; // Col C: ชื่ออันดับ (เช่น จอมยุทธ์เสก, อยากเก่งแบบพี่เสก)
  punchlineNote: string; // Col D: คำสร้อย (เช่น ไทยแท้แน่นอน, คิดดีไม่ได้เลย)
  tier1TagNames: string[]; // Col E: แท็ก Tier 1
  tier2TagNames: string[]; // Col F: แท็ก Tier 2
  tier3TagNames: string[]; // Col G: แท็ก Tier 3
  resolvedTags: TagTierAssignment[]; // แท็กทั้งหมดของแถวนี้พร้อมระบุ Tier 1 / 2 / 3
  tagNames: string[]; // รวมชื่อแท็กทุก Tier ที่จะผูกกับฟุตเทจ
  episodeUrl: string; // Col H: ลิงก์คลิปหลัก (YouTube Shorts / ฯลฯ)
  publishDate: string; // Col I: วันที่เผยแพร่ (YYYY-MM-DD หรือว่าง)
  publishTime: string; // Col J: เวลาเผยแพร่ (HH:mm หรือว่าง)
  publishSlot: PublishSlot; // รอบเวลาเผยแพร่ (MORNING_0600 หรือ EVENING_1800)
  matchedFootage: ComputedFootage | null;
  matchSimilarityPercent: number; // 100 = ตรงเป๊ะ, 82..99 = ใกล้เคียง (Fuzzy), 0 = ไม่พบ
  isFuzzyMatched: boolean;
  isInStaging: boolean;
  occurrenceCountInSheet: number;
  existingTags: CategoryTag[];
  tagsToCreate: string[];
  finalTagNames: string[];
}

export type EpisodeMatchMethod =
  | 'EXACT_TITLE'
  | 'YOUTUBE_URL'
  | 'FOOTAGE_OVERLAP'
  | 'FUZZY_TITLE'
  | 'NONE';

export interface ParsedEpisodeGroup {
  groupKey: string;
  episodeTitle: string; // เช่น "5 อันดับพี่เสกสุดฮา EP.1"
  rawFullTitleWithTags: string; // เช่น "5 อันดับพี่เสกสุดฮา EP.1 #ตลก #funny #memes"
  episodeHashtags: string[];
  seriesBaseName: string; // เช่น "พี่เสกสุดฮา"
  episodeNo: number; // เช่น 1
  youtubeUrl: string; // ลิงก์จาก Col H
  publishDate: string; // วันที่เผยแพร่จริงจาก Col I (หรือปรับแก้ในตารางพรีวิว)
  publishTime: string; // เวลาจาก Col J (เช่น "06:00" หรือ "18:00")
  publishSlot: PublishSlot; // รอบเช้า/เย็น
  hasExplicitDateInSheet: boolean; // มีการระบุวันที่มาในชีทหรือแก้ไขด้วยตนเองหรือไม่
  rows: ParsedSheetRow[];
  existingEpisode: Episode | null;
  epMatchSimilarityPercent: number; // 100 = ตรงเป๊ะ/ลิงก์ตรง, 80..99 = ชื่อใกล้เคียง/ชุดฟุตเทจตรง, 0 = สร้างใหม่
  epMatchMethod: EpisodeMatchMethod;
  primaryTagName: string;
  isCompleteFiveRanks: boolean;
  missingFootageCount: number;
  hasDuplicateClipsInGroup: boolean;
  rankingsPreview: Array<{
    rank: 5 | 4 | 3 | 2 | 1;
    row: ParsedSheetRow | null;
  }>;
}

export interface SheetSyncSummaryStats {
  totalRows: number;
  detectedFormat: SheetDetectedColumnFormat;
  matchedCount: number;
  stagingMatchedCount: number;
  unmatchedCount: number;
  duplicateRowsInSheetCount: number;
  newTagsCount: number;
  newTier1TagsCount: number;
  newTier2TagsCount: number;
  newTier3TagsCount: number;
  newTagNames: string[];
  episodeGroupsCount: number;
  completeEpisodesCount: number;
  incompleteEpisodesCount: number;
  newEpisodesCount: number;
  existingEpisodesToUpdateCount: number;
  episodesWithExplicitDateCount: number;
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
  createdTier1TagsCount: number;
  createdTier2TagsCount: number;
  createdTier3TagsCount: number;
  createdTagNames: string[];
  createdEpisodesCount: number;
  updatedEpisodesCount: number;
  skippedEpisodesCount: number;
  syncedDatesEpisodeCount: number;
  alignedFootageCreatedAtCount: number;
  syncedEpisodeTitles: string[];
}
