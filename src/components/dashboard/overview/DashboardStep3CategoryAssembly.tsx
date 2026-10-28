import React from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  Clapperboard,
  Clock,
  FolderOpen,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { CategoryTag } from '../../../types/tag.types';
import {
  CategoryFilterMode,
  CategorySortMode,
  DashboardProductionRadarData,
  DashboardViewMode,
  WorkflowStep,
} from './dashboard.types';
import { DashboardProductionRadar } from './DashboardProductionRadar';

interface DashboardStep3CategoryAssemblyProps {
  activeWorkflowStep: WorkflowStep;
  viewMode: DashboardViewMode;
  handleSelectStep: (step: WorkflowStep) => void;
  productionRadar: DashboardProductionRadarData;
  isRadarExpanded: boolean;
  setIsRadarExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  categoryMatrix: CategoryMatrixStat[];
  filteredCategories: CategoryMatrixStat[];
  categoryFilterMode: CategoryFilterMode;
  setCategoryFilterMode: (mode: CategoryFilterMode) => void;
  categorySearch: string;
  setCategorySearch: (val: string) => void;
  categorySortMode: CategorySortMode;
  setCategorySortMode: (sort: CategorySortMode) => void;
  activeCategoryIdFilter: string | null;
  setActiveCategoryIdFilter: React.Dispatch<React.SetStateAction<string | null>>;
  tagMap: Record<string, CategoryTag>;
  setIsTagManagerOpen: (open: boolean) => void;
  setIsDirectFootageModalOpen: (open: boolean) => void;
  setTraceabilityFootageId: (id: string | null) => void;
  handleOpenCategoryInVault: (tagId: string) => void;
  launchEpisodeBuilderForCategory: (tagId: string) => void;
}

export const DashboardStep3CategoryAssembly: React.FC<
  DashboardStep3CategoryAssemblyProps
> = ({
  activeWorkflowStep,
  viewMode,
  handleSelectStep,
  productionRadar,
  isRadarExpanded,
  setIsRadarExpanded,
  categoryMatrix,
  filteredCategories,
  categoryFilterMode,
  setCategoryFilterMode,
  categorySearch,
  setCategorySearch,
  categorySortMode,
  setCategorySortMode,
  activeCategoryIdFilter,
  setActiveCategoryIdFilter,
  tagMap,
  setIsTagManagerOpen,
  setIsDirectFootageModalOpen,
  setTraceabilityFootageId,
  handleOpenCategoryInVault,
  launchEpisodeBuilderForCategory,
}) => {
  return (
    <motion.section
      id="step-section-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-5 transition-all ${
        activeWorkflowStep === 3 && viewMode === 'FOCUS'
          ? 'border-indigo-300/90 shadow-[0_8px_30px_rgba(99,102,241,0.08)] ring-1 ring-indigo-500/20'
          : 'border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Step 3 Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
            3
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>สเต็ปที่ 3: ชี้เป้าหมวด & จัดคลิป 5 อันดับพร้อมผลิต</span>
            </h2>
            <p className="text-xs text-slate-500">
              เลือกหมวดหมู่ที่มีฟุตเทจพร้อมใช้ครบ 5 ฟุต แล้วกดส่งเข้าห้องจัดอันดับได้ทันที
            </p>
          </div>
        </div>

        {viewMode === 'FOCUS' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectStep(2)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>กลับสเต็ป 2</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectStep(4)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <span>ไปสเต็ป 4: ตรวจคลิปหลัก</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Actionable 3-Card Production Radar */}
      <DashboardProductionRadar
        productionRadar={productionRadar}
        isRadarExpanded={isRadarExpanded}
        setIsRadarExpanded={setIsRadarExpanded}
        launchEpisodeBuilderForCategory={launchEpisodeBuilderForCategory}
        setIsDirectFootageModalOpen={setIsDirectFootageModalOpen}
        setTraceabilityFootageId={setTraceabilityFootageId}
      />

      {/* Filter, Search & Sort for Category Matrix */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl w-fit">
          {(
            [
              { id: 'ALL', label: `ทั้งหมด (${categoryMatrix.length})` },
              {
                id: 'READY_EP',
                label: `พร้อมทำ EP (${productionRadar.readyCategories.length})`,
              },
              {
                id: 'ALMOST_READY',
                label: `ใกล้ครบ 5 ฟุต (${productionRadar.almostReadyCategories.length})`,
              },
              { id: 'TIER_1', label: 'หมวดหลัก (Tier 1)' },
              { id: 'TIER_2', label: 'หมวดย่อย (Tier 2)' },
            ] as { id: CategoryFilterMode; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilterMode(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                categoryFilterMode === tab.id
                  ? 'bg-white text-indigo-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[190px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="ค้นหาชื่อหมวดหมู่..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-indigo-400"
            />
            {categorySearch && (
              <button
                type="button"
                onClick={() => setCategorySearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={categorySortMode}
              onChange={(e) => setCategorySortMode(e.target.value as CategorySortMode)}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="USABLE_DESC">เรียง: ฟุตพร้อมใช้ (มาก → น้อย)</option>
              <option value="EP_QUOTA_DESC">เรียง: จำนวน EP ที่ทำได้ทันที</option>
              <option value="ALMOST_5_ASC">เรียง: ใกล้ครบ 5 ฟุตที่สุด</option>
              <option value="TOTAL_DESC">เรียง: ฟุตทั้งหมดในหมวด</option>
              <option value="NAME_ASC">เรียง: ชื่อหมวดหมู่ (ก-ฮ)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsTagManagerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>จัดการหมวดหมู่</span>
          </button>
        </div>
      </div>

      {/* Category Cards Grid */}
      {filteredCategories.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="text-sm font-bold text-slate-700">
            ไม่พบหมวดหมู่ที่ตรงกับเงื่อนไข
          </div>
          <button
            type="button"
            onClick={() => {
              setCategorySearch('');
              setCategoryFilterMode('ALL');
            }}
            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-xl cursor-pointer"
          >
            แสดงหมวดหมู่ทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredCategories.map((stat) => {
            const availableToUse = stat.usableCount;
            const isSelectedOnDashboard = activeCategoryIdFilter === stat.tag.id;
            const parentTag = stat.tag.parentId ? tagMap[stat.tag.parentId] : null;
            const readinessPercent = Math.min(100, Math.round((availableToUse / 5) * 100));

            return (
              <div
                key={stat.tag.id}
                onClick={() =>
                  setActiveCategoryIdFilter((prev) =>
                    prev === stat.tag.id ? null : stat.tag.id
                  )
                }
                className={`rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between gap-3 border ${
                  isSelectedOnDashboard
                    ? 'bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'bg-white hover:bg-slate-50/70 border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1.5 text-[11px] font-mono">
                    <span className="text-slate-400 truncate">
                      {stat.tag.id}
                      {parentTag ? ` · ↳ ${parentTag.name}` : ''}
                    </span>
                    {stat.producibleEpisodesCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold shrink-0">
                        <Clapperboard className="w-3 h-3" />
                        <span>ทำได้ {stat.producibleEpisodesCount} EP</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold shrink-0">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>มี {availableToUse}/5 ฟุต</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      #{stat.tag.name}
                    </h3>
                    {isSelectedOnDashboard && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md shrink-0">
                        กำลังกรอง
                      </span>
                    )}
                  </div>

                  {/* Readiness Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${readinessPercent}%` }}
                        className={`h-full rounded-full ${
                          stat.producibleEpisodesCount > 0
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-amber-400 to-orange-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 4-Color Status Counts */}
                <div className="grid grid-cols-4 gap-1 text-center font-mono tabular-nums text-xs bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
                  <div title="ฟ้า ใหม่" className="flex flex-col items-center">
                    <Sparkles className="w-3 h-3 text-sky-600 mb-0.5" />
                    <div className="font-bold text-sky-700">{stat.newCount}</div>
                  </div>
                  <div title="เขียว สด" className="flex flex-col items-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 mb-0.5" />
                    <div className="font-bold text-emerald-700">{stat.readyCount}</div>
                  </div>
                  <div title="เหลือง ถี่" className="flex flex-col items-center">
                    <AlertTriangle className="w-3 h-3 text-amber-600 mb-0.5" />
                    <div className="font-bold text-amber-700">{stat.frequentCount}</div>
                  </div>
                  <div title="แดง พัก" className="flex flex-col items-center">
                    <Clock className="w-3 h-3 text-rose-600 mb-0.5" />
                    <div className="font-bold text-rose-700">{stat.cooldownCount}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCategoryInVault(stat.tag.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>คลัง ({stat.totalCount})</span>
                  </button>

                  {stat.producibleEpisodesCount > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        launchEpisodeBuilderForCategory(stat.tag.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>จัด 5 อันดับ</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400">
                      ขาดอีก {5 - availableToUse} ฟุต
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
};
