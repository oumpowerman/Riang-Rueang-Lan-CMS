import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileCode,
  Film,
  FolderCheck,
  Link2,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { useDebouncedCloudSync } from '../../../hooks/useDebouncedCloudSync';
import type { Footage } from '../../../types/footage.types';
import {
  formatThaiDate,
  generateStandardFileName,
  hasRealDriveLink,
} from '../../../utils/fileNameGenerator';
import { BaseModal } from '../../ui/BaseModal';
import { CloudSyncStatusBadge } from '../../ui/CloudSyncStatusBadge';
import { CloudSyncFooterBar } from '../../ui/CloudSyncFooterBar';

interface QuickDriveLinkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForTraceability?: (footageId: string) => void;
}

const DEBOUNCE_DELAY_MS = 550;

export const QuickDriveLinkerModal: React.FC<QuickDriveLinkerModalProps> = ({
  isOpen,
  onClose,
  onSelectForTraceability,
}) => {
  const { computedFootage, updateFootage } = useCMS();

  const [scopeFilter, setScopeFilter] = useState<'SOCIAL_ONLY' | 'ALL_MISSING'>(
    'ALL_MISSING'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Keep track of IDs that were missing Drive when the modal opened so rows don't abruptly disappear mid-typing
  const [sessionTargetIds, setSessionTargetIds] = useState<string[]>([]);

  const {
    summary: syncSummary,
    getFieldValue,
    getItemStatus,
    scheduleUpdate,
    flushItem,
    flushAll,
    retryItem,
    retryAllFailed,
    resetSession,
  } = useDebouncedCloudSync<Footage>({
    delayMs: DEBOUNCE_DELAY_MS,
    onCommit: updateFootage,
  });

  useEffect(() => {
    if (isOpen) {
      resetSession();
      const missingIds = computedFootage
        .filter((ft) => !hasRealDriveLink(ft.driveFileUrl))
        .map((ft) => ft.id);
      setSessionTargetIds(missingIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCloseModal = useCallback(() => {
    void flushAll();
    onClose();
  }, [flushAll, onClose]);

  // Also include any newly arrived footage from LINE OA while the modal is open
  const queueFootages = useMemo(() => {
    const sessionSet = new Set(sessionTargetIds);
    return computedFootage.filter(
      (ft) => sessionSet.has(ft.id) || !hasRealDriveLink(ft.driveFileUrl)
    );
  }, [computedFootage, sessionTargetIds]);

  const socialOnlyCount = useMemo(
    () =>
      queueFootages.filter((ft) => {
        const liveDrive = getFieldValue(ft.id, 'driveFileUrl', ft.driveFileUrl || '');
        return Boolean(ft.originalUrl?.trim()) && !hasRealDriveLink(liveDrive);
      }).length,
    [queueFootages, getFieldValue]
  );

  const remainingMissingCount = useMemo(
    () =>
      queueFootages.filter((ft) => {
        const liveDrive = getFieldValue(ft.id, 'driveFileUrl', ft.driveFileUrl || '');
        return !hasRealDriveLink(liveDrive);
      }).length,
    [queueFootages, getFieldValue]
  );

  const completedInSessionCount = useMemo(
    () =>
      queueFootages.filter((ft) => {
        const liveDrive = getFieldValue(ft.id, 'driveFileUrl', ft.driveFileUrl || '');
        return hasRealDriveLink(liveDrive);
      }).length,
    [queueFootages, getFieldValue]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return queueFootages.filter((ft) => {
      if (scopeFilter === 'SOCIAL_ONLY' && !ft.originalUrl?.trim()) {
        return false;
      }
      if (!q) return true;
      const liveTitle = getFieldValue(ft.id, 'title', ft.title);
      return (
        ft.id.toLowerCase().includes(q) ||
        liveTitle.toLowerCase().includes(q) ||
        (ft.originalUrl || '').toLowerCase().includes(q)
      );
    });
  }, [queueFootages, scopeFilter, searchQuery, getFieldValue]);

  const handleCopyFileName = async (id: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(fileName);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleDrivePaste = (
    id: string,
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (/^https?:\/\/\S+/i.test(pasted)) {
      e.preventDefault();
      scheduleUpdate(id, { driveFileUrl: pasted }, { immediate: true });
    }
  };

  const headerRight = (
    <div className="flex items-center gap-1.5 shrink-0">
      {completedInSessionCount > 0 && (
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E8F3E8] border border-[#9EC49C] text-[#224A2D] text-xs font-bold font-mono tabular-nums">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
          <span>ผูกแล้ว {completedInSessionCount}</span>
        </span>
      )}

      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF2E1] border border-[#E0C28E] text-[#6E4919] text-xs font-extrabold font-mono tabular-nums">
        <Clock className="w-3.5 h-3.5 text-[#B57B2E]" />
        <span>ค้าง {remainingMissingCount}</span>
      </span>
    </div>
  );

  const headerContent = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
      <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-[#F2ECE1] border border-[#E2D8C9] rounded-xl shrink-0">
        <button
          type="button"
          onClick={() => setScopeFilter('ALL_MISSING')}
          className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            scopeFilter === 'ALL_MISSING'
              ? 'bg-[#FFFDF9] text-[#2D2926] shadow-2xs border border-[#D5C7B2]'
              : 'text-[#6E665E] hover:text-[#2D2926] border border-transparent'
          }`}
        >
          ขาดลิงก์ Drive ทั้งหมด ({remainingMissingCount})
        </button>
        <button
          type="button"
          onClick={() => setScopeFilter('SOCIAL_ONLY')}
          className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            scopeFilter === 'SOCIAL_ONLY'
              ? 'bg-[#FFFDF9] text-[#2D2926] shadow-2xs border border-[#D5C7B2]'
              : 'text-[#6E665E] hover:text-[#2D2926] border border-transparent'
          }`}
        >
          มีลิงก์ Social ({socialOnlyCount})
        </button>
      </div>

      <div className="relative flex-1 min-w-0">
        <Search className="w-3.5 h-3.5 text-[#8C8277] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหารหัส หรือชื่อคลิป..."
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:bg-white focus:border-[#C5AB84] text-[#2D2926] placeholder:text-[#968B7E]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8277] hover:text-[#2D2926] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  const footer = (
    <CloudSyncFooterBar
      summary={syncSummary}
      debounceMs={DEBOUNCE_DELAY_MS}
      onFlushAll={() => void flushAll()}
      onRetryAll={() => void retryAllFailed()}
      onClose={handleCloseModal}
    />
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="คิววางลิงก์ Google Drive ด่วน (จาก LINE / Social)"
      subtitle="กดเปิดลิงก์ต้นฉบับ ➔ คัดลอกชื่อไฟล์ไปอัปโหลด ➔ วางลิงก์ Drive (หน่วงพิมพ์ 0.55 วิ / วางลิงก์บันทึกทันที)"
      icon={<FolderCheck className="w-4 h-4 text-[#8A5A22]" />}
      headerRight={headerRight}
      headerContent={headerContent}
      footer={footer}
      maxWidthClass="max-w-4xl"
      heightClass="h-[92dvh] max-h-[92dvh] sm:h-[85vh] sm:max-h-[85vh]"
      bodyClassName="p-3.5 sm:p-5 bg-[#FAF8F5] space-y-2.5"
    >
      {filteredItems.length === 0 ? (
        <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl">
          <div className="w-11 h-11 rounded-2xl bg-[#E8F3E8] border border-[#9EC49C] text-[#2E7D32] flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#2D2926]">
            ไม่มีรายการค้างวางลิงก์ Google Drive
          </h3>
          <p className="text-xs text-[#787066] mt-1 max-w-md">
            ฟุตเทจทั้งหมดในหมวดนี้มีลิงก์ Google Drive ครบถ้วนพร้อมใช้งานแล้ว
          </p>
        </div>
      ) : (
        filteredItems.map((ft) => {
          const liveTitle = getFieldValue(ft.id, 'title', ft.title);
          const liveDriveUrl = getFieldValue(
            ft.id,
            'driveFileUrl',
            ft.driveFileUrl || ''
          );
          const liveStandardFileName = generateStandardFileName(ft.id, liveTitle);
          const isDriveReady = hasRealDriveLink(liveDriveUrl);
          const hasSocial = Boolean(ft.originalUrl?.trim());
          const isCopied = copiedId === ft.id;
          const rowSyncStatus = getItemStatus(ft.id);

          return (
            <div
              key={ft.id}
              className={`rounded-2xl border p-3.5 transition-all space-y-2.5 shadow-2xs ${
                rowSyncStatus.state === 'ERROR'
                  ? 'bg-[#FFF9F9] border-[#ECC8C8]'
                  : isDriveReady
                  ? 'bg-[#F4FAF4] border-[#BBD6B9]'
                  : 'bg-[#FDFBF7] border-[#E8DFD3] hover:border-[#DEC190]'
              }`}
            >
              {/* Row 1: ID + Date + Drive Status + Live Cloud Sync Status + Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#4A3D31] text-white font-mono text-xs font-bold shrink-0">
                    <Film className="w-3 h-3 text-[#E6D4B3]" />
                    <span>{ft.id}</span>
                  </span>

                  <span className="text-[11px] font-mono text-[#787066] tabular-nums">
                    {formatThaiDate(ft.createdAt)}
                  </span>

                  {isDriveReady ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#E8F3E8] border border-[#9EC49C] text-[#224A2D] text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
                      <span>ผูกลิงก์ Drive แล้ว</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF2E1] border border-[#E0C28E] text-[#6E4919] text-[11px] font-bold">
                      <Clock className="w-3 h-3 text-[#B57B2E]" />
                      <span>รอลิงก์ Drive</span>
                    </span>
                  )}

                  {/* Per-Row Live Cloud Save Status */}
                  <CloudSyncStatusBadge
                    status={rowSyncStatus}
                    onRetry={() => void retryItem(ft.id)}
                    showTimestamp
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Copy Standard File Name Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyFileName(ft.id, liveStandardFileName)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#F2EBE0] border border-[#E2D8C9] text-[11px] font-bold text-[#5C5349] transition-colors cursor-pointer"
                    title={`คัดลอกชื่อไฟล์: ${liveStandardFileName}`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-[#2E7D32]" />
                        <span className="text-[#224A2D]">คัดลอกชื่อไฟล์แล้ว</span>
                      </>
                    ) : (
                      <>
                        <FileCode className="w-3 h-3 text-[#8C8277]" />
                        <span className="font-mono max-w-[140px] sm:max-w-[200px] truncate">
                          {liveStandardFileName}
                        </span>
                        <Copy className="w-3 h-3 text-[#8C8277]" />
                      </>
                    )}
                  </button>

                  {/* Open Social Link Button */}
                  {hasSocial && (
                    <a
                      href={ft.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EDF5F9] hover:bg-[#DCEBF2] border border-[#C4DFED] text-[#23546E] text-[11px] font-bold transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-[#2E6B8A]" />
                      <span>เปิดลิงก์ Social</span>
                    </a>
                  )}

                  {/* Open Full Edit & Tags Modal */}
                  {onSelectForTraceability && (
                    <button
                      type="button"
                      onClick={() => {
                        void flushAll();
                        onClose();
                        onSelectForTraceability(ft.id);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFFDF9] hover:bg-[#F4EFE6] border border-[#E2D8C9] text-[#5C5349] text-[11px] font-bold transition-colors cursor-pointer"
                      title="เปิดหน้าต่างติดแท็ก 3 ชั้นและแก้ไขละเอียด"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span className="hidden sm:inline">ติดแท็ก</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Inline Title (Debounced) + Google Drive URL Input (Debounced + Immediate Paste/Blur) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-5">
                  <input
                    type="text"
                    value={liveTitle}
                    onChange={(e) =>
                      scheduleUpdate(ft.id, { title: e.target.value })
                    }
                    onBlur={() => void flushItem(ft.id)}
                    placeholder="ชื่อช็อตฟุตเทจ..."
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:bg-white focus:border-[#C5AB84] text-[#2D2926]"
                  />
                </div>

                <div className="md:col-span-7 relative">
                  <FolderCheck
                    className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                      isDriveReady ? 'text-[#2E7D32]' : 'text-[#B57B2E]'
                    }`}
                  />
                  <input
                    type="url"
                    value={liveDriveUrl}
                    onChange={(e) =>
                      scheduleUpdate(ft.id, { driveFileUrl: e.target.value })
                    }
                    onPaste={(e) => handleDrivePaste(ft.id, e)}
                    onBlur={() => void flushItem(ft.id)}
                    placeholder="วางลิงก์ Google Drive ที่นี่ (https://drive.google.com/file/d/...)..."
                    className={`w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-xl border focus:outline-hidden transition-colors ${
                      isDriveReady
                        ? 'bg-white border-[#9EC49C] text-[#1D3B26]'
                        : 'bg-[#FAF2E1]/50 border-[#E0C28E] focus:bg-white focus:border-[#9EC49C] text-[#2D2926]'
                    }`}
                  />
                </div>
              </div>

              {/* Optional Social Link Preview */}
              {hasSocial && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#787066] truncate px-0.5">
                  <Link2 className="w-3 h-3 text-[#2E6B8A] shrink-0" />
                  <span className="font-mono truncate">{ft.originalUrl}</span>
                </div>
              )}
            </div>
          );
        })
      )}
    </BaseModal>
  );
};
