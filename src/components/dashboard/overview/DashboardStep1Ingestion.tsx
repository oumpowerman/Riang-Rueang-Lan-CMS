import React from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Film,
  Inbox,
  Plus,
  PlusCircle,
  Scissors,
  Search,
  X,
  Zap,
} from 'lucide-react';
import { ActiveNavTab, useCMS } from '../../../context/CMSContext';
import { ComputedFootage } from '../../../types/footage.types';
import { RawSource } from '../../../types/source.types';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';
import {
  DashboardMetrics,
  DashboardViewMode,
  stepSectionVariants,
  StepTransitionDirection,
  WorkflowStep,
} from './dashboard.types';

interface DashboardStep1IngestionProps {
  activeWorkflowStep: WorkflowStep;
  stepDirection?: StepTransitionDirection;
  viewMode: DashboardViewMode;
  handleSelectStep: (step: WorkflowStep) => void;
  sources: RawSource[];
  filteredSources: RawSource[];
  sourceSearch: string;
  setSourceSearch: (val: string) => void;
  metrics: DashboardMetrics;
  untaggedFootages: ComputedFootage[];
  missingDriveFootages: ComputedFootage[];
  openSourceSplitterFor: (source: RawSource | null) => void;
  setIsDirectFootageModalOpen: (open: boolean) => void;
  setActiveTab: (tab: ActiveNavTab) => void;
}

export const DashboardStep1Ingestion: React.FC<DashboardStep1IngestionProps> = ({
  activeWorkflowStep,
  stepDirection = 1,
  viewMode,
  handleSelectStep,
  sources,
  filteredSources,
  sourceSearch,
  setSourceSearch,
  metrics,
  untaggedFootages,
  missingDriveFootages,
  openSourceSplitterFor,
  setIsDirectFootageModalOpen,
  setActiveTab,
}) => {
  const { setIsGoogleDriveBatchModalOpen } = useCMS();

  return (
    <motion.section
      id="step-section-1"
      custom={stepDirection}
      variants={stepSectionVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-4 transition-colors ${
        activeWorkflowStep === 1 && viewMode === 'FOCUS'
          ? 'border-indigo-300/90 shadow-[0_8px_30px_rgba(99,102,241,0.08)] ring-1 ring-indigo-500/20'
          : 'border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Step 1 Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>นำเข้าฟุตเทจ & ต้นฉบับ</span>
          </h2>
        </div>

        {viewMode === 'FOCUS' && (
          <button
            type="button"
            onClick={() => handleSelectStep(2)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <span>ถัดไป: เช็กสถานะ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3 Compact Ingestion Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Option 1: Split 1:N */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">หั่นจากไลฟ์ (1:N)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 tabular-nums">
              {sources.length} ต้นฉบับ · แตกแล้ว {metrics.splitCount} คลิป
            </div>
          </div>

          <button
            type="button"
            onClick={() => openSourceSplitterFor(null)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>หั่นคลิป</span>
          </button>
        </div>

        {/* Option 2: Direct 1:1 */}
        <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">เพิ่มฟุตเดี่ยว (1:1)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 tabular-nums">
              สะสม {metrics.directCount} คลิป
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDirectFootageModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มคลิป</span>
          </button>
        </div>

        {/* Option 3: Google Drive Bulk Import */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <GoogleDriveIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">ดึงข้อมูลจาก Drive</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 tabular-nums">
              ไม่มีหมวด {untaggedFootages.length} คลิป
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsGoogleDriveBatchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <GoogleDriveIcon className="w-3.5 h-3.5" />
            <span>ดึงจาก Drive</span>
          </button>
        </div>
      </div>

      {/* Compact Pending Triage Strip */}
      {(untaggedFootages.length > 0 || missingDriveFootages.length > 0) && (
        <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/90 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {untaggedFootages.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-950 font-bold">
                <Inbox className="w-3.5 h-3.5 text-amber-600" />
                <span>ไม่มีหมวดหมู่</span>
                <span className="font-mono text-amber-700">{untaggedFootages.length}</span>
              </span>
            )}
            {missingDriveFootages.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-950 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>รอลิงก์ Drive</span>
                <span className="font-mono text-amber-700">{missingDriveFootages.length}</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('FOOTAGE_LIBRARY')}
            className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold transition-colors cursor-pointer shrink-0"
          >
            ไปคลังฟุตเทจ →
          </button>
        </div>
      )}

      {/* Active Sources Mini Preview */}
      <div className="space-y-2.5 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Film className="w-4 h-4 text-indigo-600" />
            <span>ต้นฉบับล่าสุด ({filteredSources.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                placeholder="ค้นหาต้นฉบับ..."
                className="pl-8 pr-6 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-indigo-400 w-36 sm:w-44"
              />
              {sourceSearch && (
                <button
                  type="button"
                  onClick={() => setSourceSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('SOURCE_SPLITTER')}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer whitespace-nowrap"
            >
              ดูทั้งหมด →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredSources.slice(0, 6).map((src) => (
            <div
              key={src.id}
              className="p-3 bg-slate-50/70 hover:bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 transition-all"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <span className="font-bold text-slate-900">{src.id}</span>
                  <span>·</span>
                  <span className="text-indigo-700 font-semibold">{src.platform}</span>
                  <span>·</span>
                  <span className="tabular-nums">{src.splitFootageIds.length} คลิป</span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">{src.title}</div>
              </div>

              <button
                type="button"
                onClick={() => openSourceSplitterFor(src)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                <Scissors className="w-3 h-3" />
                <span>หั่นคลิป</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
