import { CategoryGroup, CategoryTag } from '../../../types/tag.types';

export interface MainCategoryOverviewItem {
  mainTag: CategoryTag;
  subTags: CategoryTag[];
  familyIds: Set<string>;
  totalCount: number;
  usableCount: number;
  newCount: number;
  producibleEpisodes: number;
}

export interface CategoryGroupOverviewItem {
  group: CategoryGroup;
  mainCategories: MainCategoryOverviewItem[];
  groupFamilyTagIds: Set<string>;
  mainCatCount: number;
  totalCount: number;
  usableCount: number;
  newCount: number;
}

export interface VaultMetricsSummary {
  total: number;
  usable: number;
  newUntouched: number;
  readyFresh: number;
  inCooldown: number;
}

export interface ActiveScopeDescription {
  key: string;
  level: string;
  label: string;
  trail: string;
}

export type VaultViewMode = 'GRID' | 'TABLE';
