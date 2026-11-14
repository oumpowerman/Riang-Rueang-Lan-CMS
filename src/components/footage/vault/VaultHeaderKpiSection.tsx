import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Inbox,
  RotateCcw,
  Film,
  CheckCircle2,
  Sparkles,
  Clock,
  Maximize2,
  FileSpreadsheet,
  ChevronDown,
  Wrench,
  MessageSquare,
  FolderCheck,
} from 'lucide-react';
import { CooldownStatus } from '../../../types/footage.types';
import { SystemSettings } from '../../../types/tag.types';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';
import { CleanPrefixedTitlesButton } from '../CleanPrefixedTitlesButton';
import { AnimatedMetricNumber } from './AnimatedMetricNumber';
import { ActiveScopeDescription, VaultMetricsSummary } from './vault.types';

export interface VaultHeaderKpiSectionProps {
  totalVaultCount: number;
  stagingCount: number;
  missingDriveCount?: number;
  isStagingFilterActive: boolean;
  vaultMetrics: VaultMetricsSummary;
  activeScopeDescription: ActiveScopeDescription;
  hasHierarchySelection: boolean;
  statusFilter: CooldownStatus | 'ALL';
  settings: SystemSettings;
  onToggleStagingFilter: () => void;
  onStatusFilterChange: (status: CooldownStatus | 'ALL') => void;
  onClearHierarchySelection: () => void;
  onOpenStatusRuleModal?: () => void;
  onOpenThreeTierManager?: () => void;
  onOpenSourceSplitter?: () => void;
  onOpenDirectFootageModal?: () => void;
  onOpenGoogleDriveBatchModal?: () => void;
  onOpenFullscreenStudio?: () => void;
  onOpenSheetTagImportModal?: () => void;
  onOpenYouTubeDateSyncModal?: () => void;
  onOpenLineOaModal?: () => void;
  onOpenQuickDriveLinker?: () => void;
}

export const VaultHeaderKpiSection: React.FC<VaultHeaderKpiSectionProps> = ({
  totalVaultCount,
  stagingCount,
  missingDriveCount = 0,
  isStagingFilterActive,
  vaultMetrics,
  activeScopeDescription,
  hasHierarchySelection,
  statusFilter,
  settings,
  onToggleStagingFilter,
  onStatusFilterChange,
  onOpenGoogleDriveBatchModal,
  onOpenFullscreenStudio,
  onOpenSheetTagImportModal,
  onOpenLineOaModal,
  onOpenQuickDriveLinker,
}) => {
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const mobileToolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileToolsRef.current &&
        !mobileToolsRef.current.contains(e.target as Node)
      ) {
        setIsMobileToolsOpen(false);
      }
    };
    if (isMobileToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileToolsOpen]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
      {/* Top Action & Uncategorized Triage Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Unified Uncategorized Clips Toggle Button + Desktop Studio/Clean Actions */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onToggleStagingFilter}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              isStagingFilterActive
                ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-2xs'
                : stagingCount > 0
                ? 'bg-amber-50/90 hover:bg-amber-100/80 border-amber-300 text-amber-950 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title={
              isStagingFilterActive
                ? 'คลิกเพื่อกลับไปดูฟุตเทจทั้งหมดในคลัง'
                : 'คลิกเพื่อกรองดูเฉพาะคลิปที่ยังไม่มีหมวดหมู่'
            }
          >
            {isStagingFilterActive ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden sm:inline">
                  กำลังดูไม่มีหมวด ({stagingCount}) · ดูทั้งหมด ({totalVaultCount})
                </span>
                <span className="sm:hidden">
                  ไม่มีหมวด ({stagingCount}) · ดูทั้งหมด
                </span>
              </>
            ) : (
              <>
                <Inbox
                  className={`w-3.5 h-3.5 shrink-0 ${
                    stagingCount > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`}
                />
                <span className="hidden sm:inline">คลิปไม่มีหมวดหมู่</span>
                <span className="sm:hidden">ไม่มีหมวด</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md font-mono tabular-nums text-[11px] font-extrabold ${
                    stagingCount > 0
                      ? 'bg-amber-400/90 text-slate-950'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {stagingCount}
                </span>
              </>
            )}
          </button>

          {stagingCount > 0 && onOpenFullscreenStudio && (
            <button
              type="button"
              onClick={onOpenFullscreenStudio}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              title="เปิดสตูดิโอคัดแยกหมวดหมู่เต็มจอ"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>คัดแยกเต็มจอ</span>
            </button>
          )}

          <div className="hidden sm:block">
            <CleanPrefixedTitlesButton />
          </div>
        </div>

        {/* Right: Desktop Sync/Drive Buttons + Mobile Unified Tools Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop Buttons (sm:flex) */}
          <div className="hidden sm:flex items-center gap-2">
            {onOpenLineOaModal && (
              <button
                type="button"
                onClick={onOpenLineOaModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                title="รับโค้ด Google Apps Script เชื่อมแชท LINE OA ส่งฟุตเทจเข้าคลังอัตโนมัติ"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>เชื่อม LINE OA</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSheetTagImportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#1C4824] bg-[#EEF5EE] hover:bg-[#E2EFE2] border border-[#BAD8BF] rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
              title="สตูดิโอซิงก์ตารางหลัก 10 คอลัมน์ (A–J): ฟุตเทจ + แท็ก 3 ชั้น + จัดอันดับ EP + วันที่เผยแพร่"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#3B6845] shrink-0" />
              <span>ซิงก์ Google Sheet</span>
            </button>

            <button
              type="button"
              onClick={onOpenGoogleDriveBatchModal}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
              title="ดึงข้อมูลคลิปจากโฟลเดอร์ Google Drive"
            >
              <GoogleDriveIcon className="w-4 h-4 shrink-0" />
              <span>ดึงข้อมูลจาก Drive</span>
            </button>
          </div>

          {/* Mobile Unified Tools Menu (< sm) */}
          <div className="relative sm:hidden" ref={mobileToolsRef}>
            <button
              type="button"
              onClick={() => setIsMobileToolsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>เครื่องมือคลัง</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  isMobileToolsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isMobileToolsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 z-40 space-y-1"
                >
                  {onOpenLineOaModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileToolsOpen(false);
                        onOpenLineOaModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-xs font-bold text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>เชื่อม LINE OA (Apps Script)</span>
                    </button>
                  )}

                  {missingDriveCount > 0 && onOpenQuickDriveLinker && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileToolsOpen(false);
                        onOpenQuickDriveLinker();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-xs font-bold text-amber-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FolderCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>คิววางลิงก์ Drive ด่วน ({missingDriveCount})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileToolsOpen(false);
                      onOpenSheetTagImportModal?.();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#EEF5EE] text-xs font-bold text-[#1C4824] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#3B6845] shrink-0" />
                    <span>ซิงก์ Google Sheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileToolsOpen(false);
                      onOpenGoogleDriveBatchModal?.();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <GoogleDriveIcon className="w-4 h-4 shrink-0" />
                    <span>ดึงข้อมูลจาก Google Drive</span>
                  </button>

                  {stagingCount > 0 && onOpenFullscreenStudio && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileToolsOpen(false);
                        onOpenFullscreenStudio();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-xs font-bold text-indigo-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>สตูดิโอคัดแยกเต็มจอ ({stagingCount})</span>
                    </button>
                  )}

                  <div className="pt-1 border-t border-slate-100 px-1">
                    <CleanPrefixedTitlesButton compact />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 4 Clean KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* KPI 1: Total */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() => onStatusFilterChange('ALL')}
          className={`text-left p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-indigo-50/90 text-indigo-950 border-indigo-400 ring-2 ring-indigo-200/60'
              : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 min-w-0 ${
                statusFilter === 'ALL' ? 'text-indigo-800' : 'text-slate-600'
              }`}
            >
              <Film className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate whitespace-nowrap">
                {hasHierarchySelection ? activeScopeDescription.label : 'ทั้งหมด'}
              </span>
            </span>
            {hasHierarchySelection && (
              <span className="hidden sm:inline text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                /{totalVaultCount}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1">
            <AnimatedMetricNumber
              value={vaultMetrics.total}
              className="text-2xl font-extrabold tabular-nums"
            />
            <span className="hidden sm:inline text-[11px] text-slate-500 whitespace-nowrap">
              คลิป
            </span>
          </div>
        </motion.button>

        {/* KPI 2: Ready Fresh */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() =>
            onStatusFilterChange(
              statusFilter === 'READY_FRESH' ? 'ALL' : 'READY_FRESH'
            )
          }
          className={`text-left p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'READY_FRESH'
              ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300/60'
              : 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'READY_FRESH' ? 'text-white' : 'text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>พร้อมใช้</span>
            </span>
            <span
              className={`hidden sm:inline text-[11px] font-mono tabular-nums whitespace-nowrap ${
                statusFilter === 'READY_FRESH' ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            >
              พัก ≥{settings.greenReadyDays ?? 21}ว.
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1">
            <AnimatedMetricNumber
              value={vaultMetrics.readyFresh}
              className={`text-2xl font-extrabold tabular-nums ${
                statusFilter === 'READY_FRESH' ? 'text-white' : 'text-emerald-700'
              }`}
            />
            <span
              className={`hidden sm:inline text-[11px] font-mono tabular-nums whitespace-nowrap ${
                statusFilter === 'READY_FRESH' ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            >
              รวม {vaultMetrics.usable}
            </span>
          </div>
        </motion.button>

        {/* KPI 3: New Untouched */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() =>
            onStatusFilterChange(
              statusFilter === 'NEW_UNTOUCHED' ? 'ALL' : 'NEW_UNTOUCHED'
            )
          }
          className={`text-left p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'NEW_UNTOUCHED'
              ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-300/60'
              : 'bg-sky-50/50 hover:bg-sky-50 border-sky-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'NEW_UNTOUCHED' ? 'text-white' : 'text-sky-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>คลิปใหม่</span>
            </span>
            <span
              className={`hidden sm:inline text-[11px] whitespace-nowrap ${
                statusFilter === 'NEW_UNTOUCHED' ? 'text-sky-100' : 'text-sky-700'
              }`}
            >
              ยังไม่เคยใช้
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1">
            <AnimatedMetricNumber
              value={vaultMetrics.newUntouched}
              className={`text-2xl font-extrabold tabular-nums ${
                statusFilter === 'NEW_UNTOUCHED' ? 'text-white' : 'text-sky-700'
              }`}
            />
            <span
              className={`hidden sm:inline text-[11px] whitespace-nowrap ${
                statusFilter === 'NEW_UNTOUCHED' ? 'text-sky-100' : 'text-sky-700'
              }`}
            >
              คลิป
            </span>
          </div>
        </motion.button>

        {/* KPI 4: In Cooldown */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() =>
            onStatusFilterChange(
              statusFilter === 'RECENT_COOLDOWN' ? 'ALL' : 'RECENT_COOLDOWN'
            )
          }
          className={`text-left p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'RECENT_COOLDOWN'
              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300/60'
              : 'bg-rose-50/50 hover:bg-rose-50 border-rose-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'RECENT_COOLDOWN' ? 'text-white' : 'text-rose-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>ติดคูลดาวน์</span>
            </span>
            <span
              className={`hidden sm:inline text-[11px] font-mono tabular-nums whitespace-nowrap ${
                statusFilter === 'RECENT_COOLDOWN' ? 'text-rose-100' : 'text-rose-700'
              }`}
            >
              พัก &lt;{settings.cooldownDays}ว.
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1">
            <AnimatedMetricNumber
              value={vaultMetrics.inCooldown}
              className={`text-2xl font-extrabold tabular-nums ${
                statusFilter === 'RECENT_COOLDOWN' ? 'text-white' : 'text-rose-700'
              }`}
            />
            <span
              className={`hidden sm:inline text-[11px] whitespace-nowrap ${
                statusFilter === 'RECENT_COOLDOWN' ? 'text-rose-100' : 'text-rose-700'
              }`}
            >
              คลิป
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};
