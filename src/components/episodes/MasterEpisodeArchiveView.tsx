import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  Search,
  Package,
  Repeat,
  TrendingUp,
  TrendingDown,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { formatThaiDate } from '../../utils/fileNameGenerator';
import { PaginationBar } from '../ui/PaginationBar';
import { TagPill } from '../ui/TagPill';

export const MasterEpisodeArchiveView: React.FC = () => {
  const {
    episodes,
    computedFootage,
    computedFootageMap,
    tags,
    tagMap,
    setSelectedEpisodeDetailId,
    setActiveTab,
    launchEpisodeBuilderForCategory,
  } = useCMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'ID_ASC' | 'NEW_MIX_DESC'>('DATE_DESC');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(false);

  // Pagination state (6 items fits a 2-column grid cleanly)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, sortBy]);

  // Helper to compute how many new vs recycled footages were used in an episode
  const getEpisodeFootageMix = (ep: (typeof episodes)[number]) => {
    let newCount = 0;
    let recycledCount = 0;
    ep.rankings.forEach((slot) => {
      const ft = slot.footageId ? computedFootageMap[slot.footageId] : null;
      const isMarkedNew =
        (slot.snapshotNote || '').includes('ใหม่') ||
        (ft && ft.totalUsageCount <= 1);
      if (isMarkedNew) {
        newCount += 1;
      } else if (slot.footageId) {
        recycledCount += 1;
      }
    });
    return { newCount, recycledCount };
  };

  // Main Category Comparison & Footage Utilization Ranking (Sorted Most -> Least Episodes)
  const categoryRanking = useMemo(() => {
    const mainTags = tags.filter((t) => t.tier === 1 || (!t.parentId && !t.tier));
    const totalEps = Math.max(1, episodes.length);

    const rows = mainTags.map((mainTag) => {
      const subTags = tags.filter((t) => t.parentId === mainTag.id);
      const familyIds = new Set([mainTag.id, ...subTags.map((s) => s.id)]);

      // Episodes in this main category
      const epsInCat = episodes.filter((ep) => ep.mainCategoryTagId === mainTag.id);
      const episodeCount = epsInCat.length;
      const episodeSharePercent =
        episodes.length > 0 ? Math.round((episodeCount / totalEps) * 100) : 0;

      // Footages belonging to this category family
      const footagesInCat = computedFootage.filter((ft) =>
        ft.tags.some((tid) => familyIds.has(tid))
      );
      const totalFootageInCat = footagesInCat.length;
      const usedFootageInCat = footagesInCat.filter((ft) => ft.totalUsageCount > 0).length;
      const untouchedFootageInCat = footagesInCat.filter(
        (ft) => ft.cooldownStatus === 'NEW_UNTOUCHED'
      ).length;
      const usableFootageInCat = footagesInCat.filter(
        (ft) =>
          ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH'
      ).length;

      const utilizationPercent =
        totalFootageInCat > 0
          ? Math.round((usedFootageInCat / totalFootageInCat) * 100)
          : 0;

      return {
        mainTag,
        episodeCount,
        episodeSharePercent,
        totalFootageInCat,
        usedFootageInCat,
        untouchedFootageInCat,
        usableFootageInCat,
        utilizationPercent,
      };
    });

    return rows.sort((a, b) => {
      if (b.episodeCount !== a.episodeCount) return b.episodeCount - a.episodeCount;
      if (b.utilizationPercent !== a.utilizationPercent) {
        return b.utilizationPercent - a.utilizationPercent;
      }
      return b.totalFootageInCat - a.totalFootageInCat;
    });
  }, [tags, episodes, computedFootage]);

  const maxEpisodesInAnyCategory = useMemo(() => {
    return Math.max(1, ...categoryRanking.map((r) => r.episodeCount));
  }, [categoryRanking]);

  // Real Utilization & Overview Metrics
  const overviewMetrics = useMemo(() => {
    const totalEpisodes = episodes.length;
    const totalFootage = computedFootage.length;
    const usedFootage = computedFootage.filter((f) => f.totalUsageCount > 0).length;
    const untouchedFootage = computedFootage.filter(
      (f) => f.cooldownStatus === 'NEW_UNTOUCHED'
    ).length;
    const reusedMoreThanOnce = computedFootage.filter((f) => f.totalUsageCount >= 2).length;
    const utilizationRate =
      totalFootage > 0 ? Math.round((usedFootage / totalFootage) * 100) : 0;

    const topCategory = categoryRanking[0] || null;
    const leastCategory =
      categoryRanking.length > 0 ? categoryRanking[categoryRanking.length - 1] : null;

    return {
      totalEpisodes,
      totalFootage,
      usedFootage,
      untouchedFootage,
      reusedMoreThanOnce,
      utilizationRate,
      topCategory,
      leastCategory,
    };
  }, [episodes.length, computedFootage, categoryRanking]);

  const sortedEpisodes = useMemo(() => {
    return [...episodes]
      .filter((ep) => {
        if (categoryFilter !== 'ALL' && ep.mainCategoryTagId !== categoryFilter) {
          return false;
        }
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const inId = ep.id.toLowerCase().includes(q);
          const inTitle = ep.title.toLowerCase().includes(q);
          const inMasterFile = ep.masterVideoInfo.masterFileName.toLowerCase().includes(q);
          const inFootage = ep.rankings.some((r) =>
            (r.footageId || '').toLowerCase().includes(q)
          );
          if (!inId && !inTitle && !inMasterFile && !inFootage) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'ID_ASC') {
          return a.id.localeCompare(b.id);
        }
        if (sortBy === 'NEW_MIX_DESC') {
          const mixA = getEpisodeFootageMix(a).newCount;
          const mixB = getEpisodeFootageMix(b).newCount;
          if (mixB !== mixA) return mixB - mixA;
        }
        if (a.publishDate !== b.publishDate) return b.publishDate.localeCompare(a.publishDate);
        return b.publishSlot.localeCompare(a.publishSlot);
      });
  }, [episodes, categoryFilter, searchQuery, sortBy, computedFootageMap]);

  const paginatedEpisodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEpisodes.slice(start, start + pageSize);
  }, [sortedEpisodes, currentPage, pageSize]);

  const hasActiveFilters = searchQuery.trim() !== '' || categoryFilter !== 'ALL';

  return (
    <div className="space-y-5">
      {/* =====================================================================
          1. HEADER & REAL FOOTAGE UTILIZATION OVERVIEW (LIGHT & BRIGHT THEME)
         ===================================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>ภาพรวมคลังคลิปหลัก & ความคุ้มค่าการใช้ฟุตเทจ (Master Archive Overview)</span>
            </h1>
            <p className="text-xs text-slate-500">
              เปรียบเทียบสัดส่วนการผลิตคลิปหลักแต่ละหมวดหมู่จากมากไปน้อย พร้อมตรวจสอบว่าฟุตเทจในคลังถูกหยิบมาใช้งานอย่างคุ้มค่าแล้วหรือยัง
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('EPISODE_BUILDER')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>จัดชุดคลิป 5 อันดับใหม่</span>
          </button>
        </div>

        {/* 4 Bright Utilization & Category Balance KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Card 1: Total Episodes */}
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-indigo-50/90 text-indigo-950 border-indigo-400 ring-1 ring-indigo-300 shadow-2xs'
                : 'bg-slate-50/70 hover:bg-indigo-50/40 border-slate-200/90 text-slate-900'
            }`}
          >
            <div className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>คลิปหลักทั้งหมดในคลัง</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-mono font-extrabold tabular-nums text-slate-900">
                {overviewMetrics.totalEpisodes}
                <span className="text-xs font-sans font-bold text-slate-500 ml-1">ตอน</span>
              </span>
              <span className="text-[11px] font-mono text-slate-600">
                รวม {overviewMetrics.totalEpisodes * 5} ช็อตอันดับ
              </span>
            </div>
          </button>

          {/* Card 2: Footage Utilization Rate */}
          <div className="p-4 rounded-xl border border-emerald-200/90 bg-emerald-50/60 text-slate-900">
            <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-emerald-600" />
              <span>อัตราหยิบฟุตเทจมาใช้งานจริง</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-mono font-extrabold tabular-nums text-emerald-700">
                {overviewMetrics.utilizationRate}%
              </span>
              <span className="text-[11px] font-mono text-emerald-800">
                ใช้แล้ว {overviewMetrics.usedFootage}/{overviewMetrics.totalFootage} ฟุต (วนซ้ำ{' '}
                {overviewMetrics.reusedMoreThanOnce})
              </span>
            </div>
          </div>

          {/* Card 3: Most Produced Category */}
          {overviewMetrics.topCategory && (
            <button
              type="button"
              onClick={() =>
                setCategoryFilter(
                  categoryFilter === overviewMetrics.topCategory!.mainTag.id
                    ? 'ALL'
                    : overviewMetrics.topCategory!.mainTag.id
                )
              }
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === overviewMetrics.topCategory.mainTag.id
                  ? 'bg-sky-100/90 text-sky-950 border-sky-400 ring-1 ring-sky-300 shadow-2xs'
                  : 'bg-sky-50/60 hover:bg-sky-100/60 border-sky-200/90 text-slate-900'
              }`}
            >
              <div className="text-xs font-semibold text-sky-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                <span>หมวดหมู่ที่ผลิตมากที่สุด</span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  #{overviewMetrics.topCategory.mainTag.name}
                </span>
                <span className="text-xs font-mono font-extrabold tabular-nums text-sky-800 shrink-0">
                  {overviewMetrics.topCategory.episodeCount} EP (
                  {overviewMetrics.topCategory.episodeSharePercent}%)
                </span>
              </div>
            </button>
          )}

          {/* Card 4: Least Produced Category */}
          {overviewMetrics.leastCategory && (
            <button
              type="button"
              onClick={() =>
                setCategoryFilter(
                  categoryFilter === overviewMetrics.leastCategory!.mainTag.id
                    ? 'ALL'
                    : overviewMetrics.leastCategory!.mainTag.id
                )
              }
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === overviewMetrics.leastCategory.mainTag.id
                  ? 'bg-amber-100/90 text-amber-950 border-amber-400 ring-1 ring-amber-300 shadow-2xs'
                  : 'bg-amber-50/60 hover:bg-amber-100/60 border-amber-200/90 text-slate-900'
              }`}
            >
              <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                <span>หมวดหมู่ที่ผลิตน้อยที่สุด (น่าปั้นเพิ่ม)</span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  #{overviewMetrics.leastCategory.mainTag.name}
                </span>
                <span className="text-xs font-mono font-extrabold tabular-nums text-amber-900 shrink-0">
                  {overviewMetrics.leastCategory.episodeCount} EP · ว่าง{' '}
                  {overviewMetrics.leastCategory.usableFootageInCat} ฟุต
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          2. CATEGORY COMPARISON BARS (DEFAULT COLLAPSED WITH FRAMER MOTION)
         ===================================================================== */}
      <div className="bg-white border border-indigo-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div
          onClick={() => setIsComparisonExpanded((prev) => !prev)}
          className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/60 hover:from-indigo-50/95 hover:to-emerald-50/85 transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs"
            >
              <BarChart3 className="w-4 h-4" />
            </motion.div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                เปรียบเทียบสัดส่วนหมวดหมู่จากมากไปน้อย & อัตราความคุ้มค่าการใช้ฟุตเทจ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isComparisonExpanded
                  ? 'คลิกที่แถวหมวดหมู่เพื่อกรองดูเฉพาะคลิปหลักในหมวดนั้น หรือกดปุ่ม "+ จัดเพิ่ม" เพื่อนำฟุตเทจที่ว่างไปสร้างตอนใหม่'
                  : 'พับเก็บอยู่ · คลิกเพื่อกางดูกราฟเปรียบเทียบสัดส่วนหมวดหมู่และอัตราการใช้ฟุตเทจ'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {categoryFilter !== 'ALL' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryFilter('ALL');
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>แสดงทุกหมวดหมู่ ({episodes.length} ตอน)</span>
              </button>
            )}

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsComparisonExpanded((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isComparisonExpanded
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <span>{isComparisonExpanded ? 'พับเก็บตารางเปรียบเทียบ' : 'กางดูกราฟเปรียบเทียบหมวดหมู่'}</span>
              <motion.span
                animate={{ rotate: isComparisonExpanded ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="inline-flex"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isComparisonExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-200/80 p-4 sm:p-5 space-y-2.5 bg-white">
              {categoryRanking.map((row, idx) => {
                const isSelected = categoryFilter === row.mainTag.id;
                const barWidthPercent = Math.max(
                  6,
                  Math.round((row.episodeCount / maxEpisodesInAnyCategory) * 100)
                );
                const isTop = idx === 0 && row.episodeCount > 0;
                const isLeast =
                  idx === categoryRanking.length - 1 && categoryRanking.length > 1;

                return (
                  <motion.div
                    key={row.mainTag.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    whileHover={{ y: -1 }}
                    onClick={() =>
                      setCategoryFilter(isSelected ? 'ALL' : row.mainTag.id)
                    }
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-300 shadow-2xs'
                        : 'bg-slate-50/50 hover:bg-white hover:border-indigo-200 border-slate-200/80'
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                      {/* Col 1-3: Rank + Category Name */}
                      <div className="lg:col-span-3 flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : isTop
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                              #{row.mainTag.name}
                            </span>
                            {isTop && (
                              <span className="text-[10px] font-bold text-sky-700 shrink-0">
                                · มากสุด
                              </span>
                            )}
                            {isLeast && (
                              <span className="text-[10px] font-bold text-amber-700 shrink-0">
                                · น้อยสุด
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Col 4-8: Horizontal Comparison Bar (Episode Count & Share) */}
                      <div className="lg:col-span-5 space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className="font-bold text-slate-900">
                            ผลิตแล้ว {row.episodeCount} ตอน
                          </span>
                          <span className="text-slate-500">
                            สัดส่วน {row.episodeSharePercent}% ของคลังคลิปหลัก
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: row.episodeCount === 0 ? '0%' : `${barWidthPercent}%`,
                            }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              isSelected
                                ? 'bg-indigo-600'
                                : isTop
                                ? 'bg-sky-500'
                                : 'bg-indigo-400'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Col 9-12: Footage Utilization Efficiency in this Category + Quick Action */}
                      <div className="lg:col-span-4 flex items-center justify-between gap-3 pl-0 lg:pl-3 lg:border-l lg:border-slate-200/80">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                            <span className="text-slate-600">
                              อัตราใช้ฟุต:{' '}
                              <strong className="text-emerald-700">
                                {row.utilizationPercent}%
                              </strong>{' '}
                              ({row.usedFootageInCat}/{row.totalFootageInCat} ฟุต)
                            </span>
                            <span className="text-sky-700 font-bold">
                              ว่างพร้อมใช้ {row.usableFootageInCat}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${row.utilizationPercent}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            launchEpisodeBuilderForCategory(
                              row.mainTag.id,
                              row.untouchedFootageInCat >= 5
                                ? 'FORMULA_ALL_NEW'
                                : 'FORMULA_2_NEW_3_FRESH'
                            );
                          }}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title={`นำฟุตเทจหมวด #${row.mainTag.name} ไปจัดชุด 5 อันดับ`}
                        >
                          + จัดเพิ่ม
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =====================================================================
          3. STREAMLINED SEARCH & FILTER BAR (BRIGHT THEME, NO STATUS/VIEWS)
         ===================================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหารหัส EP-XXXX, ชื่อคลิป หรือรหัสฟุตเทจ FT-XXXX ที่ใช้ในตอน..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">หมวดหมู่หลัก: ทุกหมวด ({episodes.length} ตอน)</option>
            {categoryRanking.map((item) => (
              <option key={item.mainTag.id} value={item.mainTag.id}>
                #{item.mainTag.name} ({item.episodeCount} ตอน)
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="DATE_DESC">เรียง: วันที่สร้างล่าสุด</option>
            <option value="NEW_MIX_DESC">เรียง: สัดส่วนฟุตใหม่มากสุด</option>
            <option value="ID_ASC">เรียง: รหัส EP-XXXX</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
              }}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          4. VIEW MODE BAR & CLEAN EPISODE LIST (FOCUSED ON FOOTAGE MIX)
         ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-600">
          แสดงรายการคลิปหลัก{' '}
          <span className="font-mono font-bold text-slate-900">
            {sortedEpisodes.length}
          </span>{' '}
          จากทั้งหมด{' '}
          <span className="font-mono font-bold text-slate-900">
            {episodes.length}
          </span>{' '}
          ตอน (คลิกที่รายการเพื่อดูส่วนผสมฟุตเทจทั้ง 5 อันดับ)
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('CARDS')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'CARDS'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>การ์ดย่อ</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('TABLE')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'TABLE'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>ตารางมาตรฐาน</span>
          </button>
        </div>
      </div>

      {/* Content View */}
      {sortedEpisodes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <p className="text-sm font-bold text-slate-900">
            ไม่พบคลิปหลักที่ตรงกับเงื่อนไขการค้นหา
          </p>
        </div>
      ) : viewMode === 'CARDS' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedEpisodes.map((ep) => {
              const mix = getEpisodeFootageMix(ep);
              return (
                <div
                  key={ep.id}
                  onClick={() => setSelectedEpisodeDetailId(ep.id)}
                  className="group bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-3.5"
                >
                  <div className="space-y-2">
                    {/* Top Row: ID + Date + Footage Mix Ratio */}
                    <div className="flex items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="font-bold text-indigo-700">{ep.id}</span>
                        <span>·</span>
                        <span>{formatThaiDate(ep.publishDate)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600">
                        <span className="inline-flex items-center gap-1 text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          <Sparkles className="w-3 h-3 text-sky-600" />
                          <span>ใหม่ {mix.newCount}</span>
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>วนใช้ {mix.recycledCount}</span>
                        </span>
                      </div>
                    </div>

                    {/* Episode Title */}
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                      {ep.title}
                    </h2>
                  </div>

                  {/* Bottom Row: Category + Open 5 Footages */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <TagPill tag={tagMap[ep.mainCategoryTagId]} />
                      {ep.targetSubcategoryId && tagMap[ep.targetSubcategoryId] && (
                        <TagPill tag={tagMap[ep.targetSubcategoryId]} />
                      )}
                    </div>

                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors shrink-0">
                      <span>ดูฟุตเทจทั้ง 5 อันดับ</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalItems={sortedEpisodes.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[6, 12, 18, 24]}
            itemLabel="EP"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-28">รหัส EP</th>
                    <th className="py-3 px-4">ชื่อคลิปหลัก</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4 w-48">สัดส่วนการใช้ฟุตเทจ</th>
                    <th className="py-3 px-4 w-36">วันที่สร้าง</th>
                    <th className="py-3 px-4 w-32 text-right">ฟุตเทจ 5 อันดับ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedEpisodes.map((ep) => {
                    const mix = getEpisodeFootageMix(ep);
                    return (
                      <tr
                        key={ep.id}
                        onClick={() => setSelectedEpisodeDetailId(ep.id)}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap tabular-nums">
                          {ep.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-700">
                            {ep.title}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            <TagPill tag={tagMap[ep.mainCategoryTagId]} />
                            {ep.targetSubcategoryId &&
                              tagMap[ep.targetSubcategoryId] && (
                                <TagPill tag={tagMap[ep.targetSubcategoryId]} />
                              )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-xs">
                            <Sparkles className="w-3 h-3 text-sky-600" />
                            <span>ใหม่ {mix.newCount}</span>
                          </span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>วนใช้ {mix.recycledCount}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {formatThaiDate(ep.publishDate)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-800">
                            <span>ดู 5 อันดับ</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalItems={sortedEpisodes.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 30, 50]}
            itemLabel="EP"
          />
        </div>
      )}
    </div>
  );
};
