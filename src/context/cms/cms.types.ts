import React from 'react';
import {
  Episode,
  EpisodeProductionTarget,
  EpisodeWorkflowStage,
  MasterVideoInfo,
} from '../../types/episode.types';
import { ComputedFootage, Footage } from '../../types/footage.types';
import { RawSource, SourcePlatform } from '../../types/source.types';
import {
  CategoryGroup,
  CategoryTag,
  CategoryTier,
  EntitySubtype,
  SystemSettings,
  TagGroupType,
} from '../../types/tag.types';
import { MixRecipeId } from '../../utils/collisionDetector';

export type ActiveNavTab =
  | 'DASHBOARD'
  | 'E2E_PIPELINE'
  | 'FOOTAGE_LIBRARY'
  | 'SOURCE_SPLITTER'
  | 'EPISODE_BUILDER'
  | 'MASTER_ARCHIVE';

export interface SplitClipDraft {
  title: string;
  timestampRange: string;
  tags: string[];
  mascotNotes: string;
  driveFileUrl?: string;
}

export interface SubcategoryStat {
  subcategory: CategoryTag;
  totalCount: number;
  usableCount: number;
  newCount: number;
  readyCount: number;
  producibleEpisodesCount: number;
}

export interface CategoryMatrixStat {
  tag: CategoryTag;
  totalCount: number;
  newCount: number; // NEW_UNTOUCHED
  readyCount: number; // READY_FRESH
  frequentCount: number; // HIGH_VELOCITY_WARNING
  cooldownCount: number; // RECENT_COOLDOWN
  directFlowCount: number;
  splitFlowCount: number;
  // Category Production Capacity (5 Footages = 1 Episode)
  usableCount: number; // newCount + readyCount
  producibleEpisodesCount: number; // Math.floor(usableCount / 5)
  remainingForNextEp: number; // 5 - (usableCount % 5)
  allNewEpisodesCount: number; // Math.floor(newCount / 5)
  canMakeAllNew5: boolean; // newCount >= 5
  canMakeMix2New3Fresh: boolean; // newCount >= 2 && usableCount >= 5
  usableFootages: ComputedFootage[];
  allFootages: ComputedFootage[];
  // 2-Tier Hierarchy Analytics
  subcategoriesCount: number;
  subcategoryStats: SubcategoryStat[];
  varietyEpisodeQuota: number; // Maximum variety EP where 5 different entities appear
  specialEpisodeSubcategories: { subcategory: CategoryTag; count: number }[]; // Subcategories with >= 5 usable clips ready for solo EP
}

export interface BuilderPreselectRequest {
  tagId: string;
  recipeId: MixRecipeId;
  productionTarget?: EpisodeProductionTarget;
  targetSubcategoryId?: string | null;
  timestamp: number;
}

export interface CMSContextType {
  // Navigation & Global Modal States
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  selectedTagFilter: string[];
  setSelectedTagFilter: React.Dispatch<React.SetStateAction<string[]>>;
  isTagManagerOpen: boolean;
  setIsTagManagerOpen: (open: boolean) => void;
  isThreeTierManagerOpen: boolean;
  setIsThreeTierManagerOpen: (open: boolean) => void;
  isStatusRuleModalOpen: boolean;
  setIsStatusRuleModalOpen: (open: boolean) => void;
  isClearClipsModalOpen: boolean;
  setIsClearClipsModalOpen: (open: boolean) => void;
  isDirectFootageModalOpen: boolean;
  setIsDirectFootageModalOpen: (open: boolean) => void;
  isSourceSplitterModalOpen: boolean;
  setIsSourceSplitterModalOpen: (open: boolean) => void;
  activeSourceForSplitting: RawSource | null;
  openSourceSplitterFor: (source: RawSource | null) => void;
  traceabilityFootageId: string | null;
  setTraceabilityFootageId: (id: string | null) => void;
  selectedEpisodeDetailId: string | null;
  setSelectedEpisodeDetailId: (id: string | null) => void;

  // Cross-View Category Preselection for Episode Builder
  builderPreselectRequest: BuilderPreselectRequest | null;
  clearBuilderPreselectRequest: () => void;
  launchEpisodeBuilderForCategory: (
    tagId: string,
    recipeId?: MixRecipeId,
    productionTarget?: EpisodeProductionTarget,
    targetSubcategoryId?: string | null
  ) => void;

  // Data Entities & Analytics
  categoryGroups: CategoryGroup[];
  categoryGroupMap: Record<string, CategoryGroup>;
  createCategoryGroup: (name: string, icon?: string, color?: string, description?: string) => CategoryGroup;
  updateCategoryGroup: (id: string, updates: Partial<Omit<CategoryGroup, 'id'>>) => void;
  deleteCategoryGroup: (id: string) => void;
  wipeAllCategories: () => void;
  restoreDefaultCategories: () => void;
  tags: CategoryTag[];
  tagMap: Record<string, CategoryTag>;
  mainCategories: CategoryTag[];
  subcategories: CategoryTag[];
  getSubcategoriesByParent: (parentId: string) => CategoryTag[];
  sources: RawSource[];
  sourceMap: Record<string, RawSource>;
  computedFootage: ComputedFootage[];
  computedFootageMap: Record<string, ComputedFootage>;
  episodes: Episode[];
  settings: SystemSettings;
  categoryMatrix: CategoryMatrixStat[];
  untaggedFootages: ComputedFootage[];
  missingDriveFootages: ComputedFootage[];

  // Actions: Tags & Settings
  createTag: (
    name: string,
    groupType?: TagGroupType,
    color?: string,
    description?: string,
    tier?: CategoryTier,
    parentId?: string | null,
    entityType?: EntitySubtype,
    groupId?: string
  ) => CategoryTag;
  createSubcategory: (
    parentId: string,
    name: string,
    entityType?: EntitySubtype,
    color?: string,
    description?: string
  ) => CategoryTag;
  updateTag: (id: string, updates: Partial<Omit<CategoryTag, 'id'>>) => void;
  deleteTag: (id: string) => void;
  updateSettings: (updates: Partial<SystemSettings>) => void;

  // Actions: Flow A (1-to-1 Direct Footage)
  addDirectFootage: (payload: {
    title: string;
    originalUrl: string;
    tags: string[];
    driveFileUrl: string;
    mascotNotes: string;
    durationSec?: number;
  }) => Footage;

  // Actions: Flow B (1-to-N Source Splitter)
  createSourceWithSplitFootage: (
    sourcePayload: {
      title: string;
      originalUrl: string;
      platform: SourcePlatform;
      channelOrCreator: string;
      totalDuration?: string;
      tags: string[];
      notes: string;
    },
    clips: SplitClipDraft[]
  ) => { source: RawSource; createdFootage: Footage[] };

  appendSplitFootageToSource: (sourceId: string, clips: SplitClipDraft[]) => Footage[];

  // Actions: Footage Update/Delete
  updateFootage: (id: string, updates: Partial<Footage>) => void;
  deleteFootage: (id: string) => void;

  // Actions: Episodes & Master Archive
  saveEpisode: (
    episodePayload: Omit<Episode, 'id' | 'createdAt' | 'masterVideoInfo'> & {
      id?: string;
      masterVideoInfo?: Partial<MasterVideoInfo>;
    }
  ) => Episode;
  updateEpisodeWorkflowStage: (episodeId: string, stage: EpisodeWorkflowStage) => void;
  updateEpisodeMasterInfo: (episodeId: string, updates: Partial<MasterVideoInfo>) => void;
  deleteEpisode: (episodeId: string) => void;

  // Demo Reset / Production Clip Wipe
  resetDemoData: () => void;
  clearAllClips: () => Promise<void>;
  isClearingClips: boolean;

  // Cloud Database Sync
  isCloudConnected: boolean;
  isCloudSynced: boolean;
  isSeedingToCloud: boolean;
  seedToCloud: () => Promise<void>;
}
