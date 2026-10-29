import React from 'react';
import { Pickaxe, TrendingUp, Video, Zap } from 'lucide-react';
import { MiningQuickFilter, SourceMiningKpis } from './sourceStudio.types';

interface SourceMiningKpiGridProps {
  miningKpis: SourceMiningKpis;
  miningFilter: MiningQuickFilter;
  underMinedThreshold: number;
  onMiningFilterChange: React.Dispatch<React.SetStateAction<MiningQuickFilter>>;
  onUnderMinedThresholdChange: (threshold: number) => void;
}

export const SourceMiningKpiGrid: React.FC<SourceMiningKpiGridProps> = ({
  miningKpis,
  miningFilter,
  underMinedThreshold,
  onMiningFilterChange,
  onUnderMinedThresholdChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
      {/* KPI 1: Total Sources */}
      <button
        type="button"
        onClick={() => onMiningFilterChange('ALL')}
        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
          miningFilter === 'ALL'
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs font-bold ${
              miningFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            คลิปยาวต้นฉบับทั้งหมด (Total Sources)
          </span>
          <Video
            className={`w-4 h-4 ${
              miningFilter === 'ALL' ? 'text-indigo-400' : 'text-indigo-600'
            }`}
          />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono tabular-nums">
            {miningKpis.totalSources}
          </span>
          <span
            className={`text-xs font-medium ${
              miningFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            ไลฟ์ต้นฉบับในคลัง
          </span>
        </div>
        <div
          className={`mt-1.5 text-[11px] ${
            miningFilter === 'ALL' ? 'text-indigo-300 font-semibold' : 'text-slate-400'
          }`}
        >
          คลิกเพื่อดูคลิปยาวต้นฉบับทั้งหมด
        </div>
      </button>

      {/* KPI 2: Average Yield Rate */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500">
            อัตราการขุดช็อตฮา (Average Yield Rate)
          </span>
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
            {miningKpis.avgYield}
          </span>
          <span className="text-xs font-semibold text-emerald-700">
            ฟุตย่อย / 1 ไลฟ์
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
          หั่นช็อตย่อยสะสมแล้วรวม {miningKpis.totalSplitClips} ฟุต
        </div>
      </div>

      {/* KPI 3: Under-mined Sources */}
      <div
        onClick={() =>
          onMiningFilterChange((prev) =>
            prev === 'UNDER_MINED' ? 'ALL' : 'UNDER_MINED'
          )
        }
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          miningFilter === 'UNDER_MINED'
            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
            : 'bg-white border-slate-200 hover:border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-amber-800 inline-flex items-center gap-1">
            <Pickaxe className="w-3.5 h-3.5 text-amber-600" />
            <span>ไลฟ์ที่ยังขุดไม่คุ้ม (Under-mined)</span>
          </span>
          <select
            value={underMinedThreshold}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              onUnderMinedThresholdChange(Number(e.target.value));
              onMiningFilterChange('UNDER_MINED');
            }}
            className="text-[11px] font-mono font-bold bg-amber-100/80 text-amber-900 border border-amber-300 rounded-md px-1.5 py-0.5 cursor-pointer"
          >
            <option value={3}>&lt; 3 ฟุต (0–2 ช็อต)</option>
            <option value={5}>&lt; 5 ฟุต (0–4 ช็อต)</option>
            <option value={1}>0 ฟุต (ยังไม่หั่น)</option>
          </select>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-amber-900">
            {miningKpis.underMinedSourcesCount}
          </span>
          <span className="text-xs font-semibold text-amber-700">
            ไลฟ์ที่รอขุดมุกเพิ่ม
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-amber-700 font-medium">
          {miningFilter === 'UNDER_MINED'
            ? 'กำลังกรองเฉพาะไลฟ์ที่ยังขุดไม่คุ้ม (คลิกเพื่อยกเลิก)'
            : 'คลิกเพื่อกรองไลฟ์ที่หั่นน้อยกว่าเกณฑ์'}
        </div>
      </div>

      {/* KPI 4: Ready Split Clips */}
      <button
        type="button"
        onClick={() =>
          onMiningFilterChange((prev) =>
            prev === 'HAS_READY_CLIPS' ? 'ALL' : 'HAS_READY_CLIPS'
          )
        }
        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
          miningFilter === 'HAS_READY_CLIPS'
            ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
            : 'bg-white border-slate-200 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-emerald-800">
            ฟุตย่อยพร้อมใช้งาน (Ready Split Clips)
          </span>
          <Zap className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-900">
            {miningKpis.totalReadySplitClips}
          </span>
          <span className="text-xs font-semibold text-emerald-700">
            ช็อตสดใหม่พร้อมจัด 5 อันดับ
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-emerald-700 font-medium">
          กระจายอยู่ใน {miningKpis.sourcesWithReadyClipsCount} ไลฟ์ต้นฉบับ (คลิกเพื่อกรอง)
        </div>
      </button>
    </div>
  );
};
