import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Sparkles,
} from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import { useCMS } from '../../context/CMSContext';
import {
  SupabaseConnectionConfig,
  SupabaseContentPayload,
  SupabaseSyncProgress,
  SupabaseSyncReport,
  SupabaseSyncRowState,
  SUPABASE_CONTENT_STATUSES,
  SUPABASE_TARGET_PLATFORMS,
} from '../../types/supabaseSync.types';
import {
  batchSyncToSupabase,
  fetchExistingContentsForEpisodes,
  loadSupabaseConfig,
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

interface SupabaseContentSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig: () => void;
}

export const SupabaseContentSyncModal: React.FC<
  SupabaseContentSyncModalProps
> = ({ isOpen, onClose, onOpenConfig }) => {
  const { episodes } = useCMS();

  const [config, setConfig] =
    useState<SupabaseConnectionConfig>(loadSupabaseConfig);
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

  // Load existing contents using Chunked Batch Deduplication on open
  useEffect(() => {
    if (!isOpen) return;

    const currentConfig = loadSupabaseConfig();
    setConfig(currentConfig);
    setProgress(null);
    setReport(null);
    setSyncErrorMessage(null);
    setIsProcessing(false);
    setCurrentPage(1);

    if (!currentConfig.url || !currentConfig.anonKey) {
      setRows([]);
      return;
    }

    const runDeduplicationCheck = async () => {
      setIsLoadingExisting(true);
      setDedupProgressLabel('กำลังตรวจสอบความซ้ำแบบ Batch กับฐานข้อมูล Supabase...');
      try {
        const existingRecords = await fetchExistingContentsForEpisodes(
          currentConfig,
          episodes,
          currentConfig.targetChannelId,
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
          // Published links (case-insensitive keys)
          if (rec.published_links) {
            Object.values(rec.published_links).forEach((url) => {
              if (typeof url === 'string' && url.trim()) {
                linkMap.set(url.trim(), rec);
              }
            });
          }
          // Assets links (e.g. Google Drive master or footage in assets)
          if (Array.isArray(rec.assets)) {
            rec.assets.forEach((ast: any) => {
              if (ast && typeof ast.url === 'string' && ast.url.trim()) {
                linkMap.set(ast.url.trim(), rec);
              }
            });
          }
        });

        // Map local episodes into row states
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

          return {
            episode: ep,
            isSelected: !isDuplicate, // Default check only NEW items
            matchStatus: isDuplicate ? 'DUPLICATE' : 'NEW',
            existingRecordId: matched?.id,
            existingCreatedAt: matched?.created_at,
            existingStatus: matched?.status,
            channelId: currentConfig.targetChannelId || '',
            status: currentConfig.defaultStatus || '01_IDEA/DRAFT_💡',
            targetPlatforms:
              currentConfig.defaultTargetPlatforms &&
              currentConfig.defaultTargetPlatforms.length > 0
                ? currentConfig.defaultTargetPlatforms
                : ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'],
            includeAssets: currentConfig.defaultIncludeAssets,
            includePillar: Boolean(currentConfig.defaultIncludePillar),
            includeCategory: Boolean(currentConfig.defaultIncludeCategory),
            description: '',
            upsertMode: 'SKIP',
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
  }, [isOpen, episodes]);

  // Bulk Selection Handlers
  const handleSelectAllNew = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        isSelected: r.matchStatus === 'NEW',
      }))
    );
  };

  const handleSelectAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, isSelected: true })));
  };

  const handleDeselectAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, isSelected: false })));
  };

  // Row update handler
  const handleUpdateRow = (
    episodeId: string,
    updates: Partial<SupabaseSyncRowState>
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.episode.id === episodeId ? { ...r, ...updates } : r))
    );
  };

  // Toggle single row selection
  const handleToggleSelectRow = (episodeId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.episode.id === episodeId ? { ...r, isSelected: !r.isSelected } : r
      )
    );
  };

  // Batch property override for selected rows
  const handleBatchSetStatus = (newStatus: string) => {
    setRows((prev) =>
      prev.map((r) => (r.isSelected ? { ...r, status: newStatus } : r))
    );
  };

  const handleBatchSetChannel = (newChannelId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.isSelected ? { ...r, channelId: newChannelId } : r))
    );
  };

  const handleBatchToggleAssets = (include: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.isSelected ? { ...r, includeAssets: include } : r))
    );
  };

  const handleBatchSetPillar = (include: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.isSelected ? { ...r, includePillar: include } : r))
    );
  };

  const handleBatchSetCategory = (include: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.isSelected ? { ...r, includeCategory: include } : r))
    );
  };

  const handleBatchTogglePlatform = (platformId: string) => {
    setRows((prev) =>
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
      // 1. Tab filter
      if (activeTab === 'NEW' && r.matchStatus !== 'NEW') return false;
      if (activeTab === 'DUPLICATE' && r.matchStatus !== 'DUPLICATE')
        return false;

      // 2. Search query
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
    setRows((prev) =>
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
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] font-bold">
            Batch Sync · Enterprise
          </span>
        }
        subtitle={
          isConfigured
            ? `ตรวจสอบความซ้ำด้วย Batch Title + รหัส EP และส่งออกข้อมูลแบบกลุ่มความเร็วสูง (ช่องปัจจุบัน: ${currentChannelName})`
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
                  กรุณากรอก Supabase Project URL และ API Key
                  เพื่อให้ระบบสามารถเข้าถึงตาราง public.contents
                  และตรวจสอบรายการซ้ำได้
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
            <div className="p-3 bg-white border-b border-[#E8DFD3] shrink-0 space-y-2.5">
              {/* Row 1: Filter Tabs + Search Box */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DFD3]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'ALL'
                        ? 'bg-white text-[#2D241E] shadow-xs'
                        : 'text-[#6E5F52] hover:text-[#2D241E]'
                    }`}
                  >
                    ทั้งหมด (
                    <span className="font-mono tabular-nums">
                      {stats.total.toLocaleString()}
                    </span>
                    )
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('NEW')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      activeTab === 'NEW'
                        ? 'bg-[#EEF5EE] text-[#1C4824] shadow-xs'
                        : 'text-[#6E5F52] hover:text-[#1C4824]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-[#2E7D32]" />
                    <span>
                      คลิปใหม่ (
                      <span className="font-mono tabular-nums">
                        {stats.newCount.toLocaleString()}
                      </span>
                      )
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('DUPLICATE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      activeTab === 'DUPLICATE'
                        ? 'bg-[#FEF3C7] text-[#92400E] shadow-xs'
                        : 'text-[#6E5F52] hover:text-[#92400E]'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 text-[#B45309]" />
                    <span>
                      ซ้ำในระบบ (
                      <span className="font-mono tabular-nums">
                        {stats.duplicateCount.toLocaleString()}
                      </span>
                      )
                    </span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative min-w-[200px] sm:min-w-[280px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อคลิป, หมวดหมู่, แท็ก..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E3D8CB] bg-[#FAF8F5] text-xs focus:outline-none focus:ring-1 focus:ring-[#8FA892]"
                  />
                </div>
              </div>

              {/* Row 2: Bulk Action Buttons & Global Overrides for Selected Rows */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                {/* Selection Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllNew}
                    className="px-2.5 py-1 rounded-lg font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] hover:bg-[#E2EFE2] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    เลือกเฉพาะคลิปใหม่ทั้งหมด ({stats.newCount.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1 rounded-lg font-semibold bg-[#FAF7F2] text-[#524538] border border-[#E2D5C4] hover:bg-[#F2EBE0] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    เลือกทั้งหมดทุกหน้า
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    ล้างการเลือก
                  </button>
                </div>

                {/* Bulk Field Modifiers for Selected */}
                {stats.selectedCount > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#524538]">
                    <span className="font-semibold text-slate-400">
                      ปรับค่าที่เลือก (
                      <span className="font-mono tabular-nums">
                        {stats.selectedCount.toLocaleString()}
                      </span>
                      ):
                    </span>

                    {/* Change Status */}
                    <select
                      onChange={(e) => handleBatchSetStatus(e.target.value)}
                      defaultValue=""
                      className="px-2 py-1 rounded border border-[#E3D8CB] bg-white text-xs font-semibold"
                    >
                      <option value="" disabled>
                        เปลี่ยน Status ที่เลือก...
                      </option>
                      {SUPABASE_CONTENT_STATUSES.map((statusVal) => (
                        <option key={statusVal} value={statusVal}>
                          {statusVal}
                        </option>
                      ))}
                    </select>

                    {/* Change Channel */}
                    {config.channels.length > 1 && (
                      <select
                        onChange={(e) => handleBatchSetChannel(e.target.value)}
                        defaultValue=""
                        className="px-2 py-1 rounded border border-[#E3D8CB] bg-white text-xs"
                      >
                        <option value="" disabled>
                          เปลี่ยนช่องที่เลือก...
                        </option>
                        {config.channels.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Toggle Target Platform */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBatchTogglePlatform(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="px-2 py-1 rounded border border-[#E3D8CB] bg-white text-xs font-semibold text-[#1C4824]"
                    >
                      <option value="" disabled>
                        เปิด/ปิด แพลตฟอร์มที่เลือก...
                      </option>
                      {SUPABASE_TARGET_PLATFORMS.map((plat) => (
                        <option key={plat.id} value={plat.id}>
                          สลับ: {plat.label}
                        </option>
                      ))}
                    </select>

                    {/* Toggle Assets */}
                    <button
                      type="button"
                      onClick={() => handleBatchToggleAssets(true)}
                      className="px-2 py-1 rounded border border-[#E3D8CB] bg-white hover:bg-slate-50 text-[10px] font-bold cursor-pointer whitespace-nowrap"
                      title="แนบฟุตเทจ 5 คลิปใน assets สำหรับแถวที่เลือก"
                    >
                      + แนบ Assets ทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleAssets(false)}
                      className="px-2 py-1 rounded border border-[#E3D8CB] bg-white hover:bg-slate-50 text-[10px] text-slate-500 cursor-pointer whitespace-nowrap"
                      title="เว้นว่าง assets [] สำหรับแถวที่เลือก"
                    >
                      เว้นว่าง Assets
                    </button>

                    {/* Batch Pillar Toggle */}
                    <div className="flex items-center gap-0.5 border border-[#E3D8CB] rounded bg-white p-0.5 text-[10px]">
                      <span className="px-1 text-[#6E5F52] font-semibold">Pillar:</span>
                      <button
                        type="button"
                        onClick={() => handleBatchSetPillar(true)}
                        className="px-1.5 py-0.5 rounded text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold cursor-pointer"
                        title="เปิดใส่ค่าชื่อหมวดหมู่ใน Pillar สำหรับแถวที่เลือก"
                      >
                        เปิด
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchSetPillar(false)}
                        className="px-1.5 py-0.5 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                        title="ปิด (เว้นว่าง null) Pillar สำหรับแถวที่เลือก"
                      >
                        ปิด (null)
                      </button>
                    </div>

                    {/* Batch Category Toggle */}
                    <div className="flex items-center gap-0.5 border border-[#E3D8CB] rounded bg-white p-0.5 text-[10px]">
                      <span className="px-1 text-[#6E5F52] font-semibold">Category:</span>
                      <button
                        type="button"
                        onClick={() => handleBatchSetCategory(true)}
                        className="px-1.5 py-0.5 rounded text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold cursor-pointer"
                        title="เปิดใส่ค่าชื่อหมวดหมู่ใน Category สำหรับแถวที่เลือก"
                      >
                        เปิด
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchSetCategory(false)}
                        className="px-1.5 py-0.5 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                        title="ปิด (เว้นว่าง null) Category สำหรับแถวที่เลือก"
                      >
                        ปิด (null)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                            setRows((prev) => {
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
