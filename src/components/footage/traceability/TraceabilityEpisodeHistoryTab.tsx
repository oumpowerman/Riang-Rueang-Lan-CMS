import React from 'react';
import {
  Activity,
  ArrowUpRight,
  Award,
  Clock,
  Film,
  Medal,
  Moon,
  Sun,
  Trophy,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { formatThaiDate } from '../../../utils/fileNameGenerator';
import { TraceabilityEpisodeHistoryTabProps } from './traceability.types';

export const TraceabilityEpisodeHistoryTab: React.FC<
  TraceabilityEpisodeHistoryTabProps
> = ({ footage, onSelectEpisode }) => {
  const { settings } = useCMS();

  if (footage.usageHistory.length === 0) {
    return (
      <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 bg-white border border-slate-200 rounded-2xl">
        <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mb-3">
          <Film className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">
          ยังไม่เคยถูกนำไปใช้ในคลิปหลัก
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          สามารถดึงฟุตเทจนี้ไปจัดชุด 5 อันดับได้ทันทีโดยไม่มีประวัติซ้ำ
        </p>
      </div>
    );
  }

  const isVelocityHigh =
    footage.usageLast90Days >= settings.maxUsagePer90Days;

  const renderRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 font-mono tabular-nums font-bold text-xs shadow-2xs shrink-0">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>อันดับ 1</span>
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 font-mono tabular-nums font-bold text-xs shrink-0">
            <Medal className="w-3.5 h-3.5 text-slate-500" />
            <span>อันดับ 2</span>
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100/70 border border-amber-300/80 text-amber-900 font-mono tabular-nums font-bold text-xs shrink-0">
            <Medal className="w-3.5 h-3.5 text-amber-700" />
            <span>อันดับ 3</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50/70 border border-indigo-200 text-indigo-900 font-mono tabular-nums font-bold text-xs shrink-0">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            <span>อันดับ {rank}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-800">
            ใช้งานทั้งหมด {footage.usageHistory.length} ครั้ง
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border font-mono tabular-nums font-bold text-[11px] ${
              isVelocityHigh
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}
          >
            <Activity className="w-3 h-3 text-amber-600" />
            <span>
              ใน 90 วัน: {footage.usageLast90Days}/{settings.maxUsagePer90Days}
            </span>
          </span>
        </div>
        <span className="font-mono tabular-nums text-slate-500">
          ล่าสุด: {formatThaiDate(footage.lastUsedDate)}
        </span>
      </div>

      {/* Mobile Compact Cards (< sm) */}
      <div className="sm:hidden space-y-2">
        {footage.usageHistory.map((rec) => (
          <div
            key={`mob-${rec.episodeId}-${rec.rank}`}
            onClick={() => onSelectEpisode(rec.episodeId)}
            className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-3 space-y-2 shadow-2xs cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 font-mono font-bold text-xs text-indigo-700">
                  {rec.episodeId}
                </span>
                {renderRankBadge(rec.rank)}
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-indigo-600">
                <span>ดู EP</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="text-xs font-bold text-slate-900 line-clamp-1">
              {rec.episodeTitle}
            </div>

            <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] text-slate-500">
              <span>{formatThaiDate(rec.publishDate)}</span>
              <span>({rec.daysAgo}d)</span>
              {rec.publishSlot === 'MORNING_0600' ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>06:00</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold">
                  <Moon className="w-3 h-3 text-indigo-500" />
                  <span>18:00</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table (≥ sm) */}
      <div className="hidden sm:block border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600">
              <th className="py-3 px-4 w-28">รหัส EP</th>
              <th className="py-3 px-4">ชื่อคลิป 5 อันดับ</th>
              <th className="py-3 px-4 text-center w-32">อันดับในคลิป</th>
              <th className="py-3 px-4 w-52">วันที่โพสต์</th>
              <th className="py-3 px-4 text-right w-32">รายละเอียด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {footage.usageHistory.map((rec) => (
              <tr
                key={`${rec.episodeId}-${rec.rank}`}
                onClick={() => onSelectEpisode(rec.episodeId)}
                className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                  {rec.episodeId}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {rec.episodeTitle}
                </td>
                <td className="py-3 px-4 text-center">
                  {renderRankBadge(rec.rank)}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 font-mono tabular-nums text-slate-600">
                    <span>{formatThaiDate(rec.publishDate)}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{rec.daysAgo}d</span>
                    </span>
                    {rec.publishSlot === 'MORNING_0600' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>06:00</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold">
                        <Moon className="w-3 h-3 text-indigo-500" />
                        <span>18:00</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-indigo-600 group-hover:text-indigo-800 font-bold">
                    <span>ดูคลิปหลัก</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

