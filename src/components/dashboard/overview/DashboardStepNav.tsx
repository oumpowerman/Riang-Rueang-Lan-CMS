import React from 'react';
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
    <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <span>แผนผังนำทางการทำงาน 4 ขั้นตอน</span>
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
              Production Flow
            </span>
          </div>
          <p className="text-xs text-slate-500">
            คลิกสลับขั้นตอนเพื่อโฟกัสงานเฉพาะส่วนพร้อมซ่อนข้อมูลที่ไม่เกี่ยวข้อง หรือเปลี่ยนเป็นโหมดภาพรวมได้ตามใจ
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl text-xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('FOCUS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'FOCUS'
                ? 'bg-white text-indigo-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>โหมดโฟกัสทีละสเต็ป</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'ALL'
                ? 'bg-white text-indigo-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span>ภาพรวมทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* 4 Step Cards with Soft Ambient Glow on Active Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1 Card */}
        <button
          type="button"
          onClick={() => handleSelectStep(1)}
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative ${
            activeWorkflowStep === 1
              ? 'bg-white border-indigo-400 shadow-[0_4px_22px_rgba(99,102,241,0.16)] ring-2 ring-indigo-500/25'
              : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  activeWorkflowStep === 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                1
              </span>
              <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>เติมฟุตเข้าคลัง</span>
              </span>
            </div>
            {activeWorkflowStep === 1 && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md shrink-0">
                กำลังโฟกัส
              </span>
            )}
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="text-[11px] font-mono tabular-nums text-slate-500">
              เดี่ยว {metrics.directCount} · หั่นไลฟ์ {metrics.splitCount}
            </div>
            <div className="text-xs text-slate-700 truncate">
              แหล่งไลฟ์ต้นฉบับ {sourcesCount} แหล่ง
            </div>
          </div>
        </button>

        {/* Step 2 Card */}
        <button
          type="button"
          onClick={() => handleSelectStep(2)}
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative ${
            activeWorkflowStep === 2
              ? 'bg-white border-emerald-400 shadow-[0_4px_22px_rgba(16,185,129,0.16)] ring-2 ring-emerald-500/25'
              : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  activeWorkflowStep === 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                2
              </span>
              <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>เช็กความสด & กฎพัก</span>
              </span>
            </div>
            {activeWorkflowStep === 2 && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
                กำลังโฟกัส
              </span>
            )}
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="text-[11px] font-mono tabular-nums text-emerald-700 font-bold">
              พร้อมใช้ {metrics.usableTotal} ฟุต ({metrics.newCount} ใหม่ + {metrics.readyCount} สด)
            </div>
            <div className="text-xs text-slate-500 truncate">
              ติดพักห้ามซ้ำ {metrics.cooldownCount} · เฝ้าระวัง {metrics.warningCount}
            </div>
          </div>
        </button>

        {/* Step 3 Card */}
        <button
          type="button"
          onClick={() => handleSelectStep(3)}
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative ${
            activeWorkflowStep === 3
              ? 'bg-white border-indigo-400 shadow-[0_4px_22px_rgba(99,102,241,0.16)] ring-2 ring-indigo-500/25'
              : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  activeWorkflowStep === 3
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                3
              </span>
              <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>จัดคลิป 5 อันดับ</span>
              </span>
            </div>
            {activeWorkflowStep === 3 && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md shrink-0">
                กำลังโฟกัส
              </span>
            )}
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="text-[11px] font-mono tabular-nums text-indigo-700 font-bold">
              ทำได้ทันที {metrics.totalProducibleEps} ตอน ({productionRadar.readyCategories.length} หมวด)
            </div>
            <div className="text-xs text-slate-500 truncate">
              ใกล้ครบ 5 ฟุต: {productionRadar.almostReadyCategories.length} หมวด
            </div>
          </div>
        </button>

        {/* Step 4 Card */}
        <button
          type="button"
          onClick={() => handleSelectStep(4)}
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative ${
            activeWorkflowStep === 4
              ? 'bg-white border-indigo-400 shadow-[0_4px_22px_rgba(99,102,241,0.16)] ring-2 ring-indigo-500/25'
              : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  activeWorkflowStep === 4
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                4
              </span>
              <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-purple-600" />
                <span>คลังหลัก & ผลผลิต</span>
              </span>
            </div>
            {activeWorkflowStep === 4 && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md shrink-0">
                กำลังโฟกัส
              </span>
            )}
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="text-[11px] font-mono tabular-nums text-slate-700 font-bold">
              ผลิตแล้ว {episodesCount} EP · ใช้ซ้ำ {metrics.utilizationRate}%
            </div>
            <div className="text-xs text-slate-500 truncate">
              เฉลี่ย {metrics.avgUsagePerClip} ครั้ง/ฟุต
            </div>
          </div>
        </button>
      </div>
    </section>
  );
};
