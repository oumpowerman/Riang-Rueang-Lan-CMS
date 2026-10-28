import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, List, Sparkles } from 'lucide-react';
import { AnimatedMetricNumber } from './AnimatedMetricNumber';
import { ActiveScopeDescription, VaultViewMode } from './vault.types';

export interface VaultResultsHeaderBarProps {
  activeScopeDescription: ActiveScopeDescription;
  filteredCount: number;
  scopedTotalCount: number;
  totalVaultCount: number;
  viewMode: VaultViewMode;
  onViewModeChange: (mode: VaultViewMode) => void;
}

export const VaultResultsHeaderBar: React.FC<VaultResultsHeaderBarProps> = ({
  activeScopeDescription,
  filteredCount,
  scopedTotalCount,
  totalVaultCount,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 overflow-hidden">
        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span>กำลังแสดงรายการของ:</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={`bottom-scope-${activeScopeDescription.key}`}
            initial={{ y: 10, opacity: 0, filter: 'blur(2px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: -10, opacity: 0, filter: 'blur(2px)' }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="inline-flex items-center gap-1.5 font-bold text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg"
          >
            <span>{activeScopeDescription.label}</span>
          </motion.span>
        </AnimatePresence>

        <span className="text-slate-400">•</span>
        <span>พบ</span>
        <AnimatedMetricNumber
          value={filteredCount}
          className="font-bold text-slate-900"
        />
        <span>จากขอบเขตนี้</span>
        <AnimatedMetricNumber
          value={scopedTotalCount}
          className="font-bold text-indigo-700"
          suffix=" คลิป"
        />
        <span className="text-slate-400 hidden sm:inline">
          (ทั้งคลัง {totalVaultCount} รายการ)
        </span>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
        <button
          type="button"
          onClick={() => onViewModeChange('GRID')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            viewMode === 'GRID'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>การ์ดย่อ</span>
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('TABLE')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            viewMode === 'TABLE'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>ตารางมาตรฐาน</span>
        </button>
      </div>
    </div>
  );
};
