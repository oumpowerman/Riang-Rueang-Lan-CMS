import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, ChevronDown, Plus, Star, X } from 'lucide-react';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
} from '../../../types/tag.types';
import { TierThemeConfig } from '../../tags/three-tier/IndependentTierColumn';
import { getEntityIcon } from '../../ui/TagPill';
import {
  BuilderTagClickActionMode,
  TagLiveStockSummary,
} from './builder.types';

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface BuilderTierSubCategoryAccordionProps {
  tier: CategoryTier;
  theme: TierThemeConfig;
  subCategory: string;
  subTags: CategoryTag[];
  isCollapsed: boolean;
  cascadeIndex: number;
  isCascadeActive: boolean;
  isExpandedColumn: boolean;
  mainCategoryTagId: string;
  selectedFacetTagIds: string[];
  tagStockMap: Record<string, TagLiveStockSummary>;
  tagClickMode: BuilderTagClickActionMode;
  onToggleSubCategory: (subKey: string) => void;
  onTagClick: (tagId: string) => void;
  onToggleFacetTag: (tagId: string) => void;
  onSelectCategory: (tagId: string, autoFillWithRecipe?: boolean) => void;
}

export const BuilderTierSubCategoryAccordion: React.FC<
  BuilderTierSubCategoryAccordionProps
> = ({
  tier,
  theme,
  subCategory,
  subTags,
  isCollapsed,
  cascadeIndex,
  isCascadeActive,
  isExpandedColumn,
  mainCategoryTagId,
  selectedFacetTagIds,
  tagStockMap,
  tagClickMode,
  onToggleSubCategory,
  onTagClick,
  onToggleFacetTag,
  onSelectCategory,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const subKey = `${tier}__${subCategory}`;
  const isUnclassified = subCategory === DEFAULT_UNCLASSIFIED_SUBCATEGORY;

  const hasPrimaryInSub = subTags.some((t) => t.id === mainCategoryTagId);
  const facetCountInSub = subTags.filter((t) =>
    selectedFacetTagIds.includes(t.id)
  ).length;

  // Cascade delay applies strictly on open when triggered via Tier header "กางทั้งหมด"
  const enterDelay =
    !prefersReducedMotion && isCascadeActive
      ? Math.min(cascadeIndex * 0.04, 0.24)
      : 0;

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isUnclassified
          ? 'bg-[#FFFDF8] border-[#E8D2AE]'
          : 'bg-white border-[#E5DED4]'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggleSubCategory(subKey)}
        aria-expanded={!isCollapsed}
        className={`w-full px-2.5 py-1.5 border-b flex items-center justify-between gap-1.5 text-left cursor-pointer transition-colors ${
          isCollapsed ? 'border-b-transparent' : ''
        } ${
          isUnclassified
            ? 'bg-[#FEF6E6] border-[#E8D2AE] hover:bg-[#FCEFD6]'
            : `${theme.subHeaderBg} ${theme.subHeaderBorder} hover:brightness-98`
        }`}
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

          {hasPrimaryInSub && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#3B6845] text-white text-[9px] font-extrabold shrink-0">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>แกนหลัก</span>
            </span>
          )}
          {facetCountInSub > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#8A5A22] text-white text-[9px] font-extrabold shrink-0">
              <Check className="w-2.5 h-2.5" />
              <span>ผสม {facetCountInSub}</span>
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
            key={`${subKey}-accordion-body`}
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
                <p className="text-[11px] text-[#8C7B6C] italic text-center py-1.5">
                  ยังไม่มีแท็กในหมวดย่อยนี้
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {subTags.map((tag) => {
                    const isPrimary = tag.id === mainCategoryTagId;
                    const isFacet = selectedFacetTagIds.includes(tag.id);
                    const stock = tagStockMap[tag.id] || {
                      total: 0,
                      usable: 0,
                      newCount: 0,
                      freshCount: 0,
                      producibleEpisodes: 0,
                    };

                    return (
                      <div
                        key={tag.id}
                        className={`group inline-flex items-stretch rounded-xl border transition-colors overflow-hidden ${
                          isPrimary
                            ? 'bg-[#EDF4ED] border-[#3B6845] ring-2 ring-[#A4C5A1]/60 shadow-2xs'
                            : isFacet
                            ? 'bg-[#FDF5E8] border-[#C99749] ring-1 ring-[#E8CFA6] shadow-2xs'
                            : 'bg-[#FAF8F5] border-[#DFD7CA] hover:bg-white hover:border-[#BAD8B9]'
                        }`}
                      >
                        {/* Main Tag Click Button */}
                        <button
                          type="button"
                          onClick={() => onTagClick(tag.id)}
                          className="px-2.5 py-1.5 text-left flex items-center gap-1.5 cursor-pointer min-w-0"
                          title={`#${tag.name} — ใหม่ ${stock.newCount} | พร้อมใช้ ${stock.usable}/${stock.total} ฟุต (${stock.producibleEpisodes} EP)`}
                        >
                          {isPrimary ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#3B6845] text-white text-[9px] font-extrabold shrink-0">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>หลัก</span>
                            </span>
                          ) : isFacet ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#8A5A22] text-white text-[9px] font-extrabold shrink-0">
                              <Check className="w-2.5 h-2.5" />
                              <span>ผสม</span>
                            </span>
                          ) : (
                            <span className="text-xs shrink-0">
                              {getEntityIcon(tag)}
                            </span>
                          )}

                          <span
                            className={`text-xs truncate ${
                              isExpandedColumn
                                ? 'max-w-[220px]'
                                : 'max-w-[130px]'
                            } ${
                              isPrimary
                                ? 'font-extrabold text-[#1E4628]'
                                : isFacet
                                ? 'font-extrabold text-[#6B4415]'
                                : 'font-semibold text-[#3D332A]'
                            }`}
                          >
                            #{tag.name}
                          </span>

                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums shrink-0 ${
                              isPrimary
                                ? 'bg-[#3B6845]/15 text-[#1E4628] font-bold'
                                : isFacet
                                ? 'bg-[#8A5A22]/15 text-[#6B4415] font-bold'
                                : stock.usable >= 5
                                ? 'bg-[#EAF5ED] text-[#245233] font-bold'
                                : 'bg-[#EFECE6] text-[#786B5C]'
                            }`}
                          >
                            {stock.usable > 0
                              ? `${stock.usable}`
                              : `${stock.total}`}
                          </span>
                        </button>

                        {/* Quick Secondary Action Button (+Facet or ★Primary) */}
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (tagClickMode === 'SET_PRIMARY') {
                                onToggleFacetTag(tag.id);
                              } else {
                                onSelectCategory(tag.id, false);
                              }
                            }}
                            className={`px-1.5 border-l flex items-center justify-center transition-colors cursor-pointer ${
                              isFacet
                                ? 'border-[#E2C699] bg-[#F8E9CE] text-[#6B4415] hover:bg-[#F2DCB3]'
                                : 'border-[#EAE2D6] bg-[#F4F0E8] text-[#6E5F52] hover:bg-[#E5EFE6] hover:text-[#244B2F]'
                            }`}
                            title={
                              tagClickMode === 'SET_PRIMARY'
                                ? isFacet
                                  ? 'เอาออกจากป้ายที่ผสม'
                                  : 'กด + เพื่อผสมแท็กนี้เพิ่ม (Cross-Tier Filter)'
                                : 'ตั้งป้ายนี้เป็นแกนหลักของตอน (Primary Series)'
                            }
                          >
                            {tagClickMode === 'SET_PRIMARY' ? (
                              isFacet ? (
                                <X className="w-3 h-3" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )
                            ) : (
                              <Star className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
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
