import { normalizeFootageTags, isStagingTagId } from '../services/seedData';
import { Episode } from '../types/episode.types';
import { ComputedFootage, Footage } from '../types/footage.types';
import {
  normalizeTitleForComparison,
  normalizeUrlForComparison,
  extractDriveFileId,
} from './duplicateDetector';
import {
  buildFootageCatchphraseUpdate,
  extractDefaultRankFields,
} from './episodeScriptGenerator';
import {
  generateStandardFileName,
  hasRealDriveLink,
} from './fileNameGenerator';

export type DuplicateMatchReason = 'TITLE' | 'DRIVE_LINK' | 'ORIGINAL_LINK';

export interface DuplicateCluster {
  clusterId: string;
  items: ComputedFootage[];
  reasons: DuplicateMatchReason[];
  matchedKeysSummary: string;
  recommendedSurvivorId: string;
}

export interface DuplicateScanSummary {
  clusters: DuplicateCluster[];
  duplicateClusterCount: number;
  totalItemsInClusters: number;
  redundantCount: number;
  itemReasonsById: Record<string, DuplicateMatchReason[]>;
  itemClusterIndexById: Record<string, number>;
}

export interface DuplicateMergePlan {
  survivorId: string;
  duplicateIds: string[];
}

export interface MergedSurvivorPreview {
  survivor: ComputedFootage;
  mergedTags: string[];
  mergedDriveFileUrl: string;
  mergedOriginalUrl: string;
  mergedThumbnailUrl: string;
  mergedRankTitle: string;
  mergedPunchlineNote: string;
  mergedMascotNotes: string;
  affectedEpisodeIds: string[];
  affectedEpisodeCount: number;
  totalCombinedUsages: number;
}

const PLACEHOLDER_URL_VALUES = new Set(['-', '#', 'none', 'null', 'undefined', 'n/a']);

function isMeaningfulUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed || trimmed.length < 5) return false;
  if (PLACEHOLDER_URL_VALUES.has(trimmed)) return false;
  return true;
}

function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('drive.google.com') ||
    lower.includes('docs.google.com') ||
    extractDriveFileId(url) !== null
  );
}

export function getDuplicateReasonLabel(reason: DuplicateMatchReason): string {
  switch (reason) {
    case 'TITLE':
      return 'ชื่อฟุตซ้ำ';
    case 'DRIVE_LINK':
      return 'ลิงก์ Drive ซ้ำ';
    case 'ORIGINAL_LINK':
      return 'ลิงก์ต้นฉบับซ้ำ';
  }
}

function parseNumericIdSuffix(id: string): number {
  const match = id.match(/(\d+)$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const num = parseInt(match[1], 10);
  return Number.isNaN(num) ? Number.MAX_SAFE_INTEGER : num;
}

/**
 * Scores a Footage item to suggest the best default Survivor when deduplicating:
 * 1. Has a real Google Drive link (+10,000)
 * 2. Episode usage count (+500 per usage)
 * 3. Categorized out of staging (+200) & number of real tags (+40 per tag)
 * 4. Has catchphrase / punchlineNote (+150)
 * 5. Has original social URL (+80) & thumbnail (+40)
 * 6. Prefers FT- prefix over CLP- (+20) and earlier ID number
 */
export function scoreFootageForSurvivor(ft: ComputedFootage): number {
  let score = 0;

  if (hasRealDriveLink(ft.driveFileUrl)) {
    score += 10000;
  }

  score += (ft.totalUsageCount || 0) * 500;

  const realTags = (ft.tags || []).filter((tid) => Boolean(tid) && !isStagingTagId(tid));
  if (realTags.length > 0) {
    score += 200 + realTags.length * 40;
  }

  const { punchlineNote } = extractDefaultRankFields(ft);
  if (punchlineNote.trim()) {
    score += 150;
  }

  if (isMeaningfulUrl(ft.originalUrl) && !isGoogleDriveUrl(ft.originalUrl)) {
    score += 80;
  } else if (isMeaningfulUrl(ft.originalUrl)) {
    score += 30;
  }

  if (isMeaningfulUrl(ft.thumbnailUrl)) {
    score += 40;
  }

  if (ft.id.startsWith('FT-')) {
    score += 20;
  }

  return score;
}

class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }

  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }

  union(a: number, b: number): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return;

    if (this.rank[rootA] < this.rank[rootB]) {
      this.parent[rootA] = rootB;
    } else if (this.rank[rootA] > this.rank[rootB]) {
      this.parent[rootB] = rootA;
    } else {
      this.parent[rootB] = rootA;
      this.rank[rootA] += 1;
    }
  }
}

/**
 * Scans the entire Footage Vault and groups items into connected duplicate clusters
 * matching on normalized Title, Google Drive link / File ID, and Original Source URL.
 */
export function scanDuplicateFootageClusters(
  computedFootage: ComputedFootage[]
): DuplicateScanSummary {
  if (!computedFootage || computedFootage.length < 2) {
    return {
      clusters: [],
      duplicateClusterCount: 0,
      totalItemsInClusters: 0,
      redundantCount: 0,
      itemReasonsById: {},
      itemClusterIndexById: {},
    };
  }

  const n = computedFootage.length;
  const uf = new UnionFind(n);

  const titleBuckets = new Map<string, number[]>();
  const driveBuckets = new Map<string, number[]>();
  const originalUrlBuckets = new Map<string, number[]>();

  const pushToBucket = (map: Map<string, number[]>, key: string, idx: number) => {
    if (!key) return;
    const arr = map.get(key);
    if (arr) {
      arr.push(idx);
    } else {
      map.set(key, [idx]);
    }
  };

  for (let i = 0; i < n; i++) {
    const ft = computedFootage[i];

    // 1. Normalized Title
    const normTitle = normalizeTitleForComparison(ft.title);
    if (normTitle.length >= 2) {
      pushToBucket(titleBuckets, normTitle, i);
    }

    // 2. Google Drive link (prefer File ID; fallback to normalized Drive URL)
    if (isMeaningfulUrl(ft.driveFileUrl)) {
      const driveId = extractDriveFileId(ft.driveFileUrl);
      if (driveId) {
        pushToBucket(driveBuckets, `id:${driveId}`, i);
      } else {
        const normDrive = normalizeUrlForComparison(ft.driveFileUrl);
        if (normDrive) {
          pushToBucket(driveBuckets, `url:${normDrive}`, i);
        }
      }
    }

    // 3. Original Source URL (if originalUrl is actually a Drive URL, route it to driveBuckets)
    if (isMeaningfulUrl(ft.originalUrl)) {
      if (isGoogleDriveUrl(ft.originalUrl)) {
        const driveId = extractDriveFileId(ft.originalUrl);
        if (driveId) {
          pushToBucket(driveBuckets, `id:${driveId}`, i);
        } else {
          const normOrigDrive = normalizeUrlForComparison(ft.originalUrl);
          if (normOrigDrive) {
            pushToBucket(driveBuckets, `url:${normOrigDrive}`, i);
          }
        }
      } else {
        const normOrig = normalizeUrlForComparison(ft.originalUrl);
        if (normOrig) {
          pushToBucket(originalUrlBuckets, normOrig, i);
        }
      }
    }
  }

  const itemReasonSets: Array<Set<DuplicateMatchReason>> = Array.from(
    { length: n },
    () => new Set<DuplicateMatchReason>()
  );

  const unionBucketMap = (
    buckets: Map<string, number[]>,
    reason: DuplicateMatchReason
  ) => {
    buckets.forEach((indices) => {
      if (indices.length < 2) return;
      const first = indices[0];
      itemReasonSets[first].add(reason);
      for (let k = 1; k < indices.length; k++) {
        const idx = indices[k];
        uf.union(first, idx);
        itemReasonSets[idx].add(reason);
      }
    });
  };

  unionBucketMap(titleBuckets, 'TITLE');
  unionBucketMap(driveBuckets, 'DRIVE_LINK');
  unionBucketMap(originalUrlBuckets, 'ORIGINAL_LINK');

  const componentMap = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = uf.find(i);
    const list = componentMap.get(root);
    if (list) {
      list.push(i);
    } else {
      componentMap.set(root, [i]);
    }
  }

  const clusters: DuplicateCluster[] = [];

  componentMap.forEach((memberIndices) => {
    if (memberIndices.length < 2) return;

    const clusterReasonsSet = new Set<DuplicateMatchReason>();
    memberIndices.forEach((idx) => {
      itemReasonSets[idx].forEach((r) => clusterReasonsSet.add(r));
    });

    const items = memberIndices.map((idx) => computedFootage[idx]);

    // Sort items by Survivor score descending, then earlier createdAt, then smaller numeric ID
    const sortedItems = [...items].sort((a, b) => {
      const scoreDiff = scoreFootageForSurvivor(b) - scoreFootageForSurvivor(a);
      if (scoreDiff !== 0) return scoreDiff;
      if (a.createdAt !== b.createdAt) {
        return a.createdAt.localeCompare(b.createdAt);
      }
      const numDiff = parseNumericIdSuffix(a.id) - parseNumericIdSuffix(b.id);
      if (numDiff !== 0) return numDiff;
      return a.id.localeCompare(b.id);
    });

    const recommendedSurvivor = sortedItems[0];
    const reasons: DuplicateMatchReason[] = [];
    if (clusterReasonsSet.has('DRIVE_LINK')) reasons.push('DRIVE_LINK');
    if (clusterReasonsSet.has('ORIGINAL_LINK')) reasons.push('ORIGINAL_LINK');
    if (clusterReasonsSet.has('TITLE')) reasons.push('TITLE');

    const summaryParts: string[] = [];
    if (recommendedSurvivor.title) {
      summaryParts.push(recommendedSurvivor.title);
    }
    const matchedKeysSummary = summaryParts.join(' · ') || recommendedSurvivor.id;

    clusters.push({
      clusterId: `DUP-${recommendedSurvivor.id}`,
      items: sortedItems,
      reasons,
      matchedKeysSummary,
      recommendedSurvivorId: recommendedSurvivor.id,
    });
  });

  // Sort clusters so highest-priority / largest / Drive-matched clusters appear first
  clusters.sort((a, b) => {
    if (b.items.length !== a.items.length) {
      return b.items.length - a.items.length;
    }
    return a.recommendedSurvivorId.localeCompare(b.recommendedSurvivorId);
  });

  const itemReasonsById: Record<string, DuplicateMatchReason[]> = {};
  const itemClusterIndexById: Record<string, number> = {};
  let totalItemsInClusters = 0;

  clusters.forEach((cluster, clusterIdx) => {
    totalItemsInClusters += cluster.items.length;
    cluster.items.forEach((ft) => {
      itemClusterIndexById[ft.id] = clusterIdx;
      const idxInAll = computedFootage.findIndex((item) => item.id === ft.id);
      const specificReasons =
        idxInAll >= 0 && itemReasonSets[idxInAll].size > 0
          ? Array.from(itemReasonSets[idxInAll])
          : cluster.reasons;
      itemReasonsById[ft.id] = specificReasons;
    });
  });

  return {
    clusters,
    duplicateClusterCount: clusters.length,
    totalItemsInClusters,
    redundantCount: totalItemsInClusters - clusters.length,
    itemReasonsById,
    itemClusterIndexById,
  };
}

/**
 * Merges metadata from duplicate Footage entities onto the chosen Survivor Footage.
 */
export function buildMergedFootageEntity(
  survivor: Footage,
  duplicates: Footage[]
): Footage {
  const allItems = [survivor, ...duplicates];

  // 1. Merge tags (keep all real tags; strip STAGING if any real tag exists)
  const rawCombinedTags = allItems.flatMap((ft) => ft.tags || []);
  const mergedTags = normalizeFootageTags(rawCombinedTags);

  // 2. Drive File URL (keep survivor's if real; else take first real Drive URL)
  let mergedDriveFileUrl = (survivor.driveFileUrl || '').trim();
  if (!hasRealDriveLink(mergedDriveFileUrl)) {
    const donor = duplicates.find((d) => hasRealDriveLink(d.driveFileUrl));
    if (donor) {
      mergedDriveFileUrl = donor.driveFileUrl.trim();
    }
  }

  // 3. Original Social URL (prefer non-Drive social link if survivor lacks one or only has Drive link)
  let mergedOriginalUrl = (survivor.originalUrl || '').trim();
  if (!isMeaningfulUrl(mergedOriginalUrl) || isGoogleDriveUrl(mergedOriginalUrl)) {
    const socialDonor = allItems.find(
      (d) => isMeaningfulUrl(d.originalUrl) && !isGoogleDriveUrl(d.originalUrl)
    );
    if (socialDonor) {
      mergedOriginalUrl = socialDonor.originalUrl.trim();
    } else if (!isMeaningfulUrl(mergedOriginalUrl)) {
      const anyDonor = duplicates.find((d) => isMeaningfulUrl(d.originalUrl));
      if (anyDonor) {
        mergedOriginalUrl = anyDonor.originalUrl.trim();
      }
    }
  }

  // 4. Thumbnail URL
  let mergedThumbnailUrl = (survivor.thumbnailUrl || '').trim();
  if (!isMeaningfulUrl(mergedThumbnailUrl)) {
    const thumbDonor = duplicates.find((d) => isMeaningfulUrl(d.thumbnailUrl));
    if (thumbDonor?.thumbnailUrl) {
      mergedThumbnailUrl = thumbDonor.thumbnailUrl.trim();
    }
  }

  // 5. Title & Duration & Earliest CreatedAt
  const mergedTitle =
    (survivor.title || '').trim() ||
    duplicates.find((d) => d.title?.trim())?.title.trim() ||
    survivor.title;

  const mergedDurationSec =
    survivor.durationSec && survivor.durationSec > 0
      ? survivor.durationSec
      : duplicates.find((d) => d.durationSec && d.durationSec > 0)?.durationSec ||
        survivor.durationSec ||
        25;

  const validDates = allItems
    .map((d) => (d.createdAt || '').trim())
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort((a, b) => a.localeCompare(b));
  const mergedCreatedAt = validDates[0] || survivor.createdAt;

  // 6. RankTitle, PunchlineNote, MascotNotes (preserve survivor first, fill gaps from duplicates)
  const survivorRankFields = extractDefaultRankFields(survivor);
  let mergedRankTitle = (survivor.rankTitle || '').trim() || survivorRankFields.rankTitle;
  let mergedPunchline = survivorRankFields.punchlineNote;
  let mergedMascotNotes = (survivor.mascotNotes || '').trim();

  if (!mergedPunchline) {
    for (const dup of duplicates) {
      const dupFields = extractDefaultRankFields(dup);
      if (dupFields.punchlineNote) {
        mergedPunchline = dupFields.punchlineNote;
        break;
      }
    }
  }

  if (!mergedRankTitle || mergedRankTitle === mergedTitle) {
    for (const dup of duplicates) {
      if (dup.rankTitle && dup.rankTitle.trim() && dup.rankTitle.trim() !== dup.title.trim()) {
        mergedRankTitle = dup.rankTitle.trim();
        break;
      }
    }
  }

  if (!mergedMascotNotes) {
    const noteDonor = duplicates.find((d) => (d.mascotNotes || '').trim().length > 0);
    if (noteDonor) {
      mergedMascotNotes = noteDonor.mascotNotes.trim();
    }
  }

  const syncedCatchphrase = buildFootageCatchphraseUpdate(
    {
      ...survivor,
      title: mergedTitle,
      rankTitle: mergedRankTitle,
      punchlineNote: mergedPunchline,
      mascotNotes: mergedMascotNotes,
    },
    {
      rankTitle: mergedRankTitle,
      punchlineNote: mergedPunchline,
    }
  );

  return {
    ...survivor,
    title: mergedTitle,
    tags: mergedTags,
    driveFileUrl: mergedDriveFileUrl,
    originalUrl: mergedOriginalUrl,
    ...(mergedThumbnailUrl ? { thumbnailUrl: mergedThumbnailUrl } : {}),
    durationSec: mergedDurationSec,
    createdAt: mergedCreatedAt,
    standardFileName: generateStandardFileName(survivor.id, mergedTitle),
    rankTitle: syncedCatchphrase.rankTitle ?? mergedRankTitle,
    punchlineNote: syncedCatchphrase.punchlineNote ?? mergedPunchline,
    mascotNotes: syncedCatchphrase.mascotNotes ?? mergedMascotNotes,
  };
}

/**
 * Builds a complete preview of what the Survivor and Episode migrations will look like before committing.
 */
export function buildMergedSurvivorPreview(
  survivor: ComputedFootage,
  duplicates: ComputedFootage[],
  episodes: Episode[]
): MergedSurvivorPreview {
  const merged = buildMergedFootageEntity(survivor, duplicates);
  const dupIdSet = new Set(duplicates.map((d) => d.id));

  const affectedEpisodeIds = episodes
    .filter((ep) =>
      ep.rankings.some(
        (slot) => Boolean(slot.footageId) && dupIdSet.has(slot.footageId!)
      )
    )
    .map((ep) => ep.id);

  const allInvolvedSet = new Set([survivor.id, ...duplicates.map((d) => d.id)]);
  const totalCombinedUsages = episodes.filter((ep) =>
    ep.rankings.some(
      (slot) => Boolean(slot.footageId) && allInvolvedSet.has(slot.footageId!)
    )
  ).length;

  return {
    survivor,
    mergedTags: merged.tags,
    mergedDriveFileUrl: merged.driveFileUrl,
    mergedOriginalUrl: merged.originalUrl,
    mergedThumbnailUrl: merged.thumbnailUrl || '',
    mergedRankTitle: merged.rankTitle || '',
    mergedPunchlineNote: merged.punchlineNote || '',
    mergedMascotNotes: merged.mascotNotes || '',
    affectedEpisodeIds,
    affectedEpisodeCount: affectedEpisodeIds.length,
    totalCombinedUsages,
  };
}
