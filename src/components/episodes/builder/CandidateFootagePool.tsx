import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpDown,
  Globe,
  GripVertical,
  Search,
  Film,
  Video,
  Scissors,
  Zap,
  Sparkles,
  CheckCircle2,
  ListFilter,
  AlertTriangle,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { CategoryMatrixStat, useCMS } from '../../../context/CMSContext';
import {
  EpisodeProductionTarget,
  EpisodeRankingSlot,
} from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import {
  CategoryGroup,
  CategoryTag,
  SystemSettings,
} from '../../../types/tag.types';
import { VideoThumbnailPreview } from '../../footage/VideoThumbnailPreview';
import { CategoryGroupIcon } from '../../ui/CategoryGroupIcon';
import { PaginationBar } from '../../ui/PaginationBar';
import { StatusBadge } from '../../ui/StatusBadge';
import { TagPill } from '../../ui/TagPill';
import {
  LiveCategoryStock,
  PickerSortBy,
  PoolQuickFilter,
  RANK_ORDER_1_TO_5,
  RankNumber,
} from './builder.types';

interface CandidateFootagePoolProps {
  className?: string;
  isExpanded?: boolean;
  onCollapseToStrip?: () => void;
  categoryGroups: CategoryGroup[];
  activeGroup: CategoryGroup | null;
  activeCategoryStat: CategoryMatrixStat | null;
  productionTarget: EpisodeProductionTarget;
  activeSubcategory: CategoryTag | null;
  currentSubcategories?: CategoryTag[];
  poolSubcategoryFilterId?: string | null;
  onChangePoolSubcategoryFilterId?: (subId: string | null) => void;
  computedFootage?: ComputedFootage[];
  liveCategoryStock: LiveCategoryStock;
  allowCrossCategory: boolean;
  onToggleCrossCategory: () => void;
  onEnableCrossCategory: () => void;
  poolFilterGroupId: string;
  onChangePoolFilterGroupId: (groupId: string) => void;
  poolQuickFilter: PoolQuickFilter;
  onChangePoolQuickFilter: (filter: PoolQuickFilter) => void;
  pickerSearch: string;
  onChangePickerSearch: (q: string) => void;
  pickerSortBy: PickerSortBy;
  onChangePickerSortBy: (sort: PickerSortBy) => void;
  pickerCandidatesCount: number;
  paginatedPickerCandidates: ComputedFootage[];
  pickerPage: number;
  pickerPageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  rankings: EpisodeRankingSlot[];
  selectedFootageIds: string[];
  footageToAssignedRankMap: Record<string, RankNumber>;
  onAssignFootageToRank: (rank: RankNumber, footageId: string) => void;
  tagMap: Record<string, CategoryTag>;
  settings: SystemSettings;
}

export const CandidateFootagePool: React.FC<CandidateFootagePoolProps> = ({
  className,
  isExpanded = false,
  onCollapseToStrip,
  categoryGroups,
  activeGroup,
  activeCategoryStat,
  productionTarget,
  activeSubcategory,
  currentSubcategories = [],
  poolSubcategoryFilterId,
  onChangePoolSubcategoryFilterId,
  computedFootage = [],
  liveCategoryStock,
  allowCrossCategory,
  onToggleCrossCategory,
  onEnableCrossCategory,
  poolFilterGroupId,
  onChangePoolFilterGroupId,
  poolQuickFilter,
  onChangePoolQuickFilter,
  pickerSearch,
  onChangePickerSearch,
  pickerSortBy,
  onChangePickerSortBy,
  pickerCandidatesCount,
  paginatedPickerCandidates,
  pickerPage,
  pickerPageSize,
  onPageChange,
  onPageSizeChange,
  rankings,
  selectedFootageIds,
  footageToAssignedRankMap,
  onAssignFootageToRank,
  tagMap,
  settings,
}) => {
  const { setPreviewFootageId } = useCMS();

  // Find first empty rank for the 1-click "+ ลงอันดับว่าง" helper
  const nextEmptyRank = useMemo(() => {
    const emptySlot = rankings.find((r) => r.footageId === null);
    return emptySlot ? emptySlot.rank : null;
  }, [rankings]);

  // Compute counts per subcategory in current main category to help user focus quickly
  const subcategoryCounts = useMemo(() => {
    if (!currentSubcategories || currentSubcategories.length === 0) return {};
    const map: Record<string, number> = {};
    for (const sub of currentSubcategories) {
      map[sub.id] = computedFootage.filter((ft) => ft.tags.includes(sub.id)).length;
    }
    return map;
  }, [currentSubcategories, computedFootage]);

  return (
    <div
      className={`bg-[#fdfbf7] border border-[#e8dfd3] rounded-2xl p-4 space-y-3.5 shadow-xs transition-colors ${
        className || ''
      }`}
    >
      {/* Header: Title + Cross-Category Toggle + Optional Collapse Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#eee6da]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#2d2926] flex items-center gap-1.5">
            <Film className="w-4 h-4 text-[#3b6845] shrink-0" />
            <span>คลังฟุตเทจ ({pickerCandidatesCount} คลิป)</span>{' '}
            {allowCrossCategory ? (
              <span className="text-[#3b6845] text-xs font-semibold">(ข้ามหมวด)</span>
            ) : (
              <span className="text-[#787066] text-xs font-semibold">
                (#{activeCategoryStat?.tag.name})
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleCrossCategory}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
              allowCrossCategory
                ? 'bg-[#3b6845] text-white border-[#3b6845] shadow-xs'
                : 'bg-[#faf7f2] text-[#4d4740] border-[#e8dfd3] hover:border-[#bad8b9]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{allowCrossCategory ? 'กลับหมวดเดิม' : 'ดึงข้ามหมวด'}</span>
          </button>

          {onCollapseToStrip && (
            <button
              type="button"
              onClick={onCollapseToStrip}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#554d44] bg-[#faf7f2] hover:bg-[#eae1d4] border border-[#e8dfd3] rounded-xl transition-colors cursor-pointer"
              title="ย่อคลังคลิปกลับไปแสดงสูตรด่วนเต็มจอ"
            >
              <span>พับเก็บ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tier 0 CategoryGroup Filter Bar when Cross-Category Mode is Active */}
      {allowCrossCategory && (
        <div className="bg-[#f7f3eb] border border-[#e2d8cb] rounded-xl p-2.5 space-y-1.5">
          <div className="text-[11px] font-bold text-[#47413a] flex items-center gap-1">
            <ListFilter className="w-3 h-3 text-[#7b5d3a]" />
            <span>กรองตามกลุ่มหมวดหมู่:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onChangePoolFilterGroupId('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                poolFilterGroupId === 'ALL'
                  ? 'bg-[#3b6845] text-white shadow-xs'
                  : 'bg-white text-[#4d4740] border border-[#e2d8cb] hover:bg-[#faf7f2]'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>ทุกกลุ่ม</span>
            </button>
            {categoryGroups.map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => onChangePoolFilterGroupId(grp.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  poolFilterGroupId === grp.id
                    ? 'bg-[#3b6845] text-white shadow-xs'
                    : 'bg-white text-[#4d4740] border border-[#e2d8cb] hover:bg-[#faf7f2]'
                }`}
              >
                <CategoryGroupIcon icon={grp.icon} className="w-3.5 h-3.5 shrink-0" />
                <span>{grp.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stock Filter Tabs (Shortened, Concise & Focused) */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-1">
          {(
            [
              {
                id: 'AVAILABLE_USABLE',
                icon: Zap,
                label: `พร้อมใช้ (${
                  liveCategoryStock.remainingNew + liveCategoryStock.remainingFresh
                })`,
              },
              {
                id: 'ONLY_NEW',
                icon: Sparkles,
                label: `ฟุตใหม่ (${liveCategoryStock.remainingNew})`,
              },
              {
                id: 'ONLY_FRESH',
                icon: CheckCircle2,
                label: `ฟุตเก่าสด (${liveCategoryStock.remainingFresh})`,
              },
              {
                id: 'ALL',
                icon: ListFilter,
                label: `ทั้งหมด (${pickerCandidatesCount})`,
              },
            ] as const
          ).map((tab) => {
            const TabIcon = tab.icon;
            const isTabActive = poolQuickFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangePoolQuickFilter(tab.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer border ${
                  isTabActive
                    ? 'bg-[#edf4ed] text-[#244b2f] border-[#bad8b9] shadow-xs'
                    : 'bg-[#faf7f2] text-[#4d4740] border-[#e8dfd3] hover:bg-white'
                }`}
              >
                <TabIcon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Subcategory Quick Filter Chips (Solves 200+ clips clutter!) */}
        {currentSubcategories.length > 0 && onChangePoolSubcategoryFilterId && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#eee6da]">
            <span className="text-[11px] font-bold text-[#787066] mr-0.5">หมวดย่อย:</span>
            <button
              type="button"
              onClick={() => onChangePoolSubcategoryFilterId(null)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                poolSubcategoryFilterId === null
                  ? 'bg-[#3b6845] text-white border-[#3b6845]'
                  : 'bg-white text-[#554d44] border-[#e2d8cb] hover:bg-[#faf7f2]'
              }`}
            >
              ทั้งหมด ({pickerCandidatesCount})
            </button>
            {currentSubcategories.map((sub) => {
              const isSelected = poolSubcategoryFilterId === sub.id;
              const count = subcategoryCounts[sub.id] || 0;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() =>
                    onChangePoolSubcategoryFilterId(isSelected ? null : sub.id)
                  }
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-[#fdf3ec] text-[#8e4537] border-[#f5d7cf] ring-1 ring-[#f2bfae]'
                      : 'bg-white text-[#554d44] border-[#e2d8cb] hover:bg-[#fdf3ec]'
                  }`}
                >
                  <span>{sub.name}</span>{' '}
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search & Sort Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#9a9186] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={pickerSearch}
              onChange={(e) => onChangePickerSearch(e.target.value)}
              placeholder="ค้นหารหัส FT-XXXX หรือชื่อคลิป..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#faf7f2] border border-[#e8dfd3] rounded-xl focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#9a9186]" />
            <select
              value={pickerSortBy}
              onChange={(e) => onChangePickerSortBy(e.target.value as PickerSortBy)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-[#faf7f2] border border-[#e8dfd3] rounded-xl text-[#2d2926] focus:outline-none cursor-pointer"
            >
              <option value="REST_DAYS_DESC">พักนานสุดขึ้นก่อน</option>
              <option value="USAGE_90D_ASC">ใช้ใน 90 วันน้อยสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Footage Cards */}
      <div
        className={
          isExpanded
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-2.5'
            : 'space-y-2.5'
        }
      >
        {paginatedPickerCandidates.length === 0 ? (
          <div className="p-6 text-center bg-[#faf7f2] border border-[#e8dfd3] rounded-xl space-y-2">
            <p className="text-xs font-bold text-[#554d44]">
              ไม่มีฟุตเทจที่ว่างตามตัวกรองนี้ในหมวด #{activeCategoryStat?.tag.name}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onChangePoolQuickFilter('ALL')}
                className="px-3 py-1.5 text-xs font-bold text-[#4d4740] bg-white border border-[#e2d8cb] rounded-lg hover:bg-[#faf7f2] cursor-pointer"
              >
                ดูฟุตทั้งหมดในหมวดนี้
              </button>
              <button
                type="button"
                onClick={onEnableCrossCategory}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#3b6845] rounded-lg hover:bg-[#2c5234] cursor-pointer shadow-xs"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>ดึงฟุตข้ามหมวดอื่นมาช่วยผสม</span>
              </button>
            </div>
          </div>
        ) : (
          paginatedPickerCandidates.map((ft, idx) => {
            const assignedRank = footageToAssignedRankMap[ft.id];
            const collidingPartnerIds = selectedFootageIds.filter(
              (selId) => selId !== ft.id && (ft.coUsedWithMap[selId] || 0) > 0
            );

            return (
              <motion.div
                key={ft.id}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.24,
                  delay: Math.min(idx * 0.025, 0.18),
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({ type: 'FOOTAGE', footageId: ft.id })
                    );
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className={`p-3 border rounded-xl transition-colors space-y-2 cursor-grab active:cursor-grabbing ${
                    assignedRank
                      ? 'bg-[#edf4ed]/70 border-[#bad8b9]'
                      : 'bg-white border-[#e8dfd3] hover:border-[#bad8b9] shadow-2xs'
                  }`}
                >
                <div className="flex items-start gap-2.5">
                  <VideoThumbnailPreview
                    footage={ft}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFootageId(ft.id);
                    }}
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <GripVertical className="w-3.5 h-3.5 text-[#9a9186]" />
                        <span className="font-extrabold text-[#2d2926]">
                          {ft.id}
                        </span>
                        <span className="text-[#787066] text-[11px] inline-flex items-center gap-1">
                          {ft.ingestionFlow === 'DIRECT_1_TO_1' ? (
                            <>
                              <Video className="w-3 h-3 text-[#4c684b]" />
                              <span>1:1</span>
                            </>
                          ) : (
                            <>
                              <Scissors className="w-3 h-3 text-[#8a632b]" />
                              <span>{ft.sourceId}</span>
                            </>
                          )}
                        </span>
                      </div>

                      <StatusBadge
                        status={ft.cooldownStatus}
                        daysSinceLastUse={ft.daysSinceLastUsed}
                        cooldownDays={settings.cooldownDays}
                        greenReadyDays={settings.greenReadyDays}
                        usageLast90Days={ft.usageLast90Days}
                        totalUsageCount={ft.totalUsageCount}
                        maxTotalUsageCount={settings.maxTotalUsageCount}
                        compact
                      />
                    </div>

                    <div className="text-xs font-bold text-[#2d2926] line-clamp-1">
                      {ft.title}
                    </div>
                  </div>
                </div>

                {collidingPartnerIds.length > 0 && !assignedRank && (
                  <div className="text-[11px] text-[#8e4537] bg-[#fdf3ec] border border-[#f5d7cf] rounded-lg px-2 py-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-[#a34c3c] shrink-0" />
                    <span>เคยผสมคู่กับ {collidingPartnerIds.join(', ')} ใน EP ก่อนหน้า</span>
                  </div>
                )}

                {/* Bottom Row: Tags + 1-Click [+ ว่าง] or Direct [1][2][3][4][5] Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#eee6da]">
                  <div className="flex flex-wrap items-center gap-1">
                    {ft.tags.map((tid) => (
                      <TagPill key={tid} tag={tagMap[tid]} />
                    ))}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!assignedRank && nextEmptyRank && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onAssignFootageToRank(nextEmptyRank, ft.id)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-[#edf4ed] text-[#244b2f] border border-[#bad8b9] hover:bg-[#3b6845] hover:text-white transition-colors cursor-pointer flex items-center gap-0.5 mr-1"
                        title={`ใส่ในอันดับที่ ${nextEmptyRank} ที่ยังว่าง`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>ลงอันดับ {nextEmptyRank}</span>
                      </motion.button>
                    )}

                    <div className="flex items-center gap-0.5">
                      {RANK_ORDER_1_TO_5.map((rankNum) => {
                        const isAssignedHere = assignedRank === rankNum;
                        const slotHasOtherClip =
                          !isAssignedHere &&
                          Boolean(
                            rankings.find((r) => r.rank === rankNum)?.footageId
                          );

                        return (
                          <motion.button
                            key={rankNum}
                            type="button"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => onAssignFootageToRank(rankNum, ft.id)}
                            className={`w-6 h-6 rounded-lg text-xs font-mono font-extrabold transition-colors cursor-pointer ${
                              isAssignedHere
                                ? 'bg-[#3b6845] text-white shadow-xs'
                                : slotHasOtherClip
                                ? 'bg-[#f4eee4] text-[#6b645b] border border-[#e2d8cb] hover:bg-[#3b6845] hover:text-white'
                                : 'bg-[#edf4ed] text-[#244b2f] border border-[#bad8b9] hover:bg-[#3b6845] hover:text-white'
                            }`}
                            title={
                              isAssignedHere
                                ? `อยู่ในอันดับที่ ${rankNum} แล้ว`
                                : slotHasOtherClip
                                ? `แทนที่ฟุตในอันดับที่ ${rankNum}`
                                : `ใส่ในอันดับที่ ${rankNum}`
                            }
                          >
                            {rankNum}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </div>
              </motion.div>
            );
          })
        )}

        <PaginationBar
          currentPage={pickerPage}
          totalItems={pickerCandidatesCount}
          pageSize={pickerPageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[6, 8, 12, 20]}
          itemLabel="ฟุตเทจ"
          compact
        />
      </div>
    </div>
  );
};
