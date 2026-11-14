import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  FileEdit,
  Film,
  GitMerge,
  Trophy,
  Video,
  X,
  Scissors,
} from 'lucide-react';
import { formatThaiDate } from '../../../utils/fileNameGenerator';
import { StatusBadge } from '../../ui/StatusBadge';
import {
  TraceabilityModalHeaderProps,
  TraceabilityTabId,
} from './traceability.types';

export const TraceabilityModalHeader: React.FC<
  TraceabilityModalHeaderProps
> = ({
  footage,
  parentSource,
  settings,
  coUsedCount,
  activeTab,
  onChangeTab,
  onOpenParentSource,
  onClose,
}) => {
  const tabs: {
    id: TraceabilityTabId;
    label: string;
    count?: number;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'DETAILS_AND_TAGS',
      label: 'ข้อมูล & แท็ก',
      icon: <FileEdit className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'EPISODE_HISTORY',
      label: 'ประวัติ EP',
      count: footage.usageHistory.length,
      icon: <Trophy className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'CO_USAGE_MATRIX',
      label: 'คู่ผสมซ้ำ',
      count: coUsedCount,
      icon: <GitMerge className="w-3.5 h-3.5 shrink-0" />,
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-slate-50/95 px-3.5 sm:px-5 pt-3 sm:pt-4 pb-2.5 sm:pb-3 space-y-2 shrink-0">
      {/* Row 1: ID + Origin + Date + StatusBadge + Close */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {/* Footage ID Badge */}
          <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shrink-0">
            <Film className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-300" />
            <span>{footage.id}</span>
          </span>

          {/* Ingestion Flow Origin Badge */}
          {footage.ingestionFlow === 'DIRECT_1_TO_1' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] sm:text-xs font-semibold shrink-0">
              <Video className="w-3 h-3 text-slate-500" />
              <span>1:1</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-[11px] sm:text-xs font-semibold truncate max-w-[130px] sm:max-w-none shrink-0">
              <Scissors className="w-3 h-3 text-indigo-600" />
              <span className="truncate">{footage.sourceId}</span>
              {parentSource && (
                <button
                  type="button"
                  onClick={onOpenParentSource}
                  className="ml-0.5 text-[10px] sm:text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer hidden sm:inline"
                >
                  ดูต้นฉบับ →
                </button>
              )}
            </span>
          )}

          {/* Ingestion Date Badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100/80 border border-slate-200/80 text-slate-600 font-mono text-[11px] tabular-nums shrink-0">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{formatThaiDate(footage.createdAt)}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <StatusBadge
            status={footage.cooldownStatus}
            daysSinceLastUse={footage.daysSinceLastUsed}
            cooldownDays={settings.cooldownDays}
            greenReadyDays={settings.greenReadyDays}
            usageLast90Days={footage.usageLast90Days}
            totalUsageCount={footage.totalUsageCount}
            maxTotalUsageCount={settings.maxTotalUsageCount}
            compact
          />

          <motion.button
            type="button"
            whileHover={{ scale: 1.08, rotate: 90 }}
            whileTap={{ scale: 0.92 }}
            onClick={onClose}
            className="p-1 sm:p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Row 2: Footage Title + Segmented Tab Bar (side-by-side on desktop, stacked on mobile) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-0.5">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate min-w-0">
          {footage.title || 'ไม่มีชื่อช็อตฟุตเทจ'}
        </h2>

        {/* Animated Segmented Tabs: 3 equal columns on mobile */}
        <div className="grid grid-cols-3 lg:flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl w-full lg:w-auto shadow-2xs shrink-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`relative py-1.5 px-1.5 sm:px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="traceability-modal-active-tab"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 bg-white rounded-lg shadow-2xs"
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 truncate">
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1 sm:px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

