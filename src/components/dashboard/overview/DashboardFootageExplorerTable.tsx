import React from 'react';
import {
  ArrowUpDown,
  Check,
  ChevronRight,
  Copy,
  Film,
  Inbox,
  MessageSquareQuote,
  Scissors,
  Tag,
  Video,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { isFootageInStaging, isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag } from '../../../types/tag.types';
import { hasRealDriveLink } from '../../../utils/fileNameGenerator';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';
import { StatusBadge } from '../../ui/StatusBadge';
import {
  FlowFilter,
  FootageSortMode,
} from './dashboard.types';

interface DashboardFootageExplorerTableProps {
  filteredFootages: ComputedFootage[];
  footageLimit: number;
  setFootageLimit: React.Dispatch<React.SetStateAction<number>>;
  activeFlowFilter: FlowFilter;
  setActiveFlowFilter: (flow: FlowFilter) => void;
  footageSortMode: FootageSortMode;
  setFootageSortMode: (sort: FootageSortMode) => void;
  setActiveCategoryIdFilter: React.Dispatch<React.SetStateAction<string | null>>;
  tagMap: Record<string, CategoryTag>;
  copiedId: string | null;
  handleCopyText: (id: string, text: string, e?: React.MouseEvent) => void;
  setTraceabilityFootageId: (id: string | null) => void;
  resetAllFilters: () => void;
}

export const DashboardFootageExplorerTable: React.FC<
  DashboardFootageExplorerTableProps
> = ({
  filteredFootages,
  footageLimit,
  setFootageLimit,
  activeFlowFilter,
  setActiveFlowFilter,
  footageSortMode,
  setFootageSortMode,
  setActiveCategoryIdFilter,
  tagMap,
  copiedId,
  handleCopyText,
  setTraceabilityFootageId,
  resetAllFilters,
}) => {
  const {
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
    setIsGoogleDriveBatchModalOpen,
    setIsBatchAssignCategoryModalOpen,
  } = useCMS();

  const visibleFootages = filteredFootages.slice(0, footageLimit);
  const stagingItems = filteredFootages.filter((ft) => isFootageInStaging(ft.tags));

  const isAllVisibleSelected =
    visibleFootages.length > 0 &&
    visibleFootages.every((ft) => selectedFootageIdsForBatch.includes(ft.id));

  const handleToggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      const visibleIdSet = new Set(visibleFootages.map((f) => f.id));
      setSelectedFootageIdsForBatch((prev) => prev.filter((id) => !visibleIdSet.has(id)));
    } else {
      const newSelected = Array.from(
        new Set([...selectedFootageIdsForBatch, ...visibleFootages.map((f) => f.id)])
      );
      setSelectedFootageIdsForBatch(newSelected);
    }
  };

  const handleSelectAllStagingItems = () => {
    const stagingIds = stagingItems.map((f) => f.id);
    setSelectedFootageIdsForBatch(
      Array.from(new Set([...selectedFootageIdsForBatch, ...stagingIds]))
    );
  };

  const handleToggleSelectOne = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFootageIdsForBatch((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Top Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Film className="w-4 h-4 text-emerald-600" />
          <span>ฟุตเทจ ({filteredFootages.length})</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsGoogleDriveBatchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <GoogleDriveIcon className="w-3.5 h-3.5" />
            <span>ดึงข้อมูลจาก Drive</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveFlowFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeFlowFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setActiveFlowFilter('DIRECT_1_TO_1')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeFlowFilter === 'DIRECT_1_TO_1'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-3 h-3 text-slate-500" />
              <span>1:1</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFlowFilter('SPLIT_1_TO_N')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeFlowFilter === 'SPLIT_1_TO_N'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scissors className="w-3 h-3 text-indigo-500" />
              <span>1:N</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={footageSortMode}
              onChange={(e) => setFootageSortMode(e.target.value as FootageSortMode)}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="SMART_ROI">พร้อมใช้ก่อน</option>
              <option value="REST_DAYS_DESC">พักนานสุด</option>
              <option value="USAGE_DESC">ใช้มากสุด</option>
              <option value="Usage_ASC">ใช้น้อยสุด</option>
              <option value="ID_DESC">รหัสล่าสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Compact Staging Triage Bar */}
      {stagingItems.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white font-mono font-bold">
              <Inbox className="w-3 h-3" />
              {stagingItems.length}
            </span>
            <span className="font-bold text-amber-950">คลิปไม่มีหมวดหมู่</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSelectAllStagingItems}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg font-bold text-xs transition-colors cursor-pointer"
            >
              เลือกทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectAllStagingItems();
                setIsBatchAssignCategoryModalOpen(true);
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Tag className="w-3 h-3 text-amber-300" />
              <span>จัดหมวดหมู่</span>
            </button>
          </div>
        </div>
      )}

      {filteredFootages.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="text-sm font-bold text-slate-700">ไม่พบฟุตเทจ</div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-xl cursor-pointer"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600">
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={handleToggleSelectAllVisible}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    title="เลือกหน้านี้"
                  />
                </th>
                <th className="py-2.5 px-3">คลิป</th>
                <th className="py-2.5 px-3">สถานะ</th>
                <th className="py-2.5 px-3">การใช้งาน</th>
                <th className="py-2.5 px-3 hidden md:table-cell">หมวดหมู่</th>
                <th className="py-2.5 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFootages.slice(0, footageLimit).map((ft) => {
                const isCopied = copiedId === ft.id;
                const isSelected = selectedFootageIdsForBatch.includes(ft.id);
                return (
                  <tr
                    key={ft.id}
                    onClick={() => setTraceabilityFootageId(ft.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 hover:bg-indigo-100/60'
                        : 'hover:bg-emerald-50/40'
                    }`}
                  >
                    <td
                      className="py-3 px-3 w-10 text-center"
                      onClick={(e) => handleToggleSelectOne(ft.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      />
                    </td>
                    <td className="py-3 px-3 min-w-[210px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700 shrink-0">
                          {ft.id}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono shrink-0">
                          {ft.ingestionFlow === 'DIRECT_1_TO_1' ? (
                            <>
                              <Video className="w-3 h-3 text-slate-400" />
                              <span>1:1</span>
                            </>
                          ) : (
                            <>
                              <Scissors className="w-3 h-3 text-indigo-500" />
                              <span>1:N</span>
                            </>
                          )}
                        </span>
                        <span className="font-bold text-slate-900 truncate max-w-[260px]">
                          {ft.title}
                        </span>
                      </div>
                      {ft.mascotNotes && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[320px] mt-0.5">
                          <MessageSquareQuote className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{ft.mascotNotes}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge
                        status={ft.cooldownStatus}
                        compact
                        daysSinceLastUse={ft.daysSinceLastUsed}
                        usageLast90Days={ft.usageLast90Days}
                        totalUsageCount={ft.totalUsageCount}
                      />
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap">
                      <div className="font-bold text-slate-800">
                        {ft.totalUsageCount} ครั้ง{' '}
                        <span className="text-slate-400 font-normal">
                          (90ว: {ft.usageLast90Days})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ft.daysSinceLastUsed === null
                          ? 'ยังไม่เคยใช้'
                          : `พัก ${ft.daysSinceLastUsed}ว.`}
                      </div>
                    </td>

                    <td className="py-3 px-3 hidden md:table-cell">
                      <div className="flex flex-wrap items-center gap-1">
                        {ft.tags.map((tid) => {
                          const isStaging = isStagingTagId(tid);
                          return (
                            <button
                              key={tid}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCategoryIdFilter((prev) =>
                                  prev === tid ? null : tid
                                );
                              }}
                              className={`text-[11px] font-semibold cursor-pointer ${
                                isStaging
                                  ? 'px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'text-indigo-700 hover:underline'
                              }`}
                            >
                              {isStaging ? 'ไม่มีหมวดหมู่' : `#${tagMap[tid]?.name || tid}`}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td
                      className="py-3 px-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) =>
                            handleCopyText(ft.id, ft.standardFileName, e)
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                          title={`คัดลอก: ${ft.standardFileName}`}
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {hasRealDriveLink(ft.driveFileUrl) && (
                          <a
                            href={ft.driveFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-colors"
                            title="เปิดไฟล์ใน Google Drive"
                          >
                            <GoogleDriveIcon className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setTraceabilityFootageId(ft.id)}
                          className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                          title="ดูรายละเอียดคลิป"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredFootages.length > footageLimit && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setFootageLimit((prev) => prev + 12)}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            แสดงเพิ่ม ({filteredFootages.length - footageLimit})
          </button>
        </div>
      )}
    </div>
  );
};
