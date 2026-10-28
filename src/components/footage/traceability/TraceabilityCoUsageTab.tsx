import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Film, GitMerge, Layers } from 'lucide-react';
import { StatusBadge } from '../../ui/StatusBadge';
import { TagPill } from '../../ui/TagPill';
import { TraceabilityCoUsageTabProps } from './traceability.types';

export const TraceabilityCoUsageTab: React.FC<TraceabilityCoUsageTabProps> = ({
  coUsedEntries,
  tagMap,
  settings,
  onSelectPartnerFootage,
}) => {
  if (coUsedEntries.length === 0) {
    return (
      <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6 bg-white border border-slate-200 rounded-2xl">
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
          <GitMerge className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">
          ยังไม่เคยถูกผสมคู่กับฟุตเทจอื่นในระบบ
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          สามารถนำฟุตเทจนี้ไปจับคู่ผสมกับฟุตเทจใดก็ได้ในคลังโดยไม่เกิด Pairwise Collision
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 px-1">
        <span className="font-bold text-slate-800">
          ฟุตเทจที่เคยอยู่ร่วม EP เดียวกัน ({coUsedEntries.length} รายการ)
        </span>
        <span className="text-slate-500">
          คลิกที่การ์ดเพื่อสลับดูข้อมูลของฟุตเทจคู่ผสมได้ทันที
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {coUsedEntries.map(({ partner, partnerId, count }) => (
          <motion.div
            key={partnerId}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectPartnerFootage(partnerId)}
            className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-3.5 cursor-pointer flex flex-col justify-between gap-2.5 shadow-2xs transition-colors"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold">
                    <Film className="w-3.5 h-3.5 text-slate-300" />
                    <span>{partnerId}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50/80 border border-purple-200 text-purple-900 font-mono tabular-nums text-[11px] font-bold">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span>เจอกัน {count} EP</span>
                  </span>
                </div>

                <StatusBadge
                  status={partner.cooldownStatus}
                  daysSinceLastUse={partner.daysSinceLastUsed}
                  cooldownDays={settings.cooldownDays}
                  greenReadyDays={settings.greenReadyDays}
                  usageLast90Days={partner.usageLast90Days}
                  totalUsageCount={partner.totalUsageCount}
                  maxTotalUsageCount={settings.maxTotalUsageCount}
                  compact
                />
              </div>

              <div className="text-xs font-bold text-slate-900 line-clamp-1">
                {partner.title}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                {partner.tags.slice(0, 3).map((tid) => (
                  <TagPill key={tid} tag={tagMap[tid]} />
                ))}
                {partner.tags.length > 3 && (
                  <span className="text-[10px] font-mono text-slate-500">
                    +{partner.tags.length - 3}
                  </span>
                )}
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                <span>เปิดดูฟุตนี้</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
