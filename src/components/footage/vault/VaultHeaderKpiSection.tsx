import React from 'react';
import { motion } from 'motion/react';
import {
  Inbox,
  RotateCcw,
  Film,
  CheckCircle2,
  Sparkles,
  Clock,
  Maximize2,
  X,
} from 'lucide-react';
import { CooldownStatus } from '../../../types/footage.types';
import { SystemSettings } from '../../../types/tag.types';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';
import { AnimatedMetricNumber } from './AnimatedMetricNumber';
import { ActiveScopeDescription, VaultMetricsSummary } from './vault.types';

export interface VaultHeaderKpiSectionProps {
  totalVaultCount: number;
  stagingCount: number;
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
}

export const VaultHeaderKpiSection: React.FC<VaultHeaderKpiSectionProps> = ({
  totalVaultCount,
  stagingCount,
  isStagingFilterActive,
  vaultMetrics,
  activeScopeDescription,
  hasHierarchySelection,
  statusFilter,
  settings,
  onToggleStagingFilter,
  onStatusFilterChange,
  onClearHierarchySelection,
  onOpenGoogleDriveBatchModal,
  onOpenFullscreenStudio,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-2xs">
      {/* Top Action & Uncategorized Triage Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Uncategorized Clips Quick Triage Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
              isStagingFilterActive
                ? 'bg-amber-100 border-amber-400 text-amber-950'
                : stagingCount > 0
                ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <Inbox
              className={`w-4 h-4 shrink-0 ${
                stagingCount > 0 ? 'text-amber-600' : 'text-slate-400'
              }`}
            />
            <span>คลิปไม่มีหมวดหมู่</span>
            <span
              className={`px-2 py-0.5 rounded-md font-mono tabular-nums text-xs font-extrabold ${
                stagingCount > 0
                  ? 'bg-amber-400/90 text-slate-950'
                  : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {stagingCount}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleStagingFilter}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isStagingFilterActive
                ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                : stagingCount > 0
                ? 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            {isStagingFilterActive ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ดูทั้งหมด ({totalVaultCount})</span>
              </>
            ) : (
              <span>ดูคลิปไม่มีหมวด</span>
            )}
          </button>

          {stagingCount > 0 && onOpenFullscreenStudio && (
            <button
              type="button"
              onClick={onOpenFullscreenStudio}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
              title="เปิดสตูดิโอคัดแยกหมวดหมู่เต็มจอ"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>คัดแยกเต็มจอ</span>
            </button>
          )}
        </div>

        {/* Right: Active Filter Chip (if filtered) + Google Drive Import */}
        <div className="flex flex-wrap items-center gap-2">
          {hasHierarchySelection && (
            <button
              type="button"
              onClick={onClearHierarchySelection}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
              title="ล้างหมวดหมู่ที่เลือก"
            >
              <span>{activeScopeDescription.label}</span>
              <X className="w-3.5 h-3.5 text-indigo-600" />
            </button>
          )}

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
      </div>

      {/* 4 Clean KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* KPI 1: Total */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() => onStatusFilterChange('ALL')}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-indigo-50/90 text-indigo-950 border-indigo-400 ring-2 ring-indigo-200/60'
              : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 truncate ${
                statusFilter === 'ALL' ? 'text-indigo-800' : 'text-slate-600'
              }`}
            >
              <Film className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {hasHierarchySelection ? activeScopeDescription.label : 'ทั้งหมด'}
              </span>
            </span>
            {hasHierarchySelection && (
              <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                /{totalVaultCount}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <AnimatedMetricNumber
              value={vaultMetrics.total}
              className="text-2xl font-extrabold tabular-nums"
            />
            <span className="text-[11px] text-slate-500">คลิป</span>
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
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'READY_FRESH'
              ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300/60'
              : 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 ${
                statusFilter === 'READY_FRESH' ? 'text-white' : 'text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>พร้อมใช้</span>
            </span>
            <span
              className={`text-[11px] font-mono tabular-nums ${
                statusFilter === 'READY_FRESH' ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            >
              พัก ≥{settings.greenReadyDays ?? 21}ว.
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <AnimatedMetricNumber
              value={vaultMetrics.readyFresh}
              className={`text-2xl font-extrabold tabular-nums ${
                statusFilter === 'READY_FRESH' ? 'text-white' : 'text-emerald-700'
              }`}
            />
            <span
              className={`text-[11px] font-mono tabular-nums ${
                statusFilter === 'READY_FRESH' ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            >
              ใช้ได้รวม {vaultMetrics.usable}
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
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'NEW_UNTOUCHED'
              ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-300/60'
              : 'bg-sky-50/50 hover:bg-sky-50 border-sky-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 ${
                statusFilter === 'NEW_UNTOUCHED' ? 'text-white' : 'text-sky-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>คลิปใหม่</span>
            </span>
            <span
              className={`text-[11px] ${
                statusFilter === 'NEW_UNTOUCHED' ? 'text-sky-100' : 'text-sky-700'
              }`}
            >
              ยังไม่เคยใช้
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <AnimatedMetricNumber
              value={vaultMetrics.newUntouched}
              className={`text-2xl font-extrabold tabular-nums ${
                statusFilter === 'NEW_UNTOUCHED' ? 'text-white' : 'text-sky-700'
              }`}
            />
            <span
              className={`text-[11px] ${
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
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'RECENT_COOLDOWN'
              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300/60'
              : 'bg-rose-50/50 hover:bg-rose-50 border-rose-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 ${
                statusFilter === 'RECENT_COOLDOWN' ? 'text-white' : 'text-rose-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>ติดคูลดาวน์</span>
            </span>
            <span
              className={`text-[11px] font-mono tabular-nums ${
                statusFilter === 'RECENT_COOLDOWN' ? 'text-rose-100' : 'text-rose-700'
              }`}
            >
              พัก &lt;{settings.cooldownDays}ว.
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <AnimatedMetricNumber
              value={vaultMetrics.inCooldown}
              className={`text-2xl font-extrabold tabular-nums ${
                statusFilter === 'RECENT_COOLDOWN' ? 'text-white' : 'text-rose-700'
              }`}
            />
            <span
              className={`text-[11px] ${
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
