export type TagGroupType = 'THEME' | 'PERSON' | 'ACTION' | 'GENERAL' | string;
export type CategoryTier = 1 | 2;
export type EntitySubtype = 'PERSON' | 'ANIMAL' | 'TOPIC' | 'ACTION' | 'GENERAL';

// Level 1: กลุ่มหมวดหมู่ (Cluster Group)
export interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  order?: number;
  createdAt: string;
}

// Level 2 & 3: หมวดหมู่หลัก (Tier 1) และ หมวดหมู่ย่อย/บุคคล (Tier 2)
export interface CategoryTag {
  id: string;
  name: string;
  color: string;
  groupType: TagGroupType;
  groupId?: string; // References CategoryGroup.id for Level 2
  description?: string;
  createdAt: string;
  // 2-Tier Hierarchical Taxonomy
  tier: CategoryTier; // 1 = Main Category (เช่น ดาราฮาๆ), 2 = Subcategory/Entity (เช่น พี่แจ๊ส)
  parentId?: string | null; // ID of Tier 1 Parent if tier === 2
  entityType?: EntitySubtype; // Specific entity identifier (👤 Person, 🐾 Animal, 🎯 Topic)
}

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
}
