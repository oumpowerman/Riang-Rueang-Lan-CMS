import React, { useMemo } from 'react';
import { Clock, Plus, Sparkles } from 'lucide-react';
import { ComputedFootage } from '../../types/footage.types';

interface SourceTimelineBarProps {
  totalDuration?: string;
  childFootages: ComputedFootage[];
  onSelectClip: (footageId: string) => void;
  onSplitMore: () => void;
}

interface ParsedSegment {
  footage: ComputedFootage;
  startSec: number;
  endSec: number;
  leftPct: number;
  widthPct: number;
}

interface UnexploredGap {
  startSec: number;
  endSec: number;
  durationSec: number;
  label: string;
}

function parseTimeToSeconds(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim();
  if (!cleaned) return null;
  const parts = cleaned.split(':').map((p) => Number(p.trim()));
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return null;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return null;
}

function parseRangeToSeconds(
  rangeStr?: string | null
): { startSec: number; endSec: number } | null {
  if (!rangeStr) return null;
  const parts = rangeStr.split(/[-–—~]/).map((s) => s.trim());
  if (parts.length < 2) return null;
  const startSec = parseTimeToSeconds(parts[0]);
  const endSec = parseTimeToSeconds(parts[1]);
  if (startSec === null || endSec === null || endSec <= startSec) return null;
  return { startSec, endSec };
}

function formatSecToTimestamp(sec: number, includeHours: boolean): string {
  const safe = Math.max(0, Math.round(sec));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (includeHours || hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const SourceTimelineBar: React.FC<SourceTimelineBarProps> = ({
  totalDuration,
  childFootages,
  onSelectClip,
  onSplitMore,
}) => {
  const timelineData = useMemo(() => {
    const rawRanges = childFootages
      .map((ft) => {
        const parsed = parseRangeToSeconds(ft.timestampRange);
        return parsed ? { ft, ...parsed } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.startSec - b.startSec);

    const parsedTotal = parseTimeToSeconds(totalDuration);
    const maxEndSec = rawRanges.reduce((max, r) => Math.max(max, r.endSec), 0);
    const effectiveTotalSec = Math.max(
      parsedTotal && parsedTotal > 0 ? parsedTotal : 3600,
      maxEndSec > 0 ? Math.ceil(maxEndSec * 1.1) : 1800
    );
    const includeHours = effectiveTotalSec >= 3600;

    const segments: ParsedSegment[] = rawRanges.map((r) => {
      const leftPct = Math.min(98, Math.max(0, (r.startSec / effectiveTotalSec) * 100));
      const rawWidthPct = ((r.endSec - r.startSec) / effectiveTotalSec) * 100;
      const widthPct = Math.min(100 - leftPct, Math.max(2.2, rawWidthPct));
      return {
        footage: r.ft,
        startSec: r.startSec,
        endSec: r.endSec,
        leftPct,
        widthPct,
      };
    });

    // Compute unexplored gaps (>= 180 seconds = 3 mins)
    const gaps: UnexploredGap[] = [];
    let cursor = 0;
    for (const seg of rawRanges) {
      if (seg.startSec - cursor >= 180) {
        const dur = seg.startSec - cursor;
        gaps.push({
          startSec: cursor,
          endSec: seg.startSec,
          durationSec: dur,
          label: `${formatSecToTimestamp(cursor, includeHours)} – ${formatSecToTimestamp(seg.startSec, includeHours)}`,
        });
      }
      cursor = Math.max(cursor, seg.endSec);
    }
    if (effectiveTotalSec - cursor >= 180) {
      const dur = effectiveTotalSec - cursor;
      gaps.push({
        startSec: cursor,
        endSec: effectiveTotalSec,
        durationSec: dur,
        label: `${formatSecToTimestamp(cursor, includeHours)} – ${formatSecToTimestamp(effectiveTotalSec, includeHours)}`,
      });
    }

    const coveredSeconds = rawRanges.reduce(
      (acc, r) => acc + Math.max(0, r.endSec - r.startSec),
      0
    );
    const coveragePct = Math.min(100, Math.round((coveredSeconds / effectiveTotalSec) * 100));

    return {
      effectiveTotalSec,
      includeHours,
      segments,
      gaps,
      coveragePct,
      startLabel: formatSecToTimestamp(0, includeHours),
      midLabel: formatSecToTimestamp(effectiveTotalSec / 2, includeHours),
      endLabel: formatSecToTimestamp(effectiveTotalSec, includeHours),
    };
  }, [totalDuration, childFootages]);

  const getSegmentStyle = (status: ComputedFootage['cooldownStatus']) => {
    switch (status) {
      case 'NEW_UNTOUCHED':
        return 'bg-sky-500 hover:bg-sky-600 border-sky-700 text-white';
      case 'READY_FRESH':
        return 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white';
      case 'RECENT_COOLDOWN':
        return 'bg-amber-500 hover:bg-amber-600 border-amber-700 text-white';
      case 'HIGH_VELOCITY_WARNING':
        return 'bg-rose-500 hover:bg-rose-600 border-rose-700 text-white';
    }
  };

  return (
    <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-bold text-slate-800">
            เส้นเวลาการหั่นช็อต (Visual Timestamp Timeline)
          </span>
          <span className="font-mono tabular-nums text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
            หั่นครอบคลุมแล้ว {timelineData.segments.length} ช่วง ({timelineData.coveragePct}% ของไลฟ์)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block" />
            <span>ฟุตใหม่แกะกล่อง</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            <span>พร้อมวนซ้ำ</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
            <span>พักคูลดาวน์</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 border border-dashed border-slate-400 inline-block" />
            <span>ช่องว่างรอขุดช็อต</span>
          </span>
        </div>
      </div>

      {/* Interactive Timeline Track */}
      <div className="relative h-8 w-full bg-slate-200/75 border border-slate-300/80 rounded-lg overflow-hidden select-none">
        {/* Background subtle grid ticks */}
        <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-slate-300/40 last:border-r-0" />
          ))}
        </div>

        {timelineData.segments.length === 0 ? (
          <button
            type="button"
            onClick={onSplitMore}
            className="w-full h-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ยังไม่มีช็อตที่ระบุช่วงเวลา — คลิกเพื่อเริ่มหั่นช็อตแรกจากไลฟ์นี้</span>
          </button>
        ) : (
          timelineData.segments.map((seg) => (
            <button
              key={seg.footage.id}
              type="button"
              onClick={() => onSelectClip(seg.footage.id)}
              style={{
                left: `${seg.leftPct}%`,
                width: `${seg.widthPct}%`,
              }}
              title={`${seg.footage.id} (${seg.footage.timestampRange}) — ${seg.footage.title}`}
              className={`absolute top-1 bottom-1 rounded-md border shadow-2xs transition-transform hover:scale-y-105 hover:z-10 flex items-center justify-center overflow-hidden px-1 cursor-pointer ${getSegmentStyle(
                seg.footage.cooldownStatus
              )}`}
            >
              <span className="text-[10px] font-mono font-bold truncate">
                {seg.footage.timestampRange?.split('-')[0]?.trim()}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Time markers + Unexplored Gaps callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center justify-between sm:justify-start sm:gap-6 font-mono tabular-nums text-slate-500">
          <span>เริ่ม {timelineData.startLabel}</span>
          <span>กลางไลฟ์ {timelineData.midLabel}</span>
          <span>จบ {timelineData.endLabel}</span>
        </div>

        {timelineData.gaps.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>ช่วงเวลาว่างน่าขุดเพิ่ม:</span>
            </span>
            {timelineData.gaps.slice(0, 2).map((gap, idx) => (
              <button
                key={idx}
                type="button"
                onClick={onSplitMore}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 font-mono tabular-nums text-[11px] font-semibold transition-colors cursor-pointer"
                title="คลิกเพื่อเปิดหน้าต่างหั่นช็อตเพิ่มจากไลฟ์นี้"
              >
                <span>{gap.label}</span>
                <Plus className="w-2.5 h-2.5" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
