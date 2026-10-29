import React from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Compass,
  Layers,
  Package,
  PlusCircle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  DashboardMetrics,
  DashboardProductionRadarData,
  DashboardViewMode,
  WorkflowStep,
} from './dashboard.types';

interface DashboardStepNavProps {
  activeWorkflowStep: WorkflowStep;
  viewMode: DashboardViewMode;
  setViewMode: (mode: DashboardViewMode) => void;
  handleSelectStep: (step: WorkflowStep) => void;
  metrics: DashboardMetrics;
  productionRadar: DashboardProductionRadarData;
  sourcesCount: number;
  episodesCount: number;
}

export const DashboardStepNav: React.FC<DashboardStepNavProps> = ({
  activeWorkflowStep,
  viewMode,
  setViewMode,
  handleSelectStep,
  metrics,
  productionRadar,
  sourcesCount,
  episodesCount,
}) => {
  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
      {/* Compact Header & View Mode Switcher */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-bold text-slate-900">ขั้นตอนการผลิต</span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl text-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('FOCUS')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'FOCUS'
                ? 'bg-white text-indigo-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>ทีละขั้น</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ALL')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'ALL'
                ? 'bg-white text-indigo-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span>ทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* 4 Step Cards with Shared Layout Highlight Transition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1 Card */}
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onClick={() => handleSelectStep(1)}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden ${
            activeWorkflowStep === 1
              ? 'bg-white border-indigo-400 text-slate-900'
              : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          {activeWorkflowStep === 1 && (
            <motion.div
              layoutId="active-workflow-step-highlight"
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="absolute inset-0 rounded-2xl border-2 border-indigo-500 shadow-[0_4px_20px_rgba(99,102,241,0.16)] pointer-events-none"
            />
          )}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                  activeWorkflowStep === 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                1
              </span>
              <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5 truncate">
                <PlusCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">นำเข้าฟุตเทจ</span>
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded-md shrink-0 tabular-nums">
              {metrics.total} คลิป
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-500 relative z-10">
            <span>1:1 ({metrics.directCount}) · 1:N ({metrics.splitCount})</span>
            <span className="text-slate-600 font-semibold">{sourcesCount} ต้นฉบับ</span>
          </div>
        </motion.button>

        {/* Step 2 Card */}
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onClick={() => handleSelectStep(2)}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden ${
            activeWorkflowStep === 2
              ? 'bg-white border-emerald-400 text-slate-900'
              : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          {activeWorkflowStep === 2 && (
            <motion.div
              layoutId="active-workflow-step-highlight"
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="absolute inset-0 rounded-2xl border-2 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.16)] pointer-events-none"
            />
          )}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                  activeWorkflowStep === 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                2
              </span>
              <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">เช็กสถานะฟุต</span>
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md shrink-0 tabular-nums">
              พร้อมใช้ {metrics.usableTotal}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] font-mono tabular-nums text-slate-600 relative z-10">
            <span className="inline-flex items-center gap-1" title="คลิปใหม่">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              {metrics.newCount}
            </span>
            <span className="inline-flex items-center gap-1" title="พร้อมใช้">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {metrics.readyCount}
            </span>
            <span className="inline-flex items-center gap-1" title="ใช้ถี่">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {metrics.warningCount}
            </span>
            <span className="inline-flex items-center gap-1" title="ติดคูลดาวน์">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {metrics.cooldownCount}
            </span>
          </div>
        </motion.button>

        {/* Step 3 Card */}
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onClick={() => handleSelectStep(3)}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden ${
            activeWorkflowStep === 3
              ? 'bg-white border-indigo-400 text-slate-900'
              : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          {activeWorkflowStep === 3 && (
            <motion.div
              layoutId="active-workflow-step-highlight"
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="absolute inset-0 rounded-2xl border-2 border-indigo-500 shadow-[0_4px_20px_rgba(99,102,241,0.16)] pointer-events-none"
            />
          )}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                  activeWorkflowStep === 3
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                3
              </span>
              <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5 truncate">
                <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">จัด 5 อันดับ</span>
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded-md shrink-0 tabular-nums">
              {metrics.totalProducibleEps} EP
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-500 relative z-10">
            <span className="text-emerald-700 font-semibold">
              พร้อมทำ {productionRadar.readyCategories.length} หมวด
            </span>
            <span>ใกล้ครบ {productionRadar.almostReadyCategories.length}</span>
          </div>
        </motion.button>

        {/* Step 4 Card */}
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onClick={() => handleSelectStep(4)}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden ${
            activeWorkflowStep === 4
              ? 'bg-white border-indigo-400 text-slate-900'
              : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          {activeWorkflowStep === 4 && (
            <motion.div
              layoutId="active-workflow-step-highlight"
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="absolute inset-0 rounded-2xl border-2 border-indigo-500 shadow-[0_4px_20px_rgba(99,102,241,0.16)] pointer-events-none"
            />
          )}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                  activeWorkflowStep === 4
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                4
              </span>
              <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5 truncate">
                <Package className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">คลัง EP & สถิติ</span>
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 rounded-md shrink-0 tabular-nums">
              {episodesCount} EP
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-500 relative z-10">
            <span>ใช้ซ้ำ {metrics.utilizationRate}%</span>
            <span>เฉลี่ย {metrics.avgUsagePerClip}x</span>
          </div>
        </motion.button>
      </div>
    </section>
  );
};
