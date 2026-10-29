/**
 * Smart Tag & Category Reconciler
 * Matches Google Drive subfolder names to existing CategoryTags or creates new ones.
 */

import { CategoryGroup, CategoryTag, TagGroupType } from '../types/tag.types';
import { generateNextId } from './fileNameGenerator';

const VIBRANT_TAG_COLORS = [
  'indigo',
  'sky',
  'emerald',
  'amber',
  'violet',
  'rose',
  'teal',
  'orange',
  'fuchsia',
  'blue',
];

/**
 * Normalizes folder name by stripping leading numbering (e.g. "01_ตลก", "02. มุก", "[EP] สัตว์โลก")
 */
export function cleanSubfolderCategoryName(rawName: string): string {
  if (!rawName) return 'ทั่วไป';

  let cleaned = rawName.trim();

  // Remove leading bracket tags: e.g. [หมวด], (01), #01
  cleaned = cleaned.replace(/^[\[({#].*?[\])}#]\s*[-_.]?\s*/, '');

  // Remove leading number patterns: "01_", "01. ", "01 - ", "1_", "1- "
  cleaned = cleaned.replace(/^\d+[\s._-]+/, '');

  // Remove trailing numbering/symbols
  cleaned = cleaned.replace(/[\s._-]+$/, '');

  return cleaned.trim() || rawName.trim();
}

/**
 * Fuzzy/normalized string comparison for Thai and English names
 */
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\-_.,/\\#()[\]{}|]/g, '')
    .trim();
}

export interface ReconciledCategoryResult {
  folderName: string;
  cleanedCategoryName: string;
  tagId: string;
  isNew: boolean;
  tag: CategoryTag;
}

/**
 * Reconciles a folder name against current system tags and groups
 */
export function reconcileSubfolder(
  folderName: string,
  existingTags: CategoryTag[],
  existingGroups: CategoryGroup[],
  createdTagsInMemory: CategoryTag[] = []
): ReconciledCategoryResult {
  const cleanedName = cleanSubfolderCategoryName(folderName);
  const normalizedTarget = normalizeForMatching(cleanedName);

  // 1. Check if already matched in this batch in-memory
  const inMemoryMatch = createdTagsInMemory.find(
    (t) => normalizeForMatching(t.name) === normalizedTarget
  );
  if (inMemoryMatch) {
    return {
      folderName,
      cleanedCategoryName: cleanedName,
      tagId: inMemoryMatch.id,
      isNew: false,
      tag: inMemoryMatch,
    };
  }

  // 2. Check existing persistent tags
  const exactMatch = existingTags.find(
    (t) => t.name.trim().toLowerCase() === cleanedName.toLowerCase()
  );
  if (exactMatch) {
    return {
      folderName,
      cleanedCategoryName: cleanedName,
      tagId: exactMatch.id,
      isNew: false,
      tag: exactMatch,
    };
  }

  const fuzzyMatch = existingTags.find(
    (t) => normalizeForMatching(t.name) === normalizedTarget
  );
  if (fuzzyMatch) {
    return {
      folderName,
      cleanedCategoryName: cleanedName,
      tagId: fuzzyMatch.id,
      isNew: false,
      tag: fuzzyMatch,
    };
  }

  // 3. Not found -> Draft a new CategoryTag
  const allExistingIds = [
    ...existingTags.map((t) => t.id),
    ...createdTagsInMemory.map((t) => t.id),
  ];
  const newTagId = generateNextId('TAG', allExistingIds);

  // Pick deterministic pleasant color based on name hash
  let hash = 0;
  for (let i = 0; i < cleanedName.length; i++) {
    hash = (hash << 5) - hash + cleanedName.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % VIBRANT_TAG_COLORS.length;
  const chosenColor = VIBRANT_TAG_COLORS[colorIndex];

  // Match default group or fallback
  const defaultGroup =
    existingGroups.find((g) => g.id === 'GRP-THEME') ||
    existingGroups[0] || { id: 'GRP-GENERAL' };

  const newTag: CategoryTag = {
    id: newTagId,
    name: cleanedName,
    color: chosenColor,
    groupType: 'THEME',
    groupId: defaultGroup.id,
    description: `หมวดหมู่นำเข้าอัตโนมัติจากโฟลเดอร์ "${folderName}"`,
    createdAt: new Date().toISOString().split('T')[0],
    tier: 1,
    parentId: null,
  };

  return {
    folderName,
    cleanedCategoryName: cleanedName,
    tagId: newTagId,
    isNew: true,
    tag: newTag,
  };
}
