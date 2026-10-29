import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Moon,
  Package,
  PlaySquare,
  RefreshCw,
  Repeat,
  Search,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { ActiveNavTab } from '../../../context/CMSContext';
import { Episode } from '../../../types/episode.types';
import { formatThaiDate } from '../../../utils/fileNameGenerator';
import {
  DashboardMetrics,
  DashboardViewMode,
  stepSectionVariants,
  StepTransitionDirection,
  WorkflowStep,
} from './dashboard.types';

interface DashboardStep4ArchiveRoiProps {
  activeWorkflowStep: WorkflowStep;
  stepDirection?: StepTransitionDirection;
  viewMode: DashboardViewMode;
  handleSelectStep: (step: WorkflowStep) => void;
  episodes: Episode[];
  filteredEpisodes: Episode[];
  episodeSearch: string;
  setEpisodeSearch: (val: string) => void;
  metrics: DashboardMetrics;
  setActiveTab: (tab: ActiveNavTab) => void;
  setSelectedEpisodeDetailId: (id: string | null) => void;
  setTraceabilityFootageId: (id: string | null) => void;
}

export const DashboardStep4ArchiveRoi: React.FC<
  DashboardStep4ArchiveRoiProps
> = ({
  activeWorkflowStep,
  stepDirection = 1,
  viewMode,
  handleSelectStep,
  episodes,
  filteredEpisodes,
  episodeSearch,
  setEpisodeSearch,
  metrics,
  setActiveTab,
  setSelectedEpisodeDetailId,
  setTraceabilityFootageId,
}) => {
  return (
    <motion.section
      id="step-section-4"
      custom={stepDirection}
      variants={stepSectionVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-4 transition-colors ${
        activeWorkflowStep === 4 && viewMode === 'FOCUS'
          ? 'border-indigo-300/90 shadow-[0_8px_30px_rgba(99,102,241,0.08)] ring-1 ring-indigo-500/20'
          : 'border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Step 4 Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            4
          </span>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-purple-600" />
            <span>คลัง EP & สถิติการใช้ซ้ำ</span>
          </h2>
        </div>

        {viewMode === 'FOCUS' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectStep(3)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>ก่อนหน้า</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectStep(1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>เริ่มรอบใหม่</span>
            </button>
          </div>
        )}
      </div>

      {/* Utilization ROI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
          <span className="text-xs text-slate-500 font-bold inline-flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span>ผลิตแล้ว</span>
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {episodes.length} <span className="text-xs font-normal text-slate-500">EP</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            รวม {episodes.length * 5} คลิป
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-1">
          <span className="text-xs text-indigo-900 font-bold inline-flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-indigo-600" />
            <span>อัตราใช้ซ้ำ</span>
          </span>
          <div className="text-xl font-bold font-mono text-indigo-700 tabular-nums">
            {metrics.utilizationRate}%
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            ใช้แล้ว {metrics.everUsedCount}/{metrics.total} คลิป
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
          <span className="text-xs text-emerald-950 font-bold inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>เฉลี่ยต่อคลิป</span>
          </span>
          <div className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {metrics.avgUsagePerClip} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            รวม {metrics.totalUsagesAllClips} ครั้ง
          </div>
        </div>
      </div>

      {/* Master Episodes List */}
      <div className="space-y-2.5 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <PlaySquare className="w-4 h-4 text-indigo-600" />
            <span>EP ล่าสุด ({filteredEpisodes.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={episodeSearch}
                onChange={(e) => setEpisodeSearch(e.target.value)}
                placeholder="ค้นหา EP หรือรหัสคลิป..."
                className="pl-8 pr-6 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-indigo-400 w-40 sm:w-44"
              />
              {episodeSearch && (
                <button
                  type="button"
                  onClick={() => setEpisodeSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('MASTER_ARCHIVE')}
              className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer whitespace-nowrap"
            >
              ดูทั้งหมด →
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {filteredEpisodes.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              ไม่พบ EP
            </div>
          ) : (
            filteredEpisodes.map((ep) => (
              <div
                key={ep.id}
                className="p-3 bg-slate-50/60 hover:bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl space-y-2 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-mono tabular-nums">
                    <span className="font-bold text-indigo-700">{ep.id}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatThaiDate(ep.publishDate)}</span>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      {ep.publishSlot === 'MORNING_0600' ? (
                        <>
                          <Sun className="w-3 h-3 text-amber-500" />
                          <span>06:00</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3 h-3 text-indigo-500" />
                          <span>18:00</span>
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEpisodeDetailId(ep.id)}
                    className="inline-flex items-center gap-0.5 text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
                  >
                    <span>รายละเอียด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div
                  onClick={() => setSelectedEpisodeDetailId(ep.id)}
                  className="text-sm font-bold text-slate-900 hover:text-indigo-700 cursor-pointer truncate"
                >
                  {ep.title}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {ep.rankings.map((r) => (
                    <button
                      key={r.rank}
                      type="button"
                      onClick={() => r.footageId && setTraceabilityFootageId(r.footageId)}
                      className="px-2 py-0.5 text-[11px] font-mono tabular-nums bg-white hover:bg-indigo-600 hover:text-white text-slate-800 border border-slate-200/80 rounded-md transition-colors cursor-pointer"
                    >
                      #{r.rank} {r.footageId}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.section>
  );
};
