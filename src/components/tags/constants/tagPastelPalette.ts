import { EntitySubtype, TagGroupType } from '../../../types/tag.types';

export interface PastelColorOption {
  value: string;
  label: string;
  shortLabel: string;
  swatchBg: string;
  pastelBg: string;
  pastelBorder: string;
  pastelText: string;
  badgeBg: string;
  ringColor: string;
}

export const COLOR_OPTIONS: PastelColorOption[] = [
  {
    value: 'blue',
    label: 'ฟ้าพาสเทล (Sky Pastel)',
    shortLabel: 'ฟ้า Sky',
    swatchBg: 'bg-sky-400',
    pastelBg: 'bg-sky-50/90',
    pastelBorder: 'border-sky-200',
    pastelText: 'text-sky-900',
    badgeBg: 'bg-sky-100/90 text-sky-800 border-sky-200',
    ringColor: 'ring-sky-300',
  },
  {
    value: 'emerald',
    label: 'เขียวมิ้นต์ (Mint Pastel)',
    shortLabel: 'มิ้นต์ Mint',
    swatchBg: 'bg-emerald-400',
    pastelBg: 'bg-emerald-50/90',
    pastelBorder: 'border-emerald-200',
    pastelText: 'text-emerald-900',
    badgeBg: 'bg-emerald-100/90 text-emerald-800 border-emerald-200',
    ringColor: 'ring-emerald-300',
  },
  {
    value: 'amber',
    label: 'เหลืองพีช (Butter Pastel)',
    shortLabel: 'พีช Butter',
    swatchBg: 'bg-amber-400',
    pastelBg: 'bg-amber-50/90',
    pastelBorder: 'border-amber-200',
    pastelText: 'text-amber-900',
    badgeBg: 'bg-amber-100/90 text-amber-800 border-amber-200',
    ringColor: 'ring-amber-300',
  },
  {
    value: 'purple',
    label: 'ม่วงลาเวนเดอร์ (Lavender)',
    shortLabel: 'ม่วง Lavender',
    swatchBg: 'bg-purple-400',
    pastelBg: 'bg-purple-50/90',
    pastelBorder: 'border-purple-200',
    pastelText: 'text-purple-900',
    badgeBg: 'bg-purple-100/90 text-purple-800 border-purple-200',
    ringColor: 'ring-purple-300',
  },
  {
    value: 'rose',
    label: 'ชมพูโรส (Rose Pastel)',
    shortLabel: 'ชมพู Rose',
    swatchBg: 'bg-rose-400',
    pastelBg: 'bg-rose-50/90',
    pastelBorder: 'border-rose-200',
    pastelText: 'text-rose-900',
    badgeBg: 'bg-rose-100/90 text-rose-800 border-rose-200',
    ringColor: 'ring-rose-300',
  },
  {
    value: 'cyan',
    label: 'ฟ้าอควา (Aqua Pastel)',
    shortLabel: 'อควา Aqua',
    swatchBg: 'bg-cyan-400',
    pastelBg: 'bg-cyan-50/90',
    pastelBorder: 'border-cyan-200',
    pastelText: 'text-cyan-900',
    badgeBg: 'bg-cyan-100/90 text-cyan-800 border-cyan-200',
    ringColor: 'ring-cyan-300',
  },
  {
    value: 'indigo',
    label: 'ครามพาสเทล (Periwinkle)',
    shortLabel: 'คราม Indigo',
    swatchBg: 'bg-indigo-400',
    pastelBg: 'bg-indigo-50/90',
    pastelBorder: 'border-indigo-200',
    pastelText: 'text-indigo-900',
    badgeBg: 'bg-indigo-100/90 text-indigo-800 border-indigo-200',
    ringColor: 'ring-indigo-300',
  },
  {
    value: 'slate',
    label: 'เทาซิลเวอร์ (Cloud Slate)',
    shortLabel: 'เทา Cloud',
    swatchBg: 'bg-slate-400',
    pastelBg: 'bg-slate-50/90',
    pastelBorder: 'border-slate-200',
    pastelText: 'text-slate-800',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    ringColor: 'ring-slate-300',
  },
];

export function getPastelColorConfig(colorName?: string): PastelColorOption {
  return COLOR_OPTIONS.find((c) => c.value === colorName) || COLOR_OPTIONS[0];
}

export const ENTITY_SUBTYPE_OPTIONS: {
  value: EntitySubtype;
  label: string;
  emoji: string;
  desc: string;
  pastelClass: string;
}[] = [
  {
    value: 'PERSON',
    label: 'บุคคล / ดารา / สตรีมเมอร์',
    emoji: '👤',
    desc: 'เช่น พี่แจ๊ส, เอก HRK, กรรชัย',
    pastelClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    value: 'ANIMAL',
    label: 'สัตว์เลี้ยง / สัตว์โลก',
    emoji: '🐾',
    desc: 'เช่น คอร์กี้, ปลาสวาย, แมวส้ม',
    pastelClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    value: 'TOPIC',
    label: 'หัวข้อ / เกม / ประเด็น',
    emoji: '🎯',
    desc: 'เช่น เกมผี, ตำนาน, อาหารแปลก',
    pastelClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  {
    value: 'ACTION',
    label: 'กิริยา / มุกตลก / จังหวะ',
    emoji: '⚡',
    desc: 'เช่น ตกใจสุดขีด, ขำค้าง, หักมุม',
    pastelClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    value: 'GENERAL',
    label: 'หมวดย่อยทั่วไป',
    emoji: '🏷️',
    desc: 'หัวข้อย่อยอื่นๆ ภายใต้หมวดหลัก',
    pastelClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
];

export const TAG_GROUP_OPTIONS: {
  value: TagGroupType;
  label: string;
  desc: string;
  badgeClass: string;
}[] = [
  {
    value: 'THEME',
    label: 'THEME · หมวดเนื้อหาหลัก',
    desc: 'รายการประจำช่องที่มีโครงสร้างชัดเจน',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    value: 'PERSON',
    label: 'PERSON · หมวดบุคคล/ดารา',
    desc: 'เน้นตัวบุคคล ดารา หรือสตรีมเมอร์เป็นหลัก',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    value: 'ACTION',
    label: 'ACTION · หมวดเหตุการณ์/อาการ',
    desc: 'เน้นอารมณ์ จังหวะฮา หรือแอคชั่นเด่น',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    value: 'GENERAL',
    label: 'GENERAL · หมวดทั่วไป',
    desc: 'หมวดหมู่เสริมหรือคลังรวมทั่วไป',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
];

export const STATUS_RULE_PRESETS = [
  {
    id: 'strict',
    label: 'เข้มงวด (เน้นความสดใหม่)',
    desc: 'พักขั้นต่ำ 21 วัน · พร้อมเขียว 30 วัน · เพดาน 6 ครั้ง',
    values: {
      cooldownDays: 21,
      greenReadyDays: 30,
      maxUsagePer90Days: 2,
      yellowTotalUsageCount: 3,
      maxTotalUsageCount: 6,
    },
  },
  {
    id: 'balanced',
    label: 'สมดุลแนะนำ (ค่ามาตรฐาน)',
    desc: 'พักขั้นต่ำ 14 วัน · พร้อมเขียว 21 วัน · เพดาน 8 ครั้ง',
    values: {
      cooldownDays: 14,
      greenReadyDays: 21,
      maxUsagePer90Days: 3,
      yellowTotalUsageCount: 4,
      maxTotalUsageCount: 8,
    },
  },
  {
    id: 'flexible',
    label: 'ยืดหยุ่น (หมุนฟุตไว)',
    desc: 'พักขั้นต่ำ 7 วัน · พร้อมเขียว 14 วัน · เพดาน 12 ครั้ง',
    values: {
      cooldownDays: 7,
      greenReadyDays: 14,
      maxUsagePer90Days: 4,
      yellowTotalUsageCount: 6,
      maxTotalUsageCount: 12,
    },
  },
];
