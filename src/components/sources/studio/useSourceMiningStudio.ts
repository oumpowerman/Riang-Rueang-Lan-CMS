import { useEffect, useMemo, useState } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { RawSource } from '../../../types/source.types';
import {
  MiningQuickFilter,
  PlatformFilterOption,
  SourceMiningKpis,
  SourceSortOption,
} from './sourceStudio.types';

export const useSourceMiningStudio = () => {
  const {
    sources,
    tags,
    categoryGroups,
    computedFootageMap,
    tagMap,
    settings,
    openSourceSplitterFor,
    setTraceabilityFootageId,
    launchEpisodeBuilderForCategory,
    launchEpisodeBuilderWithCustomClips,
  } = useCMS();

  // Filter & Sort state for Parent Sources
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilterOption>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [miningFilter, setMiningFilter] = useState<MiningQuickFilter>('ALL');
  const [underMinedThreshold, setUnderMinedThreshold] = useState<number>(3); // Default: < 3 clips (0-2 clips)
  const [sortBy, setSortBy] = useState<SourceSortOption>('NEWEST');

  // Google Drive 1:N Modal state
  const [isDrive1ToNOpen, setIsDrive1ToNOpen] = useState(false);

  // Selected child clips per source for direct hand-off to Episode Builder (Dimension 5)
  const [selectedClipIdsBySource, setSelectedClipIdsBySource] = useState<
    Record<string, string[]>
  >({});

  // Parent Source Pagination
  const [sourcePage, setSourcePage] = useState(1);
  const [sourcePageSize, setSourcePageSize] = useState(3);

  // Child Split-Footage Pagination per Source ID
  const [childPageMap, setChildPageMap] = useState<Record<string, number>>({});
  const [childPageSize, setChildPageSize] = useState(4);

  useEffect(() => {
    setSourcePage(1);
  }, [
    searchQuery,
    platformFilter,
    selectedGroupId,
    selectedTags,
    miningFilter,
    underMinedThreshold,
    sortBy,
  ]);

  // Helper: check if a source or any of its split child clips has a tag
  const sourceMatchesTagDeep = (src: RawSource, tagId: string): boolean => {
    if (src.tags.includes(tagId)) return true;
    return src.splitFootageIds.some((fid: string) => {
      const ft = computedFootageMap[fid];
      return ft ? ft.tags.includes(tagId) : false;
    });
  };

  // Compute source count per tag (deep matching: parent source + split child clips)
  const tagSourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tag of tags) {
      counts[tag.id] = sources.filter((src) => sourceMatchesTagDeep(src, tag.id)).length;
    }
    return counts;
  }, [tags, sources, computedFootageMap]);

  // Compute KPI metrics (Dimension 2)
  const miningKpis = useMemo<SourceMiningKpis>(() => {
    const totalSources = sources.length;
    let totalSplitClips = 0;
    let totalReadySplitClips = 0;
    let underMinedSourcesCount = 0;
    let sourcesWithReadyClipsCount = 0;

    for (const src of sources) {
      const children = src.splitFootageIds
        .map((fid) => computedFootageMap[fid])
        .filter(Boolean);
      const count = children.length;
      totalSplitClips += count;

      if (count < underMinedThreshold) {
        underMinedSourcesCount += 1;
      }

      const readyCount = children.filter(
        (ft) =>
          ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH'
      ).length;
      totalReadySplitClips += readyCount;
      if (readyCount > 0) {
        sourcesWithReadyClipsCount += 1;
      }
    }

    const avgYield =
      totalSources > 0 ? (totalSplitClips / totalSources).toFixed(1) : '0.0';

    return {
      totalSources,
      totalSplitClips,
      avgYield,
      underMinedSourcesCount,
      totalReadySplitClips,
      sourcesWithReadyClipsCount,
    };
  }, [sources, computedFootageMap, underMinedThreshold]);

  // Filter tags for the 3-Tier Compact Bar (Dimension 1)
  const visibleTagsForBar = useMemo(() => {
    const groupFiltered =
      selectedGroupId === 'ALL'
        ? tags
        : tags.filter((t) => t.groupId === selectedGroupId);

    const activeOnly = groupFiltered.filter(
      (t) => (tagSourceCounts[t.id] || 0) > 0 || selectedTags.includes(t.id)
    );

    if (showAllTags) {
      return [...groupFiltered].sort(
        (a, b) => (tagSourceCounts[b.id] || 0) - (tagSourceCounts[a.id] || 0)
      );
    }

    return activeOnly.sort(
      (a, b) => (tagSourceCounts[b.id] || 0) - (tagSourceCounts[a.id] || 0)
    );
  }, [tags, selectedGroupId, tagSourceCounts, selectedTags, showAllTags]);

  const hiddenZeroTagCount = useMemo(() => {
    const groupFiltered =
      selectedGroupId === 'ALL'
        ? tags
        : tags.filter((t) => t.groupId === selectedGroupId);
    const activeCount = groupFiltered.filter(
      (t) => (tagSourceCounts[t.id] || 0) > 0 || selectedTags.includes(t.id)
    ).length;
    return Math.max(0, groupFiltered.length - activeCount);
  }, [tags, selectedGroupId, tagSourceCounts, selectedTags]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPlatformFilter('ALL');
    setSelectedGroupId('ALL');
    setSelectedTags([]);
    setMiningFilter('ALL');
    setSortBy('NEWEST');
    setSourcePage(1);
  };

  const filteredAndSortedSources = useMemo(() => {
    const filtered = sources.filter((src) => {
      if (platformFilter !== 'ALL' && src.platform !== platformFilter) return false;

      const children = src.splitFootageIds
        .map((fid) => computedFootageMap[fid])
        .filter(Boolean);

      // Mining KPI quick filter
      if (miningFilter === 'UNDER_MINED' && children.length >= underMinedThreshold) {
        return false;
      }
      if (miningFilter === 'HAS_READY_CLIPS') {
        const hasReady = children.some(
          (ft) =>
            ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH'
        );
        if (!hasReady) return false;
      }

      // Group filter (matches parent tag or child clip tag in that group)
      if (selectedGroupId !== 'ALL') {
        const groupTagIds = new Set(
          tags.filter((t) => t.groupId === selectedGroupId).map((t) => t.id)
        );
        const inParent = src.tags.some((tid) => groupTagIds.has(tid));
        const inChild = children.some((ft) => ft.tags.some((tid) => groupTagIds.has(tid)));
        if (!inParent && !inChild) return false;
      }

      // Selected Tags filter (Deep match: parent source OR child split footage)
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some((tid) => sourceMatchesTagDeep(src, tid));
        if (!hasTag) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inId = src.id.toLowerCase().includes(q);
        const inTitle = src.title.toLowerCase().includes(q);
        const inCreator = src.channelOrCreator.toLowerCase().includes(q);
        const inNotes = src.notes.toLowerCase().includes(q);
        const inChildClip = children.some(
          (ft) =>
            ft.id.toLowerCase().includes(q) ||
            ft.title.toLowerCase().includes(q) ||
            (ft.mascotNotes && ft.mascotNotes.toLowerCase().includes(q))
        );
        if (!inId && !inTitle && !inCreator && !inNotes && !inChildClip) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'MOST_CLIPS') {
        return b.splitFootageIds.length - a.splitFootageIds.length;
      }
      if (sortBy === 'LEAST_MINED') {
        return a.splitFootageIds.length - b.splitFootageIds.length;
      }
      if (sortBy === 'MOST_USABLE') {
        const usableA = a.splitFootageIds.filter((fid) => {
          const ft = computedFootageMap[fid];
          return (
            ft &&
            (ft.cooldownStatus === 'NEW_UNTOUCHED' ||
              ft.cooldownStatus === 'READY_FRESH')
          );
        }).length;
        const usableB = b.splitFootageIds.filter((fid) => {
          const ft = computedFootageMap[fid];
          return (
            ft &&
            (ft.cooldownStatus === 'NEW_UNTOUCHED' ||
              ft.cooldownStatus === 'READY_FRESH')
          );
        }).length;
        return usableB - usableA;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [
    sources,
    platformFilter,
    miningFilter,
    underMinedThreshold,
    selectedGroupId,
    selectedTags,
    searchQuery,
    sortBy,
    computedFootageMap,
    tags,
  ]);

  const paginatedSources = useMemo(() => {
    const start = (sourcePage - 1) * sourcePageSize;
    return filteredAndSortedSources.slice(start, start + sourcePageSize);
  }, [filteredAndSortedSources, sourcePage, sourcePageSize]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    platformFilter !== 'ALL' ||
    selectedGroupId !== 'ALL' ||
    selectedTags.length > 0 ||
    miningFilter !== 'ALL';

  // Toggle selection of a child clip for Episode Builder hand-off
  const handleToggleSelectClip = (sourceId: string, footageId: string) => {
    setSelectedClipIdsBySource((prev) => {
      const current = prev[sourceId] || [];
      if (current.includes(footageId)) {
        return { ...prev, [sourceId]: current.filter((id) => id !== footageId) };
      }
      if (current.length >= 5) {
        return { ...prev, [sourceId]: [...current.slice(1), footageId] };
      }
      return { ...prev, [sourceId]: [...current, footageId] };
    });
  };

  const handleSelectTop5ReadyInSource = (src: RawSource) => {
    const readyIds = src.splitFootageIds
      .map((fid: string) => computedFootageMap[fid])
      .filter(
        (ft) =>
          Boolean(ft) &&
          (ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH')
      )
      .slice(0, 5)
      .map((ft) => ft.id);

    setSelectedClipIdsBySource((prev) => ({
      ...prev,
      [src.id]: readyIds,
    }));
  };

  const handleChildPageChange = (sourceId: string, page: number) => {
    setChildPageMap((prev) => ({ ...prev, [sourceId]: page }));
  };

  return {
    // Global context data & actions
    tags,
    categoryGroups,
    computedFootageMap,
    tagMap,
    settings,
    openSourceSplitterFor,
    setTraceabilityFootageId,
    launchEpisodeBuilderForCategory,
    launchEpisodeBuilderWithCustomClips,

    // Filter & sort states
    searchQuery,
    setSearchQuery,
    platformFilter,
    setPlatformFilter,
    selectedGroupId,
    setSelectedGroupId,
    selectedTags,
    showAllTags,
    setShowAllTags,
    miningFilter,
    setMiningFilter,
    underMinedThreshold,
    setUnderMinedThreshold,
    sortBy,
    setSortBy,

    // Modal state
    isDrive1ToNOpen,
    setIsDrive1ToNOpen,

    // Selection & pagination states
    selectedClipIdsBySource,
    sourcePage,
    setSourcePage,
    sourcePageSize,
    setSourcePageSize,
    childPageMap,
    childPageSize,
    setChildPageSize,

    // Computed data
    tagSourceCounts,
    miningKpis,
    visibleTagsForBar,
    hiddenZeroTagCount,
    filteredAndSortedSources,
    paginatedSources,
    hasActiveFilters,

    // Handlers
    handleToggleTag,
    handleResetFilters,
    handleToggleSelectClip,
    handleSelectTop5ReadyInSource,
    handleChildPageChange,
  };
};
