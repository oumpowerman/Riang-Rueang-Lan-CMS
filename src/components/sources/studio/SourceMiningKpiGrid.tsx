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
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {/* KPI 1: Total Sources (Light Pastel Indigo) */}
      <button
        type="button"
        onClick={() => onMiningFilterChange('ALL')}
        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
          miningFilter === 'ALL'
            ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
            : 'bg-white hover:bg-indigo-50/40 border-slate-200/90 hover:border-indigo-200 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-950 inline-flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>ไลฟ์ทั้งหมด</span>
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/90 text-indigo-700 border border-indigo-200/80">
            ต้นฉบับ
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono tabular-nums text-indigo-950">
              {miningKpis.totalSources}
            </span>
            <span className="text-xs font-medium text-indigo-700/80">ไลฟ์</span>
          </div>
        </div>
      </button>

      {/* KPI 2: Average Yield Rate (Light Pastel Sky) */}
      <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-200/80 flex flex-col justify-between gap-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-sky-950 inline-flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>เฉลี่ยต่อไลฟ์</span>
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/90 text-sky-700 border border-sky-200/80 tabular-nums">
            รวม {miningKpis.totalSplitClips} คลิป
          </span>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-sky-950">
            {miningKpis.avgYield}
          </span>
          <span className="text-xs font-medium text-sky-700">คลิป/ไลฟ์</span>
        </div>
      </div>

      {/* KPI 3: Under-mined Sources (Light Pastel Amber) */}
      <div
        onClick={() =>
          onMiningFilterChange((prev) =>
            prev === 'UNDER_MINED' ? 'ALL' : 'UNDER_MINED'
          )
        }
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
          miningFilter === 'UNDER_MINED'
            ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
            : 'bg-white hover:bg-amber-50/40 border-slate-200/90 hover:border-amber-200 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-amber-950 inline-flex items-center gap-1.5 whitespace-nowrap">
            <Pickaxe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>หั่นน้อย</span>
          </span>
          <select
            value={underMinedThreshold}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              onUnderMinedThresholdChange(Number(e.target.value));
              onMiningFilterChange('UNDER_MINED');
            }}
            className="text-[11px] font-mono font-bold bg-amber-100/70 text-amber-900 border border-amber-300/80 rounded-lg px-2 py-0.5 cursor-pointer outline-none"
          >
            <option value={3}>&lt; 3 คลิป</option>
            <option value={5}>&lt; 5 คลิป</option>
            <option value={1}>0 คลิป</option>
          </select>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-amber-950">
            {miningKpis.underMinedSourcesCount}
          </span>
          <span className="text-xs font-medium text-amber-800">ไลฟ์</span>
        </div>
      </div>

      {/* KPI 4: Ready Split Clips (Light Pastel Emerald) */}
      <button
        type="button"
        onClick={() =>
          onMiningFilterChange((prev) =>
            prev === 'HAS_READY_CLIPS' ? 'ALL' : 'HAS_READY_CLIPS'
          )
        }
        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
          miningFilter === 'HAS_READY_CLIPS'
            ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
            : 'bg-white hover:bg-emerald-50/40 border-slate-200/90 hover:border-emerald-200 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-emerald-950 inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>คลิปย่อยพร้อมใช้</span>
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/90 text-emerald-700 border border-emerald-200/80 tabular-nums">
            จาก {miningKpis.sourcesWithReadyClipsCount} ไลฟ์
          </span>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-950">
            {miningKpis.totalReadySplitClips}
          </span>
          <span className="text-xs font-medium text-emerald-700">คลิป</span>
        </div>
      </button>
    </div>
  );
};
