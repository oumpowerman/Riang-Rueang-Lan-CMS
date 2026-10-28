import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, FolderTree, Sparkles, Trophy, Target, Layers, Folder } from 'lucide-react';
import { ActiveNavTab, CategoryMatrixStat } from '../../../context/CMSContext';
import { EpisodeProductionTarget } from '../../../types/episode.types';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';

interface BuilderStudioHeaderProps {
  nextEpisodeId: string;
  selectedCount: number;
  activeGroup: CategoryGroup | null;
  activeCategoryStat: CategoryMatrixStat | null;
  productionTarget: EpisodeProductionTarget;
  activeSubcategory: CategoryTag | null;
  onOpenThreeTierManager: () => void;
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
  onOpenThreeTierManager,
  onFocusStep1,
  preselectNotice,
  onDismissPreselectNotice,
  savedBannerMessage,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-3">
      {/* Compact Studio Header & Single Source-of-Truth 3-Tier Context Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>จัดชุดคลิป 5 อันดับ</span>
            </h1>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-mono font-bold tabular-nums">
              {nextEpisodeId}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`px-3 py-1.5 rounded-xl font-mono font-bold tabular-nums transition-colors ${
                selectedCount === 5
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              เลือกแล้ว {selectedCount}/5 อันดับ
            </span>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenThreeTierManager}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-900 border border-slate-200 hover:border-indigo-300 font-bold transition-colors cursor-pointer"
            >
              <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
              <span>จัดการหมวดหมู่ 3 ชั้น</span>
            </motion.button>
          </div>
        </div>

        {/* Single Source of Truth 3-Tier Breadcrumb Bar */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-500 mr-0.5">
              หมวดหมู่ที่กำลังจัด:
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 font-bold">
              <Folder className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>{activeGroup?.name || 'ไม่ได้ระบุกลุ่ม'}</span>
            </span>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 font-bold">
              <span>#{activeCategoryStat?.tag.name || 'เลือกหมวด'}</span>
            </span>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL' && activeSubcategory ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 font-bold">
                <Target className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>เจาะจง: {activeSubcategory.name}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>รวมหลากประเด็น</span>
              </span>
            )}
          </div>

          <AnimatePresence initial={false}>
            {onFocusStep1 && (
              <motion.button
                key="change-cat-btn"
                type="button"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.2 }}
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
            transition={{ duration: 0.25, ease: SLIDE_EASE }}
            className="overflow-hidden"
          >
            <div className="bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs font-bold text-sky-900">
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
            transition={{ duration: 0.25, ease: SLIDE_EASE }}
            className="overflow-hidden"
          >
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold text-emerald-900">
                {savedBannerMessage}
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('MASTER_ARCHIVE')}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg whitespace-nowrap cursor-pointer"
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
