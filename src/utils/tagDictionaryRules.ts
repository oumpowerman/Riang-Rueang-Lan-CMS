import {
  CategoryTag,
  CategoryTier,
  EntitySubtype,
  TierSubCategoriesConfig,
} from '../types/tag.types';
import {
  DictionaryTagSpec,
  TIER1_DICTIONARY_TAGS,
  TIER2_DICTIONARY_TAGS,
  TIER3_DICTIONARY_TAGS,
} from './tagDictionaryData';

export type { DictionaryTagSpec };

export interface DictionaryUseCase {
  id: string;
  title: string;
  tier1: string[];
  tier2: string[];
  tier3: string[];
  rankingNote: string;
}

export const DATA_DICTIONARY_SUBCATEGORIES: TierSubCategoriesConfig = {
  tier1: ['รอคัดแยก', 'วงการ/หมวดหลัก'],
  tier2: [
    'กลุ่ม A: สถานการณ์ / อาการ',
    'กลุ่ม B: เหตุการณ์ / เทศกาล',
    'กลุ่ม C: วิธีการนำเสนอ',
    'กลุ่ม D: ความขลัง',
  ],
  tier3: ['สายตลก/ดารา', 'สายอินฟลู/ไวรัล', 'ชื่อรายการ/ผลงาน'],
};

export const TAGGING_GOLDEN_RULES: Array<{
  ruleNo: number;
  title: string;
  description: string;
}> = [
  {
    ruleNo: 1,
    title: 'อิสระจากกัน (ห้ามคิดแบบโฟลเดอร์)',
    description:
      'Tag คือส่วนผสม 1 ฟุตเทจสามารถมี Tag จาก Tier 1, Tier 2 และ Tier 3 ผสมรวมกันได้อย่างอิสระ ไม่ยึดติดอยู่แค่หมวดเดียว',
  },
  {
    ruleNo: 2,
    title: 'ห้ามมีคำว่า "ฮา", "ฮาๆ" หรือ "สุดฮา"',
    description:
      'ช่องของเราคือช่องตลกอยู่แล้ว ทุกฟุตเทจคือความฮา ระบบจะตัดคำว่า ฮา / ฮาๆ / สุดฮา ออกจากชื่อแท็กให้อัตโนมัติ (เช่น #ดาราฮาๆ ➔ #ดารา ➔ ยุบรวมเข้า #คนมีชื่อเสียง)',
  },
  {
    ruleNo: 3,
    title: 'อย่าสร้าง Tag ขยะ',
    description:
      'หากฟุตเทจไหนไม่มีจุดเด่นที่ตรงกับ Data Dictionary ให้เว้นว่างไว้ใน Tier นั้นๆ ห้ามตั้งคำเฉพาะกิจหรือนำชื่อคลิปมาเป็นแท็ก',
  },
  {
    ruleNo: 4,
    title: 'ฟุตเทจ 1 คลิป = หลายบริบทได้',
    description:
      'เช่น คลิปสัมภาษณ์นักเรียนตอนน้ำท่วมแล้วพูดผิดช็อตฟีล สามารถติด Tier 2 เป็น #สัมภาษณ์ข่าว #น้ำท่วม #พูดผิด #ช็อตฟีล ร่วมกันได้เลย',
  },
  {
    ruleNo: 5,
    title: 'ถ้าไม่แน่ใจให้ยึด Data Dictionary เป็นหลัก',
    description:
      'ตรวจสอบความหมายของแต่ละป้ายในตาราง Data Dictionary หรือสอบถามหัวหน้าทีมก่อนสร้างป้ายใหม่นอกเหนือข้อตกลง',
  },
];

export const DATA_DICTIONARY_USE_CASES: DictionaryUseCase[] = [
  {
    id: 'case-1',
    title: 'เคสที่ 1: ลุงทำเสียงเป็ดเบิ้มๆ ให้นักข่าวฟัง',
    tier1: ['#วิถีชาวบ้าน'],
    tier2: ['#สัมภาษณ์ข่าว', '#พูดผิด'],
    tier3: [],
    rankingNote:
      'ดึงไปใช้ได้ทั้งหัวข้อ "5 อันดับสัมภาษณ์ข่าวสุดฮา" หรือ "5 อันดับชาวบ้านพูดผิด"',
  },
  {
    id: 'case-2',
    title: 'เคสที่ 2: พี่แจ๊สไปออกรายการโหนกระแสแล้วช็อตฟีล',
    tier1: ['#คนมีชื่อเสียง'],
    tier2: ['#ช็อตฟีล'],
    tier3: ['#แจ๊ส', '#โหนกระแส'],
    rankingNote:
      'ดึงไปจัดอันดับ "5 อันดับพี่แจ๊สช็อตฟีล" หรือ "5 อันดับโหนกระแสสุดฮา"',
  },
  {
    id: 'case-3',
    title: 'เคสที่ 3: สตรีมเมอร์หัวร้อนด่าเพื่อนในเกมแล้วทุบโต๊ะ',
    tier1: ['#คนมีชื่อเสียง'],
    tier2: ['#ไลฟ์สด', '#หัวร้อน', '#ทะเลาะวิวาท'],
    tier3: ['#แก๊บโบ๋'],
    rankingNote:
      'ดึงไปจัดอันดับ "5 อันดับสตรีมเมอร์หัวร้อน" หรือ "5 อันดับไลฟ์สดสุดฮา"',
  },
  {
    id: 'case-4',
    title: 'เคสที่ 4: สไปเดอร์แมนขายพวงมาลัยตอนน้ำท่วม',
    tier1: ['#วิถีชาวบ้าน'],
    tier2: ['#คอสเพลย์', '#น้ำท่วม'],
    tier3: ['#สไปเดอร์แมน'],
    rankingNote:
      'ดึงไปจัดอันดับ "5 อันดับเหตุการณ์น้ำท่วม" หรือ "5 อันดับคอสเพลย์สุดปั่น"',
  },
];

export const STANDARD_DICTIONARY_TAGS: DictionaryTagSpec[] = [
  ...TIER1_DICTIONARY_TAGS,
  ...TIER2_DICTIONARY_TAGS,
  ...TIER3_DICTIONARY_TAGS,
];

function normalizeLookupKey(text: string): string {
  return text
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * กฎข้อที่ 2: ห้ามมีคำว่า "ฮา", "ฮาๆ" หรือ "สุดฮา" ในชื่อ Tag
 * เช่น "#ดาราฮาๆ" ➔ "ดารา", "#ให้อาหารสัตว์สุดฮา" ➔ "ให้อาหารสัตว์"
 */
export function stripForbiddenHumorSuffixes(rawTagName: string): {
  cleanedName: string;
  wasStripped: boolean;
} {
  const withoutHash = rawTagName.trim().replace(/^#+/, '').trim();
  if (!withoutHash) {
    return { cleanedName: '', wasStripped: false };
  }

  let current = withoutHash;
  const suffixRegex =
    /(?:\s*(?:สุดฮา|ฮาๆ|ฮาจัด|สุดปั่น|โบ๊ะบ๊ะ|สายฮา|ฮา))+$/i;

  if (suffixRegex.test(current)) {
    const candidate = current.replace(suffixRegex, '').trim();
    if (candidate.length >= 2) {
      current = candidate;
    }
  }

  return {
    cleanedName: current,
    wasStripped: current !== withoutHash,
  };
}

// Lookup index for instant dictionary & synonym resolution
const dictionaryByNormalizedKey = new Map<string, DictionaryTagSpec[]>();

function registerDictionaryLookup() {
  dictionaryByNormalizedKey.clear();

  for (const spec of STANDARD_DICTIONARY_TAGS) {
    const mainKey = normalizeLookupKey(spec.name);
    dictionaryByNormalizedKey.set(mainKey, [spec]);

    for (const alias of spec.aliases) {
      const aliasKey = normalizeLookupKey(alias);
      if (!aliasKey) continue;
      const existing = dictionaryByNormalizedKey.get(aliasKey) || [];
      if (!existing.some((item) => item.id === spec.id)) {
        dictionaryByNormalizedKey.set(aliasKey, [...existing, spec]);
      }
    }
  }

  // Special compound alias: "ร้องเต้น" -> resolves to both "#ร้องเพลง" and "#เต้น"
  const singSpec = STANDARD_DICTIONARY_TAGS.find((t) => t.name === 'ร้องเพลง');
  const danceSpec = STANDARD_DICTIONARY_TAGS.find((t) => t.name === 'เต้น');
  if (singSpec && danceSpec) {
    dictionaryByNormalizedKey.set(normalizeLookupKey('ร้องเต้น'), [
      singSpec,
      danceSpec,
    ]);
  }
}

registerDictionaryLookup();

export interface ResolvedTagRuleResult {
  name: string;
  tier: CategoryTier;
  subCategory: string;
  color: string;
  entityType: EntitySubtype;
  description?: string;
  dictionarySpecId?: string;
  wasMappedFromAlias: boolean;
  wasStrippedHumor: boolean;
}

/**
 * ตรวจสอบชื่อแท็กตามกฎเหล็กและ Data Dictionary:
 * 1. ตัดคำว่า "ฮา / ฮาๆ / สุดฮา" ออกอัตโนมัติตามกฎข้อ 2
 * 2. หากตรงกับแท็กมาตรฐานหรือคำพ้อง (เช่น #ดารา, #คนดัง, #พระ, #รายการผี) จะแปลงเข้าแท็กหลักและจัด Tier + หมวดย่อยให้อัตโนมัติ
 */
export function resolveTagByDataDictionary(
  rawTagName: string,
  fallbackTier: CategoryTier = 1,
  fallbackSubCategory?: string
): ResolvedTagRuleResult[] {
  const { cleanedName, wasStripped } = stripForbiddenHumorSuffixes(rawTagName);
  if (!cleanedName) return [];

  const lookupKey = normalizeLookupKey(cleanedName);
  const directMatches = dictionaryByNormalizedKey.get(lookupKey);

  // Also check raw key before stripping (in case an alias literally had a suffix)
  const rawLookupKey = normalizeLookupKey(rawTagName);
  const matchedSpecs =
    directMatches || dictionaryByNormalizedKey.get(rawLookupKey);

  if (matchedSpecs && matchedSpecs.length > 0) {
    return matchedSpecs.map((spec) => ({
      name: spec.name,
      tier: spec.tier,
      subCategory: spec.subCategory,
      color: spec.color,
      entityType: spec.entityType,
      description: spec.description,
      dictionarySpecId: spec.id,
      wasMappedFromAlias:
        normalizeLookupKey(spec.name) !== rawLookupKey ||
        matchedSpecs.length > 1,
      wasStrippedHumor: wasStripped,
    }));
  }

  const defaultSub =
    fallbackSubCategory ||
    (fallbackTier === 1
      ? 'รอคัดแยก'
      : fallbackTier === 2
      ? DATA_DICTIONARY_SUBCATEGORIES.tier2[0]
      : DATA_DICTIONARY_SUBCATEGORIES.tier3[0]);

  const defaultColor =
    fallbackTier === 1 ? 'blue' : fallbackTier === 2 ? 'amber' : 'emerald';

  const defaultEntity: EntitySubtype =
    fallbackTier === 3 ? 'PERSON' : fallbackTier === 2 ? 'ACTION' : 'TOPIC';

  return [
    {
      name: cleanedName,
      tier: fallbackTier,
      subCategory: defaultSub,
      color: defaultColor,
      entityType: defaultEntity,
      wasMappedFromAlias: false,
      wasStrippedHumor: wasStripped,
    },
  ];
}

export function buildStandardSeedTags(createdAt = '2025-01-01'): CategoryTag[] {
  return STANDARD_DICTIONARY_TAGS.map((spec) => {
    const groupType =
      spec.tier === 3 ? 'PERSON' : spec.tier === 2 ? 'ACTION' : 'THEME';
    return {
      id: spec.id,
      name: spec.name,
      color: spec.color,
      groupType,
      groupId: `GRP-${groupType}`,
      description: spec.description,
      createdAt,
      tier: spec.tier,
      subCategory: spec.subCategory,
      parentId: null,
      entityType: spec.entityType,
    };
  });
}
