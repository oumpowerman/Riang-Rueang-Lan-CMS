import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Calendar,
  Clapperboard,
  Clock,
  FileEdit,
  Film,
  GitMerge,
  Sparkles,
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
      icon: <FileEdit className="w-3.5 h-3.5" />,
    },
    {
      id: 'EPISODE_HISTORY',
      label: 'ประวัติ EP',
      count: footage.usageHistory.length,
      icon: <Trophy className="w-3.5 h-3.5" />,
    },
    {
      id: 'CO_USAGE_MATRIX',
      label: 'คู่ผสมซ้ำ',
      count: coUsedCount,
      icon: <GitMerge className="w-3.5 h-3.5" />,
    },
  ];

  const isVelocityHigh =
    footage.usageLast90Days >= settings.maxUsagePer90Days;

  return (
    <div className="border-b border-slate-200 bg-slate-50/95 px-5 pt-4 pb-3 space-y-3 shrink-0">
      {/* Row 1: ID + Origin Badges + StatusBadge + Close */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Footage ID Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold tracking-tight">
              <Film className="w-3.5 h-3.5 text-slate-300" />
              <span>{footage.id}</span>
            </span>

            {/* Ingestion Flow Origin Badge */}
            {footage.ingestionFlow === 'DIRECT_1_TO_1' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                <Video className="w-3.5 h-3.5 text-slate-500" />
                <span>คลิปเดี่ยว 1:1</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-900 font-semibold">
                <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {footage.sourceId}
                  {footage.timestampRange ? ` · ${footage.timestampRange}` : ''}
                </span>
                {parentSource && (
                  <button
                    type="button"
                    onClick={onOpenParentSource}
                    className="ml-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
                  >
                    ดูต้นฉบับ →
                  </button>
                )}
              </span>
            )}

            {/* Ingestion Date Badge */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100/80 border border-slate-200/80 text-slate-600 font-mono text-[11px] tabular-nums">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>
                {formatThaiDate(footage.createdAt)} ({footage.daysSinceCreated}d)
              </span>
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {footage.title || 'ไม่มีชื่อช็อตฟุตเทจ'}
          </h2>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <StatusBadge
            status={footage.cooldownStatus}
            daysSinceLastUse={footage.daysSinceLastUsed}
            cooldownDays={settings.cooldownDays}
            greenReadyDays={settings.greenReadyDays}
            usageLast90Days={footage.usageLast90Days}
            totalUsageCount={footage.totalUsageCount}
            maxTotalUsageCount={settings.maxTotalUsageCount}
          />

          <motion.button
            type="button"
            whileHover={{ scale: 1.08, rotate: 90 }}
            whileTap={{ scale: 0.92 }}
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Row 2: Single-Row 4-KPI Strip + Segmented Tab Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-0.5">
        {/* 4 Professional Translucent KPI Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 border border-indigo-200/80 text-indigo-950 font-bold"
            title="จำนวนครั้งที่ถูกนำไปใช้ในคลิปหลักทั้งหมด"
          >
            <Clapperboard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-sans font-medium text-slate-500 text-[11px]">ใช้</span>
            <span>{footage.totalUsageCount}x</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold ${
              isVelocityHigh
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}
            title="ความถี่การใช้ในรอบ 90 วันล่าสุดเทียบเกณฑ์เพดาน"
          >
            <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-sans font-medium text-slate-500 text-[11px]">90d</span>
            <span>
              {footage.usageLast90Days}/{settings.maxUsagePer90Days}
            </span>
          </span>

          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-bold"
            title="ระยะเวลาพักนับจากวันที่ออกอากาศล่าสุด"
          >
            {footage.daysSinceLastUsed !== null ? (
              <>
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-sans font-medium text-slate-500 text-[11px]">พัก</span>
                <span>{footage.daysSinceLastUsed}d</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="font-sans font-semibold text-sky-700">ใหม่แกะกล่อง</span>
              </>
            )}
          </span>

          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50/70 border border-purple-200/80 text-purple-950 font-bold"
            title="จำนวนฟุตเทจที่เคยถูกจัดชุดใน EP เดียวกัน"
          >
            <GitMerge className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="font-sans font-medium text-slate-500 text-[11px]">คู่ผสม</span>
            <span>{coUsedCount} ฟุต</span>
          </span>
        </div>

        {/* Animated Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl self-start lg:self-auto shadow-2xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
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
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
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
