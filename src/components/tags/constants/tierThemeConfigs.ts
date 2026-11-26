import { CategoryTier, EntitySubtype } from '../../../types/tag.types';

export interface TierThemeConfig {
  tier: CategoryTier;
  badgeText: string;
  title: string;
  subtitle: string;
  headerBg: string;
  headerBorder: string;
  badgeBg: string;
  badgeTextCls: string;
  accentText: string;
  accentBtnBg: string;
  accentBtnHover: string;
  subHeaderBg: string;
  subHeaderBorder: string;
  defaultColor: string;
  defaultEntity: EntitySubtype;
  examplesPlaceholder: string;
}

export const TIER_THEME_CONFIGS: Record<CategoryTier, TierThemeConfig> = {
  1: {
    tier: 1,
    badgeText: 'TIER 1',
    title: 'มิติปลายทาง / หมวดกว้าง',
    subtitle: 'บอกว่าคลิปนี้อยู่วงการไหน เช่น #คนมีชื่อเสียง #วิถีชาวบ้าน #สัตว์โลก #อาชีพ',
    headerBg: 'bg-[#EEF5FB]',
    headerBorder: 'border-[#C5DCEF]',
    badgeBg: 'bg-[#2C5378]',
    badgeTextCls: 'text-white',
    accentText: 'text-[#184366]',
    accentBtnBg: 'bg-[#2C5378]',
    accentBtnHover: 'hover:bg-[#1E3D59]',
    subHeaderBg: 'bg-[#F4F9FD]',
    subHeaderBorder: 'border-[#D5E6F5]',
    defaultColor: 'blue',
    defaultEntity: 'TOPIC',
    examplesPlaceholder: 'เช่น คนมีชื่อเสียง, วิถีชาวบ้าน, สัตว์โลก, อาชีพ...',
  },
  2: {
    tier: 2,
    badgeText: 'TIER 2',
    title: 'บริบท / สไตล์คลิป',
    subtitle: 'เกิดเหตุการณ์อะไรขึ้น หรือคลิปเป็นทรงไหน เช่น #พูดผิด #ช็อตฟีล #ไลฟ์สด #สัมภาษณ์ข่าว',
    headerBg: 'bg-[#FEF6E8]',
    headerBorder: 'border-[#E8CFA6]',
    badgeBg: 'bg-[#8A5A22]',
    badgeTextCls: 'text-white',
    accentText: 'text-[#6B4415]',
    accentBtnBg: 'bg-[#8A5A22]',
    accentBtnHover: 'hover:bg-[#6E4518]',
    subHeaderBg: 'bg-[#FFFDF9]',
    subHeaderBorder: 'border-[#EFE0C6]',
    defaultColor: 'amber',
    defaultEntity: 'ACTION',
    examplesPlaceholder: 'เช่น พูดผิด, ช็อตฟีล, ไลฟ์สด, สัมภาษณ์ข่าว, กล้องวงจรปิด...',
  },
  3: {
    tier: 3,
    badgeText: 'TIER 3',
    title: 'บุคคลเจาะจง / รายการ',
    subtitle: 'ระบุว่าใคร หรือรายการอะไร เช่น #พี่แจ๊ส #พี่เสก #เซียนหรั่ง #โหนกระแส',
    headerBg: 'bg-[#EDF6F0]',
    headerBorder: 'border-[#BFE0C8]',
    badgeBg: 'bg-[#2D623C]',
    badgeTextCls: 'text-white',
    accentText: 'text-[#1D4D2B]',
    accentBtnBg: 'bg-[#2D623C]',
    accentBtnHover: 'hover:bg-[#214B2D]',
    subHeaderBg: 'bg-[#F6FBF7]',
    subHeaderBorder: 'border-[#CEE8D5]',
    defaultColor: 'emerald',
    defaultEntity: 'PERSON',
    examplesPlaceholder: 'เช่น พี่แจ๊ส, พี่เสก, เซียนหรั่ง, โหนกระแส...',
  },
};
