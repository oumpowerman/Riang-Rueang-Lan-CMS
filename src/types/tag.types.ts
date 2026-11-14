import { SavedDriveFolderPreset } from './driveSync.types';

export type TagGroupType = 'THEME' | 'PERSON' | 'ACTION' | 'GENERAL' | string;
export type CategoryTier = 1 | 2 | 3;
export type EntitySubtype = 'PERSON' | 'ANIMAL' | 'TOPIC' | 'ACTION' | 'GENERAL';

export interface TierSubCategoriesConfig {
  tier1: string[];
  tier2: string[];
  tier3: string[];
}

export const DEFAULT_UNCLASSIFIED_SUBCATEGORY = 'รอคัดแยก';

export const DEFAULT_TIER_SUBCATEGORIES: TierSubCategoriesConfig = {
  tier1: [DEFAULT_UNCLASSIFIED_SUBCATEGORY, 'วงการ/หมวดหลัก'],
  tier2: [
    'กลุ่ม A: สถานการณ์ / อาการ',
    'กลุ่ม B: เหตุการณ์ / เทศกาล',
    'กลุ่ม C: วิธีการนำเสนอ',
    'กลุ่ม D: ความขลัง',
  ],
  tier3: ['สายตลก/ดารา', 'สายอินฟลู/ไวรัล', 'ชื่อรายการ/ผลงาน'],
};

// Level 1: กลุ่มหมวดหมู่ (Cluster Group - Legacy compatibility)
export interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  order?: number;
  createdAt: string;
}

// ระบบ Tag 3 ชั้นอิสระ (3-Tier Independent Faceted Taxonomy)
// Tier 1 = มิติปลายทาง / หมวดกว้าง (เช่น #คนมีชื่อเสียง, #วิถีชาวบ้าน, #สัตว์โลก, #อาชีพ)
// Tier 2 = บริบท / สไตล์คลิป (เช่น #พูดผิด, #ช็อตฟีล, #ไลฟ์สด, #สัมภาษณ์ข่าว)
// Tier 3 = บุคคลเจาะจง / รายการ (เช่น #พี่แจ๊ส, #พี่เสก, #เซียนหรั่ง, #โหนกระแส)
export interface CategoryTag {
  id: string;
  name: string;
  color: string;
  groupType: TagGroupType;
  groupId?: string;
  description?: string;
  createdAt: string;
  tier: CategoryTier; // 1 | 2 | 3
  subCategory?: string; // หมวดหมู่ย่อยภายใน Tier นั้นๆ เช่น 'รอคัดแยก', 'สถานการณ์', 'วิธีการนำเสนอ'
  parentId?: string | null; // Deprecated in 3-tier independent system (always null for independent tags)
  entityType?: EntitySubtype;
}

export interface ArchiveSeriesCategory {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_ARCHIVE_SERIES_CATEGORIES: ArchiveSeriesCategory[] = [
  {
    id: 'ARC-CAT-CELEB',
    name: 'คนดัง / สตรีมเมอร์ / รายการ',
    color: 'blue',
  },
  {
    id: 'ARC-CAT-LOCAL',
    name: 'คนไทยสายฮา / วิถีชาวบ้าน',
    color: 'emerald',
  },
  {
    id: 'ARC-CAT-CHAOS',
    name: 'สายเมา / หลุดโลก / ตำนานฮา',
    color: 'amber',
  },
  {
    id: 'ARC-CAT-ROLE',
    name: 'อาชีพ / เหตุการณ์ / ข่าวดัง',
    color: 'purple',
  },
  {
    id: 'ARC-CAT-OTHER',
    name: 'สัตว์โลก / ทั่วไป / อื่นๆ',
    color: 'rose',
  },
];

export interface SystemSettings {
  // 🔴 เกณฑ์สีแดง (RECENT_COOLDOWN — ห้ามใช้ซ้ำ)
  cooldownDays: number; // วันพักขั้นต่ำหลังใช้งานล่าสุด (Default: 14 วัน — ถ้าน้อยกว่านี้ = 🔴 สีแดง)
  maxTotalUsageCount: number; // เพดานจำนวนครั้งที่ใช้ซ้ำสะสมสูงสุด (Default: 8 ครั้ง — ถ้าถึงหรือเกิน = 🔴 สีแดง)

  // 🟢 เกณฑ์สีเขียว & 🟡 เกณฑ์สีเหลือง (READY_FRESH vs HIGH_VELOCITY_WARNING)
  greenReadyDays: number; // วันพักขั้นต่ำที่ถือว่าสดพร้อมเป็น 🟢 สีเขียว (Default: 21 วัน — ถ้าพักพ้นสีแดงแต่ยังไม่ถึงเกณฑ์นี้ = 🟡 สีเหลือง)
  maxUsagePer90Days: number; // จำนวนครั้งที่ใช้ในรอบ 90 วันที่เริ่มเตือนเป็น 🟡 สีเหลือง (Default: 3 ครั้ง)
  yellowTotalUsageCount: number; // จำนวนครั้งใช้ซ้ำสะสมที่เริ่มเตือนเป็น 🟡 สีเหลือง (Default: 4 ครั้ง)
  minAvgDaysBetweenUses: number; // ระยะห่างเฉลี่ยต่อการใช้ 1 ครั้ง (Default: 25 วัน)

  channelName: string;
  defaultMascotName: string;
  driveRootFolderUrl: string;
  driveApiKey?: string;
  savedDriveFolders?: SavedDriveFolderPreset[];
  tierSubCategories?: TierSubCategoriesConfig;
  archiveSeriesCategories?: ArchiveSeriesCategory[];
  seriesToArchiveCategoryMap?: Record<string, string>;
  seriesToTagIdsMap?: Record<string, string[]>;
}

