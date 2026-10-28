import React from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Film,
  Plus,
  PlusCircle,
  Scissors,
  Search,
  X,
  Zap,
} from 'lucide-react';
import { ActiveNavTab } from '../../../context/CMSContext';
import { ComputedFootage } from '../../../types/footage.types';
import { RawSource } from '../../../types/source.types';
import { DashboardMetrics, DashboardViewMode, WorkflowStep } from './dashboard.types';

interface DashboardStep1IngestionProps {
  activeWorkflowStep: WorkflowStep;
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
  return (
    <motion.section
      id="step-section-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-5 transition-all ${
        activeWorkflowStep === 1 && viewMode === 'FOCUS'
          ? 'border-indigo-300/90 shadow-[0_8px_30px_rgba(99,102,241,0.08)] ring-1 ring-indigo-500/20'
          : 'border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Step 1 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>สเต็ปที่ 1: เติมฟุตเทจเข้าคลัง & เตรียมคลิปต้นฉบับ</span>
            </h2>
            <p className="text-xs text-slate-500">
              หั่นตัดคลิปสั้นจากไลฟ์ยาว (1:N) หรือเพิ่มฟุตเดี่ยวพร้อมใช้งานทันที (1:1)
            </p>
          </div>
        </div>

        {viewMode === 'FOCUS' && (
          <button
            type="button"
            onClick={() => handleSelectStep(2)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>ขั้นตอนถัดไป: ตรวจสอบความสด (สเต็ป 2)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Ingest Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option A: Split 1:N */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/40 border border-indigo-200/90 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <span>หั่นจากไลฟ์สด / คลิปยาว (1:N)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {sources.length} ต้นฉบับ
              </span>
            </div>
            <p className="text-xs text-slate-600">
              นำเข้าคลิปสตรีมสดหรือรายการยาว แล้วตัดเป็นช่วงย่อยหลายๆ คลิปเพื่อเติมคลังแบบทวีคูณ
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-indigo-700 font-semibold tabular-nums">
              แตกฟุตแล้ว {metrics.splitCount} ฟุต
            </span>
            <button
              type="button"
              onClick={() => openSourceSplitterFor(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>เปิดสตูดิโอหั่นคลิป</span>
            </button>
          </div>
        </div>

        {/* Option B: Direct 1:1 */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border border-amber-200/90 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>เพิ่มฟุตเดี่ยวพร้อมใช้ (1:1)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {metrics.directCount} ฟุต
              </span>
            </div>
            <p className="text-xs text-slate-600">
              นำเข้าคลิปเดี่ยวสั้น 1 ไฟล์ พร้อมให้ระบบสร้างชื่อไฟล์มาตรฐานตามกฎและระบุแท็กหมวดหมู่ทันที
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-amber-800 font-semibold tabular-nums">
              สร้างชื่อไฟล์มาตรฐานอัตโนมัติ
            </span>
            <button
              type="button"
              onClick={() => setIsDirectFootageModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มฟุตเดี่ยว</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staging Area / Missing Drive Link Alert Strip */}
      {(untaggedFootages.length > 0 || missingDriveFootages.length > 0) && (
        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-950 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              รายการรอจัดการเพิ่มเติม: อยู่ในพื้นที่พักรอจัดหมวดหมู่ {untaggedFootages.length} รายการ (ยังไม่นับโควตา 5 ฟุต = 1 EP) · รอลิงก์ไฟล์ Google Drive {missingDriveFootages.length} รายการ
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('FOOTAGE_LIBRARY')}
            className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold transition-colors cursor-pointer shrink-0"
          >
            ไปจัดการที่คลังฟุต →
          </button>
        </div>
      )}

      {/* Active Sources Mini Preview */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Film className="w-4 h-4 text-indigo-600" />
            <span>คลิปยาวและไลฟ์ต้นฉบับล่าสุด ({filteredSources.length} แหล่ง)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                placeholder="ค้นหาชื่อไลฟ์/ช่อง..."
                className="pl-8 pr-6 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-indigo-400 w-40"
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
              เปิดสตูดิโอเต็ม →
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
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">{src.title}</div>
                <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                  แตกแล้ว {src.splitFootageIds.length} ฟุต
                </div>
              </div>

              <button
                type="button"
                onClick={() => openSourceSplitterFor(src)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                <Scissors className="w-3 h-3" />
                <span>หั่นเพิ่ม</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
