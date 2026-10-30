import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  Package,
  Repeat,
  TrendingUp,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  Film,
  Layers,
  ArrowRight,
  Plus,
  Tag,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { isStagingGroupId } from '../../services/seedData';
import { formatThaiDate } from '../../utils/fileNameGenerator';
import { PaginationBar } from '../ui/PaginationBar';
import { TagPill } from '../ui/TagPill';
import { EpisodeWorkflowStage } from '../../types/episode.types';
import { CategoryTag } from '../../types/tag.types';

export const MasterEpisodeArchiveView: React.FC = () => {
  const {
    episodes,
    computedFootage,
    computedFootageMap,
    tags,
    tagMap,
    categoryGroups,
    categoryGroupMap,
    setSelectedEpisodeDetailId,
    launchEpisodeBuilderForCategory,
  } = useCMS();

  const [archiveTab, setArchiveTab] = useState<'EPISODES' | 'SERIES_SHELF'>('EPISODES');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [workflowFilter, setWorkflowFilter] = useState<'ALL' | EpisodeWorkflowStage>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'ID_ASC' | 'NEW_MIX_DESC'>('DATE_DESC');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(false);

  // Pagination state (6 items fits a 2-column grid cleanly)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, selectedGroupId, workflowFilter, sortBy, archiveTab]);

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

  // Resolve Tier 0 Group ID for any tag
  const resolveTagGroupId = (tag: CategoryTag | undefined): string => {
    if (!tag) return categoryGroups[0]?.id || 'GRP-PERSON';
    if (tag.groupId && categoryGroupMap[tag.groupId]) return tag.groupId;
    if (tag.parentId && tagMap[tag.parentId]?.groupId) return tagMap[tag.parentId]!.groupId!;
    const fallback = `GRP-${tag.groupType || 'GENERAL'}`;
    if (categoryGroupMap[fallback]) return fallback;
    return categoryGroups[0]?.id || 'GRP-PERSON';
  };

  // Categories belonging to currently selected Tier 0 Group
  const categoriesInGroup = useMemo(() => {
    if (selectedGroupId === 'ALL') return categoryRanking;
    return categoryRanking.filter((item) => resolveTagGroupId(item.mainTag) === selectedGroupId);
  }, [categoryRanking, selectedGroupId, categoryGroupMap, tagMap]);

  const sortedEpisodes = useMemo(() => {
    return [...episodes]
      .filter((ep) => {
        if (selectedGroupId !== 'ALL') {
          const t = tagMap[ep.mainCategoryTagId];
          if (resolveTagGroupId(t) !== selectedGroupId) return false;
        }
        if (categoryFilter !== 'ALL') {
          const inMain = ep.mainCategoryTagId === categoryFilter;
          const inSub = ep.targetSubcategoryId === categoryFilter;
          const inSeries = ep.seriesId === categoryFilter;
          if (!inMain && !inSub && !inSeries) return false;
        }
        if (workflowFilter !== 'ALL' && ep.workflowStage !== workflowFilter) {
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
          const catName = (tagMap[ep.mainCategoryTagId]?.name || '').toLowerCase();
          const subName = ep.targetSubcategoryId ? (tagMap[ep.targetSubcategoryId]?.name || '').toLowerCase() : '';
          const inCategory = catName.includes(q) || subName.includes(q);
          const epNoStr = `ep.${ep.categoryEpisodeNo || ''}`.toLowerCase();
          const epNoStr2 = `ep ${ep.categoryEpisodeNo || ''}`.toLowerCase();
          const inEpNo = (Boolean(ep.categoryEpisodeNo) && (epNoStr.includes(q) || epNoStr2.includes(q)));
          if (!inId && !inTitle && !inMasterFile && !inFootage && !inCategory && !inEpNo) return false;
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
  }, [episodes, selectedGroupId, categoryFilter, workflowFilter, searchQuery, sortBy, tagMap, computedFootageMap]);

  const paginatedEpisodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEpisodes.slice(start, start + pageSize);
  }, [sortedEpisodes, currentPage, pageSize]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'ALL' ||
    selectedGroupId !== 'ALL' ||
    workflowFilter !== 'ALL';

  return (
    <div className="space-y-4">
      {/* =====================================================================
          1. HEADER & 4 CONCISE KPI CARDS (LIGHT PASTEL THEME WITH TOOLTIPS)
         ===================================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>คลังคลิปหลัก (Master Archive)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ประวัติคลิปหลักที่จัดทำเสร็จ และอัตราการหยิบฟุตเทจมาใช้งานจริง
            </p>
          </div>

          {/* Dual View Mode Switcher: รายตอน vs คลังชั้นวางซีรีส์ */}
          <div className="flex items-center gap-1 p-1 bg-amber-50/80 border border-amber-200/80 rounded-xl self-start sm:self-auto shadow-2xs">
            <button
              type="button"
              onClick={() => setArchiveTab('EPISODES')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                archiveTab === 'EPISODES'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-amber-100/50'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>มุมมองรายตอน ({sortedEpisodes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setArchiveTab('SERIES_SHELF')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                archiveTab === 'SERIES_SHELF'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-amber-100/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>คลังชั้นวางซีรีส์ ({categoryRanking.length})</span>
            </button>
          </div>
        </div>

        {/* 4 Concise KPI Cards with Distinct Color Tints & Tooltips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Episodes */}
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            title="จำนวนคลิปหลักที่จัดทำเสร็จทั้งหมดในระบบ (คลิกเพื่อแสดงทุกหมวดหมู่)"
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-indigo-50/90 text-indigo-950 border-indigo-400 ring-1 ring-indigo-300 shadow-2xs'
                : 'bg-slate-50/70 hover:bg-indigo-50/40 border-slate-200/90 text-slate-900'
            }`}
          >
            <div className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>คลังทั้งหมด</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-mono font-extrabold tabular-nums text-slate-900">
                {overviewMetrics.totalEpisodes}
                <span className="text-xs font-sans font-bold text-slate-500 ml-1">ตอน</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                รวม {overviewMetrics.totalEpisodes * 5} ช็อต
              </span>
            </div>
          </button>

          {/* Card 2: Footage Utilization Rate */}
          <div
            title="สัดส่วนฟุตเทจในคลังที่ถูกนำมาผลิตคลิปหลักแล้วอย่างน้อย 1 ครั้ง"
            className="p-3.5 rounded-xl border border-emerald-200/90 bg-emerald-50/60 text-slate-900 cursor-default"
          >
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>อัตราการใช้ฟุต</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-mono font-extrabold tabular-nums text-emerald-700">
                {overviewMetrics.utilizationRate}%
              </span>
              <span className="text-[11px] font-mono text-emerald-800">
                ใช้แล้ว {overviewMetrics.usedFootage}/{overviewMetrics.totalFootage} ฟุต (ซ้ำ {overviewMetrics.reusedMoreThanOnce})
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
              title={`หมวดหมู่ที่มีการผลิตคลิปหลักมากที่สุดในคลัง: #${overviewMetrics.topCategory.mainTag.name} (คลิกเพื่อกรอง)`}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === overviewMetrics.topCategory.mainTag.id
                  ? 'bg-sky-100/90 text-sky-950 border-sky-400 ring-1 ring-sky-300 shadow-2xs'
                  : 'bg-sky-50/60 hover:bg-sky-100/60 border-sky-200/90 text-slate-900'
              }`}
            >
              <div className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>ผลิตสูงสุด</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900 truncate">
                  #{overviewMetrics.topCategory.mainTag.name}
                </span>
                <span className="text-xs font-mono font-extrabold tabular-nums text-sky-800 shrink-0">
                  {overviewMetrics.topCategory.episodeCount} EP ({overviewMetrics.topCategory.episodeSharePercent}%)
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
              title={`หมวดที่ผลิตน้อยที่สุด: #${overviewMetrics.leastCategory.mainTag.name} (แนะนำจัดทำเพิ่มจากฟุตเทจที่ยังว่าง ${overviewMetrics.leastCategory.usableFootageInCat} ฟุต)`}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === overviewMetrics.leastCategory.mainTag.id
                  ? 'bg-amber-100/90 text-amber-950 border-amber-400 ring-1 ring-amber-300 shadow-2xs'
                  : 'bg-amber-50/60 hover:bg-amber-100/60 border-amber-200/90 text-slate-900'
              }`}
            >
              <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>ผลิตน้อยสุด</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900 truncate">
                  #{overviewMetrics.leastCategory.mainTag.name}
                </span>
                <span className="text-xs font-mono font-extrabold tabular-nums text-amber-900 shrink-0">
                  {overviewMetrics.leastCategory.episodeCount} EP · ว่าง {overviewMetrics.leastCategory.usableFootageInCat}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          2. CATEGORY COMPARISON BARS (COLLAPSIBLE DRAWER WITH CONCISE COPY)
         ===================================================================== */}
      <div className="bg-white border border-indigo-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div
          onClick={() => setIsComparisonExpanded((prev) => !prev)}
          className="p-3.5 sm:p-4 bg-gradient-to-r from-indigo-50/60 via-white to-emerald-50/50 hover:from-indigo-50/90 hover:to-emerald-50/80 transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs"
            >
              <BarChart3 className="w-4 h-4" />
            </motion.div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900">
                สัดส่วนการผลิตตามหมวดหมู่ & อัตราใช้ฟุต
              </h2>
              <p className="text-xs text-slate-500">
                {isComparisonExpanded
                  ? 'คลิกแถวเพื่อกรองคลิปหลัก หรือกด "+ จัดเพิ่ม" เพื่อนำฟุตเทจที่ว่างไปสร้างตอนใหม่'
                  : 'คลิกเพื่อกางดูกราฟเปรียบเทียบสัดส่วนตอนและฟุตเทจพร้อมใช้'}
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
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>แสดงทั้งหมด</span>
              </button>
            )}

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsComparisonExpanded((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isComparisonExpanded
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <span>{isComparisonExpanded ? 'ย่อกราฟ' : 'ดูกราฟเปรียบเทียบ'}</span>
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
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-200/80 p-3 sm:p-4 space-y-2 bg-white">
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
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: idx * 0.02 }}
                      whileHover={{ y: -1 }}
                      onClick={() =>
                        setCategoryFilter(isSelected ? 'ALL' : row.mainTag.id)
                      }
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-300 shadow-2xs'
                          : 'bg-slate-50/50 hover:bg-white hover:border-indigo-200 border-slate-200/80'
                      }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
                        {/* Col 1-3: Rank + Category Name */}
                        <div className="lg:col-span-3 flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-md font-mono text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
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
                              {row.episodeCount} ตอน
                            </span>
                            <span className="text-slate-500">
                              {row.episodeSharePercent}% ของคลัง
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: row.episodeCount === 0 ? '0%' : `${barWidthPercent}%`,
                              }}
                              transition={{ duration: 0.45, ease: 'easeOut' }}
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
                        <div className="lg:col-span-4 flex items-center justify-between gap-2.5 pl-0 lg:pl-3 lg:border-l lg:border-slate-200/80">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                              <span className="text-slate-600">
                                ใช้จริง{' '}
                                <strong className="text-emerald-700 font-bold">
                                  {row.utilizationPercent}%
                                </strong>{' '}
                                ({row.usedFootageInCat}/{row.totalFootageInCat})
                              </span>
                              <span className="text-sky-700 font-bold">
                                ว่าง {row.usableFootageInCat}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${row.utilizationPercent}%` }}
                                transition={{ duration: 0.45, ease: 'easeOut' }}
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
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 rounded-lg transition-colors shrink-0 cursor-pointer"
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
          3. 2-TIER HIERARCHICAL SERIES NAVIGATION BAR (Tier 0 Groups ──▶ Tier 1 Series)
         ===================================================================== */}
      <div className="bg-[#FAF7F2] border border-amber-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Tier 0 Group Level Filter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>1. เลือกกลุ่มหมวดหมู่หลัก (Tier 0 Category Groups)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {categoryGroups.filter((g) => !isStagingGroupId(g.id)).length} กลุ่ม
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => {
                setSelectedGroupId('ALL');
                setCategoryFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedGroupId === 'ALL'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-amber-100/60 border border-slate-200'
              }`}
            >
              <span>ทุกกลุ่ม</span>
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                  selectedGroupId === 'ALL'
                    ? 'bg-black/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {episodes.length}
              </span>
            </button>

            {categoryGroups
              .filter((grp) => !isStagingGroupId(grp.id))
              .map((grp) => {
                const isSelected = selectedGroupId === grp.id;
                const grpEpCount = episodes.filter((ep) => {
                  const t = tagMap[ep.mainCategoryTagId];
                  return resolveTagGroupId(t) === grp.id;
                }).length;

                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(grp.id);
                      setCategoryFilter('ALL');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-600 text-white font-bold shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-amber-100/60 border border-slate-200 font-medium'
                    }`}
                  >
                    <span>{grp.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                        isSelected
                          ? 'bg-black/20 text-white font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {grpEpCount}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Tier 1 Series Level Filter (Only shows series in selected group) */}
        <div className="pt-2 border-t border-amber-200/50 space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                2. เลือกซีรีส์เฉพาะ ({categoriesInGroup.length} ซีรีส์ในกลุ่มนี้)
              </span>
            </span>
            {categoryFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
              >
                ดูทุกซีรีส์ในกลุ่มนี้
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'ALL'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              <span>
                ทั้งหมด ({categoriesInGroup.reduce((sum, c) => sum + c.episodeCount, 0)})
              </span>
            </button>

            {categoriesInGroup.map((item) => {
              const isSelected = categoryFilter === item.mainTag.id;
              return (
                <button
                  key={item.mainTag.id}
                  type="button"
                  onClick={() => setCategoryFilter(item.mainTag.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200 font-medium'
                  }`}
                >
                  <span>#{item.mainTag.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                      isSelected
                        ? 'bg-black/20 text-white font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.episodeCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          SERIES SHELF HUB (เมื่อเลือกดูแบบคลังชั้นวางซีรีส์)
         ===================================================================== */}
      {archiveTab === 'SERIES_SHELF' && (
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="text-xs text-slate-600">
              กำลังแสดง{' '}
              <span className="font-mono font-bold text-slate-900">
                {categoriesInGroup.length}
              </span>{' '}
              ซีรีส์
              {selectedGroupId !== 'ALL' && categoryGroupMap[selectedGroupId] && (
                <span>
                  {' '}
                  ในกลุ่ม{' '}
                  <strong className="text-amber-800">
                    {categoryGroupMap[selectedGroupId].name}
                  </strong>
                </span>
              )}
            </div>

            <div className="text-xs font-mono text-slate-500">
              รวม {categoriesInGroup.reduce((sum, c) => sum + c.episodeCount, 0)} ตอนที่ผลิตแล้ว
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categoriesInGroup.map((item) => {
              const grp = categoryGroupMap[resolveTagGroupId(item.mainTag)];
              const seriesEps = episodes.filter(
                (e) => e.mainCategoryTagId === item.mainTag.id
              );
              const latestEp = seriesEps[0] || null;
              const nextEpNumber = item.episodeCount + 1;
              const estProducible = Math.floor(item.usableFootageInCat / 5);

              return (
                <div
                  key={item.mainTag.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-amber-300 hover:shadow-2xs transition-all flex flex-col justify-between gap-3.5"
                >
                  <div className="space-y-2">
                    {/* Top Row: Group Tag + Producible Badge */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 text-[11px] font-semibold">
                        {grp?.name || 'หมวดหมู่ทั่วไป'}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        พร้อมผลิต ~{estProducible} EP
                      </span>
                    </div>

                    {/* Series Title */}
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>5 อันดับ #{item.mainTag.name}</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.mainTag.description ||
                          `ซีรีส์จัดอันดับช็อตเด็ดหมวด ${item.mainTag.name}`}
                      </p>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <div className="text-[11px] text-slate-500">ผลิตแล้ว</div>
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {item.episodeCount}{' '}
                          <span className="text-[10px] font-normal text-slate-500">
                            ตอน
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">ฟุตเทจว่าง</div>
                        <div className="font-mono font-bold text-emerald-700 text-sm">
                          {item.usableFootageInCat}{' '}
                          <span className="text-[10px] font-normal text-slate-500">
                            ฟุต (ใหม่ {item.untouchedFootageInCat})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Latest EP Info */}
                    {latestEp ? (
                      <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
                        <span className="truncate">
                          ล่าสุด:{' '}
                          <strong className="text-slate-900">
                            EP.{latestEp.categoryEpisodeNo || item.episodeCount}
                          </strong>{' '}
                          ({formatThaiDate(latestEp.publishDate)})
                        </span>
                        <span className="font-mono text-indigo-700 font-bold shrink-0 ml-1">
                          {latestEp.id}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic pt-1">
                        ยังไม่มีตอนที่เผยแพร่
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter(item.mainTag.id);
                        setArchiveTab('EPISODES');
                      }}
                      className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>ดู {item.episodeCount} ตอน</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        launchEpisodeBuilderForCategory(
                          item.mainTag.id,
                          item.untouchedFootageInCat >= 5
                            ? 'FORMULA_ALL_NEW'
                            : 'FORMULA_2_NEW_3_FRESH'
                        );
                      }}
                      className="py-1.5 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>สร้าง EP.{nextEpNumber}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          4. EPISODE ARCHIVE VIEW (SEARCH, FILTERS, CARDS/TABLE)
         ===================================================================== */}
      {archiveTab === 'EPISODES' && (
        <div className="space-y-4">
          {/* Streamlined Search & Workflow Filter Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5 shadow-2xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัส EP, หมวดหมู่, เลขตอน (เช่น EP.1), หรือรหัสฟุตเทจ..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 4-Stage Workflow Filter */}
              <select
                value={workflowFilter}
                onChange={(e) => setWorkflowFilter(e.target.value as typeof workflowFilter)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">ทุกสถานะงาน</option>
                <option value="1_MIXING">🟡 ขั้น 1: ผสมฟุต 5 อันดับ</option>
                <option value="2_SCRIPTING">🔵 ขั้น 2: เขียนบทมาสคอต</option>
                <option value="3_EDITING">🟣 ขั้น 3: ตัดต่อวิดีโอ</option>
                <option value="4_PUBLISHED">🟢 ขั้น 4: เผยแพร่แล้ว</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="DATE_DESC">วันที่ล่าสุด</option>
                <option value="NEW_MIX_DESC">ฟุตใหม่มากสุด</option>
                <option value="ID_ASC">รหัส EP</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('ALL');
                    setWorkflowFilter('ALL');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ล้างตัวกรอง</span>
                </button>
              )}
            </div>
          </div>

          {/* View Mode Bar & Episode Count */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-600">
              รายการคลิปหลัก{' '}
              <span className="font-mono font-bold text-slate-900">
                {sortedEpisodes.length}
              </span>{' '}
              / {episodes.length} ตอน
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-white text-indigo-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>การ์ด</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-indigo-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>ตาราง</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {paginatedEpisodes.map((ep) => {
                  const mix = getEpisodeFootageMix(ep);
                  return (
                    <div
                      key={ep.id}
                      onClick={() => setSelectedEpisodeDetailId(ep.id)}
                      className="group bg-white border border-slate-200/90 rounded-2xl p-3.5 hover:border-indigo-300 hover:shadow-2xs transition-all cursor-pointer flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        {/* Top Row: Series Category EP Pill + Global ID + Date */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-xs font-sans flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{tagMap[ep.mainCategoryTagId]?.name || 'หมวด'} · EP.{ep.categoryEpisodeNo || 1}</span>
                            </span>
                            <span className="font-bold text-slate-400 text-[11px]">{ep.id}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-500 text-[11px]">{formatThaiDate(ep.publishDate)}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-600">
                            <span className="inline-flex items-center gap-1 text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-[11px]">
                              <Sparkles className="w-2.5 h-2.5 text-sky-600" />
                              <span>ใหม่ {mix.newCount}</span>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
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
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <TagPill tag={tagMap[ep.mainCategoryTagId]} />
                          {ep.targetSubcategoryId && tagMap[ep.targetSubcategoryId] && (
                            <TagPill tag={tagMap[ep.targetSubcategoryId]} />
                          )}
                        </div>

                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors shrink-0">
                          <span>ดู 5 อันดับ</span>
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
                        <th className="py-2.5 px-3.5 w-36">รหัส & ซีรีส์ EP</th>
                        <th className="py-2.5 px-3.5">ชื่อคลิปหลัก</th>
                        <th className="py-2.5 px-3.5">หมวดหมู่</th>
                        <th className="py-2.5 px-3.5 w-44">สัดส่วนฟุตเทจ</th>
                        <th className="py-2.5 px-3.5 w-32">วันที่สร้าง</th>
                        <th className="py-2.5 px-3.5 w-28 text-right">5 อันดับ</th>
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
                            <td className="py-2.5 px-3.5 font-mono whitespace-nowrap">
                              <div className="font-bold text-indigo-700 tabular-nums">
                                {ep.id}
                              </div>
                              <div className="text-[11px] font-sans font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70 inline-flex items-center gap-1 mt-0.5">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{tagMap[ep.mainCategoryTagId]?.name || 'หมวด'} · EP.{ep.categoryEpisodeNo || 1}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-indigo-700">
                                {ep.title}
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <div className="flex flex-wrap gap-1.5">
                                <TagPill tag={tagMap[ep.mainCategoryTagId]} />
                                {ep.targetSubcategoryId &&
                                  tagMap[ep.targetSubcategoryId] && (
                                    <TagPill tag={tagMap[ep.targetSubcategoryId]} />
                                  )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5 font-mono tabular-nums whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-[11px]">
                                <Sparkles className="w-2.5 h-2.5 text-sky-600" />
                                <span>ใหม่ {mix.newCount}</span>
                              </span>
                              <span className="text-slate-300 mx-1">·</span>
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>วนใช้ {mix.recycledCount}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                              {formatThaiDate(ep.publishDate)}
                            </td>
                            <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
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
      )}
    </div>
  );
};
