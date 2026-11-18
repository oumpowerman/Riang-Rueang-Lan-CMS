import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Episode } from '../../types/episode.types';
import { ComputedFootage } from '../../types/footage.types';
import {
  ArchiveSeriesCategory,
  CategoryTag,
  DEFAULT_ARCHIVE_SERIES_CATEGORIES,
  SystemSettings,
} from '../../types/tag.types';
import {
  SupabaseArchiveCategoryOption,
  SupabaseConnectionConfig,
  SupabaseReadinessFilter,
  SupabaseRowDraftOverride,
  SupabaseSeriesFilterOption,
  SupabaseSyncFilterPreset,
  SupabaseSyncRowState,
} from '../../types/supabaseSync.types';
import {
  fetchFullVerifyContentsForEpisodes,
  fetchSmartDeltaContentsForEpisodes,
  loadSupabaseRowDraftsAsync,
} from '../../services/supabaseService';
import {
  EpisodeCompletenessResult,
  evaluateEpisodeCompleteness,
  THAI_COLLATOR,
} from '../../utils/episodeValidator';
import {
  extractEpisodeSeriesInfo,
  resolveSeriesArchiveCategoryId,
} from '../../utils/seriesExtractor';
import {
  getEpisodeSmartSearchIndex,
  matchesSmartSearchTokens,
  parseSmartSearchQuery,
} from '../../utils/smartSearchEngine';
import { isStagingTagId } from '../../services/seedData';
import {
  buildMatchedRecordLookup,
  buildRowFromEpisode,
  findEpisodeMatchInLookup,
  mergeMatchedLookups,
  SupabaseMatchedLookup,
} from './supabaseRowMatcher';
import { useSupabaseSyncRowActions } from './useSupabaseSyncRowActions';

export type SupabaseSyncTabType = 'ALL' | 'NEW' | 'SENT' | 'DUPLICATE';

interface UseSupabaseSyncRowsParams {
  isOpen: boolean;
  episodes: Episode[];
  tagMap: Record<string, CategoryTag>;
  computedFootageMap: Record<string, ComputedFootage>;
  settings: SystemSettings;
  config: SupabaseConnectionConfig;
  rowDrafts: Record<string, SupabaseRowDraftOverride>;
  presetFilter?: SupabaseSyncFilterPreset | null;
  onConsumePresetFilter?: () => void;
  persistRowsToDrafts: (
    updatedRows: SupabaseSyncRowState[],
    currentConfig: SupabaseConnectionConfig
  ) => void;
  handleResetAllRowDrafts: () => void;
  onUpdateConfig: (updates: Partial<SupabaseConnectionConfig>) => void;
  onPersistEpisodeSyncUpdates: (updatedEpisodes: Episode[]) => Promise<void>;
}

export interface EpisodeSyncMetadata {
  seriesKey: string;
  seriesName: string;
  fullSeriesTitle: string;
  archiveCategoryId: string;
  completeness: EpisodeCompletenessResult;
  searchIndex: string;
}

export function useSupabaseSyncRows({
  isOpen,
  episodes,
  tagMap,
  computedFootageMap,
  settings,
  config,
  rowDrafts,
  presetFilter,
  onConsumePresetFilter,
  persistRowsToDrafts,
  handleResetAllRowDrafts,
  onUpdateConfig,
  onPersistEpisodeSyncUpdates,
}: UseSupabaseSyncRowsParams) {
  const [rows, setRows] = useState<SupabaseSyncRowState[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [hasCheckedThisSession, setHasCheckedThisSession] = useState(false);
  const [lastCheckSummary, setLastCheckSummary] = useState<string | null>(null);
  const [dedupProgressLabel, setDedupProgressLabel] = useState(
    'กำลังตรวจสอบความซ้ำกับฐานข้อมูล Kontent OS...'
  );

  // Granular Filters & Search
  const [activeTab, setActiveTab] = useState<SupabaseSyncTabType>('ALL');
  const [seriesFilter, setSeriesFilter] = useState<string>('ALL');
  const [archiveCategoryFilter, setArchiveCategoryFilter] =
    useState<string>('ALL');
  const [readinessFilter, setReadinessFilter] =
    useState<SupabaseReadinessFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Refs to prevent background episode mutations from interrupting active editing
  const latestEpisodesRef = useRef<Episode[]>(episodes);
  latestEpisodesRef.current = episodes;
  const latestConfigRef = useRef<SupabaseConnectionConfig>(config);
  latestConfigRef.current = config;
  const latestRowDraftsRef =
    useRef<Record<string, SupabaseRowDraftOverride>>(rowDrafts);
  latestRowDraftsRef.current = rowDrafts;

  const autoCheckRanForOpenRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const matchedRecordLookupRef = useRef<SupabaseMatchedLookup | null>(null);

  // Reset pagination when any filter or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    seriesFilter,
    archiveCategoryFilter,
    readinessFilter,
    searchQuery,
    pageSize,
  ]);

  // Apply preset filter when modal opens with context
  useEffect(() => {
    if (!isOpen) {
      autoCheckRanForOpenRef.current = false;
      setHasCheckedThisSession(false);
      setLastCheckSummary(null);
      return;
    }
    if (presetFilter) {
      setSeriesFilter(presetFilter.seriesKey || 'ALL');
      setArchiveCategoryFilter(presetFilter.archiveCategoryId || 'ALL');
      setReadinessFilter(presetFilter.readiness || 'ALL');
      setSearchQuery(presetFilter.searchQuery || '');
      setActiveTab('ALL');
      onConsumePresetFilter?.();
    }
  }, [isOpen, presetFilter, onConsumePresetFilter]);

  const archiveCategories = useMemo<ArchiveSeriesCategory[]>(() => {
    if (
      settings.archiveSeriesCategories &&
      settings.archiveSeriesCategories.length > 0
    ) {
      return settings.archiveSeriesCategories;
    }
    return DEFAULT_ARCHIVE_SERIES_CATEGORIES;
  }, [settings.archiveSeriesCategories]);

  // Precompute metadata per episode for instant filtering & Smart Search at 10,000+ scale
  const episodeMetaMap = useMemo(() => {
    const map = new Map<string, EpisodeSyncMetadata>();

    for (let i = 0; i < episodes.length; i++) {
      const ep = episodes[i];
      const seriesInfo = extractEpisodeSeriesInfo(ep, tagMap);
      const epFootageTagIds = new Set<string>();
      const epTagNames: string[] = [];

      if (ep.mainCategoryTagId && !isStagingTagId(ep.mainCategoryTagId)) {
        epFootageTagIds.add(ep.mainCategoryTagId);
        const mainName = tagMap[ep.mainCategoryTagId]?.name;
        if (mainName) epTagNames.push(mainName);
      }
      if (ep.targetSubcategoryId && !isStagingTagId(ep.targetSubcategoryId)) {
        epFootageTagIds.add(ep.targetSubcategoryId);
        const subName = tagMap[ep.targetSubcategoryId]?.name;
        if (subName) epTagNames.push(subName);
      }

      if (Array.isArray(ep.rankings)) {
        for (let rIdx = 0; rIdx < ep.rankings.length; rIdx++) {
          const ftId = ep.rankings[rIdx].footageId;
          if (!ftId) continue;
          const ft = computedFootageMap[ftId];
          if (!ft || !Array.isArray(ft.tags)) continue;
          for (let tIdx = 0; tIdx < ft.tags.length; tIdx++) {
            const tid = ft.tags[tIdx];
            if (!tid || isStagingTagId(tid)) continue;
            if (!epFootageTagIds.has(tid)) {
              epFootageTagIds.add(tid);
              const tName = tagMap[tid]?.name;
              if (tName) epTagNames.push(tName);
            }
          }
        }
      }

      const archiveCategoryId = resolveSeriesArchiveCategoryId(
        seriesInfo.seriesKey,
        seriesInfo.seriesName,
        epTagNames,
        settings.seriesToArchiveCategoryMap,
        archiveCategories
      );
      const completeness = evaluateEpisodeCompleteness(ep);
      const searchIndex = getEpisodeSmartSearchIndex(
        ep,
        tagMap,
        epFootageTagIds
      );

      map.set(ep.id, {
        seriesKey: seriesInfo.seriesKey,
        seriesName: seriesInfo.seriesName,
        fullSeriesTitle: seriesInfo.fullSeriesTitle,
        archiveCategoryId,
        completeness,
        searchIndex,
      });
    }

    return map;
  }, [
    episodes,
    tagMap,
    computedFootageMap,
    settings.seriesToArchiveCategoryMap,
    archiveCategories,
  ]);

  // Smart Incremental + Delta Check (skips already stamped SENT episodes)
  const runSmartDeltaCheck = useCallback(async () => {
    const activeConfig = latestConfigRef.current;
    if (!activeConfig.url || !activeConfig.anonKey) return;

    setIsLoadingExisting(true);
    setDedupProgressLabel(
      'กำลังตรวจเช็คเฉพาะคลิปใหม่ & รายการอัปเดตล่าสุด (Delta)...'
    );

    try {
      const result = await fetchSmartDeltaContentsForEpisodes(
        activeConfig,
        latestEpisodesRef.current,
        activeConfig.lastDedupCheckedAt,
        (info) => {
          if (isOpenRef.current) setDedupProgressLabel(info.label);
        }
      );

      const incomingLookup = buildMatchedRecordLookup(result.records);
      const mergedLookup = mergeMatchedLookups(
        matchedRecordLookupRef.current,
        incomingLookup
      );
      matchedRecordLookupRef.current = mergedLookup;

      const latestDrafts = await loadSupabaseRowDraftsAsync();
      const currentEpisodes = latestEpisodesRef.current;
      const checkedAtIso = new Date().toISOString();
      const backfillEpisodes: Episode[] = [];

      const rebuiltRows = currentEpisodes.map((ep) => {
        const outcome = findEpisodeMatchInLookup(ep, mergedLookup);
        let workingEp = ep;

        // Auto-stamp `[EP_REF:<id>]` match back onto Episode so future checks skip it!
        if (
          !ep.supabaseSyncInfo?.recordId &&
          outcome.matchedViaEpRef &&
          outcome.matchedRecord?.id
        ) {
          workingEp = {
            ...ep,
            supabaseSyncInfo: {
              recordId: String(outcome.matchedRecord.id),
              syncedAt: outcome.matchedRecord.created_at || checkedAtIso,
              channelId: outcome.matchedRecord.channel_id || '',
              status: outcome.matchedRecord.status || '',
            },
          };
          backfillEpisodes.push(workingEp);
        }

        return buildRowFromEpisode(
          workingEp,
          activeConfig,
          latestDrafts[ep.id],
          outcome
        );
      });

      if (isOpenRef.current) {
        setRows(rebuiltRows);
        setHasCheckedThisSession(true);
        setLastCheckSummary(
          result.checkedEpisodesCount === 0
            ? 'คลิปทั้งหมดมีรหัสส่งแล้ว (ดึง Delta ล่าสุดเรียบร้อย)'
            : `เช็ค ${result.checkedEpisodesCount.toLocaleString()} คลิปใหม่ + Delta ล่าสุดเรียบร้อย`
        );
      }

      if (backfillEpisodes.length > 0) {
        void onPersistEpisodeSyncUpdates(backfillEpisodes);
      }

      onUpdateConfig({ lastDedupCheckedAt: checkedAtIso });
    } catch (err) {
      console.error('Failed to run Smart Delta check:', err);
    } finally {
      if (isOpenRef.current) {
        setIsLoadingExisting(false);
      }
    }
  }, [onPersistEpisodeSyncUpdates, onUpdateConfig]);

  // Full Re-Verify Check (scans ALL episodes & verifies stamped SENT records still exist)
  const runFullVerifyCheck = useCallback(async () => {
    const activeConfig = latestConfigRef.current;
    if (!activeConfig.url || !activeConfig.anonKey) return;

    setIsLoadingExisting(true);
    setDedupProgressLabel(
      'กำลังสแกนเทียบทั้งฐานข้อมูลและทวนสอบคลิปที่ส่งแล้ว...'
    );

    try {
      const result = await fetchFullVerifyContentsForEpisodes(
        activeConfig,
        latestEpisodesRef.current,
        (info) => {
          if (isOpenRef.current) setDedupProgressLabel(info.label);
        }
      );

      const fullLookup = buildMatchedRecordLookup(result.records);
      matchedRecordLookupRef.current = fullLookup;

      const latestDrafts = await loadSupabaseRowDraftsAsync();
      const currentEpisodes = latestEpisodesRef.current;
      const checkedAtIso = new Date().toISOString();
      const episodesToPersist: Episode[] = [];

      const rebuiltRows = currentEpisodes.map((ep) => {
        const outcome = findEpisodeMatchInLookup(ep, fullLookup);
        let workingEp = ep;

        if (ep.supabaseSyncInfo?.recordId) {
          // Verify existing stamp wasn't deleted in Kontent OS
          const stillExistsById = result.verifiedStampedIds.has(
            ep.supabaseSyncInfo.recordId
          );
          if (
            result.verificationSucceeded &&
            !stillExistsById &&
            !outcome.matchedRecord
          ) {
            const { supabaseSyncInfo: _removed, ...rest } = ep;
            workingEp = rest;
            episodesToPersist.push(workingEp);
          }
        } else if (outcome.matchedViaEpRef && outcome.matchedRecord?.id) {
          workingEp = {
            ...ep,
            supabaseSyncInfo: {
              recordId: String(outcome.matchedRecord.id),
              syncedAt: outcome.matchedRecord.created_at || checkedAtIso,
              channelId: outcome.matchedRecord.channel_id || '',
              status: outcome.matchedRecord.status || '',
            },
          };
          episodesToPersist.push(workingEp);
        }

        return buildRowFromEpisode(
          workingEp,
          activeConfig,
          latestDrafts[ep.id],
          outcome
        );
      });

      if (isOpenRef.current) {
        setRows(rebuiltRows);
        setHasCheckedThisSession(true);
        setLastCheckSummary(
          `ทวนสอบทั้งฐานข้อมูลครบ ${currentEpisodes.length.toLocaleString()} เรื่องเรียบร้อย`
        );
      }

      if (episodesToPersist.length > 0) {
        void onPersistEpisodeSyncUpdates(episodesToPersist);
      }

      onUpdateConfig({ lastDedupCheckedAt: checkedAtIso });
    } catch (err) {
      console.error('Failed to run Full Verify check:', err);
    } finally {
      if (isOpenRef.current) {
        setIsLoadingExisting(false);
      }
    }
  }, [onPersistEpisodeSyncUpdates, onUpdateConfig]);

  // Instant 0ms local hydration on modal open + conditional auto-check
  useEffect(() => {
    if (!isOpen) return;
    setCurrentPage(1);

    let cancelled = false;
    void loadSupabaseRowDraftsAsync().then((latestDrafts) => {
      if (cancelled) return;
      const activeConfig = latestConfigRef.current;
      const lookup = matchedRecordLookupRef.current;
      const hydratedRows = latestEpisodesRef.current.map((ep) =>
        buildRowFromEpisode(
          ep,
          activeConfig,
          latestDrafts[ep.id],
          findEpisodeMatchInLookup(ep, lookup)
        )
      );
      setRows(hydratedRows);

      if (
        activeConfig.url &&
        activeConfig.anonKey &&
        activeConfig.autoCheckOnModalOpen &&
        !autoCheckRanForOpenRef.current
      ) {
        autoCheckRanForOpenRef.current = true;
        void runSmartDeltaCheck();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, config.url, config.anonKey, runSmartDeltaCheck]);

  // Reconcile background `episodes` mutations (including newly stamped receipts) smoothly
  useEffect(() => {
    if (!isOpen || isLoadingExisting || rows.length === 0) return;

    const epById = new Map<string, Episode>();
    episodes.forEach((ep) => epById.set(ep.id, ep));

    let changed = false;
    const nextRows: SupabaseSyncRowState[] = [];
    const seenIds = new Set<string>();
    const lookup = matchedRecordLookupRef.current;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const latestEp = epById.get(r.episode.id);
      if (!latestEp) {
        changed = true;
        continue;
      }
      seenIds.add(r.episode.id);
      if (latestEp !== r.episode) {
        changed = true;
        const stampChanged =
          latestEp.supabaseSyncInfo?.recordId !==
          r.episode.supabaseSyncInfo?.recordId;
        if (stampChanged && latestEp.supabaseSyncInfo?.recordId) {
          nextRows.push({
            ...r,
            episode: latestEp,
            matchStatus: 'SENT',
            existingRecordId: latestEp.supabaseSyncInfo.recordId,
            existingCreatedAt: latestEp.supabaseSyncInfo.syncedAt,
            existingStatus: latestEp.supabaseSyncInfo.status,
            isSelected:
              typeof latestRowDraftsRef.current[latestEp.id]?.isSelected ===
              'boolean'
                ? r.isSelected
                : false,
          });
        } else {
          nextRows.push({ ...r, episode: latestEp });
        }
      } else {
        nextRows.push(r);
      }
    }

    if (seenIds.size < episodes.length) {
      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        if (!seenIds.has(ep.id)) {
          changed = true;
          nextRows.push(
            buildRowFromEpisode(
              ep,
              latestConfigRef.current,
              latestRowDraftsRef.current[ep.id],
              findEpisodeMatchInLookup(ep, lookup)
            )
          );
        }
      }
    }

    if (changed) {
      setRows(nextRows);
    }
  }, [episodes, isOpen, isLoadingExisting]);

  // Apply real-time Cloud rowDrafts onto existing rows when another device edits
  useEffect(() => {
    if (!isOpen || rows.length === 0 || isLoadingExisting) return;

    setRows((prev) =>
      prev.map((row) => {
        const draft = rowDrafts[row.episode.id];
        if (!draft) return row;

        return {
          ...row,
          isSelected:
            typeof draft.isSelected === 'boolean'
              ? draft.isSelected
              : row.isSelected,
          channelId:
            typeof draft.channelId === 'string'
              ? draft.channelId
              : row.channelId,
          status: typeof draft.status === 'string' ? draft.status : row.status,
          targetPlatforms:
            Array.isArray(draft.targetPlatforms) &&
            draft.targetPlatforms.length > 0
              ? draft.targetPlatforms
              : row.targetPlatforms,
          includeAssets:
            typeof draft.includeAssets === 'boolean'
              ? draft.includeAssets
              : row.includeAssets,
          includePillar:
            typeof draft.includePillar === 'boolean'
              ? draft.includePillar
              : row.includePillar,
          includeCategory:
            typeof draft.includeCategory === 'boolean'
              ? draft.includeCategory
              : row.includeCategory,
          description:
            typeof draft.description === 'string'
              ? draft.description
              : row.description,
          upsertMode:
            draft.upsertMode === 'UPDATE' || draft.upsertMode === 'SKIP'
              ? draft.upsertMode
              : row.upsertMode,
        };
      })
    );
  }, [rowDrafts, isOpen]);

  // Build dropdown options for Series & Archive Category & Readiness counts
  const { seriesFilterOptions, archiveCategoryOptions, readinessCounts } =
    useMemo(() => {
      const seriesCountMap = new Map<string, SupabaseSeriesFilterOption>();
      const catCountMap = new Map<string, number>();
      let readyCount = 0;
      let missingDriveCount = 0;
      let incompleteSlotsCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const meta = episodeMetaMap.get(rows[i].episode.id);
        if (!meta) continue;

        const existingSeries = seriesCountMap.get(meta.seriesKey);
        if (existingSeries) {
          existingSeries.count += 1;
        } else {
          seriesCountMap.set(meta.seriesKey, {
            seriesKey: meta.seriesKey,
            seriesName: meta.seriesName,
            fullSeriesTitle: meta.fullSeriesTitle,
            count: 1,
          });
        }

        catCountMap.set(
          meta.archiveCategoryId,
          (catCountMap.get(meta.archiveCategoryId) || 0) + 1
        );

        if (
          meta.completeness.hasFullFiveSlots &&
          meta.completeness.hasRealMasterDrive
        ) {
          readyCount++;
        }
        if (!meta.completeness.hasRealMasterDrive) {
          missingDriveCount++;
        }
        if (!meta.completeness.hasFullFiveSlots) {
          incompleteSlotsCount++;
        }
      }

      const sortedSeries = Array.from(seriesCountMap.values()).sort((a, b) =>
        THAI_COLLATOR.compare(a.seriesName, b.seriesName)
      );

      const categoryOptions: SupabaseArchiveCategoryOption[] =
        archiveCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          count: catCountMap.get(cat.id) || 0,
        }));

      return {
        seriesFilterOptions: sortedSeries,
        archiveCategoryOptions: categoryOptions,
        readinessCounts: {
          readyCount,
          missingDriveCount,
          incompleteSlotsCount,
        },
      };
    }, [rows, episodeMetaMap, archiveCategories]);

  // Filtered rows (Tabs + Series + Archive Category + Readiness + Smart Search)
  const filteredRows = useMemo(() => {
    const queryTokens = parseSmartSearchQuery(searchQuery);
    const hasQuery = queryTokens.length > 0;

    return rows.filter((r) => {
      if (activeTab === 'NEW' && r.matchStatus !== 'NEW') return false;
      if (activeTab === 'SENT' && r.matchStatus !== 'SENT') return false;
      if (activeTab === 'DUPLICATE' && r.matchStatus !== 'DUPLICATE')
        return false;

      const meta = episodeMetaMap.get(r.episode.id);
      if (meta) {
        if (seriesFilter !== 'ALL' && meta.seriesKey !== seriesFilter) {
          return false;
        }
        if (
          archiveCategoryFilter !== 'ALL' &&
          meta.archiveCategoryId !== archiveCategoryFilter
        ) {
          return false;
        }
        if (readinessFilter === 'READY_ONLY') {
          if (
            !meta.completeness.hasFullFiveSlots ||
            !meta.completeness.hasRealMasterDrive
          ) {
            return false;
          }
        } else if (readinessFilter === 'MISSING_DRIVE') {
          if (meta.completeness.hasRealMasterDrive) return false;
        } else if (readinessFilter === 'INCOMPLETE_SLOTS') {
          if (meta.completeness.hasFullFiveSlots) return false;
        }

        if (
          hasQuery &&
          !matchesSmartSearchTokens(meta.searchIndex, queryTokens)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    rows,
    activeTab,
    seriesFilter,
    archiveCategoryFilter,
    readinessFilter,
    searchQuery,
    episodeMetaMap,
  ]);

  const hasActiveFilters =
    activeTab !== 'ALL' ||
    seriesFilter !== 'ALL' ||
    archiveCategoryFilter !== 'ALL' ||
    readinessFilter !== 'ALL' ||
    searchQuery.trim().length > 0;

  const resetAllFilters = useCallback(() => {
    setActiveTab('ALL');
    setSeriesFilter('ALL');
    setArchiveCategoryFilter('ALL');
    setReadinessFilter('ALL');
    setSearchQuery('');
  }, []);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safeCurrentPage, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const filteredIdSet = new Set(filteredRows.map((r) => r.episode.id));
    let newCount = 0;
    let sentCount = 0;
    let duplicateCount = 0;
    let unstampedCount = 0;
    let selectedCount = 0;
    let selectedNewCount = 0;
    let selectedDupUpdateCount = 0;
    let selectedInFilteredCount = 0;
    let selectedOutsideFilterCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.episode.supabaseSyncInfo?.recordId) unstampedCount++;

      if (r.matchStatus === 'NEW') newCount++;
      else if (r.matchStatus === 'SENT') sentCount++;
      else duplicateCount++;

      if (r.isSelected) {
        selectedCount++;
        if (r.matchStatus === 'NEW') selectedNewCount++;
        else if (r.upsertMode === 'UPDATE') selectedDupUpdateCount++;

        if (filteredIdSet.has(r.episode.id)) {
          selectedInFilteredCount++;
        } else {
          selectedOutsideFilterCount++;
        }
      }
    }

    return {
      total: rows.length,
      filteredCount: filteredRows.length,
      newCount,
      sentCount,
      duplicateCount,
      unstampedCount,
      selectedCount,
      selectedNewCount,
      selectedDupUpdateCount,
      selectedInFilteredCount,
      selectedOutsideFilterCount,
    };
  }, [rows, filteredRows]);

  const rowActions = useSupabaseSyncRowActions({
    config,
    filteredRows,
    setRows,
    persistRowsToDrafts,
    handleResetAllRowDrafts,
    onPersistEpisodeSyncUpdates,
    matchedRecordLookupRef,
  });

  return {
    rows,
    filteredRows,
    paginatedRows,
    episodeMetaMap,
    isLoadingExisting,
    hasCheckedThisSession,
    lastCheckSummary,
    dedupProgressLabel,
    runSmartDeltaCheck,
    runFullVerifyCheck,
    activeTab,
    setActiveTab,
    seriesFilter,
    setSeriesFilter,
    archiveCategoryFilter,
    setArchiveCategoryFilter,
    readinessFilter,
    setReadinessFilter,
    searchQuery,
    setSearchQuery,
    seriesFilterOptions,
    archiveCategoryOptions,
    readinessCounts,
    hasActiveFilters,
    resetAllFilters,
    currentPage: safeCurrentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    stats,
    ...rowActions,
  };
}
