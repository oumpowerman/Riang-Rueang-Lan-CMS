import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Settings,
  Cloud,
} from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import { useCMS } from '../../context/CMSContext';
import {
  SupabaseContentPayload,
  SupabaseSyncProgress,
  SupabaseSyncReport,
  SupabaseSyncRowState,
} from '../../types/supabaseSync.types';
import {
  batchSyncToSupabase,
  fetchExistingContentsForEpisodes,
  loadSupabaseRowDrafts,
} from '../../services/supabaseService';
import {
  extractEpRefFromRemark,
  mapEpisodeToSupabasePayload,
} from '../../utils/supabasePayloadMapper';
import { SupabaseSyncRowView } from './SupabaseSyncRowView';
import { SupabasePayloadPreviewModal } from './SupabasePayloadPreviewModal';
import { SupabaseSyncProgressView } from './SupabaseSyncProgressView';
import { SupabaseSyncReportView } from './SupabaseSyncReportView';
import { SupabasePaginationBar } from './SupabasePaginationBar';
import { SupabaseSyncToolbar } from './SupabaseSyncToolbar';
import { useSupabaseCloudSync } from './useSupabaseCloudSync';

interface SupabaseContentSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig: () => void;
}

export const SupabaseContentSyncModal: React.FC<
  SupabaseContentSyncModalProps
> = ({ isOpen, onClose, onOpenConfig }) => {
  const { episodes } = useCMS();

  // Real-time Cloud Sync of Supabase connection config & per-row draft overrides
  const {
    config,
    rowDrafts,
    isCloudSynced,
    persistRowsToDrafts,
    handleResetAllRowDrafts,
  } = useSupabaseCloudSync(isOpen);

  const [rows, setRows] = useState<SupabaseSyncRowState[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [dedupProgressLabel, setDedupProgressLabel] = useState(
    'กำลังตรวจสอบความซ้ำกับฐานข้อมูล Supabase...'
  );

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEW' | 'DUPLICATE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination for 10,000+ Enterprise Scale
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Processing & Reports
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<SupabaseSyncProgress | null>(null);
  const [report, setReport] = useState<SupabaseSyncReport | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // Preview Modal
  const [previewPayload, setPreviewPayload] =
    useState<SupabaseContentPayload | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const isConfigured = Boolean(config.url && config.anonKey);

  // Reset pagination to page 1 when filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, pageSize]);

  // Apply real-time rowDrafts from Cloud onto existing rows if another device edits a row while modal is open
  useEffect(() => {
    if (!isOpen || rows.length === 0 || isLoadingExisting || isProcessing) return;

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

  // Load existing contents using Chunked Batch Deduplication on open or when config changes
  useEffect(() => {
    if (!isOpen) return;

    setProgress(null);
    setReport(null);
    setSyncErrorMessage(null);
    setIsProcessing(false);
    setCurrentPage(1);

    if (!config.url || !config.anonKey) {
      setRows([]);
      return;
    }

    const runDeduplicationCheck = async () => {
      setIsLoadingExisting(true);
      setDedupProgressLabel('กำลังตรวจสอบความซ้ำแบบ Batch กับฐานข้อมูล Supabase...');
      try {
        const existingRecords = await fetchExistingContentsForEpisodes(
          config,
          episodes,
          config.targetChannelId,
          (info) => {
            setDedupProgressLabel(info.label);
          }
        );

        // Build 3-layer O(1) lookup maps:
        // 1. Immutable EP Reference ID ([EP_REF:<id>] in remark)
        // 2. Normalized Title
        // 3. Published Links (YouTube / Google Drive)
        const epRefMap = new Map<string, any>();
        const titleMap = new Map<string, any>();
        const linkMap = new Map<string, any>();

        existingRecords.forEach((rec) => {
          const epRef = extractEpRefFromRemark(rec.remark);
          if (epRef) {
            epRefMap.set(epRef, rec);
          }
          if (rec.title) {
            titleMap.set(rec.title.trim().toLowerCase(), rec);
          }
          if (rec.published_links) {
            Object.values(rec.published_links).forEach((url) => {
              if (typeof url === 'string' && url.trim()) {
                linkMap.set(url.trim(), rec);
              }
            });
          }
          if (Array.isArray(rec.assets)) {
            rec.assets.forEach((ast: any) => {
              if (ast && typeof ast.url === 'string' && ast.url.trim()) {
                linkMap.set(ast.url.trim(), rec);
              }
            });
          }
        });

        const latestDrafts = loadSupabaseRowDrafts();

        // Map local episodes into row states merged with Cloud/local per-row draft overrides
        const initialRows: SupabaseSyncRowState[] = episodes.map((ep) => {
          const cleanTitle = ep.title.trim().toLowerCase();
          const cleanYoutubeUrl = ep.masterVideoInfo?.youtubeUrl?.trim();
          const cleanTiktokUrl = ep.masterVideoInfo?.tiktokUrl?.trim();
          const cleanFacebookUrl = ep.masterVideoInfo?.facebookUrl?.trim();
          const cleanInstagramUrl = ep.masterVideoInfo?.instagramUrl?.trim();
          const cleanDriveUrl = ep.masterVideoInfo?.masterDriveUrl?.trim();

          const matched =
            (ep.id ? epRefMap.get(ep.id.trim()) : null) ||
            titleMap.get(cleanTitle) ||
            (cleanDriveUrl ? linkMap.get(cleanDriveUrl) : null) ||
            (cleanYoutubeUrl ? linkMap.get(cleanYoutubeUrl) : null) ||
            (cleanTiktokUrl ? linkMap.get(cleanTiktokUrl) : null) ||
            (cleanFacebookUrl ? linkMap.get(cleanFacebookUrl) : null) ||
            (cleanInstagramUrl ? linkMap.get(cleanInstagramUrl) : null);

          const isDuplicate = Boolean(matched);
          const draft = latestDrafts[ep.id];

          const defaultPlatforms =
            config.defaultTargetPlatforms &&
            config.defaultTargetPlatforms.length > 0
              ? config.defaultTargetPlatforms
              : ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'];

          return {
            episode: ep,
            isSelected:
              typeof draft?.isSelected === 'boolean'
                ? draft.isSelected
                : !isDuplicate,
            matchStatus: isDuplicate ? 'DUPLICATE' : 'NEW',
            existingRecordId: matched?.id,
            existingCreatedAt: matched?.created_at,
            existingStatus: matched?.status,
            channelId:
              typeof draft?.channelId === 'string'
                ? draft.channelId
                : config.targetChannelId || '',
            status:
              typeof draft?.status === 'string'
                ? draft.status
                : config.defaultStatus || '01_IDEA/DRAFT_💡',
            targetPlatforms:
              Array.isArray(draft?.targetPlatforms) &&
              draft.targetPlatforms.length > 0
                ? draft.targetPlatforms
                : defaultPlatforms,
            includeAssets:
              typeof draft?.includeAssets === 'boolean'
                ? draft.includeAssets
                : config.defaultIncludeAssets,
            includePillar:
              typeof draft?.includePillar === 'boolean'
                ? draft.includePillar
                : Boolean(config.defaultIncludePillar),
            includeCategory:
              typeof draft?.includeCategory === 'boolean'
                ? draft.includeCategory
                : Boolean(config.defaultIncludeCategory),
            description:
              typeof draft?.description === 'string' ? draft.description : '',
            upsertMode:
              draft?.upsertMode === 'UPDATE' || draft?.upsertMode === 'SKIP'
                ? draft.upsertMode
                : 'SKIP',
          };
        });

        setRows(initialRows);
      } catch (err) {
        console.error('Failed to run deduplication check:', err);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    runDeduplicationCheck();
  }, [isOpen, episodes, config.url, config.anonKey, config.targetChannelId]);

  // Helper to update rows and persist draft overrides to Cloud
  const applyRowsUpdate = (
    updater: (prev: SupabaseSyncRowState[]) => SupabaseSyncRowState[]
  ) => {
    setRows((prev) => {
      const next = updater(prev);
      persistRowsToDrafts(next, config);
      return next;
    });
  };

  // Bulk Selection Handlers
  const handleSelectAllNew = () => {
    applyRowsUpdate((prev) =>
      prev.map((r) => ({
        ...r,
        isSelected: r.matchStatus === 'NEW',
      }))
    );
  };

  const handleSelectAll = () => {
    applyRowsUpdate((prev) => prev.map((r) => ({ ...r, isSelected: true })));
  };

  const handleDeselectAll = () => {
    applyRowsUpdate((prev) => prev.map((r) => ({ ...r, isSelected: false })));
  };

  // Reset all row draft overrides to config defaults
  const handleResetRowsToDefaults = () => {
    handleResetAllRowDrafts();
    const defaultPlatforms =
      config.defaultTargetPlatforms && config.defaultTargetPlatforms.length > 0
        ? config.defaultTargetPlatforms
        : ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'];

    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        isSelected: r.matchStatus === 'NEW',
        channelId: config.targetChannelId || '',
        status: config.defaultStatus || '01_IDEA/DRAFT_💡',
        targetPlatforms: defaultPlatforms,
        includeAssets: config.defaultIncludeAssets,
        includePillar: Boolean(config.defaultIncludePillar),
        includeCategory: Boolean(config.defaultIncludeCategory),
        description: '',
        upsertMode: 'SKIP',
      }))
    );
  };

  // Row update handler
  const handleUpdateRow = (
    episodeId: string,
    updates: Partial<SupabaseSyncRowState>
  ) => {
    applyRowsUpdate((prev) =>
      prev.map((r) => (r.episode.id === episodeId ? { ...r, ...updates } : r))
    );
  };

  // Toggle single row selection
  const handleToggleSelectRow = (episodeId: string) => {
    applyRowsUpdate((prev) =>
      prev.map((r) =>
        r.episode.id === episodeId ? { ...r, isSelected: !r.isSelected } : r
      )
    );
  };

  // Batch property override for selected rows
  const handleBatchSetStatus = (newStatus: string) => {
    applyRowsUpdate((prev) =>
      prev.map((r) => (r.isSelected ? { ...r, status: newStatus } : r))
    );
  };

  const handleBatchSetChannel = (newChannelId: string) => {
    applyRowsUpdate((prev) =>
      prev.map((r) => (r.isSelected ? { ...r, channelId: newChannelId } : r))
    );
  };

  const handleBatchToggleAssets = (include: boolean) => {
    applyRowsUpdate((prev) =>
      prev.map((r) => (r.isSelected ? { ...r, includeAssets: include } : r))
    );
  };

  const handleBatchSetPillar = (include: boolean) => {
    applyRowsUpdate((prev) =>
      prev.map((r) => (r.isSelected ? { ...r, includePillar: include } : r))
    );
  };

  const handleBatchSetCategory = (include: boolean) => {
    applyRowsUpdate((prev) =>
      prev.map((r) => (r.isSelected ? { ...r, includeCategory: include } : r))
    );
  };

  const handleBatchTogglePlatform = (platformId: string) => {
    applyRowsUpdate((prev) =>
      prev.map((r) => {
        if (!r.isSelected) return r;
        const currentList = r.targetPlatforms || [];
        const isSelected = currentList.includes(platformId);
        const updated = isSelected
          ? currentList.filter((p) => p !== platformId)
          : [...currentList, platformId];
        return {
          ...r,
          targetPlatforms: updated.length > 0 ? updated : [platformId],
        };
      })
    );
  };

  // Filtered rows across entire dataset
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (activeTab === 'NEW' && r.matchStatus !== 'NEW') return false;
      if (activeTab === 'DUPLICATE' && r.matchStatus !== 'DUPLICATE')
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = r.episode.title.toLowerCase().includes(q);
        const catMatch = (r.episode.seriesTitle || r.episode.mainCategoryTagId)
          ?.toLowerCase()
          .includes(q);
        const scriptMatch = r.episode.rankings?.some(
          (slot) =>
            slot.mascotScript?.toLowerCase().includes(q) ||
            slot.snapshotNote?.toLowerCase().includes(q)
        );
        return Boolean(titleMatch || catMatch || scriptMatch);
      }
      return true;
    });
  }, [rows, activeTab, searchQuery]);

  // Pagination slice for instant rendering at 10,000+ rows
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safeCurrentPage, pageSize]);

  const isAllCurrentPageSelected =
    paginatedRows.length > 0 && paginatedRows.every((r) => r.isSelected);
  const isAllFilteredSelected =
    filteredRows.length > 0 && filteredRows.every((r) => r.isSelected);

  const handleSelectAllFiltered = () => {
    const idsToSelect = new Set(filteredRows.map((fr) => fr.episode.id));
    applyRowsUpdate((prev) =>
      prev.map((r) =>
        idsToSelect.has(r.episode.id) ? { ...r, isSelected: true } : r
      )
    );
  };

  // Statistics
  const stats = useMemo(() => {
    const total = rows.length;
    const newCount = rows.filter((r) => r.matchStatus === 'NEW').length;
    const duplicateCount = rows.filter(
      (r) => r.matchStatus === 'DUPLICATE'
    ).length;
    const selectedRows = rows.filter((r) => r.isSelected);
    const selectedCount = selectedRows.length;
    const selectedNewCount = selectedRows.filter(
      (r) => r.matchStatus === 'NEW'
    ).length;
    const selectedDupUpdateCount = selectedRows.filter(
      (r) => r.matchStatus === 'DUPLICATE' && r.upsertMode === 'UPDATE'
    ).length;

    return {
      total,
      newCount,
      duplicateCount,
      selectedCount,
      selectedNewCount,
      selectedDupUpdateCount,
    };
  }, [rows]);

  // Preview payload handler
  const handlePreviewPayload = (row: SupabaseSyncRowState) => {
    const payload = mapEpisodeToSupabasePayload(row, config);
    setPreviewPayload(payload);
    setPreviewTitle(row.episode.title);
  };

  // Execute Synchronization
  const handleExecuteSync = async () => {
    if (stats.selectedCount === 0) return;
    setIsProcessing(true);
    setSyncErrorMessage(null);
    try {
      const res = await batchSyncToSupabase(config, rows, (p) => {
        setProgress(p);
      });
      setReport(res);
    } catch (err: any) {
      setSyncErrorMessage(
        `เกิดข้อผิดพลาดในการซิงก์: ${err.message || String(err)}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const currentChannelName =
    config.channels.find((c) => c.id === config.targetChannelId)?.name ||
    'ช่องเริ่มต้น';

  const savedDraftOverridesCount = Object.keys(rowDrafts).length;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        maxWidthClass="max-w-[96vw] xl:max-w-[1580px]"
        heightClass="h-[94dvh] sm:h-[92vh]"
        icon={<Database className="w-5 h-5 text-[#2E7D32]" />}
        title="ส่งออกคอนเทนต์สู่ระบบ Supabase กลาง (ตาราง public.contents)"
        badge={
          <div className="inline-flex items-center gap-1.5">
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] font-bold">
              Batch Sync · Enterprise
            </span>
            {isCloudSynced && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-bold"
                title="การตั้งค่าเชื่อมต่อและค่าที่ปรับแต่งรายแถวถูกซิงก์ผ่าน Cloud (Firestore) ให้ทุกเครื่องเห็นตรงกันอัตโนมัติ"
              >
                <Cloud className="w-3 h-3 text-sky-600" />
                <span>Cloud Synced</span>
              </span>
            )}
          </div>
        }
        subtitle={
          isConfigured
            ? `ตรวจสอบความซ้ำด้วย Batch Title + รหัส EP และซิงก์การตั้งค่ารายแถวผ่าน Cloud ทุกเครื่อง (ช่องปัจจุบัน: ${currentChannelName})`
            : undefined
        }
        headerRight={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenConfig}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#FAF7F2] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5 text-[#3B6845]" />
              <span>ตั้งค่า Supabase</span>
            </button>
          </div>
        }
        footer={
          !isProcessing && !report && isConfigured ? (
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="text-xs text-[#6E5F52]">
                เลือกที่จะซิงค์:{' '}
                <strong className="font-mono tabular-nums text-[#1C4824]">
                  {stats.selectedCount.toLocaleString()}
                </strong>
                /
                <span className="font-mono tabular-nums">
                  {stats.total.toLocaleString()}
                </span>{' '}
                คลิป{' '}
                <span className="text-slate-400">
                  (ใหม่{' '}
                  <span className="font-mono tabular-nums">
                    {stats.selectedNewCount.toLocaleString()}
                  </span>{' '}
                  รายการ
                  {stats.selectedDupUpdateCount > 0 &&
                    ` · อัปเดตทับ ${stats.selectedDupUpdateCount.toLocaleString()} รายการ`}
                  )
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E5F52] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSync}
                  disabled={stats.selectedCount === 0 || isLoadingExisting}
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    stats.selectedCount > 0 && !isLoadingExisting
                      ? 'bg-[#3B6845] hover:bg-[#2D5236] text-white shadow-xs hover:shadow-md'
                      : 'bg-[#E5DED4] text-[#8E8174] border border-[#D8CFC3] cursor-not-allowed opacity-70'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {stats.selectedCount > 0
                      ? `ยืนยัน Batch Sync ลง Supabase (${stats.selectedCount.toLocaleString()} รายการ) ➔`
                      : 'กรุณาติ๊กเลือกคลิปที่ต้องการซิงค์'}
                  </span>
                </button>
              </div>
            </div>
          ) : undefined
        }
        bodyClassName="p-0 bg-[#FAF8F5] flex flex-col overflow-hidden"
      >
        {/* If Supabase is not configured yet */}
        {!isConfigured ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF5EE] border border-[#BAD8BF] flex items-center justify-center mx-auto text-[#2E7D32]">
                <Database className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#2D241E]">
                  ยังไม่ได้ตั้งค่าเชื่อมต่อฐานข้อมูล Supabase
                </h3>
                <p className="text-xs text-[#6E5F52] leading-relaxed">
                  กรุณากรอก Supabase Project URL และ API Key เพียงครั้งเดียว
                  ระบบจะซิงก์การตั้งค่าขึ้น Cloud ให้ทุกเครื่องพร้อมใช้งานทันที
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenConfig}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3B6845] hover:bg-[#2D5236] text-white shadow-xs transition-colors cursor-pointer"
              >
                เปิดหน้าต่างตั้งค่า Supabase
              </button>
            </div>
          </div>
        ) : isProcessing && progress ? (
          <div className="flex-1 flex items-center justify-center overflow-y-auto scrollbar-thin">
            <SupabaseSyncProgressView progress={progress} />
          </div>
        ) : report ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <SupabaseSyncReportView
              report={report}
              onClose={() => {
                setReport(null);
                onClose();
              }}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Inline Error Banner if sync failed */}
            {syncErrorMessage && (
              <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 font-semibold flex items-center justify-between">
                <span>{syncErrorMessage}</span>
                <button
                  type="button"
                  onClick={() => setSyncErrorMessage(null)}
                  className="text-rose-500 hover:text-rose-800 underline text-[11px] cursor-pointer"
                >
                  ปิดข้อความ
                </button>
              </div>
            )}

            {/* Top Toolbar: Tabs, Quick Selectors, Bulk Field Overrides */}
            <SupabaseSyncToolbar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              stats={stats}
              config={config}
              savedDraftOverridesCount={savedDraftOverridesCount}
              onSelectAllNew={handleSelectAllNew}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onResetAllRowDrafts={handleResetRowsToDefaults}
              onBatchSetStatus={handleBatchSetStatus}
              onBatchSetChannel={handleBatchSetChannel}
              onBatchTogglePlatform={handleBatchTogglePlatform}
              onBatchToggleAssets={handleBatchToggleAssets}
              onBatchSetPillar={handleBatchSetPillar}
              onBatchSetCategory={handleBatchSetCategory}
            />

            {/* Table Area */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
              {isLoadingExisting ? (
                <div className="p-12 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#2E7D32]" />
                  <div className="text-xs font-bold text-[#3D332A]">
                    {dedupProgressLabel}
                  </div>
                  <div className="text-[11px] text-[#8E8174]">
                    รองรับการตรวจสอบข้อมูลสะสมระดับหมื่นรายการด้วย Chunked IN Query
                  </div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#8E8174]">
                  ไม่พบรายการคลิปที่ตรงกับเงื่อนไขการค้นหา
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#FAF7F2] text-[11px] font-bold text-[#6E5F52] border-b border-[#E8DFD3] sticky top-0 z-10 select-none">
                    <tr>
                      <th className="p-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={isAllCurrentPageSelected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            applyRowsUpdate((prev) => {
                              const idsToToggle = new Set(
                                paginatedRows.map((pr) => pr.episode.id)
                              );
                              return prev.map((r) =>
                                idsToToggle.has(r.episode.id)
                                  ? { ...r, isSelected: checked }
                                  : r
                              );
                            });
                          }}
                          title="เลือก/ยกเลิกการเลือกเฉพาะหน้าปัจจุบัน"
                          className="w-4 h-4 rounded text-[#3B6845] focus:ring-[#8FA892] border-slate-300 cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-36">สถานะในระบบ</th>
                      <th className="p-3">ชื่อคลิปหลัก (EP) & หมวดหมู่</th>
                      <th className="p-3 w-40">ช่อง (channel_id)</th>
                      <th className="p-3 w-32">สถานะ (status)</th>
                      <th className="p-3 w-44">แพลตฟอร์ม (target_platform)</th>
                      <th className="p-3 w-28 text-center">assets (ฟุตเทจ)</th>
                      <th className="p-3 w-28 text-right">คำบรรยาย / JSON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <SupabaseSyncRowView
                        key={row.episode.id}
                        row={row}
                        config={config}
                        onToggleSelect={handleToggleSelectRow}
                        onUpdateRow={handleUpdateRow}
                        onPreviewPayload={handlePreviewPayload}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Enterprise Pagination Bar */}
            {!isLoadingExisting && filteredRows.length > 0 && (
              <SupabasePaginationBar
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalFilteredCount={filteredRows.length}
                currentPageItemCount={paginatedRows.length}
                isAllCurrentPageSelected={isAllCurrentPageSelected}
                isAllFilteredSelected={isAllFilteredSelected}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                onSelectAllFiltered={handleSelectAllFiltered}
              />
            )}
          </div>
        )}
      </BaseModal>

      {/* JSON Payload Preview Modal */}
      <SupabasePayloadPreviewModal
        isOpen={Boolean(previewPayload)}
        onClose={() => setPreviewPayload(null)}
        payload={previewPayload}
        title={previewTitle}
      />
    </>
  );
};
