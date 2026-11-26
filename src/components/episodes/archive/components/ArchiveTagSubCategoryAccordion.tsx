import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { CategoryTag, CategoryTier } from '../../../../types/tag.types';
import { TierThemeConfig } from '../../../tags/three-tier/IndependentTierColumn';
import { getEntityIcon } from '../../../ui/TagPill';

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface ArchiveTagSubCategoryAccordionProps {
  tier: CategoryTier;
  theme: TierThemeConfig;
  subCategory: string;
  subTags: CategoryTag[];
  isCollapsed: boolean;
  cascadeIndex: number;
  isCascadeActive: boolean;
  selectedFootageTagIds: string[];
  tagEpisodeCounts: Record<string, number>;
  onToggleSubCategory: (subKey: string) => void;
  onToggleFootageTag: (tagId: string) => void;
}

export const ArchiveTagSubCategoryAccordion: React.FC<
  ArchiveTagSubCategoryAccordionProps
> = ({
  tier,
  theme,
  subCategory,
  subTags,
  isCollapsed,
  cascadeIndex,
  isCascadeActive,
  selectedFootageTagIds,
  tagEpisodeCounts,
  onToggleSubCategory,
  onToggleFootageTag,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const subKey = `${tier}__${subCategory}`;
  const selectedInSub = subTags.filter((t) =>
    selectedFootageTagIds.includes(t.id)
  ).length;

  const enterDelay =
    !prefersReducedMotion && isCascadeActive
      ? Math.min(cascadeIndex * 0.04, 0.24)
      : 0;

  return (
    <div className="rounded-xl border border-[#E5DED4] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => onToggleSubCategory(subKey)}
        aria-expanded={!isCollapsed}
        className={`w-full px-2.5 py-1.5 border-b flex items-center justify-between gap-1.5 text-left cursor-pointer transition-colors ${
          isCollapsed ? 'border-b-transparent' : ''
        } ${theme.subHeaderBg} ${theme.subHeaderBorder} hover:brightness-98`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <motion.span
            initial={false}
            animate={{ rotate: isCollapsed ? -90 : 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.24,
              ease: SMOOTH_EASE,
              delay: isCollapsed ? 0 : enterDelay,
            }}
            className="inline-flex items-center justify-center text-[#524538] shrink-0"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.span>

          <span className="text-[11px] font-extrabold text-[#3D332A] truncate">
            {subCategory}
          </span>

          {selectedInSub > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#3B6845] text-white text-[9px] font-extrabold tabular-nums shrink-0">
              <Check className="w-2.5 h-2.5" />
              <span>{selectedInSub}</span>
            </span>
          )}
        </div>

        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white text-[#6E5F52] border border-black/10 tabular-nums shrink-0">
          {subTags.length}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key={`${subKey}-archive-accordion-body`}
            variants={{
              collapsed: prefersReducedMotion
                ? {
                    opacity: 0,
                    transition: { duration: 0.08 },
                  }
                : {
                    height: 0,
                    opacity: 0,
                    transition: {
                      height: { duration: 0.22, ease: SMOOTH_EASE, delay: 0 },
                      opacity: { duration: 0.14, ease: 'easeOut', delay: 0 },
                    },
                  },
              expanded: prefersReducedMotion
                ? {
                    opacity: 1,
                    transition: { duration: 0.12, delay: enterDelay },
                  }
                : {
                    height: 'auto',
                    opacity: 1,
                    transition: {
                      height: {
                        duration: 0.28,
                        ease: SMOOTH_EASE,
                        delay: enterDelay,
                      },
                      opacity: {
                        duration: 0.22,
                        ease: 'easeOut',
                        delay: enterDelay + 0.02,
                      },
                    },
                  },
            }}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <motion.div
              variants={{
                collapsed: prefersReducedMotion
                  ? { opacity: 0 }
                  : {
                      y: -5,
                      opacity: 0,
                      transition: { duration: 0.14, ease: 'easeOut' },
                    },
                expanded: prefersReducedMotion
                  ? { opacity: 1 }
                  : {
                      y: 0,
                      opacity: 1,
                      transition: {
                        duration: 0.24,
                        ease: SMOOTH_EASE,
                        delay: enterDelay + 0.02,
                      },
                    },
              }}
              className="p-2"
            >
              {subTags.length === 0 ? (
                <p className="text-[11px] text-[#8C7B6C] italic text-center py-1">
                  ยังไม่มีแท็กในหมวดนี้
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {subTags.map((tag) => {
                    const isSelected = selectedFootageTagIds.includes(tag.id);
                    const epCount = tagEpisodeCounts[tag.id] || 0;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => onToggleFootageTag(tag.id)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-[#D5EBDA] text-[#144220] font-bold border-[#AED7B7] shadow-2xs ring-1 ring-[#C5E6CD]'
                            : epCount > 0
                            ? 'bg-[#FAF8F5] text-[#3D332A] border-[#DFD7CA] hover:bg-[#EDF6F0] hover:border-[#C5DFCC]'
                            : 'bg-[#FAF8F5]/60 text-[#9C9286] border-[#EAE2D6] hover:bg-white'
                        }`}
                        title={`#${tag.name} — ปรากฏในคลิปหลัก ${epCount} ตอน`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-[#1B572A] shrink-0" />
                        )}
                        <span className="text-xs shrink-0">
                          {getEntityIcon(tag)}
                        </span>
                        <span>#{tag.name}</span>
                        <span
                          className={`text-[10px] font-mono px-1 rounded tabular-nums ${
                            isSelected
                              ? 'bg-[#BFE0C8] text-[#144220] font-bold'
                              : epCount > 0
                              ? 'bg-[#EAF5ED] text-[#245233] font-bold'
                              : 'bg-[#EFECE6] text-[#9C9286]'
                          }`}
                        >
                          {epCount} EP
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
