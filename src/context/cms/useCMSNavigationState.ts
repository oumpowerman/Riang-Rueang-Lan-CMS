import { useState } from 'react';
import { EpisodeProductionTarget } from '../../types/episode.types';
import { RawSource } from '../../types/source.types';
import { MixRecipeId } from '../../utils/collisionDetector';
import { ActiveNavTab, BuilderPreselectRequest } from './cms.types';

export function useCMSNavigationState() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('DASHBOARD');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string[]>([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isThreeTierManagerOpen, setIsThreeTierManagerOpen] = useState(false);
  const [isStatusRuleModalOpen, setIsStatusRuleModalOpen] = useState(false);
  const [isClearClipsModalOpen, setIsClearClipsModalOpen] = useState(false);
  const [isDirectFootageModalOpen, setIsDirectFootageModalOpen] = useState(false);
  const [isSourceSplitterModalOpen, setIsSourceSplitterModalOpen] = useState(false);
  const [activeSourceForSplitting, setActiveSourceForSplitting] = useState<RawSource | null>(null);
  const [traceabilityFootageId, setTraceabilityFootageId] = useState<string | null>(null);
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

  const clearBuilderPreselectRequest = () => {
    setBuilderPreselectRequest(null);
  };

  return {
    activeTab,
    setActiveTab,
    selectedTagFilter,
    setSelectedTagFilter,
    isTagManagerOpen,
    setIsTagManagerOpen,
    isThreeTierManagerOpen,
    setIsThreeTierManagerOpen,
    isStatusRuleModalOpen,
    setIsStatusRuleModalOpen,
    isClearClipsModalOpen,
    setIsClearClipsModalOpen,
    isDirectFootageModalOpen,
    setIsDirectFootageModalOpen,
    isSourceSplitterModalOpen,
    setIsSourceSplitterModalOpen,
    activeSourceForSplitting,
    openSourceSplitterFor,
    traceabilityFootageId,
    setTraceabilityFootageId,
    selectedEpisodeDetailId,
    setSelectedEpisodeDetailId,
    builderPreselectRequest,
    clearBuilderPreselectRequest,
    launchEpisodeBuilderForCategory,
  };
}
