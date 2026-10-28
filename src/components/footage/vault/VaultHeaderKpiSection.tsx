import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Filter,
  FolderTree,
  Inbox,
  Plus,
  RotateCcw,
  Scissors,
  Film,
  Sliders,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { CooldownStatus } from '../../../types/footage.types';
import { SystemSettings } from '../../../types/tag.types';
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
  onOpenStatusRuleModal: () => void;
  onOpenThreeTierManager: () => void;
  onOpenSourceSplitter: () => void;
  onOpenDirectFootageModal: () => void;
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
  onOpenStatusRuleModal,
  onOpenThreeTierManager,
  onOpenSourceSplitter,
  onOpenDirectFootageModal,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>คลังฟุตเทจ (Footage Vault Overview)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            สำรวจสต็อกคลิปแบบ 3 ชั้น (กลุ่มหมวดหมู่ ➔ หมวดหลัก ➔ หมวดย่อย) พร้อมพื้นที่พักสำหรับคลิปที่บันทึกด่วนรอจัดหมวดหมู่
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenStatusRuleModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>ตั้งค่าเกณฑ์สีสถานะ</span>
          </button>

          <button
            type="button"
            onClick={onOpenThreeTierManager}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
            <span>จัดการหมวดหมู่ 3 ชั้น</span>
          </button>

          <button
            type="button"
            onClick={onOpenSourceSplitter}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-950 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-colors cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-700" />
            <span>หั่นจากไลฟ์ (1:N)</span>
          </button>

          <button
            type="button"
            onClick={onOpenDirectFootageModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มฟุตเดี่ยว (1:1)</span>
          </button>
        </div>
      </div>

      {/* Special Staging Area Alert Banner (พื้นที่พักรอจัดหมวดหมู่) */}
      <motion.div
        layout
        className={`rounded-2xl p-4 border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 ${
          isStagingFilterActive
            ? 'bg-amber-100/90 border-2 border-amber-500 ring-2 ring-amber-400/30 shadow-xs'
            : stagingCount > 0
            ? 'bg-amber-50/90 border-amber-300/90'
            : 'bg-slate-50/90 border-slate-200/90'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isStagingFilterActive || stagingCount > 0
                ? 'bg-amber-500 text-slate-950 shadow-2xs'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <Inbox className="w-5 h-5" />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900">
                พื้นที่พักรอจัดหมวดหมู่ (Staging Area)
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-mono font-bold tabular-nums rounded-lg border ${
                  stagingCount > 0
                    ? 'bg-amber-400 text-slate-950 border-amber-500'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {stagingCount > 0
                  ? `รอจัดเข้าหมวดหมู่ ${stagingCount} คลิป`
                  : 'ไม่มีคลิปค้าง (0 คลิป)'}
              </span>

              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-amber-900 bg-white/90 border border-amber-200 rounded-lg">
                ไม่นับรวมโควตา 5 ฟุต = 1 EP จนกว่าจะจัดเข้าหมวดหมู่จริง
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              {isStagingFilterActive
                ? 'กำลังแสดงเฉพาะฟุตเทจในพื้นที่พักรอจัดหมวดหมู่ — คลิกที่การ์ดคลิปด้านล่างเพื่อเลือกหมวดหมู่จริงได้ทันที'
                : stagingCount > 0
                ? `มีฟุตเทจที่บันทึกด่วนรอคัดแยกอยู่ ${stagingCount} รายการ กดปุ่มกรองด้านขวาเพื่อเปิดดูและจัดเข้าหมวดหมู่จริง`
                : 'เมื่อคุณบันทึกฟุตเทจใหม่โดยยังไม่เลือกแท็ก คลิปจะถูกเก็บไว้ในพื้นที่พักนี้โดยอัตโนมัติ'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleStagingFilter}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-2xs ${
              isStagingFilterActive
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : stagingCount > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-300'
            }`}
          >
            {isStagingFilterActive ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>แสดงฟุตเทจทั้งหมดในคลัง</span>
              </>
            ) : (
              <>
                <Filter className="w-4 h-4" />
                <span>กรองดูคลิปในพื้นที่พักทันที ({stagingCount})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenDirectFootageModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-amber-950 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-700" />
            <span>โยนคลิปเข้าพื้นที่พักด่วน</span>
          </button>
        </div>
      </motion.div>

      {/* Active Scope Banner for the 4 KPI Cards (Animated Pill & Trail) */}
      <motion.div
        layout
        className={`px-3.5 py-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
          hasHierarchySelection
            ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950'
            : 'bg-slate-50 border-slate-200/80 text-slate-600'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 overflow-hidden">
          <span className="font-semibold text-slate-500">
            ตัวเลขการ์ดสถานะด้านล่างกำลังแสดงของ:
          </span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={activeScopeDescription.key}
              initial={{ y: 10, opacity: 0, scale: 0.94, filter: 'blur(2px)' }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ y: -10, opacity: 0, scale: 0.94, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-md ${
                hasHierarchySelection
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-200/80 text-slate-800'
              }`}
            >
              <span>{activeScopeDescription.label}</span>
            </motion.span>
          </AnimatePresence>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`trail-${activeScopeDescription.key}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.18 }}
              className="text-[11px] text-slate-500 hidden sm:inline"
            >
              ({activeScopeDescription.trail})
            </motion.span>
          </AnimatePresence>
        </div>

        {hasHierarchySelection && (
          <button
            type="button"
            onClick={onClearHierarchySelection}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>กลับไปดูยอดรวมทั้งคลัง ({totalVaultCount} คลิป)</span>
          </button>
        )}
      </motion.div>

      {/* 4 Enterprise KPI Cards (Synchronized with Selected Scope + Smooth Animated Counters) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() => onStatusFilterChange('ALL')}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-indigo-50/90 text-indigo-950 border-indigo-400 ring-2 ring-indigo-300/60 shadow-2xs'
              : 'bg-slate-50/80 hover:bg-indigo-50/40 border-slate-200/80 text-slate-900'
          }`}
        >
          <div
            className={`text-xs font-semibold truncate ${
              statusFilter === 'ALL' ? 'text-indigo-700' : 'text-slate-500'
            }`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`kpi1-title-${activeScopeDescription.key}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="inline-block truncate max-w-full"
              >
                {hasHierarchySelection
                  ? `ทั้งหมดใน ${activeScopeDescription.label}`
                  : 'ฟุตเทจทั้งหมดในคลัง'}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <AnimatedMetricNumber
              value={vaultMetrics.total}
              className="text-2xl font-extrabold"
            />
            <span
              className={`text-[11px] font-medium ${
                statusFilter === 'ALL' ? 'text-indigo-700' : 'text-slate-500'
              }`}
            >
              {hasHierarchySelection
                ? `จากทั้งคลัง ${totalVaultCount} คลิป`
                : 'รายการทั้งหมด'}
            </span>
          </div>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() =>
            onStatusFilterChange(
              statusFilter === 'READY_FRESH' ? 'ALL' : 'READY_FRESH'
            )
          }
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'READY_FRESH'
              ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-400/50 shadow-xs'
              : 'bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200/80 text-slate-900'
          }`}
        >
          <div
            className={`text-xs font-medium truncate flex items-center gap-1.5 ${
              statusFilter === 'READY_FRESH' ? 'text-emerald-100' : 'text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>พร้อมวนใช้ (พัก ≥ {settings.greenReadyDays ?? 21} วัน)</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <AnimatedMetricNumber
              value={vaultMetrics.readyFresh}
              className={`text-2xl font-extrabold ${
                statusFilter === 'READY_FRESH' ? 'text-white' : 'text-emerald-700'
              }`}
            />
            <span
              className={`text-[11px] font-mono tabular-nums inline-flex items-baseline gap-1 ${
                statusFilter === 'READY_FRESH' ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            >
              <span>รวมพร้อมใช้</span>
              <AnimatedMetricNumber value={vaultMetrics.usable} suffix=" คลิป" />
            </span>
          </div>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() =>
            onStatusFilterChange(
              statusFilter === 'NEW_UNTOUCHED' ? 'ALL' : 'NEW_UNTOUCHED'
            )
          }
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'NEW_UNTOUCHED'
              ? 'bg-sky-700 text-white border-sky-700 ring-2 ring-sky-400/50 shadow-xs'
              : 'bg-sky-50/60 hover:bg-sky-100/70 border-sky-200/80 text-slate-900'
          }`}
        >
          <div
            className={`text-xs font-medium truncate flex items-center gap-1.5 ${
              statusFilter === 'NEW_UNTOUCHED' ? 'text-sky-100' : 'text-sky-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>คลิปใหม่แกะกล่อง (ใช้ 0 ครั้ง)</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <AnimatedMetricNumber
              value={vaultMetrics.newUntouched}
              className={`text-2xl font-extrabold ${
                statusFilter === 'NEW_UNTOUCHED' ? 'text-white' : 'text-sky-700'
              }`}
            />
            <span
              className={`text-[11px] font-medium ${
                statusFilter === 'NEW_UNTOUCHED' ? 'text-sky-100' : 'text-sky-700'
              }`}
            >
              ยังไม่เคยใช้ 100%
            </span>
          </div>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() =>
            onStatusFilterChange(
              statusFilter === 'RECENT_COOLDOWN' ? 'ALL' : 'RECENT_COOLDOWN'
            )
          }
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'RECENT_COOLDOWN'
              ? 'bg-rose-700 text-white border-rose-700 ring-2 ring-rose-400/50 shadow-xs'
              : 'bg-rose-50/60 hover:bg-rose-100/70 border-rose-200/80 text-slate-900'
          }`}
        >
          <div
            className={`text-xs font-medium truncate flex items-center gap-1.5 ${
              statusFilter === 'RECENT_COOLDOWN' ? 'text-rose-100' : 'text-rose-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>เฝ้าระวัง & พักคูลดาวน์ (&lt;{settings.cooldownDays}วัน / ≥{settings.maxUsagePer90Days}ครั้ง)</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <AnimatedMetricNumber
              value={vaultMetrics.inCooldown}
              className={`text-2xl font-extrabold ${
                statusFilter === 'RECENT_COOLDOWN' ? 'text-white' : 'text-rose-700'
              }`}
            />
            <span
              className={`text-[11px] font-medium ${
                statusFilter === 'RECENT_COOLDOWN' ? 'text-rose-100' : 'text-rose-700'
              }`}
            >
              ในขอบเขตที่เลือก
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};
