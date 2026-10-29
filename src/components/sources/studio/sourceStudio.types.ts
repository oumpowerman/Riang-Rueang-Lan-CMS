import { SourcePlatform } from '../../../types/source.types';

export type MiningQuickFilter = 'ALL' | 'UNDER_MINED' | 'HAS_READY_CLIPS';

export type SourceSortOption =
  | 'NEWEST'
  | 'MOST_CLIPS'
  | 'MOST_USABLE'
  | 'LEAST_MINED';

export type PlatformFilterOption = SourcePlatform | 'ALL';

export interface SourceMiningKpis {
  totalSources: number;
  totalSplitClips: number;
  avgYield: string;
  underMinedSourcesCount: number;
  totalReadySplitClips: number;
  sourcesWithReadyClipsCount: number;
}
