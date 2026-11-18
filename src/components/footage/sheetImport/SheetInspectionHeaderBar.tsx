import React from 'react';
import { motion } from 'motion/react';
import {
  CalendarClock,
  ClipboardPaste,
  FileSpreadsheet,
} from 'lucide-react';
import {
  RankingOrderDirection,
  SheetSyncSummaryStats,
  TableRowDensity,
} from './sheetImport.types';
import { SheetSettingsPopover } from './SheetSettingsPopover';

export type UnifiedSyncMainTab = 'SHEET_SYNC' | 'YOUTUBE_DATE_SYNC';

interface SheetHeaderUtilityActionsProps {
  activeMainSyncTab: UnifiedSyncMainTab;
  hasData: boolean;
  isInputExpanded: boolean;
  onToggleInputExpanded: () => void;
  onClearPastedText: () => void;
  rowDensity: TableRowDensity;
  onToggleRowDensity: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  syncEpisodesFromColD: boolean;
  onChangeSyncEpisodesFromColD: (val: boolean) => void;
  autoCreateMissingFootage: boolean;
  onChangeAutoCreateMissingFootage: (val: boolean) => void;
  includeSeriesTagOnFootage: boolean;
  onChangeIncludeSeriesTagOnFootage: (val: boolean) => void;
  rankingOrder: RankingOrderDirection;
  onChangeRankingOrder: (dir: RankingOrderDirection) => void;
  onOpenJunkTagCleanup?: () => void;
}

export const SheetHeaderUtilityActions: React.FC<
  SheetHeaderUtilityActionsProps
> = ({
  activeMainSyncTab,
  hasData,
  isInputExpanded,
  onToggleInputExpanded,
  onClearPastedText,
  rowDensity,
  onToggleRowDensity,
  isFullScreen,
  onToggleFullScreen,
  syncEpisodesFromColD,
  onChangeSyncEpisodesFromColD,
  autoCreateMissingFootage,
  onChangeAutoCreateMissingFootage,
  includeSeriesTagOnFootage,
  onChangeIncludeSeriesTagOnFootage,
  rankingOrder,
  onChangeRankingOrder,
  onOpenJunkTagCleanup,
}) => {
  return (
    <div className="flex items-center gap-2 justify-end">
      {activeMainSyncTab === 'SHEET_SYNC' && hasData && (
        <button
          type="button"
          onClick={onToggleInputExpanded}
          title={
            isInputExpanded
              ? 'ซ่อนช่องวางข้อมูลจากชีท'
              : 'แก้ไขหรือวางข้อมูลจากชีทใหม่'
          }
          className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isInputExpanded
              ? 'bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF]'
              : 'bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border-[#E2D5C4]'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>{isInputExpanded ? 'ซ่อนช่องวาง' : 'วางข้อมูลใหม่'}</span>
        </button>
      )}

      <SheetSettingsPopover
        hasData={hasData}
        syncEpisodesFromColD={syncEpisodesFromColD}
        onChangeSyncEpisodesFromColD={onChangeSyncEpisodesFromColD}
        autoCreateMissingFootage={autoCreateMissingFootage}
        onChangeAutoCreateMissingFootage={onChangeAutoCreateMissingFootage}
        includeSeriesTagOnFootage={includeSeriesTagOnFootage}
        onChangeIncludeSeriesTagOnFootage={onChangeIncludeSeriesTagOnFootage}
        rankingOrder={rankingOrder}
        onChangeRankingOrder={onChangeRankingOrder}
        rowDensity={rowDensity}
        onToggleRowDensity={onToggleRowDensity}
        isFullScreen={isFullScreen}
        onToggleFullScreen={onToggleFullScreen}
        onClearPastedText={onClearPastedText}
        onOpenJunkTagCleanup={onOpenJunkTagCleanup}
      />
    </div>
  );
};

interface SheetHeaderSubNavBarProps {
  activeMainSyncTab: UnifiedSyncMainTab;
  onChangeMainSyncTab: (tab: UnifiedSyncMainTab) => void;
  hasData: boolean;
  stats: SheetSyncSummaryStats;
  activePreviewTab: 'FOOTAGE_ROWS' | 'EPISODE_GROUPS';
  onChangeActivePreviewTab: (tab: 'FOOTAGE_ROWS' | 'EPISODE_GROUPS') => void;
  syncEpisodesFromColD: boolean;
}

export const SheetHeaderSubNavBar: React.FC<SheetHeaderSubNavBarProps> = ({
  activeMainSyncTab,
  onChangeMainSyncTab,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-2 pb-0.5 border-t border-[#EFE7DC]">
      <div
        className="inline-flex p-1 rounded-2xl bg-[#EFE8DC]/80 border border-[#E3D8CB]/80 shadow-2xs backdrop-blur-xs select-none"
        role="tablist"
        aria-label="เลือกโหมดการซิงก์"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeMainSyncTab === 'SHEET_SYNC'}
          onClick={() => onChangeMainSyncTab('SHEET_SYNC')}
          className={`relative px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-2 ${
            activeMainSyncTab === 'SHEET_SYNC'
              ? 'text-[#1C4824]'
              : 'text-[#7D6E61] hover:text-[#3D332A]'
          }`}
        >
          {activeMainSyncTab === 'SHEET_SYNC' && (
            <motion.div
              layoutId="sheetUnifiedSegmentCapsule"
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              className="absolute inset-0 bg-white rounded-xl shadow-2xs border border-[#DFD3C4]/60 z-0"
            />
          )}
          <span className="relative z-10 inline-flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ซิงก์ชีทหลัก (10 คอลัมน์)</span>
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeMainSyncTab === 'YOUTUBE_DATE_SYNC'}
          onClick={() => onChangeMainSyncTab('YOUTUBE_DATE_SYNC')}
          className={`relative px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-2 ${
            activeMainSyncTab === 'YOUTUBE_DATE_SYNC'
              ? 'text-[#1C4824]'
              : 'text-[#7D6E61] hover:text-[#3D332A]'
          }`}
        >
          {activeMainSyncTab === 'YOUTUBE_DATE_SYNC' && (
            <motion.div
              layoutId="sheetUnifiedSegmentCapsule"
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              className="absolute inset-0 bg-white rounded-xl shadow-2xs border border-[#DFD3C4]/60 z-0"
            />
          )}
          <span className="relative z-10 inline-flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>อัปเดตเฉพาะวันที่ (2 คอลัมน์)</span>
          </span>
        </button>
      </div>
    </div>
  );
};
