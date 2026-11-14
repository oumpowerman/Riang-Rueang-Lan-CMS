import {
  isStagingTagId,
  normalizeFootageTags,
  STAGING_CATEGORY_TAG,
} from '../services/seedData';
import { Footage } from '../types/footage.types';
import { RawSource } from '../types/source.types';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
  TierSubCategoriesConfig,
} from '../types/tag.types';
import { getReferenceTodayDate } from './cooldownCalculator';
import { generateNextId } from './fileNameGenerator';
import {
  DATA_DICTIONARY_SUBCATEGORIES,
  resolveTagByDataDictionary,
  STANDARD_DICTIONARY_TAGS,
  stripForbiddenHumorSuffixes,
} from './tagDictionaryRules';

export interface ReorganizeDictionaryResult {
  nextTags: CategoryTag[];
  tagsToSave: CategoryTag[];
  tagIdsToDelete: string[];
  nextFootage: Footage[];
  changedFootages: Footage[];
  nextSources: RawSource[];
  changedSources: RawSource[];
  nextTierSubCategories: TierSubCategoriesConfig;
  stats: {
    addedStandardTagsCount: number;
    updatedTagsCount: number;
    mergedAliasTagsCount: number;
    migratedFootagesCount: number;
    migratedSourcesCount: number;
    mergedExamples: string[];
  };
}

const OBSOLETE_SUBCATEGORY_NAMES = new Set([
  'หมวดหลัก',
  'สถานการณ์',
  'เหตุการณ์',
  'เทศกาล',
  'วิธีการนำเสนอ',
  'ความขลัง',
  'บุคคล/คนดัง',
  'รายการ/ช่อง',
  'รายการ',
]);

export function isObsoleteSubCategoryName(
  tier: CategoryTier,
  name: string
): boolean {
  const trimmed = (name || '').trim();
  if (!trimmed) return true;
  if (tier !== 1 && trimmed === DEFAULT_UNCLASSIFIED_SUBCATEGORY) {
    return true;
  }
  return OBSOLETE_SUBCATEGORY_NAMES.has(trimmed);
}

export function normalizeLegacySubCategory(
  tier: CategoryTier,
  subCategory?: string
): string {
  const trimmed = (subCategory || '').trim();
  if (tier === 1) {
    if (!trimmed || trimmed === 'หมวดหลัก') {
      return 'วงการ/หมวดหลัก';
    }
    return trimmed;
  }
  if (tier === 2) {
    if (!trimmed || trimmed === 'สถานการณ์' || trimmed === 'รอคัดแยก') {
      return 'กลุ่ม A: สถานการณ์ / อาการ';
    }
    if (trimmed === 'เหตุการณ์' || trimmed === 'เทศกาล') {
      return 'กลุ่ม B: เหตุการณ์ / เทศกาล';
    }
    if (trimmed === 'วิธีการนำเสนอ') {
      return 'กลุ่ม C: วิธีการนำเสนอ';
    }
    if (trimmed === 'ความขลัง') {
      return 'กลุ่ม D: ความขลัง';
    }
    return trimmed;
  }
  // tier === 3
  if (!trimmed || trimmed === 'บุคคล/คนดัง' || trimmed === 'รอคัดแยก') {
    return 'สายอินฟลู/ไวรัล';
  }
  if (trimmed === 'รายการ/ช่อง' || trimmed === 'รายการ') {
    return 'ชื่อรายการ/ผลงาน';
  }
  return trimmed;
}

const SEVEN_MAIN_TIER1_NAMES = new Set(
  STANDARD_DICTIONARY_TAGS.filter((s) => s.tier === 1).map((s) =>
    s.name.toLowerCase()
  )
);

/**
 * Checks whether the current tags or settings still contain:
 * - Duplicate tag names (e.g. both TAG-00xx and TAG-T1/T2/T3-xxx)
 * - Synonym/alias tags that should be merged into the 7 Tier 1 tags or Tier 2/3 tags
 * - Missing canonical dictionary tags
 * - Obsolete subcategory names in settings
 */
export function needsDictionaryCleanup(
  tags: CategoryTag[],
  tierSubCategories?: TierSubCategoriesConfig
): boolean {
  const realTags = tags.filter((t) => !isStagingTagId(t.id));
  if (realTags.length === 0) return false;

  // 1. Check for duplicate tag names (case-insensitive)
  const seenLowerNames = new Set<string>();
  for (const t of realTags) {
    const key = t.name.trim().toLowerCase();
    if (seenLowerNames.has(key)) return true;
    seenLowerNames.add(key);
  }

  // 2. Check if any canonical tag from STANDARD_DICTIONARY_TAGS is missing or misplaced
  for (const spec of STANDARD_DICTIONARY_TAGS) {
    const found = realTags.find(
      (t) => t.name.trim().toLowerCase() === spec.name.toLowerCase()
    );
    if (!found) return true;
    if (found.tier !== spec.tier || found.subCategory !== spec.subCategory) {
      return true;
    }
  }

  // 3. Check if any tag is an un-merged alias/synonym or has forbidden humor suffixes or obsolete subcategory
  for (const t of realTags) {
    if (isObsoleteSubCategoryName((t.tier || 1) as CategoryTier, t.subCategory || '')) {
      return true;
    }
    const resolved = resolveTagByDataDictionary(
      t.name,
      (t.tier || 1) as CategoryTier,
      t.subCategory
    );
    if (
      resolved.some(
        (r) =>
          r.wasMappedFromAlias ||
          r.wasStrippedHumor ||
          (r.dictionarySpecId &&
            r.name.toLowerCase() !== t.name.trim().toLowerCase())
      )
    ) {
      return true;
    }
    // In Tier 1 'วงการ/หมวดหลัก', only the 7 canonical tags should exist
    if (
      (t.tier || 1) === 1 &&
      t.subCategory === 'วงการ/หมวดหลัก' &&
      !SEVEN_MAIN_TIER1_NAMES.has(t.name.trim().toLowerCase())
    ) {
      return true;
    }
  }

  // 4. Check if tierSubCategories still has obsolete subcategory names
  if (tierSubCategories) {
    if (
      tierSubCategories.tier1?.some((s) => isObsoleteSubCategoryName(1, s)) ||
      tierSubCategories.tier2?.some((s) => isObsoleteSubCategoryName(2, s)) ||
      tierSubCategories.tier3?.some((s) => isObsoleteSubCategoryName(3, s))
    ) {
      return true;
    }
  }

  return false;
}

export function computeDictionaryTagReorganization(params: {
  tags: CategoryTag[];
  footage: Footage[];
  sources: RawSource[];
  currentTierSubCategories?: TierSubCategoriesConfig;
}): ReorganizeDictionaryResult {
  const { tags, footage, sources } = params;
  const todayIso = getReferenceTodayDate();

  const existingRealTags = tags.filter((t) => !isStagingTagId(t.id));
  const stagingTag =
    tags.find((t) => isStagingTagId(t.id)) || STAGING_CATEGORY_TAG;

  // Count how many footages currently use each tag ID so we prefer keeping the tag ID that already has clips attached
  const usageCountByTagId = new Map<string, number>();
  for (const ft of footage) {
    for (const tid of ft.tags || []) {
      usageCountByTagId.set(tid, (usageCountByTagId.get(tid) || 0) + 1);
    }
  }

  const accumulatedIds = tags.map((t) => t.id);

  // 1. Map canonical spec ID -> canonical CategoryTag (choosing at most 1 survivor per spec)
  const canonicalTagBySpecId = new Map<string, CategoryTag>();
  const usedPrimaryTagIds = new Set<string>();
  const tagsToSave: CategoryTag[] = [];
  let addedStandardTagsCount = 0;
  let updatedTagsCount = 0;

  for (const spec of STANDARD_DICTIONARY_TAGS) {
    const groupType =
      spec.tier === 3 ? 'PERSON' : spec.tier === 2 ? 'ACTION' : 'THEME';
    const expectedGroupId = `GRP-${groupType}`;

    // Find all existing tags that have the exact canonical name or ID
    const candidates = existingRealTags.filter(
      (t) =>
        !usedPrimaryTagIds.has(t.id) &&
        (t.id === spec.id ||
          t.name.trim().toLowerCase() === spec.name.toLowerCase())
    );

    // Sort candidates: prefer the one with the most footage usage, then prefer original TAG-00xx or exact spec.id
    candidates.sort((a, b) => {
      const usageDiff =
        (usageCountByTagId.get(b.id) || 0) - (usageCountByTagId.get(a.id) || 0);
      if (usageDiff !== 0) return usageDiff;
      if (a.id === spec.id) return -1;
      if (b.id === spec.id) return 1;
      return a.id.localeCompare(b.id);
    });

    const existingPrimary = candidates[0];

    if (existingPrimary) {
      usedPrimaryTagIds.add(existingPrimary.id);
      const needsUpdate =
        existingPrimary.name !== spec.name ||
        existingPrimary.tier !== spec.tier ||
        existingPrimary.subCategory !== spec.subCategory ||
        existingPrimary.color !== spec.color ||
        existingPrimary.entityType !== spec.entityType ||
        existingPrimary.description !== spec.description ||
        existingPrimary.parentId !== null;

      const updatedCanonical: CategoryTag = {
        ...existingPrimary,
        name: spec.name,
        tier: spec.tier,
        subCategory: spec.subCategory,
        color: spec.color,
        groupType,
        groupId: expectedGroupId,
        entityType: spec.entityType,
        description: spec.description,
        parentId: null,
      };

      canonicalTagBySpecId.set(spec.id, updatedCanonical);
      if (needsUpdate) {
        tagsToSave.push(updatedCanonical);
        updatedTagsCount += 1;
      }
    } else {
      const newId = accumulatedIds.includes(spec.id)
        ? generateNextId('TAG', accumulatedIds)
        : spec.id;
      accumulatedIds.push(newId);

      const createdCanonical: CategoryTag = {
        id: newId,
        name: spec.name,
        tier: spec.tier,
        subCategory: spec.subCategory,
        color: spec.color,
        groupType,
        groupId: expectedGroupId,
        entityType: spec.entityType,
        description: spec.description,
        createdAt: todayIso,
        parentId: null,
      };

      canonicalTagBySpecId.set(spec.id, createdCanonical);
      tagsToSave.push(createdCanonical);
      addedStandardTagsCount += 1;
    }
  }

  // 2. Analyze all remaining tags:
  // - Any duplicate of a canonical tag or synonym/alias -> merge into canonical tag & delete duplicate!
  // - Any custom tag -> strip "ฮา / ฮาๆ / สุดฮา", deduplicate by name, and if in Tier 1 place in 'รอคัดแยก' so 'วงการ/หมวดหลัก' only has the 7 main tags!
  const replacementTagIdsByOldId = new Map<string, string[]>();
  const tagIdsToDelete: string[] = [];
  const retainedCustomTags: CategoryTag[] = [];
  const mergedExamples: string[] = [];

  const customTagByLowerName = new Map<string, CategoryTag>();

  // Sort remaining tags so the one with higher usage becomes the survivor when deduplicating custom tags
  const remainingTags = existingRealTags
    .filter((t) => !usedPrimaryTagIds.has(t.id))
    .sort(
      (a, b) =>
        (usageCountByTagId.get(b.id) || 0) - (usageCountByTagId.get(a.id) || 0)
    );

  for (const tag of remainingTags) {
    const resolvedList = resolveTagByDataDictionary(
      tag.name,
      (tag.tier || 1) as CategoryTier,
      tag.subCategory
    );

    const matchedCanonicalIds = resolvedList
      .map((r) =>
        r.dictionarySpecId
          ? canonicalTagBySpecId.get(r.dictionarySpecId)?.id
          : undefined
      )
      .filter((id): id is string => Boolean(id));

    if (matchedCanonicalIds.length > 0) {
      replacementTagIdsByOldId.set(tag.id, matchedCanonicalIds);
      tagIdsToDelete.push(tag.id);

      const targetNames = resolvedList
        .filter((r) => Boolean(r.dictionarySpecId))
        .map((r) => `#${r.name}`)
        .join(', ');
      if (mergedExamples.length < 15) {
        mergedExamples.push(`#${tag.name} ➔ ${targetNames}`);
      }
      continue;
    }

    // Custom tag not in Data Dictionary:
    const { cleanedName, wasStripped } = stripForbiddenHumorSuffixes(tag.name);
    const finalName = cleanedName || tag.name.trim();
    const resolvedTier: CategoryTier =
      tag.tier === 1 || tag.tier === 2 || tag.tier === 3 ? tag.tier : 1;

    // For Tier 1: 'วงการ/หมวดหลัก' is strictly reserved for the 7 main tags in tag_3_tiers.md.
    // Any non-dictionary tag in Tier 1 goes into 'รอคัดแยก' so the user can see it in the top inbox!
    const normalizedSub =
      resolvedTier === 1
        ? DEFAULT_UNCLASSIFIED_SUBCATEGORY
        : normalizeLegacySubCategory(resolvedTier, tag.subCategory);

    const lowerKey = finalName.toLowerCase();
    const existingCustom = customTagByLowerName.get(lowerKey);
    if (existingCustom) {
      replacementTagIdsByOldId.set(tag.id, [existingCustom.id]);
      tagIdsToDelete.push(tag.id);
      if (mergedExamples.length < 15) {
        mergedExamples.push(`#${tag.name} (ซ้ำ) ➔ #${existingCustom.name}`);
      }
      continue;
    }

    const needsCustomUpdate =
      tag.name !== finalName ||
      tag.tier !== resolvedTier ||
      tag.subCategory !== normalizedSub ||
      tag.parentId !== null;

    const updatedCustom: CategoryTag = {
      ...tag,
      name: finalName,
      tier: resolvedTier,
      subCategory: normalizedSub,
      parentId: null,
    };

    customTagByLowerName.set(lowerKey, updatedCustom);
    retainedCustomTags.push(updatedCustom);

    if (needsCustomUpdate) {
      tagsToSave.push(updatedCustom);
      updatedTagsCount += 1;
      if (wasStripped && mergedExamples.length < 15) {
        mergedExamples.push(`#${tag.name} ➔ #${finalName}`);
      }
    }
  }

  // 3. Build nextTags list
  const nextTags: CategoryTag[] = [
    stagingTag,
    ...Array.from(canonicalTagBySpecId.values()),
    ...retainedCustomTags,
  ];

  // 4. Migrate Footage tags using replacementTagIdsByOldId
  const changedFootages: Footage[] = [];
  const nextFootage = footage.map((ft) => {
    let changed = false;
    const mappedTagIds: string[] = [];

    for (const tid of ft.tags) {
      const replacement = replacementTagIdsByOldId.get(tid);
      if (replacement) {
        changed = true;
        mappedTagIds.push(...replacement);
      } else {
        mappedTagIds.push(tid);
      }
    }

    const normalized = normalizeFootageTags(mappedTagIds);
    if (
      !changed &&
      normalized.length === ft.tags.length &&
      normalized.every((val, i) => val === ft.tags[i])
    ) {
      return ft;
    }

    const updatedFt: Footage = {
      ...ft,
      tags: normalized,
    };
    changedFootages.push(updatedFt);
    return updatedFt;
  });

  // 5. Migrate RawSource tags using replacementTagIdsByOldId
  const changedSources: RawSource[] = [];
  const nextSources = sources.map((src) => {
    let changed = false;
    const mappedTagIds: string[] = [];

    for (const tid of src.tags) {
      const replacement = replacementTagIdsByOldId.get(tid);
      if (replacement) {
        changed = true;
        mappedTagIds.push(...replacement);
      } else {
        mappedTagIds.push(tid);
      }
    }

    if (!changed) return src;

    const deduplicated = Array.from(new Set(mappedTagIds.filter(Boolean)));
    const updatedSrc: RawSource = {
      ...src,
      tags: deduplicated,
    };
    changedSources.push(updatedSrc);
    return updatedSrc;
  });

  // 6. Build clean TierSubCategoriesConfig without obsolete legacy subcategory names
  const collectCleanSubCategories = (
    tier: CategoryTier,
    defaults: string[]
  ): string[] => {
    const set = new Set<string>(defaults);
    nextTags.forEach((t) => {
      if (!isStagingTagId(t.id) && t.tier === tier && t.subCategory) {
        const sub = t.subCategory.trim();
        if (!isObsoleteSubCategoryName(tier, sub)) {
          set.add(sub);
        }
      }
    });
    return Array.from(set);
  };

  const nextTierSubCategories: TierSubCategoriesConfig = {
    tier1: collectCleanSubCategories(1, [
      DEFAULT_UNCLASSIFIED_SUBCATEGORY,
      'วงการ/หมวดหลัก',
    ]),
    tier2: collectCleanSubCategories(2, DATA_DICTIONARY_SUBCATEGORIES.tier2),
    tier3: collectCleanSubCategories(3, DATA_DICTIONARY_SUBCATEGORIES.tier3),
  };

  return {
    nextTags,
    tagsToSave,
    tagIdsToDelete,
    nextFootage,
    changedFootages,
    nextSources,
    changedSources,
    nextTierSubCategories,
    stats: {
      addedStandardTagsCount,
      updatedTagsCount,
      mergedAliasTagsCount: tagIdsToDelete.length,
      migratedFootagesCount: changedFootages.length,
      migratedSourcesCount: changedSources.length,
      mergedExamples,
    },
  };
}
