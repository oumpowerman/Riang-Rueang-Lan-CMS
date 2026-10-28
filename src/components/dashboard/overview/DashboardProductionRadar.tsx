import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Plus,
  Rocket,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DashboardProductionRadarData } from './dashboard.types';

interface DashboardProductionRadarProps {
  productionRadar: DashboardProductionRadarData;
  isRadarExpanded: boolean;
  setIsRadarExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  launchEpisodeBuilderForCategory: (tagId: string) => void;
  setIsDirectFootageModalOpen: (open: boolean) => void;
  setTraceabilityFootageId: (id: string | null) => void;
}

export const DashboardProductionRadar: React.FC<DashboardProductionRadarProps> = ({
  productionRadar,
  isRadarExpanded,
  setIsRadarExpanded,
  launchEpisodeBuilderForCategory,
  setIsDirectFootageModalOpen,
  setTraceabilityFootageId,
}) => {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-emerald-50/30 border border-slate-200/80 p-3.5 space-y-3">
      <div
        onClick={() => setIsRadarExpanded((prev) => !prev)}
        className="flex flex-wrap items-center justify-between gap-2 cursor-pointer"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Rocket className="w-4 h-4 text-emerald-600" />
          <span>เรดาร์ชี้เป้าด่วน: หมวดพร้อมทำ EP ทันที · หมวดใกล้ครบ 5 ฟุต · ฟุตคุ้มค่าพร้อมใช้</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
        >
          <span>{isRadarExpanded ? 'พับเก็บเรดาร์' : 'กางดูเรดาร์ชี้เป้า 3 กล่อง'}</span>
          <motion.span
            animate={{ rotate: isRadarExpanded ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isRadarExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                {/* Radar 1: Ready-to-Produce */}
                <div className="bg-white border border-emerald-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-950 inline-flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5 text-emerald-600" />
                      <span>หมวดพร้อมจัด 5 อันดับทันที</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {productionRadar.readyCategories.length} หมวด
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {productionRadar.readyCategories.slice(0, 5).map((stat) => (
                      <div
                        key={stat.tag.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-50/40 hover:bg-emerald-50/90 border border-emerald-200/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            #{stat.tag.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                            พร้อมใช้ {stat.usableCount} ฟุต · ทำได้{' '}
                            <strong className="text-emerald-700">
                              {stat.producibleEpisodesCount} EP
                            </strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => launchEpisodeBuilderForCategory(stat.tag.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                        >
                          <Zap className="w-3 h-3" />
                          <span>จัด EP</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar 2: Almost Ready */}
                <div className="bg-white border border-amber-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-950 inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>หมวดใกล้ครบ 5 ฟุต (ขาด 1–2 ฟุต)</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      {productionRadar.almostReadyCategories.length} หมวด
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {productionRadar.almostReadyCategories.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center">
                        ไม่มีหมวดที่ค้าง 3–4 ฟุต
                      </div>
                    ) : (
                      productionRadar.almostReadyCategories.map((stat) => (
                        <div
                          key={stat.tag.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50/40 hover:bg-amber-50/90 border border-amber-200/60 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              #{stat.tag.name}
                            </div>
                            <div className="text-[11px] text-amber-800 font-mono tabular-nums">
                              มี {stat.usableCount}/5 ฟุต · ขาดอีก {5 - stat.usableCount} ฟุต
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsDirectFootageModalOpen(true)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>เติมฟุต</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Radar 3: High-ROI Footages */}
                <div className="bg-white border border-sky-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-sky-950 inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>ชี้เป้าฟุตคุ้มค่าพร้อมใช้</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                      {productionRadar.topRoiFootages.length} รายการ
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {productionRadar.topRoiFootages.map((ft) => (
                      <div
                        key={ft.id}
                        onClick={() => setTraceabilityFootageId(ft.id)}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-sky-50/40 hover:bg-sky-50/90 border border-sky-200/60 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                            {ft.cooldownStatus === 'NEW_UNTOUCHED' ? (
                              <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            <span className="font-mono text-indigo-700">{ft.id}</span>
                            <span className="truncate">{ft.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
                            {ft.cooldownStatus === 'NEW_UNTOUCHED'
                              ? 'ยังไม่เคยใช้เลย'
                              : `พักมาแล้ว ${ft.daysSinceLastUsed} วัน`}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-sky-700 shrink-0">
                          ประวัติ →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
