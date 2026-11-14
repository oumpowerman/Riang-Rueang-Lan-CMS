export type PublishSlot = 'MORNING_0600' | 'EVENING_1800';

export type EpisodeWorkflowStage =
  | '1_MIXING'
  | '2_MASCOT_SCRIPTING'
  | '3_VIDEO_EDITING'
  | '4_PUBLISHED';

export interface EpisodeRankingSlot {
  rank: 5 | 4 | 3 | 2 | 1;
  footageId: string | null;
  rankTitle?: string; // Col C: ชื่ออันดับในคลิป (เช่น "จอมยุทธ์เสก", "อยากเก่งแบบพี่เสก")
  punchlineNote?: string; // Col D: คำสร้อย/มุกตลกประจำอันดับ (เช่น "ไทยแท้แน่นอน", "คิดดีไม่ได้เลย")
  isCustomOverride?: boolean; // true = ล็อกคำสร้อย/ชื่อฟุตเฉพาะ EP นี้, false/undefined = ดึงแบบ Realtime จากตัวฟุตเทจหลัก
  mascotScript: string; // บทพูดมาสคอตของอันดับนั้น
  snapshotNote?: string; // บันทึกสถานะฟุตตอนนำมาผสม หรือสรุปชื่ออันดับ/คำสร้อย
}

export interface MasterVideoInfo {
  masterFileName: string; // e.g., EP-0012_2026-10-28_MORNING_5อันดับคนไทยเป็นคนตลก.mp4
  masterDriveUrl: string; // ลิงก์ไฟล์วิดีโอตัวเต็มใน Google Drive (ที่รวม 5 ฟุต + มาสคอตเรียบร้อยแล้ว)
  youtubeUrl: string;
  facebookUrl: string;
  tiktokUrl?: string;
  instagramUrl?: string;
  viewsCount: number;
  performanceNote: string;
  [key: string]: any;
}

export type EpisodeProductionTarget = 'MAIN_CATEGORY_VARIETY' | 'SINGLE_SUBCATEGORY_SPECIAL';

export interface Episode {
  id: string; // e.g., EP-0001
  title: string; // e.g., "5 อันดับคนไทยเป็นคนตลก #12"
  categoryEpisodeNo?: number; // ลำดับตอนเฉพาะหมวดหมู่นี้ เช่น 1, 2, 3...
  categoryEpisodeScope?: 'MAIN_CATEGORY' | 'SUBCATEGORY'; // ระดับการรันเลขตอน (หมวดหลัก Tier 1 หรือ หมวดย่อย Tier 2)
  seriesId?: string; // Tag ID ของซีรีส์ที่ใช้อ้างอิง (อาจเป็น mainCategoryTagId หรือ targetSubcategoryId)
  seriesTitle?: string; // e.g., "5 อันดับ คนไทยเป็นคนตลก"
  categoryGroupId?: string; // Primary Category Group ID (Tier 0, e.g., GRP-PERSON)
  mainCategoryTagId: string; // Primary Tag ID (Tier 1)
  productionTarget?: EpisodeProductionTarget; // 'MAIN_CATEGORY_VARIETY' (รวมหลายดารา) or 'SINGLE_SUBCATEGORY_SPECIAL' (เจาะจงดาราคนเดียว)
  targetSubcategoryId?: string | null; // Tier 2 subcategory ID if SINGLE_SUBCATEGORY_SPECIAL
  publishDate: string; // YYYY-MM-DD
  publishSlot: PublishSlot;
  workflowStage: EpisodeWorkflowStage;
  introMascotScript: string;
  outroMascotScript: string;
  rankings: EpisodeRankingSlot[]; // Ordered [Rank 5, Rank 4, Rank 3, Rank 2, Rank 1]
  masterVideoInfo: MasterVideoInfo;
  createdAt: string;
}
