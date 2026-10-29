import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { CooldownStatus } from '../../types/footage.types';

interface StatusBadgeProps {
  status: CooldownStatus;
  daysSinceLastUse?: number | null;
  cooldownDays?: number;
  greenReadyDays?: number;
  usageLast90Days?: number;
  totalUsageCount?: number;
  maxTotalUsageCount?: number;
  compact?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  daysSinceLastUse,
  cooldownDays = 14,
  greenReadyDays = 21,
  usageLast90Days,
  totalUsageCount,
  maxTotalUsageCount = 8,
  compact = false,
}) => {
  switch (status) {
    case 'NEW_UNTOUCHED':
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-sky-50/80 border border-sky-200/90 text-sky-800 whitespace-nowrap shrink-0"
          title="คลิปใหม่ ยังไม่เคยใช้งาน"
        >
          <Sparkles className="w-3 h-3 text-sky-600 shrink-0" />
          <span>{compact ? 'ใหม่' : 'คลิปใหม่ (0 ครั้ง)'}</span>
        </span>
      );

    case 'READY_FRESH':
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50/80 border border-emerald-200/90 text-emerald-800 whitespace-nowrap shrink-0"
          title={`พร้อมใช้งาน (พักมาแล้ว ${daysSinceLastUse ?? 0} วัน · ใช้แล้ว ${totalUsageCount ?? 0} ครั้ง)`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>
            {compact
              ? `พร้อมใช้ · ${daysSinceLastUse ?? 0}ว.`
              : `พร้อมใช้ · พัก ${daysSinceLastUse ?? 0} วัน`}
          </span>
        </span>
      );

    case 'HIGH_VELOCITY_WARNING': {
      const isRestingTowardsGreen =
        daysSinceLastUse !== null &&
        daysSinceLastUse !== undefined &&
        daysSinceLastUse < greenReadyDays;

      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50/80 border border-amber-200/90 text-amber-900 whitespace-nowrap shrink-0"
          title={
            isRestingTowardsGreen
              ? `เพิ่งพ้นระยะพัก (${daysSinceLastUse}/${greenReadyDays} วัน)`
              : `ใช้ถี่ (${usageLast90Days ?? 3} ครั้งใน 90 วัน)`
          }
        >
          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
          <span>
            {isRestingTowardsGreen
              ? compact
                ? `พัก ${daysSinceLastUse}/${greenReadyDays}ว.`
                : `เพิ่งพ้นพัก · ${daysSinceLastUse}/${greenReadyDays} วัน`
              : compact
              ? `ใช้ถี่ · ${usageLast90Days ?? 3}x`
              : `ใช้ถี่ · ${usageLast90Days ?? 3} ครั้ง/90ว.`}
          </span>
        </span>
      );
    }

    case 'RECENT_COOLDOWN': {
      const isMaxedOut =
        totalUsageCount !== undefined && totalUsageCount >= maxTotalUsageCount;
      const remaining =
        daysSinceLastUse !== null && daysSinceLastUse !== undefined
          ? Math.max(1, cooldownDays - daysSinceLastUse)
          : cooldownDays;
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-rose-50/80 border border-rose-200/90 text-rose-900 whitespace-nowrap shrink-0"
          title={
            isMaxedOut
              ? `ใช้ครบโควตาสูงสุด ${totalUsageCount} ครั้ง`
              : `อยู่ระหว่างพักคูลดาวน์ รออีก ${remaining} วัน`
          }
        >
          <Clock className="w-3 h-3 text-rose-600 shrink-0" />
          <span>
            {isMaxedOut
              ? compact
                ? `ครบโควตา (${totalUsageCount}x)`
                : `ครบโควตา · ${totalUsageCount} ครั้ง`
              : compact
              ? `พักอีก ${remaining}ว.`
              : `คูลดาวน์ · รอ ${remaining} วัน`}
          </span>
        </span>
      );
    }
  }
};
