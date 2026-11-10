import { useState } from 'react';
import { EpisodeProductionTarget } from '../../types/episode.types';
import { RawSource } from '../../types/source.types';
import { MixRecipeId } from '../../utils/collisionDetector';
import { ActiveNavTab, BuilderPreselectRequest } from './cms.types';

export function useCMSNavigationState() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('DASHBOARD');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string[]>([]);
  // Unified Tag Studio & Cooldown Rules Modal state
  const [isThreeTierManagerOpen, setIsThreeTierManagerOpen] = useState(false);
  const [threeTierStudioTab, setThreeTierStudioTab] =
    useState<'STUDIO_3TIER' | 'COOLDOWN_RULES'>('STUDIO_3TIER');

  const openThreeTierStudio = (tab: 'STUDIO_3TIER' | 'COOLDOWN_RULES' = 'STUDIO_3TIER') => {
    setThreeTierStudioTab(tab);
    setIsThreeTierManagerOpen(true);
  };

  const isStatusRuleModalOpen = isThreeTierManagerOpen && threeTierStudioTab === 'COOLDOWN_RULES';
  const setIsStatusRuleModalOpen = (open: boolean) => {
    if (open) {
      openThreeTierStudio('COOLDOWN_RULES');
    } else {
      setIsThreeTierManagerOpen(false);
    }
  };

  const [isClearClipsModalOpen, setIsClearClipsModalOpen] = useState(false);
  const [isDirectFootageModalOpen, setIsDirectFootageModalOpen] = useState(false);
  const [isGoogleDriveBatchModalOpen, setIsGoogleDriveBatchModalOpen] = useState(false);
  const [isBatchAssignCategoryModalOpen, setIsBatchAssignCategoryModalOpen] = useState(false);
  const [isSheetTagImportModalOpen, setIsSheetTagImportModalOpen] = useState(false);
  const [isYouTubeDateSyncModalOpen, setIsYouTubeDateSyncModalOpen] = useState(false);
  const [isSupabaseSyncModalOpen, setIsSupabaseSyncModalOpen] = useState(false);
  const [isSupabaseConfigModalOpen, setIsSupabaseConfigModalOpen] = useState(false);
  const [selectedFootageIdsForBatch, setSelectedFootageIdsForBatch] = useState<string[]>([]);
  const [activeDragFootageIds, setActiveDragFootageIds] = useState<string[]>([]);
  const [lastSelectedFootageId, setLastSelectedFootageId] = useState<string | null>(null);
  const [isSourceSplitterModalOpen, setIsSourceSplitterModalOpen] = useState(false);
  const [activeSourceForSplitting, setActiveSourceForSplitting] = useState<RawSource | null>(null);
  const [traceabilityFootageId, setTraceabilityFootageId] = useState<string | null>(null);
  const [previewFootageId, setPreviewFootageId] = useState<string | null>(null);
  const [selectedEpisodeDetailId, setSelectedEpisodeDetailId] = useState<string | null>(null);
  const [builderPreselectRequest, setBuilderPreselectRequest] =
    useState<BuilderPreselectRequest | null>(null);

  const openSourceSplitterFor = (source: RawSource | null) => {
    setActiveSourceForSplitting(source);
    setIsSourceSplitterModalOpen(true);
  };

  const launchEpisodeBuilderForCategory = (
    tagId: string,
    recipeId: MixRecipeId = 'FORMULA_2_NEW_3_FRESH',
    productionTarget?: EpisodeProductionTarget,
    targetSubcategoryId?: string | null
  ) => {
    setBuilderPreselectRequest({
      tagId,
      recipeId,
      productionTarget,
      targetSubcategoryId,
      timestamp: Date.now(),
    });
    setActiveTab('EPISODE_BUILDER');
  };

  const launchEpisodeBuilderWithCustomClips = (
    footageIds: string[],
    tagId = 'TAG-0001',
    customEpisodeTitle?: string
  ) => {
    setBuilderPreselectRequest({
      tagId,
      recipeId: 'FORMULA_2_NEW_3_FRESH',
      customFootageIds: footageIds.slice(0, 5),
      customEpisodeTitle,
      timestamp: Date.now(),
    });
    setActiveTab('EPISODE_BUILDER');
  };

  const clearBuilderPreselectRequest = () => {
    setBuilderPreselectRequest(null);
  };

  return {
    activeTab,
    setActiveTab,
    selectedTagFilter,
    setSelectedTagFilter,
    // Both isTagManagerOpen and isThreeTierManagerOpen route to the unified Studio Modal
    isTagManagerOpen: isThreeTierManagerOpen,
    setIsTagManagerOpen: setIsThreeTierManagerOpen,
    isThreeTierManagerOpen,
    setIsThreeTierManagerOpen,
    threeTierStudioTab,
    setThreeTierStudioTab,
    openThreeTierStudio,
    isStatusRuleModalOpen,
    setIsStatusRuleModalOpen,
    isClearClipsModalOpen,
    setIsClearClipsModalOpen,
    isDirectFootageModalOpen,
    setIsDirectFootageModalOpen,
    isGoogleDriveBatchModalOpen,
    setIsGoogleDriveBatchModalOpen,
    isBatchAssignCategoryModalOpen,
    setIsBatchAssignCategoryModalOpen,
    isSheetTagImportModalOpen,
    setIsSheetTagImportModalOpen,
    isYouTubeDateSyncModalOpen,
    setIsYouTubeDateSyncModalOpen,
    isSupabaseSyncModalOpen,
    setIsSupabaseSyncModalOpen,
    isSupabaseConfigModalOpen,
    setIsSupabaseConfigModalOpen,
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
    activeDragFootageIds,
    setActiveDragFootageIds,
    lastSelectedFootageId,
    setLastSelectedFootageId,
    isSourceSplitterModalOpen,
    setIsSourceSplitterModalOpen,
    activeSourceForSplitting,
    openSourceSplitterFor,
    traceabilityFootageId,
    setTraceabilityFootageId,
    previewFootageId,
    setPreviewFootageId,
    selectedEpisodeDetailId,
    setSelectedEpisodeDetailId,
    builderPreselectRequest,
    clearBuilderPreselectRequest,
    launchEpisodeBuilderForCategory,
    launchEpisodeBuilderWithCustomClips,
  };
}
