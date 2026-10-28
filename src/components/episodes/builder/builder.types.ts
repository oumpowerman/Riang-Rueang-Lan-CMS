import { EpisodeRankingSlot } from '../../../types/episode.types';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';

export type RankNumber = 1 | 2 | 3 | 4 | 5;

export type BuilderStepNumber = 1 | 2 | 3 | 4;

export const RANK_ORDER_1_TO_5: RankNumber[] = [1, 2, 3, 4, 5];

export const DEFAULT_RANKINGS_1_TO_5: EpisodeRankingSlot[] = [
  { rank: 1, footageId: null, mascotScript: '', snapshotNote: '' },
  { rank: 2, footageId: null, mascotScript: '', snapshotNote: '' },
  { rank: 3, footageId: null, mascotScript: '', snapshotNote: '' },
  { rank: 4, footageId: null, mascotScript: '', snapshotNote: '' },
  { rank: 5, footageId: null, mascotScript: '', snapshotNote: '' },
];

export type PoolQuickFilter = 'AVAILABLE_USABLE' | 'ONLY_NEW' | 'ONLY_FRESH' | 'ALL';

export type PickerSortBy = 'REST_DAYS_DESC' | 'USAGE_90D_ASC';

export interface LiveCategoryStock {
  totalNew: number;
  usedNew: number;
  remainingNew: number;
  totalFresh: number;
  usedFresh: number;
  remainingFresh: number;
}

export interface GroupStockStat {
  group: CategoryGroup;
  mainCategoriesCount: number;
  subcategoriesCount: number;
  totalCount: number;
  usableCount: number;
  newCount: number;
  readyCount: number;
  producibleEpisodesCount: number;
}

export interface DuplicateSubcategoryWarning {
  tag: CategoryTag;
  ranks: number[];
}

export type SlotDropPayload =
  | { type: 'SLOT'; fromRank: RankNumber }
  | { type: 'FOOTAGE'; footageId: string };
