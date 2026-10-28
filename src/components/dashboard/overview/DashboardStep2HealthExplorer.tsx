import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  Film,
  Filter,
  Palette,
  Repeat,
  Search,
  Settings2,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag, SystemSettings } from '../../../types/tag.types';
import {
  DashboardMetrics,
  DashboardViewMode,
  FlowFilter,
  FootageSortMode,
  getStatusBadgeConfig,
  StatusFilter,
  WorkflowStep,
} from './dashboard.types';
import { DashboardFootageExplorerTable } from './DashboardFootageExplorerTable';

interface DashboardStep2HealthExplorerProps {
  activeWorkflowStep: WorkflowStep;
  viewMode: DashboardViewMode;
  handleSelectStep: (step: WorkflowStep) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (val: string) => void;
  activeStatusFilter: StatusFilter;
  setActiveStatusFilter: React.Dispatch<React.SetStateAction<StatusFilter>>;
  activeFlowFilter: FlowFilter;
  setActiveFlowFilter: (flow: FlowFilter) => void;
  setActiveCategoryIdFilter: React.Dispatch<React.SetStateAction<string | null>>;
  footageSortMode: FootageSortMode;
  setFootageSortMode: (sort: FootageSortMode) => void;
  footageLimit: number;
  setFootageLimit: React.Dispatch<React.SetStateAction<number>>;
  metrics: DashboardMetrics;
  settings: SystemSettings;
  isStatusRulesExpanded: boolean;
  setIsStatusRulesExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setIsStatusRuleModalOpen: (open: boolean) => void;
  hasAnyActiveFilter: boolean;
  resetAllFilters: () => void;
  filteredFootages: ComputedFootage[];
  tagMap: Record<string, CategoryTag>;
  copiedId: string | null;
  handleCopyText: (id: string, text: string, e?: React.MouseEvent) => void;
  setTraceabilityFootageId: (id: string | null) => void;
}

export const DashboardStep2HealthExplorer: React.FC<
  DashboardStep2HealthExplorerProps
> = ({
  activeWorkflowStep,
  viewMode,
  handleSelectStep,
  globalSearchQuery,
  setGlobalSearchQuery,
  activeStatusFilter,
  setActiveStatusFilter,
  activeFlowFilter,
  setActiveFlowFilter,
  setActiveCategoryIdFilter,
  footageSortMode,
  setFootageSortMode,
  footageLimit,
  setFootageLimit,
  metrics,
  settings,
  isStatusRulesExpanded,
  setIsStatusRulesExpanded,
  setIsStatusRuleModalOpen,
  hasAnyActiveFilter,
  resetAllFilters,
  filteredFootages,
  tagMap,
  copiedId,
  handleCopyText,
  setTraceabilityFootageId,
}) => {
  return (
    <motion.section
      id="step-section-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-4 transition-all ${
        activeWorkflowStep === 2 && viewMode === 'FOCUS'
          ? 'border-emerald-300/90 shadow-[0_8px_30px_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/20'
          : 'border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Step 2 Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
            2
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>สเต็ปที่ 2: ตรวจสอบความสด & กฎพักฟุต (Freshness Health)</span>
            </h2>
            <p className="text-xs text-slate-500">
              เช็กความพร้อมใช้งานตามเกณฑ์สี 4 สถานะ พร้อมค้นหาและตรวจสอบวันพักของแต่ละคลิป
            </p>
          </div>
        </div>

        {viewMode === 'FOCUS' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectStep(1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>กลับสเต็ป 1</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectStep(3)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <span>ไปสเต็ป 3: จัด 5 อันดับ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Omni Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={globalSearchQuery}
          onChange={(e) => setGlobalSearchQuery(e.target.value)}
          placeholder="ค้นหาด่วน: รหัส FT-XXXX, ชื่อฟุตเทจ, มุกพากย์, #หมวดหมู่, หรือชื่อไลฟ์..."
          className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-slate-50/90 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 focus:border-indigo-400 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none transition-all"
        />
        {globalSearchQuery ? (
          <button
            type="button"
            onClick={() => setGlobalSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-bold cursor-pointer"
          >
            <X className="w-3 h-3" />
            ล้างคำค้น
          </button>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1 absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400 select-none">
            ค้นหาและกรองได้ทันที
          </span>
        )}
      </div>

      {/* 5 Interactive Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: ALL */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter('ALL')}
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeStatusFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-slate-50/70 hover:bg-white text-slate-900 border-slate-200/90 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold opacity-85 inline-flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 opacity-80" />
              <span>คลังฟุตทั้งหมด</span>
            </span>
            <Film className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
            {metrics.total} <span className="text-xs font-normal">ฟุต</span>
          </div>
          <div
            className={`text-[11px] font-mono truncate ${
              activeStatusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            เดี่ยว {metrics.directCount} · หั่นไลฟ์ {metrics.splitCount}
          </div>
        </button>

        {/* Card 2: NEW_UNTOUCHED (Blue) */}
        <button
          type="button"
          onClick={() =>
            setActiveStatusFilter((prev) =>
              prev === 'NEW_UNTOUCHED' ? 'ALL' : 'NEW_UNTOUCHED'
            )
          }
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeStatusFilter === 'NEW_UNTOUCHED'
              ? 'bg-sky-600 text-white border-sky-700 shadow-md'
              : 'bg-sky-50/70 hover:bg-sky-100/70 text-sky-950 border-sky-200/90 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>ใหม่แกะกล่อง</span>
            </span>
            <Sparkles className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
            {metrics.newCount} <span className="text-xs font-normal">ฟุต</span>
          </div>
          <div
            className={`text-[11px] truncate ${
              activeStatusFilter === 'NEW_UNTOUCHED' ? 'text-sky-100' : 'text-sky-700'
            }`}
          >
            ใช้ 0 ครั้ง · กรองดู
          </div>
        </button>

        {/* Card 3: READY_FRESH (Green) */}
        <button
          type="button"
          onClick={() =>
            setActiveStatusFilter((prev) =>
              prev === 'READY_FRESH' ? 'ALL' : 'READY_FRESH'
            )
          }
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeStatusFilter === 'READY_FRESH'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
              : 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950 border-emerald-200/90 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>พักจนสดพร้อมใช้</span>
            </span>
            <CheckCircle2 className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
            {metrics.readyCount} <span className="text-xs font-normal">ฟุต</span>
          </div>
          <div
            className={`text-[11px] truncate ${
              activeStatusFilter === 'READY_FRESH' ? 'text-emerald-100' : 'text-emerald-700'
            }`}
          >
            พัก ≥{settings.greenReadyDays ?? 21} วัน · กรองดู
          </div>
        </button>

        {/* Card 4: HIGH_VELOCITY_WARNING (Yellow) */}
        <button
          type="button"
          onClick={() =>
            setActiveStatusFilter((prev) =>
              prev === 'HIGH_VELOCITY_WARNING' ? 'ALL' : 'HIGH_VELOCITY_WARNING'
            )
          }
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeStatusFilter === 'HIGH_VELOCITY_WARNING'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md'
              : 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-950 border-amber-200/90 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>ใช้ถี่เฝ้าระวัง</span>
            </span>
            <TrendingUp className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
            {metrics.warningCount} <span className="text-xs font-normal">ฟุต</span>
          </div>
          <div
            className={`text-[11px] truncate ${
              activeStatusFilter === 'HIGH_VELOCITY_WARNING' ? 'text-amber-50' : 'text-amber-800'
            }`}
          >
            ใช้ถี่ใน 90 วัน · กรองดู
          </div>
        </button>

        {/* Card 5: RECENT_COOLDOWN (Red) */}
        <button
          type="button"
          onClick={() =>
            setActiveStatusFilter((prev) =>
              prev === 'RECENT_COOLDOWN' ? 'ALL' : 'RECENT_COOLDOWN'
            )
          }
          className={`col-span-2 sm:col-span-1 text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeStatusFilter === 'RECENT_COOLDOWN'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md'
              : 'bg-rose-50/70 hover:bg-rose-100/70 text-rose-950 border-rose-200/90 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>ติดระยะพักห้ามซ้ำ</span>
            </span>
            <Clock className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
            {metrics.cooldownCount} <span className="text-xs font-normal">ฟุต</span>
          </div>
          <div
            className={`text-[11px] truncate ${
              activeStatusFilter === 'RECENT_COOLDOWN' ? 'text-rose-100' : 'text-rose-700'
            }`}
          >
            พัก &lt;{settings.cooldownDays} วัน · กรองดู
          </div>
        </button>
      </div>

      {/* Collapsible Status Rules & Utilization Bar (Default Collapsed) */}
      <div className="rounded-xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-sky-50/40 border border-slate-200/80 overflow-hidden">
        <div
          onClick={() => setIsStatusRulesExpanded((prev) => !prev)}
          className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-white/70 transition-colors"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>เกณฑ์สีสถานะ & ความคุ้มค่าคลัง</span>
            </span>
            <span className="font-mono text-[11px] text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80 tabular-nums inline-flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-indigo-600" />
              <span>ใช้แล้ว <strong className="text-indigo-700">{metrics.utilizationRate}%</strong> ({metrics.everUsedCount}/{metrics.total} ฟุต) · เฉลี่ย {metrics.avgUsagePerClip} ครั้ง/ฟุต</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsStatusRuleModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            >
              <Settings2 className="w-3 h-3" />
              <span>ตั้งค่าเกณฑ์สี</span>
            </button>

            <motion.span
              animate={{ rotate: isStatusRulesExpanded ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isStatusRulesExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-200/70 px-3.5 pb-3.5 pt-3 bg-white/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between">
                    <span className="font-bold text-sky-900 inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>ฟ้า (ใหม่แกะกล่อง)</span>
                    </span>
                    <span className="font-mono font-bold text-sky-700">ใช้ 0 ครั้ง</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                    <span className="font-bold text-emerald-900 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>เขียว (พร้อมวนซ้ำ)</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      พัก ≥{settings.greenReadyDays ?? 21} วัน
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                    <span className="font-bold text-amber-900 inline-flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>เหลือง (เฝ้าระวัง)</span>
                    </span>
                    <span className="font-mono font-bold text-amber-800">
                      ≥{settings.maxUsagePer90Days}ครั้ง/90วัน
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
                    <span className="font-bold text-rose-900 inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>แดง (พักห้ามซ้ำ)</span>
                    </span>
                    <span className="font-mono font-bold text-rose-700">
                      พัก &lt;{settings.cooldownDays} วัน
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filter Indicator Strip */}
      <AnimatePresence>
        {hasAnyActiveFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center justify-between gap-2 text-xs bg-indigo-50/80 border border-indigo-200/90 rounded-xl px-3.5 py-2"
          >
            <div className="flex flex-wrap items-center gap-2 text-indigo-950 font-medium">
              <Filter className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>ตัวกรองที่ทำงาน:</span>
              {globalSearchQuery && (
                <span className="font-mono font-bold text-indigo-700">
                  &quot;{globalSearchQuery}&quot;
                </span>
              )}
              {activeStatusFilter !== 'ALL' && (
                <span className="font-bold text-indigo-700 inline-flex items-center gap-1.5">
                  · {getStatusBadgeConfig(activeStatusFilter).label}
                </span>
              )}
              {activeFlowFilter !== 'ALL' && (
                <span className="font-bold text-indigo-700">
                  · {activeFlowFilter === 'DIRECT_1_TO_1' ? '1:1 ฟุตเดี่ยว' : '1:N หั่นไลฟ์'}
                </span>
              )}
              <span className="font-mono text-slate-600">
                (พบ {filteredFootages.length} รายการ)
              </span>
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Footage Table */}
      <DashboardFootageExplorerTable
        filteredFootages={filteredFootages}
        footageLimit={footageLimit}
        setFootageLimit={setFootageLimit}
        activeFlowFilter={activeFlowFilter}
        setActiveFlowFilter={setActiveFlowFilter}
        footageSortMode={footageSortMode}
        setFootageSortMode={setFootageSortMode}
        setActiveCategoryIdFilter={setActiveCategoryIdFilter}
        tagMap={tagMap}
        copiedId={copiedId}
        handleCopyText={handleCopyText}
        setTraceabilityFootageId={setTraceabilityFootageId}
        resetAllFilters={resetAllFilters}
      />
    </motion.section>
  );
};
