import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Film,
  FolderOpen,
  Layers,
  Lightbulb,
  Moon,
  Package,
  PawPrint,
  Plus,
  Repeat,
  Rocket,
  Scissors,
  Sparkles,
  Sun,
  Tag,
  Target,
  Trophy,
  User,
  Video,
  Wrench,
  Zap,
} from 'lucide-react';
import { CategoryMatrixStat, useCMS } from '../../context/CMSContext';
import { EpisodeWorkflowStage } from '../../types/episode.types';
import { ComputedFootage } from '../../types/footage.types';
import { formatThaiDate, hasRealDriveLink } from '../../utils/fileNameGenerator';
import { PaginationBar } from '../ui/PaginationBar';
import { StatusBadge } from '../ui/StatusBadge';

const NEXT_STAGE_MAP: Partial<Record<EpisodeWorkflowStage, EpisodeWorkflowStage>> = {
  '1_MIXING': '2_MASCOT_SCRIPTING',
  '2_MASCOT_SCRIPTING': '3_VIDEO_EDITING',
  '3_VIDEO_EDITING': '4_PUBLISHED',
};

const STAGE_BADGE_LABELS: Record<EpisodeWorkflowStage, string> = {
  '1_MIXING': '1. เลือกผสม 5 ฟุต',
  '2_MASCOT_SCRIPTING': '2. เขียนบทมาสคอต',
  '3_VIDEO_EDITING': '3. ตัดต่อรวม 5 ฟุต',
  '4_PUBLISHED': '4. โพสต์ลงช่องแล้ว',
};

type Col1ReadinessFilter =
  | 'ALL_CATEGORIES'
  | 'READY_5_PLUS'
  | 'RECIPE_ALL_NEW'
  | 'RECIPE_SMART_MIX'
  | 'ACCUMULATING_UNDER_5'
  | 'INCOMPLETE_FOOTAGE';

type FootageSortMode = 'REST_DAYS_DESC' | 'USAGE_90D_ASC' | 'NEWEST_FIRST';

function sortUsableFootages(
  list: ComputedFootage[],
  sortMode: FootageSortMode
): ComputedFootage[] {
  return [...list].sort((a, b) => {
    if (sortMode === 'REST_DAYS_DESC') {
      // NEW_UNTOUCHED has null daysSinceLastUsed -> treat as 9999 days rested
      const daysA = a.daysSinceLastUsed === null ? 9999 : a.daysSinceLastUsed;
      const daysB = b.daysSinceLastUsed === null ? 9999 : b.daysSinceLastUsed;
      if (daysB !== daysA) return daysB - daysA;
      return a.usageLast90Days - b.usageLast90Days;
    }
    if (sortMode === 'USAGE_90D_ASC') {
      if (a.usageLast90Days !== b.usageLast90Days) {
        return a.usageLast90Days - b.usageLast90Days;
      }
      return a.totalUsageCount - b.totalUsageCount;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export const E2EPipelineBoard: React.FC = () => {
  const {
    categoryMatrix,
    untaggedFootages,
    missingDriveFootages,
    episodes,
    settings,
    setActiveTab,
    setSelectedTagFilter,
    setTraceabilityFootageId,
    setSelectedEpisodeDetailId,
    updateEpisodeWorkflowStage,
    launchEpisodeBuilderForCategory,
  } = useCMS();

  // Column 1 Filter, Sort & Pagination State
  const [col1Filter, setCol1Filter] = useState<Col1ReadinessFilter>('ALL_CATEGORIES');
  const [footageSortMode, setFootageSortMode] = useState<FootageSortMode>('REST_DAYS_DESC');
  const [expandedTagId, setExpandedTagId] = useState<string | null>(
    categoryMatrix[0]?.tag.id || null
  );
  const [col1Page, setCol1Page] = useState(1);
  const [col1PageSize, setCol1PageSize] = useState(5);

  // Inner Category Footage Drawer Pagination
  const [drawerPageMap, setDrawerPageMap] = useState<Record<string, number>>({});

  // Column 2 & Column 3 Pagination State
  const [col2Page, setCol2Page] = useState(1);
  const [col2PageSize, setCol2PageSize] = useState(4);
  const [col3Page, setCol3Page] = useState(1);
  const [col3PageSize, setCol3PageSize] = useState(5);

  // Overall Category Readiness Summary
  const readyCategoriesCount = useMemo(
    () => categoryMatrix.filter((c) => c.usableCount >= 5).length,
    [categoryMatrix]
  );

  const totalProducibleEpisodes = useMemo(
    () => categoryMatrix.reduce((sum, c) => sum + c.producibleEpisodesCount, 0),
    [categoryMatrix]
  );

  const incompleteFootages = useMemo(() => {
    const map = new Map<string, ComputedFootage>();
    for (const ft of untaggedFootages) map.set(ft.id, ft);
    for (const ft of missingDriveFootages) map.set(ft.id, ft);
    return sortUsableFootages(Array.from(map.values()), footageSortMode);
  }, [untaggedFootages, missingDriveFootages, footageSortMode]);

  // Filtered & Sorted Categories for Column 1
  const filteredCategories = useMemo<CategoryMatrixStat[]>(() => {
    if (col1Filter === 'INCOMPLETE_FOOTAGE') return [];

    const filtered = categoryMatrix.filter((stat) => {
      // Show only Tier 1 Main categories in Column 1 primary cards
      if (stat.tag.tier === 2 && stat.tag.parentId) return false;
      if (col1Filter === 'READY_5_PLUS') return stat.usableCount >= 5;
      if (col1Filter === 'RECIPE_ALL_NEW') return stat.canMakeAllNew5;
      if (col1Filter === 'RECIPE_SMART_MIX') return stat.canMakeMix2New3Fresh;
      if (col1Filter === 'ACCUMULATING_UNDER_5') return stat.usableCount < 5;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (b.producibleEpisodesCount !== a.producibleEpisodesCount) {
        return b.producibleEpisodesCount - a.producibleEpisodesCount;
      }
      return b.usableCount - a.usableCount;
    });
  }, [categoryMatrix, col1Filter]);

  const paginatedCategories = useMemo(() => {
    const start = (col1Page - 1) * col1PageSize;
    return filteredCategories.slice(start, start + col1PageSize);
  }, [filteredCategories, col1Page, col1PageSize]);

  const paginatedIncompleteFootages = useMemo(() => {
    const start = (col1Page - 1) * col1PageSize;
    return incompleteFootages.slice(start, start + col1PageSize);
  }, [incompleteFootages, col1Page, col1PageSize]);

  // Column 2: In-Production Episodes
  const inProductionEpisodes = useMemo(
    () => episodes.filter((ep) => ep.workflowStage !== '4_PUBLISHED'),
    [episodes]
  );

  const paginatedInProduction = useMemo(() => {
    const start = (col2Page - 1) * col2PageSize;
    return inProductionEpisodes.slice(start, start + col2PageSize);
  }, [inProductionEpisodes, col2Page, col2PageSize]);

  // Column 3: Published Episodes
  const publishedEpisodes = useMemo(
    () =>
      [...episodes]
        .filter((ep) => ep.workflowStage === '4_PUBLISHED')
        .sort((a, b) => b.publishDate.localeCompare(a.publishDate)),
    [episodes]
  );

  const paginatedPublished = useMemo(() => {
    const start = (col3Page - 1) * col3PageSize;
    return publishedEpisodes.slice(start, start + col3PageSize);
  }, [publishedEpisodes, col3Page, col3PageSize]);

  const handleCol1FilterChange = (nextFilter: Col1ReadinessFilter) => {
    setCol1Filter(nextFilter);
    setCol1Page(1);
  };

  return (
    <div className="space-y-5">
      {/* Header + Real-Time Category Quota Summary Banner */}
      <div className="studio-card border border-slate-200/90 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>กระดานสายพานการผลิต End-to-End (คำนวณโควตา 5 ฟุตต่อหมวด = 1 EP)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              แยกนับเฉพาะฟุตที่ไม่ติด Cooldown (ฟุตใหม่แกะกล่อง + พักจนสด) ในหมวดหมู่เดียวกัน เพื่อให้รู้ทันทีว่าหมวดไหนทำคลิปได้จริงกี่ EP
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(untaggedFootages.length > 0 || missingDriveFootages.length > 0) && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  handleCol1FilterChange(
                    col1Filter === 'INCOMPLETE_FOOTAGE'
                      ? 'ALL_CATEGORIES'
                      : 'INCOMPLETE_FOOTAGE'
                  )
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors ${
                  col1Filter === 'INCOMPLETE_FOOTAGE'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  ฟุตยังไม่ติดแท็ก {untaggedFootages.length} · รอลิงก์ Drive{' '}
                  {missingDriveFootages.length}
                </span>
              </motion.button>
            )}

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('EPISODE_BUILDER')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm whitespace-nowrap"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>+ สร้างคิว 5 อันดับใหม่</span>
            </motion.button>
          </div>
        </div>

        {/* 4-Pill Capacity Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>หมวดที่ครบโควตา (≥5 ฟุต)</span>
              </div>
              <div className="text-base font-extrabold font-mono text-emerald-950">
                {readyCategoriesCount} / {categoryMatrix.length} หมวด
              </div>
            </div>
            <Tag className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-sky-800 flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-sky-600" />
                <span>ผลิตคลิป 5 อันดับได้ทันที</span>
              </div>
              <div className="text-base font-extrabold font-mono text-sky-950">
                รวม {totalProducibleEpisodes} EP
              </div>
            </div>
            <Rocket className="w-5 h-5 text-sky-600" />
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>กำลังตัดต่ออยู่ในสายพาน</span>
              </div>
              <div className="text-base font-extrabold font-mono text-amber-950">
                {inProductionEpisodes.length} คิว
              </div>
            </div>
            <Film className="w-5 h-5 text-amber-600" />
          </div>

          <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>ฟุตยังไม่ติดหมวด / ขาด Drive</span>
              </div>
              <div className="text-base font-extrabold font-mono text-rose-950">
                {untaggedFootages.length} แท็กว่าง · {missingDriveFootages.length} ขาดลิงก์
              </div>
            </div>
            <Wrench className="w-5 h-5 text-rose-600" />
          </div>
        </div>
      </div>

      {/* 3-Column E2E Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Column 1: Category-Grouped Ready Footage Capacity (5 Clips = 1 EP) */}
        <div className="studio-card border border-slate-200/90 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                1. วัตถุดิบพร้อมใช้ แยกตามหมวดหมู่
              </h2>
              <p className="text-[11px] text-slate-500">
                ต้องมีฟุตพร้อมใช้ในหมวดเดียวกันครบ 5 ฟุต = ทำได้ 1 คลิป
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-mono font-bold whitespace-nowrap">
              <Film className="w-3 h-3 text-emerald-700" />
              <span>ทำได้ {totalProducibleEpisodes} EP</span>
            </span>
          </div>

          {/* Actionable Filter Pills for Column 1 */}
          <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'ALL_CATEGORIES', label: `ทุกหมวด (${categoryMatrix.length})` },
                  {
                    id: 'READY_5_PLUS',
                    label: `พร้อมทำคลิป ≥5 ฟุต (${readyCategoriesCount})`,
                  },
                  {
                    id: 'RECIPE_ALL_NEW',
                    label: `ฟุตใหม่ล้วน 5:0 (${
                      categoryMatrix.filter((c) => c.canMakeAllNew5).length
                    })`,
                  },
                  {
                    id: 'RECIPE_SMART_MIX',
                    label: `สูตร 2ใหม่+3เก่า (${
                      categoryMatrix.filter((c) => c.canMakeMix2New3Fresh).length
                    })`,
                  },
                  {
                    id: 'ACCUMULATING_UNDER_5',
                    label: `กำลังสะสม <5 ฟุต (${
                      categoryMatrix.filter((c) => c.usableCount < 5).length
                    })`,
                  },
                  {
                    id: 'INCOMPLETE_FOOTAGE',
                    label: `ยังไม่ติดแท็ก/ขาด Drive (${incompleteFootages.length})`,
                  },
                ] as const
              ).map((tab) => (
                <motion.button
                  key={tab.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCol1FilterChange(tab.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    col1Filter === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:border-slate-400'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Sort Selector for Footages inside Categories */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60 text-[11px]">
              <span className="text-slate-500 font-semibold">เรียงลำดับฟุตย่อย:</span>
              <select
                value={footageSortMode}
                onChange={(e) => setFootageSortMode(e.target.value as FootageSortMode)}
                className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="REST_DAYS_DESC">พักนานสุดขึ้นก่อน (แนะนำรีไซเคิล)</option>
                <option value="USAGE_90D_ASC">ใช้ในรอบ 90 วันน้อยสุด</option>
                <option value="NEWEST_FIRST">เพิ่งนำเข้าคลังล่าสุด</option>
              </select>
            </div>
          </div>

          {/* Mode A: Incomplete / Untagged / Missing Drive Footages List */}
          {col1Filter === 'INCOMPLETE_FOOTAGE' ? (
            <div className="space-y-2.5">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>ฟุตเทจที่ยังนำไปจัดหมวดหมู่ทำคลิปไม่ได้ ({incompleteFootages.length} รายการ)</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  คลิกที่การ์ดเพื่อเปิดหน้าต่างติดป้ายหมวดหมู่ (Tag) หรือวางลิงก์ไฟล์ Google Drive ให้ครบ
                </p>
              </div>

              {paginatedIncompleteFootages.length === 0 ? (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ฟุตเทจทุกชิ้นติดป้ายหมวดหมู่และมีลิงก์ Google Drive ครบถ้วนแล้ว</span>
                </div>
              ) : (
                paginatedIncompleteFootages.map((ft) => {
                  const isUntagged = ft.tags.length === 0;
                  const isMissingDrive = !hasRealDriveLink(ft.driveFileUrl);
                  return (
                    <motion.div
                      key={ft.id}
                      whileHover={{ y: -2 }}
                      onClick={() => setTraceabilityFootageId(ft.id)}
                      className="p-3 bg-white border border-rose-200 hover:border-rose-400 rounded-xl cursor-pointer space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-mono">
                        <span className="font-bold text-slate-900">{ft.id}</span>
                        <div className="flex items-center gap-1">
                          {isUntagged && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-bold bg-rose-100 text-rose-800 rounded-md">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>ยังไม่ติดหมวดหมู่</span>
                            </span>
                          )}
                          {isMissingDrive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-bold bg-amber-100 text-amber-800 rounded-md">
                              <FolderOpen className="w-3 h-3 text-amber-700" />
                              <span>รอลิงก์ Drive</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">
                        {ft.title}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        <span>คลิกเพื่อติดป้ายหมวดหมู่ / อัปเดตลิงก์ Drive ทันที</span>
                      </div>
                    </motion.div>
                  );
                })
              )}

              <PaginationBar
                currentPage={col1Page}
                totalItems={incompleteFootages.length}
                pageSize={col1PageSize}
                onPageChange={setCol1Page}
                onPageSizeChange={setCol1PageSize}
                pageSizeOptions={[4, 6, 10]}
                itemLabel="ฟุต"
                compact
              />
            </div>
          ) : (
            /* Mode B: Category Production Capacity Cards */
            <div className="space-y-3">
              {paginatedCategories.length === 0 ? (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
                  ไม่พบหมวดหมู่ที่ตรงกับตัวกรองนี้
                </div>
              ) : (
                paginatedCategories.map((stat) => {
                  const isReadyForEp = stat.usableCount >= 5;
                  const isExpanded = expandedTagId === stat.tag.id;
                  const sortedUsable = sortUsableFootages(
                    stat.usableFootages,
                    footageSortMode
                  );
                  const drawerPage = drawerPageMap[stat.tag.id] || 1;
                  const drawerPageSize = 4;
                  const paginatedDrawerClips = sortedUsable.slice(
                    (drawerPage - 1) * drawerPageSize,
                    drawerPage * drawerPageSize
                  );

                  // Build 5-slot visual bar for next episode
                  const slots = Array.from({ length: 5 }, (_, idx) => {
                    if (idx < Math.min(5, stat.newCount)) return 'NEW';
                    if (idx < Math.min(5, stat.usableCount)) return 'FRESH';
                    return 'EMPTY';
                  });

                  return (
                    <motion.div
                      key={stat.tag.id}
                      layout
                      className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                        isReadyForEp
                          ? 'bg-emerald-50/40 border-emerald-300/90 shadow-2xs'
                          : 'bg-amber-50/30 border-amber-200/80'
                      }`}
                    >
                      {/* Top Category Row & EP Quota Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-slate-900">
                              #{stat.tag.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({stat.tag.id})
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                            พร้อมใช้ <strong className="text-slate-900">{stat.usableCount}</strong> ฟุต
                            (ใหม่ {stat.newCount} · สด {stat.readyCount})
                            {stat.cooldownCount + stat.frequentCount > 0 && (
                              <span className="text-slate-400">
                                {' '}
                                · พัก/ถี่ {stat.cooldownCount + stat.frequentCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {isReadyForEp ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold font-mono whitespace-nowrap shadow-2xs">
                            <Film className="w-3 h-3" />
                            <span>ทำได้ {stat.producibleEpisodesCount} EP</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold font-mono whitespace-nowrap">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>ขาดอีก {5 - stat.usableCount} ฟุต</span>
                          </span>
                        )}
                      </div>

                      {/* 5-Clip Episode Quota Meter */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-semibold">
                            โควตาจัดอันดับ 5 ช็อต ({Math.min(5, stat.usableCount)}/5):
                          </span>
                          {stat.usableCount > 5 && (
                            <span className="font-mono text-emerald-800 font-bold">
                              +{stat.usableCount - stat.producibleEpisodesCount * 5} ฟุตสำรองสำหรับ EP ถัดไป
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {slots.map((slotType, i) => (
                            <div
                              key={i}
                              className={`h-2 rounded-full transition-all ${
                                slotType === 'NEW'
                                  ? 'bg-sky-500'
                                  : slotType === 'FRESH'
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-200'
                              }`}
                              title={
                                slotType === 'NEW'
                                  ? 'ฟุตใหม่แกะกล่อง (NEW)'
                                  : slotType === 'FRESH'
                                  ? 'ฟุตเก่าพักจนสด (READY_FRESH)'
                                  : 'ยังขาดฟุตเทจ'
                              }
                            />
                          ))}
                        </div>
                      </div>

                      {/* Recipe Compatibility Pills */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {stat.canMakeAllNew5 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-900 rounded-md">
                            <Sparkles className="w-3 h-3 text-sky-700" />
                            <span>ทำฟุตใหม่ล้วน 5:0 ได้ ({stat.allNewEpisodesCount} EP)</span>
                          </span>
                        )}
                        {stat.canMakeMix2New3Fresh && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 rounded-md">
                            <Repeat className="w-3 h-3 text-emerald-700" />
                            <span>ผสมสูตร 2 ใหม่ + 3 เก่าสดได้ทันที</span>
                          </span>
                        )}
                        {!isReadyForEp && (
                          <span className="text-[10px] text-amber-800 font-medium inline-flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-600" />
                            <span>หั่นไลฟ์หรือเพิ่มฟุตเดี่ยวหมวดนี้อีก {5 - stat.usableCount} ช็อตเพื่อเปิดโปรเจกต์</span>
                          </span>
                        )}
                      </div>

                      {/* 2-Tier Subcategory & Entity Status */}
                      {stat.subcategoriesCount > 0 && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                              <span>มี {stat.subcategoriesCount} หัวข้อย่อย</span>
                            </span>
                            {stat.specialEpisodeSubcategories.length > 0 ? (
                              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>พร้อมทำ Special EP: {stat.specialEpisodeSubcategories.map((s) => `${s.subcategory.name} (${s.count} ฟุต)`).join(', ')}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">
                                รวมหลากเรื่อง: {stat.usableCount >= 5 ? 'พร้อมจัด EP' : 'กำลังสะสม'}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {stat.subcategoryStats.map((subStat) => (
                              <span
                                key={subStat.subcategory.id}
                                className={`px-2 py-0.5 rounded-md font-mono text-[10px] flex items-center gap-1 ${
                                  subStat.usableCount >= 5
                                    ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                                    : 'bg-white text-slate-700 border border-slate-200'
                                }`}
                              >
                                {subStat.subcategory.entityType === 'PERSON' ? (
                                  <User className="w-3 h-3 text-indigo-600" />
                                ) : subStat.subcategory.entityType === 'ANIMAL' ? (
                                  <PawPrint className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Target className="w-3 h-3 text-rose-600" />
                                )}
                                <span>{subStat.subcategory.name}:</span>
                                <strong>{subStat.usableCount}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Row: 1-Click Send to Episode Builder + Expand Footage Drawer */}
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTagId(isExpanded ? null : stat.tag.id)
                          }
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>ซ่อนฟุต ({stat.usableCount})</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>ดูฟุตพร้อมใช้ ({stat.usableCount})</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTagFilter([stat.tag.id]);
                              setActiveTab('FOOTAGE_LIBRARY');
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg"
                            title="เปิดดูหมวดนี้ในคลังฟุตเทจ"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>

                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() =>
                              launchEpisodeBuilderForCategory(
                                stat.tag.id,
                                stat.canMakeAllNew5
                                  ? 'FORMULA_ALL_NEW'
                                  : 'FORMULA_2_NEW_3_FRESH'
                              )
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                              isReadyForEp
                                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs'
                                : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-500'
                            }`}
                          >
                            <Rocket className="w-3.5 h-3.5" />
                            <span>
                              {isReadyForEp ? 'จัด 5 อันดับหมวดนี้' : 'ทดลองจัดชุด'}
                            </span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Expandable Ready Footages Drawer inside Category */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2.5 mt-1 border-t border-slate-200/70 space-y-2">
                              {paginatedDrawerClips.map((ft) => (
                                <div
                                  key={ft.id}
                                  onClick={() => setTraceabilityFootageId(ft.id)}
                                  className="p-2.5 bg-white border border-slate-200/90 hover:border-slate-400 rounded-xl cursor-pointer space-y-1 transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-1.5 font-mono">
                                      <span className="font-bold text-slate-900">
                                        {ft.id}
                                      </span>
                                      <span className="text-slate-400 inline-flex items-center gap-1">
                                        {ft.ingestionFlow === 'DIRECT_1_TO_1' ? (
                                          <>
                                            <Video className="w-3 h-3 text-slate-400" />
                                            <span>1:1</span>
                                          </>
                                        ) : (
                                          <>
                                            <Scissors className="w-3 h-3 text-indigo-500" />
                                            <span>{ft.sourceId}</span>
                                          </>
                                        )}
                                      </span>
                                      {!hasRealDriveLink(ft.driveFileUrl) && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-sans font-bold bg-amber-100 text-amber-800 rounded">
                                          <FolderOpen className="w-3 h-3 text-amber-700" />
                                          <span>รอลิงก์ Drive</span>
                                        </span>
                                      )}
                                    </div>
                                    <StatusBadge
                                      status={ft.cooldownStatus}
                                      daysSinceLastUse={ft.daysSinceLastUsed}
                                      cooldownDays={settings.cooldownDays}
                                      usageLast90Days={ft.usageLast90Days}
                                      compact
                                    />
                                  </div>
                                  <div className="text-xs font-bold text-slate-900 line-clamp-1">
                                    {ft.title}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-500 flex flex-wrap items-center gap-2">
                                    <span>รวม {ft.totalUsageCount}x</span>
                                    <span>·</span>
                                    <span>90วัน {ft.usageLast90Days}x</span>
                                    <span>·</span>
                                    <span>
                                      {ft.daysSinceLastUsed !== null
                                        ? `พัก ${ft.daysSinceLastUsed} วัน`
                                        : 'ยังไม่เคยใช้'}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {sortedUsable.length > drawerPageSize && (
                                <PaginationBar
                                  currentPage={drawerPage}
                                  totalItems={sortedUsable.length}
                                  pageSize={drawerPageSize}
                                  onPageChange={(p) =>
                                    setDrawerPageMap((prev) => ({
                                      ...prev,
                                      [stat.tag.id]: p,
                                    }))
                                  }
                                  itemLabel="ฟุต"
                                  compact
                                />
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}

              <PaginationBar
                currentPage={col1Page}
                totalItems={filteredCategories.length}
                pageSize={col1PageSize}
                onPageChange={setCol1Page}
                onPageSizeChange={setCol1PageSize}
                pageSizeOptions={[4, 5, 8]}
                itemLabel="หมวดหมู่"
                compact
              />
            </div>
          )}
        </div>

        {/* Column 2: In-Production Episodes */}
        <div className="studio-card border border-slate-200/90 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                2. กำลังผสม 5 ฟุต & ตัดต่อ
              </h2>
              <p className="text-[11px] text-slate-500">
                โปรเจกต์ที่เลือกฟุตครบ 5 อันดับแล้วและกำลังพากย์/ตัดต่อ
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums font-bold text-amber-700">
              <Film className="w-3.5 h-3.5" />
              <span>{inProductionEpisodes.length} คิว</span>
            </span>
          </div>

          {inProductionEpisodes.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 text-center space-y-3">
              <p className="text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ทุกคิวตัดต่อเสร็จและโพสต์แล้ว</span>
              </p>
              <p className="text-[11px] text-slate-500">
                สามารถกดปุ่ม &ldquo;จัด 5 อันดับหมวดนี้&rdquo; จากคอลัมน์ซ้ายมือเพื่อส่งวัตถุดิบเข้าสายพานตัดต่อได้ทันที
              </p>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab('EPISODE_BUILDER')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>+ จัดชุด 5 อันดับใหม่</span>
              </motion.button>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedInProduction.map((ep) => {
                const nextStage = NEXT_STAGE_MAP[ep.workflowStage];
                return (
                  <motion.div
                    key={ep.id}
                    layout
                    whileHover={{ y: -2 }}
                    className="p-4 bg-white border border-amber-200 rounded-xl space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900">{ep.id}</span>
                      <span className="font-mono text-amber-800 font-bold">
                        {STAGE_BADGE_LABELS[ep.workflowStage]}
                      </span>
                    </div>

                    <div
                      onClick={() => setSelectedEpisodeDetailId(ep.id)}
                      className="text-sm font-bold text-slate-900 hover:underline cursor-pointer"
                    >
                      {ep.title}
                    </div>

                    <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatThaiDate(ep.publishDate)}</span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        {ep.publishSlot === 'MORNING_0600' ? (
                          <>
                            <Sun className="w-3 h-3 text-amber-500" />
                            <span>06:00</span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-3 h-3 text-indigo-500" />
                            <span>18:00</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {ep.rankings.map((r) => (
                        <span
                          key={r.rank}
                          className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 rounded-md"
                        >
                          #{r.rank} {r.footageId}
                        </span>
                      ))}
                    </div>

                    {nextStage && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => updateEpisodeWorkflowStage(ep.id, nextStage)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      >
                        <span>ไปขั้น {STAGE_BADGE_LABELS[nextStage]}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}

              <PaginationBar
                currentPage={col2Page}
                totalItems={inProductionEpisodes.length}
                pageSize={col2PageSize}
                onPageChange={setCol2Page}
                onPageSizeChange={setCol2PageSize}
                pageSizeOptions={[3, 4, 8]}
                itemLabel="คิว"
                compact
              />
            </div>
          )}
        </div>

        {/* Column 3: Completed Master Episode Archive */}
        <div className="studio-card border border-slate-200/90 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                3. คลังคลิปหลักที่โพสต์แล้ว
              </h2>
              <p className="text-[11px] text-slate-500">
                ฟุตเทจทั้ง 5 ในคลิปจะถูกตัดรอบ Cooldown อัตโนมัติ
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums font-bold text-emerald-700">
              <Package className="w-3.5 h-3.5" />
              <span>{publishedEpisodes.length} EP</span>
            </span>
          </div>

          <div className="space-y-2.5">
            {paginatedPublished.map((ep) => (
              <motion.div
                key={ep.id}
                whileHover={{ y: -2, scale: 1.01 }}
                onClick={() => setSelectedEpisodeDetailId(ep.id)}
                className="p-3.5 bg-white border border-slate-200/90 rounded-xl hover:border-slate-400 cursor-pointer space-y-2 shadow-2xs transition-all"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-900">{ep.id}</span>
                  <span className="text-emerald-700 font-bold tabular-nums inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{ep.masterVideoInfo.viewsCount.toLocaleString()}</span>
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 line-clamp-1">
                  {ep.title}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {ep.rankings.map((r) => (
                    <span
                      key={r.rank}
                      className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 rounded text-slate-700"
                    >
                      #{r.rank} {r.footageId}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}

            <PaginationBar
              currentPage={col3Page}
              totalItems={publishedEpisodes.length}
              pageSize={col3PageSize}
              onPageChange={setCol3Page}
              onPageSizeChange={setCol3PageSize}
              pageSizeOptions={[4, 5, 10]}
              itemLabel="EP"
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
};
