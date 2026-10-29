import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronRight,
  Folder,
  Layers,
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
import { MixRecipeId } from '../../../utils/collisionDetector';

interface BuilderStudioHeaderProps {
  nextEpisodeId: string;
  selectedCount: number;
  activeGroup: CategoryGroup | null;
  activeCategoryStat: CategoryMatrixStat | null;
  productionTarget: EpisodeProductionTarget;
  activeSubcategory: CategoryTag | null;
  activeBuilderStep: 1 | 2 | 3 | 4;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
  activeRecipe?: MixRecipeId;
  onFocusStep1?: () => void;
  preselectNotice: string | null;
  onDismissPreselectNotice: () => void;
  savedBannerMessage: string | null;
  onNavigateTab: (tab: ActiveNavTab) => void;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const BuilderStudioHeader: React.FC<BuilderStudioHeaderProps> = ({
  nextEpisodeId,
  selectedCount,
  activeGroup,
  activeCategoryStat,
  productionTarget,
  activeSubcategory,
  activeBuilderStep,
  onSelectStep,
  onFocusStep1,
  preselectNotice,
  onDismissPreselectNotice,
  savedBannerMessage,
  onNavigateTab,
}) => {
  const steps = [
    {
      num: 1 as const,
      label: '1. หมวดเป้าหมาย',
      sub: activeCategoryStat ? `#${activeCategoryStat.tag.name}` : 'ยังไม่เลือก',
      icon: Target,
      isDone: Boolean(activeCategoryStat),
    },
    {
      num: 2 as const,
      label: '2. สูตรผสม (Mix)',
      sub: 'สัดส่วนใหม่/สด',
      icon: Sparkles,
      isDone: selectedCount >= 5,
    },
    {
      num: 3 as const,
      label: '3. จัด 5 อันดับ',
      sub: `${selectedCount}/5 คลิป`,
      icon: ListOrdered,
      isDone: selectedCount === 5,
    },
    {
      num: 4 as const,
      label: '4. บันทึกตอน',
      sub: selectedCount === 5 ? 'พร้อมบันทึก' : 'รอครบ 5',
      icon: FileText,
      isDone: false,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Studio Header: Title, EP ID & Stepper */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        {/* Top Row: Title + Code Badge + Selection Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>จัดชุดคลิป 5 อันดับ</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-mono font-bold tabular-nums">
              {nextEpisodeId}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-3 py-1.5 rounded-xl font-mono font-bold tabular-nums transition-colors flex items-center gap-1.5 ${
                selectedCount === 5
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              {selectedCount === 5 && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>เลือกแล้ว {selectedCount}/5 อันดับ</span>
            </span>
          </div>
        </div>

        {/* Horizontal 4-Step Wizard Stepper Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
          {steps.map((st) => {
            const isActive = activeBuilderStep === st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => onSelectStep(st.num)}
                className={`relative text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                  isActive
                    ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-300/70 shadow-2xs'
                    : 'bg-slate-50/60 hover:bg-white hover:border-indigo-200 border-slate-200/80 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-xs font-bold flex items-center gap-1.5 truncate ${
                      isActive ? 'text-indigo-950 font-extrabold' : 'text-slate-800'
                    }`}
                  >
                    <st.icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{st.label}</span>
                  </span>

                  {st.isDone && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0">
                      ✓
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span
                    className={`truncate ${
                      isActive ? 'text-indigo-700 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {st.sub}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {isActive ? '● กำลังทำ' : 'คลิกเปิด'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3-Tier Breadcrumb Summary Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-400 mr-0.5">หมวดเป้าหมาย:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-semibold">
              <Folder className="w-3 h-3 text-purple-600 shrink-0" />
              <span>{activeGroup?.name || 'ไม่ระบุกลุ่ม'}</span>
            </span>

            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold">
              <span>#{activeCategoryStat?.tag.name || 'เลือกหมวดหลัก'}</span>
            </span>

            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />

            {productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL' && activeSubcategory ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                <Target className="w-3 h-3 text-amber-600 shrink-0" />
                <span>เจาะจง: {activeSubcategory.name}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                <Layers className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>รวมหลากประเด็น</span>
              </span>
            )}
          </div>

          <AnimatePresence initial={false}>
            {onFocusStep1 && activeBuilderStep !== 1 && (
              <motion.button
                key="change-cat-btn"
                type="button"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
                onClick={onFocusStep1}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                เปลี่ยนหมวดหมู่
              </motion.button>
            )}
          </AnimatePresence>
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
            <div className="bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 text-xs font-bold text-sky-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                <span>{preselectNotice}</span>
              </div>
              <button
                type="button"
                onClick={onDismissPreselectNotice}
                className="text-sky-700 hover:underline cursor-pointer shrink-0"
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
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{savedBannerMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('MASTER_ARCHIVE')}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg whitespace-nowrap cursor-pointer shadow-2xs"
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
