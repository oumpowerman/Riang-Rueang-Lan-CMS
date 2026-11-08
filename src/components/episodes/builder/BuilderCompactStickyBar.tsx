import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Folder, Layers, Target, CheckCircle2 } from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { EpisodeProductionTarget } from '../../../types/episode.types';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';

interface BuilderCompactStickyBarProps {
  nextEpisodeId: string;
  selectedCount: number;
  activeGroup: CategoryGroup | null;
  activeCategoryStat: CategoryMatrixStat | null;
  productionTarget: EpisodeProductionTarget;
  activeSubcategory: CategoryTag | null;
  onFocusStep1?: () => void;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const BuilderCompactStickyBar: React.FC<BuilderCompactStickyBarProps> = ({
  nextEpisodeId,
  selectedCount,
  activeGroup,
  activeCategoryStat,
  productionTarget,
  activeSubcategory,
  onFocusStep1,
}) => {
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const handleScroll = () => {
      // Trigger when scrolled down past the primary header (~180px)
      if (mainEl.scrollTop > 180) {
        setIsStickyVisible(true);
      } else {
        setIsStickyVisible(false);
      }
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (onFocusStep1) {
      onFocusStep1();
    }
  };

  return (
    <AnimatePresence>
      {isStickyVisible && (
        <motion.div
          initial={{ y: -26, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2, ease: SLIDE_EASE }}
          className="sticky top-0 z-30 mb-2 w-full"
        >
          <div className="bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-md rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2.5">
            {/* Left: EP ID + Target Category Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="px-2.5 py-1 rounded-xl bg-amber-100/90 text-amber-900 border border-amber-300/80 font-mono font-bold text-xs shrink-0 select-none shadow-2xs">
                {nextEpisodeId}
              </span>

              <div className="flex items-center gap-1.5 text-xs min-w-0">
                <span className="font-semibold text-stone-400 hidden sm:inline shrink-0">
                  หมวดเป้าหมาย:
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold shrink-0">
                  <Folder className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>{activeGroup?.name || 'ไม่ระบุกลุ่ม'}</span>
                </span>

                <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold shrink-0">
                  <span>#{activeCategoryStat?.tag.name || 'เลือกหมวดหลัก'}</span>
                </span>

                <ChevronRight className="w-3 h-3 text-stone-300 shrink-0 hidden sm:inline" />

                <div className="hidden sm:inline-flex items-center">
                  {productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL' && activeSubcategory ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                      <Target className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>เจาะจง: {activeSubcategory.name}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
                      <Layers className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>รวมหลากประเด็น</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Selection Counter + Change Category / Scroll to Top Button */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-3 py-1 rounded-xl font-mono font-bold text-xs tabular-nums flex items-center gap-1.5 transition-colors ${
                  selectedCount === 5
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                {selectedCount === 5 && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>เลือกแล้ว {selectedCount}/5</span>
              </span>

              <button
                type="button"
                onClick={handleScrollToTop}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                title="เลื่อนขึ้นเพื่อแก้ไขหมวดหมู่"
              >
                เปลี่ยนหมวด
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
