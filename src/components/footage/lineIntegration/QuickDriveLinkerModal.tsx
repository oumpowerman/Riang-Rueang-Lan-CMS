import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
import {
  formatThaiDate,
  hasRealDriveLink,
} from '../../../utils/fileNameGenerator';

interface QuickDriveLinkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForTraceability?: (footageId: string) => void;
}

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

  useEffect(() => {
    if (isOpen) {
      const missingIds = computedFootage
        .filter((ft) => !hasRealDriveLink(ft.driveFileUrl))
        .map((ft) => ft.id);
      setSessionTargetIds(missingIds);
    }
  }, [isOpen]);

  // Also include any newly arrived footage from LINE OA while the modal is open
  const queueFootages = useMemo(() => {
    const sessionSet = new Set(sessionTargetIds);
    return computedFootage.filter(
      (ft) => sessionSet.has(ft.id) || !hasRealDriveLink(ft.driveFileUrl)
    );
  }, [computedFootage, sessionTargetIds]);

  const socialOnlyCount = useMemo(
    () =>
      queueFootages.filter(
        (ft) =>
          Boolean(ft.originalUrl?.trim()) && !hasRealDriveLink(ft.driveFileUrl)
      ).length,
    [queueFootages]
  );

  const remainingMissingCount = useMemo(
    () => queueFootages.filter((ft) => !hasRealDriveLink(ft.driveFileUrl)).length,
    [queueFootages]
  );

  const completedInSessionCount = useMemo(
    () => queueFootages.filter((ft) => hasRealDriveLink(ft.driveFileUrl)).length,
    [queueFootages]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return queueFootages.filter((ft) => {
      if (scopeFilter === 'SOCIAL_ONLY' && !ft.originalUrl?.trim()) {
        return false;
      }
      if (!q) return true;
      return (
        ft.id.toLowerCase().includes(q) ||
        ft.title.toLowerCase().includes(q) ||
        (ft.originalUrl || '').toLowerCase().includes(q)
      );
    });
  }, [queueFootages, scopeFilter, searchQuery]);

  const handleCopyFileName = async (id: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(fileName);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="quick-drive-linker-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-5 bg-slate-950/60 backdrop-blur-xs"
        >
          <motion.div
            key="quick-drive-linker-dialog"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl h-[94dvh] max-h-[95dvh] sm:h-[85vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50/95 px-3.5 sm:px-5 pt-3 sm:pt-4 pb-2.5 sm:pb-3 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
                    <FolderCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                      คิววางลิงก์ Google Drive ด่วน (จาก LINE / Social)
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                      กดเปิดลิงก์ต้นฉบับ ➔ คัดลอกชื่อไฟล์ไปอัปโหลด ➔ วางลิงก์ Drive เพื่อบันทึกทันที
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {completedInSessionCount > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono tabular-nums">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ผูกแล้ว {completedInSessionCount}</span>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 text-xs font-extrabold font-mono tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>ค้าง {remainingMissingCount}</span>
                  </span>

                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                    aria-label="ปิดหน้าต่าง"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setScopeFilter('ALL_MISSING')}
                    className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      scopeFilter === 'ALL_MISSING'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ขาดลิงก์ Drive ทั้งหมด ({remainingMissingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeFilter('SOCIAL_ONLY')}
                    className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      scopeFilter === 'SOCIAL_ONLY'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    มีลิงก์ Social ({socialOnlyCount})
                  </button>
                </div>

                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหารหัส หรือชื่อคลิป..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Queue List Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50/50 space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 bg-white border border-slate-200 rounded-2xl">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ไม่มีรายการค้างวางลิงก์ Google Drive
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    ฟุตเทจทั้งหมดในหมวดนี้มีลิงก์ Google Drive ครบถ้วนพร้อมใช้งานแล้ว
                  </p>
                </div>
              ) : (
                filteredItems.map((ft) => {
                  const isDriveReady = hasRealDriveLink(ft.driveFileUrl);
                  const hasSocial = Boolean(ft.originalUrl?.trim());
                  const isCopied = copiedId === ft.id;

                  return (
                    <div
                      key={ft.id}
                      className={`rounded-2xl border p-3.5 transition-all space-y-2.5 shadow-2xs ${
                        isDriveReady
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : 'bg-white border-slate-200/90 hover:border-amber-300'
                      }`}
                    >
                      {/* Row 1: ID + Date + Copy Standard Filename + Open Social Link */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold shrink-0">
                            <Film className="w-3 h-3 text-slate-300" />
                            <span>{ft.id}</span>
                          </span>

                          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                            {formatThaiDate(ft.createdAt)}
                          </span>

                          {isDriveReady ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>ผูกลิงก์ Drive แล้ว</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>รอลิงก์ Drive</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Copy Standard File Name Button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyFileName(ft.id, ft.standardFileName)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                            title={`คัดลอกชื่อไฟล์: ${ft.standardFileName}`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">
                                  คัดลอกชื่อไฟล์แล้ว
                                </span>
                              </>
                            ) : (
                              <>
                                <FileCode className="w-3 h-3 text-slate-500" />
                                <span className="font-mono max-w-[140px] sm:max-w-[200px] truncate">
                                  {ft.standardFileName}
                                </span>
                                <Copy className="w-3 h-3 text-slate-500" />
                              </>
                            )}
                          </button>

                          {/* Open Social Link Button */}
                          {hasSocial && (
                            <a
                              href={ft.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[11px] font-bold transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 text-indigo-600" />
                              <span>เปิดลิงก์ Social</span>
                            </a>
                          )}

                          {/* Open Full Edit & Tags Modal */}
                          {onSelectForTraceability && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectForTraceability(ft.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                              title="เปิดหน้าต่างติดแท็ก 3 ชั้นและแก้ไขละเอียด"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              <span className="hidden sm:inline">ติดแท็ก</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Inline Title + Google Drive URL Input */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <div className="md:col-span-5">
                          <input
                            type="text"
                            value={ft.title}
                            onChange={(e) =>
                              updateFootage(ft.id, { title: e.target.value })
                            }
                            placeholder="ชื่อช็อตฟุตเทจ..."
                            className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
                          />
                        </div>

                        <div className="md:col-span-7 relative">
                          <FolderCheck
                            className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                              isDriveReady ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          />
                          <input
                            type="url"
                            value={ft.driveFileUrl || ''}
                            onChange={(e) =>
                              updateFootage(ft.id, {
                                driveFileUrl: e.target.value,
                              })
                            }
                            placeholder="วางลิงก์ Google Drive ที่นี่ (https://drive.google.com/file/d/...)..."
                            className={`w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-xl border focus:outline-none transition-colors ${
                              isDriveReady
                                ? 'bg-white border-emerald-400 text-emerald-950'
                                : 'bg-amber-50/40 border-amber-300 focus:bg-white focus:border-emerald-600'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Optional Social Link Preview */}
                      {hasSocial && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate px-0.5">
                          <Link2 className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="font-mono truncate">
                            {ft.originalUrl}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-3.5 sm:px-5 py-2.5 border-t border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] sm:text-xs truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>วางลิงก์ Drive แล้วระบบบันทึกขึ้น Cloud อัตโนมัติทันที</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
