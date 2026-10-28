import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Folder, FolderOpen, Layers, Rocket, RotateCcw } from 'lucide-react';
import { isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import { MixRecipeId } from '../../../utils/collisionDetector';
import { TagPill } from '../../ui/TagPill';
import {
  CategoryGroupOverviewItem,
  MainCategoryOverviewItem,
} from './vault.types';

export interface VaultThreeTierExplorerProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  categoryGroupsOverview: CategoryGroupOverviewItem[];
  mainCategoriesCount: number;
  selectedGroupId: string | null;
  selectedTagFilter: string[];
  activeGroupOverview: CategoryGroupOverviewItem | null;
  activeMainCategory: MainCategoryOverviewItem | null;
  hasHierarchySelection: boolean;
  computedFootage: ComputedFootage[];
  onSelectGroup: (groupId: string) => void;
  onSelectMainCategory: (mainTagId: string) => void;
  onSelectSubcategory: (subTagId: string, mainTagId: string) => void;
  onClearMainCategoryFilter: () => void;
  onSelectAllInMainCategory: (mainTagId: string) => void;
  onClearHierarchySelection: () => void;
  onOpenThreeTierManager: () => void;
  onLaunchEpisodeBuilder: (categoryId: string, formula: MixRecipeId) => void;
}

export const VaultThreeTierExplorer: React.FC<VaultThreeTierExplorerProps> = ({
  isExpanded,
  onToggleExpand,
  categoryGroupsOverview,
  mainCategoriesCount,
  selectedGroupId,
  selectedTagFilter,
  activeGroupOverview,
  activeMainCategory,
  hasHierarchySelection,
  computedFootage,
  onSelectGroup,
  onSelectMainCategory,
  onSelectSubcategory,
  onClearMainCategoryFilter,
  onSelectAllInMainCategory,
  onClearHierarchySelection,
  onOpenThreeTierManager,
  onLaunchEpisodeBuilder,
}) => {
  return (
    <div className="bg-white border border-indigo-200/80 rounded-2xl shadow-2xs overflow-hidden">
      <div
        onClick={onToggleExpand}
        className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/60 hover:from-indigo-50/95 hover:to-sky-50/90 transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>
                สำรวจตามลำดับขั้น: กลุ่มหมวดหมู่ ({categoryGroupsOverview.length} กลุ่ม) ➔ หมวดหลัก ({mainCategoriesCount} หมวด)
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              คลิกเลือกกลุ่มหมวดหมู่ก่อน เพื่อกางดูหมวดหมู่หลักและหมวดหมู่ย่อยตามลำดับ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {hasHierarchySelection && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearHierarchySelection();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างกลุ่ม/หมวดที่เลือก</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isExpanded
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            <span>{isExpanded ? 'พับเก็บแผงสำรวจ' : 'กางแผงสำรวจหมวดหมู่'}</span>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden p-0 m-0 border-none"
          >
            <div className="border-t border-slate-200/80 p-4 sm:p-5 space-y-4 bg-white">
              {/* =================================================================
                  STAGE 1 (Always Visible): Category Group Cards (Cluster Groups)
                 ================================================================= */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-mono font-bold flex items-center justify-center">
                      1
                    </span>
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      ขั้นที่ 1 — เลือกกลุ่มหมวดหมู่ (คลิกการ์ดกลุ่มเพื่อกรองคลิปและกางหมวดหมู่หลัก):
                    </span>
                  </span>
                  {activeGroupOverview && (
                    <span className="text-xs font-semibold text-indigo-700">
                      กำลังเลือกกลุ่ม: {activeGroupOverview.group.icon}{' '}
                      {activeGroupOverview.group.name}
                    </span>
                  )}
                </div>

                {categoryGroupsOverview.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      ยังไม่มีกลุ่มหมวดหมู่ในระบบ สามารถสร้างโครงสร้างกลุ่มและหมวดหมู่ได้ทันที
                    </p>
                    <button
                      type="button"
                      onClick={onOpenThreeTierManager}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      + จัดการหมวดหมู่ 3 ชั้น
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {categoryGroupsOverview.map((groupItem) => {
                      const isGroupSelected = selectedGroupId === groupItem.group.id;

                      return (
                        <motion.button
                          key={groupItem.group.id}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                          onClick={() => onSelectGroup(groupItem.group.id)}
                          className={`relative text-left p-3.5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-2.5 overflow-hidden ${
                            isGroupSelected
                              ? 'text-white border-indigo-600 ring-4 ring-indigo-500/20 shadow-sm'
                              : 'bg-slate-50/80 hover:bg-indigo-50/40 hover:border-indigo-300 border-slate-200/90 text-slate-900'
                          }`}
                        >
                          {isGroupSelected && (
                            <motion.span
                              layoutId="vault-active-group-bg"
                              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                              className="absolute inset-0 bg-indigo-600 z-0"
                            />
                          )}
                          <div className="relative z-10 flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {!groupItem.group.icon || groupItem.group.icon === '📁' ? (
                                <Folder className="w-4 h-4 shrink-0 opacity-80" />
                              ) : (
                                <span className="text-base shrink-0">
                                  {groupItem.group.icon}
                                </span>
                              )}
                              <span className="text-xs sm:text-sm font-bold truncate">
                                {groupItem.group.name}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 tabular-nums ${
                                isGroupSelected
                                  ? 'bg-indigo-800 text-indigo-100'
                                  : 'bg-slate-200/80 text-slate-700'
                              }`}
                            >
                              {groupItem.mainCatCount} หมวดหลัก
                            </span>
                          </div>

                          <div
                            className={`relative z-10 flex items-baseline justify-between pt-2 border-t text-xs font-mono tabular-nums ${
                              isGroupSelected
                                ? 'border-indigo-500/60 text-indigo-100'
                                : 'border-slate-200/80 text-slate-500'
                            }`}
                          >
                            <span>รวม {groupItem.totalCount} คลิป</span>
                            <span
                              className={`font-bold ${
                                isGroupSelected
                                  ? 'text-emerald-300'
                                  : groupItem.usableCount > 0
                                  ? 'text-emerald-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              พร้อมใช้ {groupItem.usableCount}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* =================================================================
                  STAGE 2 (Framer Motion Progressive Reveal): Main Categories under Selected Group
                 ================================================================= */}
              <AnimatePresence initial={false}>
                {activeGroupOverview && (
                  <motion.div
                    key="vault-tier2-main-cats"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden p-0 m-0 border-none"
                  >
                    <div className="pt-3 border-t border-slate-200/80 space-y-2.5 bg-sky-50/40 p-3.5 rounded-xl border border-sky-200/80">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] font-mono font-bold flex items-center justify-center">
                            2
                          </span>
                          <span>
                            ขั้นที่ 2 — เลือกหมวดหมู่หลักในกลุ่ม{' '}
                            <span className="text-sky-800 font-bold">
                              {activeGroupOverview.group.icon}{' '}
                              {activeGroupOverview.group.name}
                            </span>
                            :
                          </span>
                        </span>

                        {activeMainCategory && (
                          <button
                            type="button"
                            onClick={onClearMainCategoryFilter}
                            className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                          >
                            ดูทุกหมวดหลักในกลุ่มนี้ ({activeGroupOverview.totalCount} คลิป)
                          </button>
                        )}
                      </div>

                      {activeGroupOverview.mainCategories.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-200">
                          ยังไม่มีหมวดหมู่หลักในกลุ่มนี้
                        </div>
                      ) : (
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.div
                            key={`maincats-grid-${activeGroupOverview.group.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5"
                          >
                            {activeGroupOverview.mainCategories.map((item, idx) => {
                              const isSelected =
                                activeMainCategory?.mainTag.id === item.mainTag.id;
                              const isStaging = isStagingTagId(item.mainTag.id);
                              const isReady5 = !isStaging && item.usableCount >= 5;

                              return (
                                <motion.button
                                  key={item.mainTag.id}
                                  type="button"
                                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 420,
                                    damping: 28,
                                    delay: idx * 0.03,
                                  }}
                                  whileHover={{ y: -1.5 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => onSelectMainCategory(item.mainTag.id)}
                                  className={`relative text-left p-3 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 overflow-hidden ${
                                    isSelected
                                      ? 'text-white border-sky-600 ring-3 ring-sky-400/30 shadow-xs'
                                      : 'bg-white hover:bg-sky-50/50 hover:border-sky-300 border-slate-200/90 text-slate-900'
                                  }`}
                                >
                                  {isSelected && (
                                    <motion.span
                                      layoutId="vault-active-maincat-bg"
                                      transition={{
                                        type: 'spring',
                                        stiffness: 420,
                                        damping: 32,
                                      }}
                                      className="absolute inset-0 bg-sky-600 z-0"
                                    />
                                  )}
                                  <div className="relative z-10 flex items-start justify-between gap-1.5">
                                    <span className="text-xs sm:text-sm font-bold leading-snug line-clamp-1">
                                      {item.mainTag.name}
                                    </span>
                                    {isStaging ? (
                                      <span
                                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                          isSelected
                                            ? 'bg-amber-300 text-slate-950'
                                            : 'bg-amber-100 text-amber-900'
                                        }`}
                                      >
                                        ไม่นับโควตา EP
                                      </span>
                                    ) : (
                                      isReady5 && (
                                        <span
                                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 tabular-nums ${
                                            isSelected
                                              ? 'bg-emerald-400 text-slate-950'
                                              : 'bg-emerald-100 text-emerald-800'
                                          }`}
                                        >
                                          {item.producibleEpisodes} EP
                                        </span>
                                      )
                                    )}
                                  </div>

                                  <div
                                    className={`relative z-10 flex items-baseline justify-between pt-1.5 border-t text-xs font-mono tabular-nums ${
                                      isSelected
                                        ? 'border-sky-500/60 text-sky-100'
                                        : 'border-slate-100 text-slate-500'
                                    }`}
                                  >
                                    <span>รวม {item.totalCount} คลิป</span>
                                    <span
                                      className={`font-bold ${
                                        isSelected
                                          ? 'text-emerald-300'
                                          : isReady5
                                          ? 'text-emerald-700'
                                          : 'text-slate-600'
                                      }`}
                                    >
                                      พร้อมใช้ {item.usableCount}
                                    </span>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* =================================================================
                  STAGE 3 (Framer Motion Progressive Reveal): Subcategory Drill-down Drawer
                 ================================================================= */}
              <AnimatePresence initial={false}>
                {activeMainCategory && (
                  <motion.div
                    key="vault-tier3-subcats"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden p-0 m-0 border-none"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-mono font-bold flex items-center justify-center">
                            3
                          </span>
                          <span className="text-xs font-bold text-emerald-950">
                            ขั้นที่ 3 — เลือกหมวดหมู่ย่อย / บุคคลใน #{activeMainCategory.mainTag.name}:
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <motion.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() =>
                              onSelectAllInMainCategory(activeMainCategory.mainTag.id)
                            }
                            className={`relative px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer overflow-hidden ${
                              selectedTagFilter.length === 1 &&
                              selectedTagFilter[0] === activeMainCategory.mainTag.id
                                ? 'text-white border-indigo-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            {selectedTagFilter.length === 1 &&
                              selectedTagFilter[0] === activeMainCategory.mainTag.id && (
                                <motion.span
                                  layoutId="vault-active-subcat-pill"
                                  transition={{
                                    type: 'spring',
                                    stiffness: 420,
                                    damping: 32,
                                  }}
                                  className="absolute inset-0 bg-indigo-600 rounded-[7px] z-0"
                                />
                              )}
                            <span className="relative z-10">
                              ทั้งหมดในหมวด ({activeMainCategory.totalCount})
                            </span>
                          </motion.button>

                          {activeMainCategory.subTags.map((sub) => {
                            const subCount = computedFootage.filter((ft) =>
                              ft.tags.includes(sub.id)
                            ).length;
                            const isSubSelected = selectedTagFilter.includes(sub.id);

                            return (
                              <TagPill
                                key={sub.id}
                                tag={sub}
                                selected={isSubSelected}
                                activeLayoutId="vault-active-subcat-pill"
                                onClick={() =>
                                  onSelectSubcategory(
                                    sub.id,
                                    activeMainCategory.mainTag.id
                                  )
                                }
                                count={subCount}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {isStagingTagId(activeMainCategory.mainTag.id) ? (
                        <span className="inline-flex items-center px-3 py-2 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-xl whitespace-nowrap shrink-0">
                          คลิกที่การ์ดคลิปเพื่อจัดเข้าหมวดหมู่จริงก่อนนำไปสร้าง EP
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onLaunchEpisodeBuilder(
                              activeMainCategory.mainTag.id,
                              activeMainCategory.newCount >= 5
                                ? 'FORMULA_ALL_NEW'
                                : 'FORMULA_2_NEW_3_FRESH'
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Rocket className="w-3.5 h-3.5 text-white" />
                          <span>นำหมวดนี้ไปจัด 5 อันดับ →</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
