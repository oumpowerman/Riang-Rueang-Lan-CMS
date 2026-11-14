import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Sparkles,
  Target,
  Trophy,
  CheckCircle2,
  ListOrdered,
  FileText,
} from 'lucide-react';
import { ActiveNavTab, CategoryMatrixStat } from '../../../context/CMSContext';
import { EpisodeProductionTarget } from '../../../types/episode.types';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import { BuilderStepNumber } from './builder.types';

interface BuilderStudioHeaderProps {
  nextEpisodeId: string;
  selectedCount: number;
  activeCategoryStat: CategoryMatrixStat | null;
  activeBuilderStep: BuilderStepNumber;
  onSelectStep: (step: BuilderStepNumber) => void;
  preselectNotice: string | null;
  onDismissPreselectNotice: () => void;
  savedBannerMessage: string | null;
  onNavigateTab: (tab: ActiveNavTab) => void;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const BuilderStudioHeader: React.FC<BuilderStudioHeaderProps> = ({
  nextEpisodeId,
  selectedCount,
  activeCategoryStat,
  activeBuilderStep,
  onSelectStep,
  preselectNotice,
  onDismissPreselectNotice,
  savedBannerMessage,
  onNavigateTab,
}) => {
  const steps = [
    {
      num: 1 as const,
      label: '1. หมวดเป้าหมาย',
      mobileLabel: '1. หมวดหมู่',
      sub: activeCategoryStat ? `#${activeCategoryStat.tag.name}` : 'ยังไม่เลือก',
      icon: Target,
      isDone: Boolean(activeCategoryStat),
    },
    {
      num: 2 as const,
      label: '2. จัด 5 อันดับ & คัดคลิป',
      mobileLabel: '2. จัด 5 อันดับ',
      sub: `${selectedCount}/5 อันดับ`,
      icon: ListOrdered,
      isDone: selectedCount === 5,
    },
    {
      num: 3 as const,
      label: '3. ข้อมูลตอน & บันทึก',
      mobileLabel: '3. บันทึกตอน',
      sub: selectedCount === 5 ? 'พร้อมบันทึก' : 'รอครบ 5 คลิป',
      icon: FileText,
      isDone: false,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Main Studio Header: Pastel Earth Tone Theme */}
      <div className="bg-[#fdfbf7] border border-[#e8dfd3] rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-xs">
        {/* Top Row: Title + Code Badge + Selection Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#edf4ed] border border-[#cbe0cb] flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#3a6845]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold text-[#2d2926] truncate">
                  จัดชุดคลิป 5 อันดับ
                </h1>
                <span className="px-2 py-0.5 rounded-lg bg-[#f3ece0] text-[#785324] border border-[#e5d8c3] text-xs font-mono font-bold tabular-nums shrink-0">
                  {nextEpisodeId}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-[#716960] mt-0.5">
                เลือกสูตรผสมด่วนหรือหยิบฟุตเทจจากคลังลง 5 อันดับให้สมบูรณ์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0">
            <span
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-mono font-bold tabular-nums transition-colors flex items-center gap-1.5 border whitespace-nowrap ${
                selectedCount === 5
                  ? 'bg-[#edf4ed] text-[#285333] border-[#bad8b9] shadow-xs'
                  : 'bg-[#fef8ed] text-[#7d5622] border-[#f0e2ca]'
              }`}
            >
              {selectedCount === 5 && <CheckCircle2 className="w-3.5 h-3.5 text-[#285333] shrink-0" />}
              <span className="hidden sm:inline">เลือกแล้ว {selectedCount}/5 อันดับ</span>
              <span className="sm:hidden">{selectedCount}/5 อันดับ</span>
            </span>
          </div>
        </div>

        {/* Horizontal 3-Step Wizard Stepper Bar (3 columns on both mobile and desktop) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-2.5 border-t border-[#eee6da]">
          {steps.map((st) => {
            const isActive = activeBuilderStep === st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => onSelectStep(st.num)}
                className={`relative text-left p-2 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                  isActive
                    ? 'bg-[#f4f7f2] border-[#93b390] ring-2 ring-[#a4c5a1]/40 shadow-xs'
                    : 'bg-[#faf7f2] hover:bg-white hover:border-[#d6cbbe] border-[#e8dfd3] text-[#4d4740]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 min-w-0 ${
                      isActive ? 'text-[#244b2f] font-extrabold' : 'text-[#3f3a34]'
                    }`}
                  >
                    <st.icon
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${
                        isActive ? 'text-[#2e5938]' : 'text-[#877e73]'
                      }`}
                    />
                    <span className="hidden sm:inline truncate">{st.label}</span>
                    <span className="sm:hidden truncate">{st.mobileLabel}</span>
                  </span>

                  {st.isDone && (
                    <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#3d7048] text-white flex items-center justify-center text-[9px] sm:text-[10px] shrink-0 font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <div className="text-[10px] sm:text-[11px] font-mono tabular-nums truncate">
                  <span
                    className={`truncate ${
                      isActive ? 'text-[#356140] font-semibold' : 'text-[#787066]'
                    }`}
                  >
                    {st.sub}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated Preselect Notice */}
      <AnimatePresence initial={false}>
        {preselectNotice && (
          <motion.div
            key="preselect-notice"
            initial={{ height: 0, opacity: 0, y: -6 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: SLIDE_EASE }}
            className="overflow-hidden"
          >
            <div className="bg-[#edf4ed] border border-[#cadcca] rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 text-xs font-bold text-[#275031]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#356a42] shrink-0" />
                <span>{preselectNotice}</span>
              </div>
              <button
                type="button"
                onClick={onDismissPreselectNotice}
                className="text-[#356a42] hover:underline cursor-pointer shrink-0"
              >
                ปิด
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Saved Episode Confirmation Banner */}
      <AnimatePresence initial={false}>
        {savedBannerMessage && (
          <motion.div
            key="saved-banner"
            initial={{ height: 0, opacity: 0, y: -6 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: SLIDE_EASE }}
            className="overflow-hidden"
          >
            <div className="bg-[#edf4ed] border border-[#b8d8b6] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold text-[#244f2e] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#32693e]" />
                <span>{savedBannerMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('MASTER_ARCHIVE')}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#376543] hover:bg-[#2b5135] rounded-lg whitespace-nowrap cursor-pointer shadow-xs"
              >
                เปิดดูคลังคลิปหลัก →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
