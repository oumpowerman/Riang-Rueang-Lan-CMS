import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Settings,
  Cloud,
  AlertCircle,
} from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import { useCMS } from '../../context/CMSContext';
import { Episode } from '../../types/episode.types';
import {
  SupabaseContentPayload,
  SupabaseSyncProgress,
  SupabaseSyncReport,
  SupabaseSyncRowState,
} from '../../types/supabaseSync.types';
import { batchSyncToSupabase } from '../../services/supabaseService';
import { mapEpisodeToSupabasePayload } from '../../utils/supabasePayloadMapper';
import { SupabaseSyncRowView } from './SupabaseSyncRowView';
import { SupabasePayloadPreviewModal } from './SupabasePayloadPreviewModal';
import { SupabaseRowEditModal } from './SupabaseRowEditModal';
import { SupabaseSyncProgressView } from './SupabaseSyncProgressView';
import { SupabaseSyncReportView } from './SupabaseSyncReportView';
import { SupabasePaginationBar } from './SupabasePaginationBar';
import { SupabaseSyncToolbar } from './SupabaseSyncToolbar';
import { SupabaseStatusIndicator } from './SupabaseStatusIndicator';
import { useSupabaseCloudSync } from './useSupabaseCloudSync';
import { useSupabaseSyncRows } from './useSupabaseSyncRows';
import { formatThaiSyncTimestamp } from './supabaseRowMatcher';

interface SupabaseContentSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig: () => void;
}

export const SupabaseContentSyncModal: React.FC<
  SupabaseContentSyncModalProps
> = ({ isOpen, onClose, onOpenConfig }) => {
  const {
    episodes,
    batchUpsertEpisodes,
    tagMap,
    computedFootageMap,
    settings,
    supabaseSyncPresetFilter,
    clearSupabaseSyncPresetFilter,
  } = useCMS();

  // Real-time Cloud Sync of connection config (autoCheck toggle, timestamps) & per-row drafts
  const {
    config,
    updateConfigAndSync,
    rowDrafts,
    isCloudDraftsCompacted,
    persistRowsToDrafts,
    handleResetAllRowDrafts,
  } = useSupabaseCloudSync(isOpen);

  // Incremental Smart Delta Dedup, SENT Stamping, Filtering & Safe Scoped Selection Hook
  const {
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
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    stats,
    applyRowsUpdate,
    handleSelectOnlyFiltered,
    handleSelectAllFiltered,
    handleClearSelectionsOutsideFilter,
    handleSelectAllNew,
    handleDeselectAll,
    handleResetRowsToDefaults,
    handleUpdateRow,
    handleToggleSelectRow,
    handleBatchSetStatus,
    handleBatchSetChannel,
    handleBatchTogglePlatform,
    handleBatchToggleAssets,
    handleBatchSetPillar,
    handleBatchSetCategory,
    handleMarkAsSent,
    handleUnmarkSent,
    handleBatchMarkAsSent,
  } = useSupabaseSyncRows({
    isOpen,
    episodes,
    tagMap,
    computedFootageMap,
    settings,
    config,
    rowDrafts,
    presetFilter: supabaseSyncPresetFilter,
    onConsumePresetFilter: clearSupabaseSyncPresetFilter,
    persistRowsToDrafts,
    handleResetAllRowDrafts,
    onUpdateConfig: updateConfigAndSync,
    onPersistEpisodeSyncUpdates: batchUpsertEpisodes,
  });

  // Processing & Reports
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<SupabaseSyncProgress | null>(null);
  const [report, setReport] = useState<SupabaseSyncReport | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // Sub-modals (JSON Preview & Row Details Editor)
  const [previewPayload, setPreviewPayload] =
    useState<SupabaseContentPayload | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [editingRowState, setEditingRowState] = useState<{
    row: SupabaseSyncRowState;
    displayCategory: string | null;
  } | null>(null);

  const isConfigured = Boolean(config.url && config.anonKey);

  const isAllCurrentPageSelected =
    paginatedRows.length > 0 && paginatedRows.every((r) => r.isSelected);
  const isAllFilteredSelected =
    filteredRows.length > 0 && filteredRows.every((r) => r.isSelected);

  // Toggle persistent Auto Check on Modal Open (stored in Firestore & localStorage)
  const handleToggleAutoCheckOnOpen = () => {
    const nextValue = !Boolean(config.autoCheckOnModalOpen);
    updateConfigAndSync({ autoCheckOnModalOpen: nextValue });
    if (nextValue && !hasCheckedThisSession && !isLoadingExisting && isConfigured) {
      void runSmartDeltaCheck();
    }
  };

  // Preview payload handler
  const handlePreviewPayload = (row: SupabaseSyncRowState) => {
    const payload = mapEpisodeToSupabasePayload(row, config, {
      tagMap,
      computedFootageMap,
    });
    setPreviewPayload(payload);
    setPreviewTitle(row.episode.title);
  };

  // Execute Synchronization + Stamp Kontent OS record IDs onto Episodes + Save Last Export Time
  const handleExecuteSync = async () => {
    if (stats.selectedCount === 0) return;
    setIsProcessing(true);
    setSyncErrorMessage(null);
    setReport(null);
    try {
      const res = await batchSyncToSupabase(
        config,
        rows,
        (p) => {
          setProgress(p);
        },
        { tagMap, computedFootageMap }
      );

      const syncedAtIso = new Date().toISOString();
      const episodeById = new Map<string, Episode>();
      episodes.forEach((ep) => episodeById.set(ep.id, ep));

      const stampedEpisodes: Episode[] = [];
      res.items.forEach((item) => {
        if (
          (item.action === 'INSERTED' || item.action === 'UPDATED') &&
          item.episodeId &&
          item.id
        ) {
          const targetEp = episodeById.get(item.episodeId);
          if (targetEp) {
            stampedEpisodes.push({
              ...targetEp,
              supabaseSyncInfo: {
                recordId: item.id,
                syncedAt: syncedAtIso,
                channelId: item.channelId || '',
                status: item.status || '',
              },
            });
          }
        }
      });

      if (stampedEpisodes.length > 0) {
        await batchUpsertEpisodes(stampedEpisodes);
      }

      if (res.insertedCount + res.updatedCount > 0) {
        updateConfigAndSync({
          lastExportSyncedAt: syncedAtIso,
        });
      }

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
  const skippedSelectedCount = Math.max(
    0,
    stats.selectedCount - stats.selectedNewCount - stats.selectedDupUpdateCount
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        closeOnEsc={!previewPayload && !editingRowState}
        maxWidthClass="max-w-[96vw] xl:max-w-[1520px]"
        heightClass="h-[94dvh] sm:h-[92vh]"
        icon={<Database className="w-5 h-5 text-[#3B6845]" />}
        title="ส่งออกคลิปหลักสู่ Kontent OS"
        subtitle={
          isConfigured ? (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
              <span>ช่องหลัก: {currentChannelName}</span>
              <span className="text-[#C5B49E]" aria-hidden="true">
                ·
              </span>
              <span>
                เช็คซ้ำล่าสุด: {formatThaiSyncTimestamp(config.lastDedupCheckedAt)}
              </span>
              <span className="text-[#C5B49E]" aria-hidden="true">
                ·
              </span>
              <span>
                ส่งออกล่าสุด: {formatThaiSyncTimestamp(config.lastExportSyncedAt)}
              </span>
            </span>
          ) : undefined
        }
        headerRight={
          <div className="flex items-center gap-2">
            <SupabaseStatusIndicator variant="modal" />
            <button
              type="button"
              onClick={onOpenConfig}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5 text-[#3B6845]" />
              <span>ตั้งค่าเชื่อมต่อ</span>
            </button>
          </div>
        }
        footer={
          !isProcessing && !report && isConfigured ? (
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              {/* Plain-Language Summary */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E5F52]">
                {stats.selectedCount > 0 ? (
                  <span>
                    พร้อมส่งเข้า Kontent OS:{' '}
                    {stats.selectedNewCount > 0 && (
                      <strong className="text-[#1C4824]">
                        คลิปใหม่{' '}
                        <span className="font-mono tabular-nums">
                          {stats.selectedNewCount.toLocaleString()}
                        </span>{' '}
                        เรื่อง
                      </strong>
                    )}
                    {stats.selectedNewCount > 0 &&
                      stats.selectedDupUpdateCount > 0 && <span> · </span>}
                    {stats.selectedDupUpdateCount > 0 && (
                      <strong className="text-[#9A3412]">
                        อัปเดตทับ{' '}
                        <span className="font-mono tabular-nums">
                          {stats.selectedDupUpdateCount.toLocaleString()}
                        </span>{' '}
                        เรื่อง
                      </strong>
                    )}
                    {skippedSelectedCount > 0 && (
                      <span className="text-[#7D6E61]">
                        {stats.selectedNewCount > 0 ||
                        stats.selectedDupUpdateCount > 0
                          ? ' · '
                          : ''}
                        ข้ามซ้ำ{' '}
                        <span className="font-mono tabular-nums">
                          {skippedSelectedCount.toLocaleString()}
                        </span>{' '}
                        เรื่อง
                      </span>
                    )}{' '}
                    <span className="text-[#8E8174]">
                      (ช่อง {currentChannelName})
                    </span>
                  </span>
                ) : (
                  <span className="text-[#7D6E61]">
                    ยังไม่ได้เลือกคลิปสำหรับส่งออก (ทั้งหมด{' '}
                    <span className="font-mono tabular-nums">
                      {stats.total.toLocaleString()}
                    </span>{' '}
                    เรื่อง)
                  </span>
                )}

                {hasActiveFilters && stats.selectedOutsideFilterCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                    <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>
                      มีอีก{' '}
                      <strong className="font-mono tabular-nums">
                        {stats.selectedOutsideFilterCount.toLocaleString()}
                      </strong>{' '}
                      เรื่องนอกตัวกรองที่ถูกเลือกค้างไว้
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSelectionsOutsideFilter}
                      className="underline font-bold text-amber-900 hover:text-rose-700 cursor-pointer"
                    >
                      ตัดรายการนอกตัวกรองออก
                    </button>
                  </span>
                )}
              </div>

              {/* Action Buttons */}
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
                      ? `ส่งเข้า Kontent OS (${stats.selectedCount.toLocaleString()} เรื่อง) ➔`
                      : 'กรุณาเลือกคลิปที่จะส่ง'}
                  </span>
                </button>
              </div>
            </div>
          ) : undefined
        }
        bodyClassName="p-0 bg-[#FAF8F5] flex flex-col overflow-hidden"
      >
        {/* If connection is not configured yet */}
        {!isConfigured ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF5EE] border border-[#BAD8BF] flex items-center justify-center mx-auto text-[#3B6845]">
                <Database className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#2D241E]">
                  ยังไม่ได้ตั้งค่าเชื่อมต่อ Kontent OS
                </h3>
                <p className="text-xs text-[#6E5F52] leading-relaxed">
                  กรุณากรอก URL และ API Key เพียงครั้งเดียว
                  ระบบจะบันทึกและพร้อมใช้งานร่วมกันทุกเครื่องอัตโนมัติ
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenConfig}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3B6845] hover:bg-[#2D5236] text-white shadow-xs transition-colors cursor-pointer"
              >
                เปิดหน้าต่างตั้งค่าเชื่อมต่อ
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

            {/* Cloud 1 MB Protection Notice */}
            {isCloudDraftsCompacted && (
              <div className="px-4 py-1.5 bg-sky-50 border-b border-sky-200 text-[11px] text-sky-800 flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>
                  รายการปรับแต่งมีจำนวนมาก ระบบบันทึกทั้งหมดไว้บนเครื่องนี้แล้ว และคัดเฉพาะการแก้ไขสำคัญขึ้น Cloud
                </span>
              </div>
            )}

            {/* 2-Row Clean Toolbar */}
            <SupabaseSyncToolbar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              seriesFilter={seriesFilter}
              onSeriesFilterChange={setSeriesFilter}
              archiveCategoryFilter={archiveCategoryFilter}
              onArchiveCategoryFilterChange={setArchiveCategoryFilter}
              readinessFilter={readinessFilter}
              onReadinessFilterChange={setReadinessFilter}
              seriesFilterOptions={seriesFilterOptions}
              archiveCategoryOptions={archiveCategoryOptions}
              readinessCounts={readinessCounts}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetAllFilters}
              autoCheckOnModalOpen={Boolean(config.autoCheckOnModalOpen)}
              onToggleAutoCheckOnOpen={handleToggleAutoCheckOnOpen}
              onRunSmartDeltaCheck={() => void runSmartDeltaCheck()}
              onRunFullVerifyCheck={() => void runFullVerifyCheck()}
              isLoadingExisting={isLoadingExisting}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              stats={stats}
              config={config}
              savedDraftOverridesCount={savedDraftOverridesCount}
              onSelectOnlyFiltered={handleSelectOnlyFiltered}
              onSelectAllNew={handleSelectAllNew}
              onDeselectAll={handleDeselectAll}
              onResetAllRowDrafts={handleResetRowsToDefaults}
              onBatchSetStatus={handleBatchSetStatus}
              onBatchSetChannel={handleBatchSetChannel}
              onBatchTogglePlatform={handleBatchTogglePlatform}
              onBatchToggleAssets={handleBatchToggleAssets}
              onBatchSetPillar={handleBatchSetPillar}
              onBatchSetCategory={handleBatchSetCategory}
              onBatchMarkAsSent={handleBatchMarkAsSent}
            />

            {/* Subtle status strip in Manual mode before checking or after completing check */}
            {!isLoadingExisting && lastCheckSummary && (
              <div className="px-4 sm:px-5 py-1.5 bg-[#EEF5EE]/70 border-b border-[#D8E8D9] text-[11px] text-[#1C4824] flex items-center justify-between gap-2">
                <span>{lastCheckSummary}</span>
              </div>
            )}

            {/* Table Area */}
            <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
              {isLoadingExisting ? (
                <div className="p-12 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#3B6845]" />
                  <div className="text-xs font-bold text-[#3D332A]">
                    {dedupProgressLabel}
                  </div>
                  <div className="text-[11px] text-[#8E8174]">
                    ข้ามคลิปที่มีรหัสส่งแล้วและตรวจเฉพาะคลิปใหม่ + ความเปลี่ยนแปลงล่าสุด (Delta)
                  </div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="p-12 text-center space-y-2.5 text-xs text-[#8E8174]">
                  <div>ไม่พบรายการคลิปที่ตรงกับเงื่อนไขการค้นหาและตัวกรอง</div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] hover:bg-[#E2EFE2] cursor-pointer"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full min-w-[720px] text-left border-collapse">
                  <thead className="bg-[#FAF7F2] text-[11px] font-bold text-[#6E5F52] border-b border-[#E8DFD3] sticky top-0 z-10 select-none">
                    <tr>
                      <th className="px-3 py-2.5 text-center w-10">
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
                          title="เลือกหรือยกเลิกทั้งหมดเฉพาะหน้านี้"
                          className="w-4 h-4 rounded text-[#3B6845] focus:ring-[#8FA892] border-[#C5B49E] cursor-pointer"
                        />
                      </th>
                      <th className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>คลิปหลัก (EP) &amp; สถานะในระบบ</span>
                          {stats.selectedCount === 0 && (
                            <div className="inline-flex items-center gap-1.5 font-normal">
                              {stats.newCount > 0 && (
                                <button
                                  type="button"
                                  onClick={handleSelectAllNew}
                                  className="px-2 py-0.5 rounded-lg bg-[#EEF5EE] hover:bg-[#E1EFE2] text-[#1C4824] font-semibold border border-[#BAD8BF] transition-colors cursor-pointer"
                                >
                                  + เลือกคลิปใหม่ ({stats.newCount.toLocaleString()})
                                </button>
                              )}
                              {hasActiveFilters && stats.filteredCount > 0 && (
                                <button
                                  type="button"
                                  onClick={handleSelectOnlyFiltered}
                                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#3D332A] font-semibold border border-[#E2D5C4] transition-colors cursor-pointer"
                                >
                                  + เลือกเฉพาะที่กรอง ({stats.filteredCount.toLocaleString()})
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="px-3 py-2.5 text-right">
                        ค่าที่จะส่งออก (คลิกแถวเพื่อกางแก้ไข)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => {
                      const meta = episodeMetaMap.get(row.episode.id);
                      return (
                        <SupabaseSyncRowView
                          key={row.episode.id}
                          row={row}
                          config={config}
                          tagMap={tagMap}
                          seriesName={meta?.seriesName}
                          completeness={meta?.completeness}
                          onToggleSelect={handleToggleSelectRow}
                          onUpdateRow={handleUpdateRow}
                          onOpenRowEdit={(targetRow, displayCategory) =>
                            setEditingRowState({
                              row: targetRow,
                              displayCategory,
                            })
                          }
                          onPreviewPayload={handlePreviewPayload}
                          onMarkAsSent={handleMarkAsSent}
                          onUnmarkSent={handleUnmarkSent}
                        />
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Bar */}
            {!isLoadingExisting && filteredRows.length > 0 && (
              <SupabasePaginationBar
                currentPage={currentPage}
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

      {/* Per-Row Description & Pillar/Category Modal */}
      <SupabaseRowEditModal
        row={editingRowState?.row || null}
        displayCategory={editingRowState?.displayCategory || null}
        onClose={() => setEditingRowState(null)}
        onSave={handleUpdateRow}
      />

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
