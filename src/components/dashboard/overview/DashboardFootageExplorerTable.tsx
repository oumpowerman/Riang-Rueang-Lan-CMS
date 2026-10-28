import {
  ArrowUpDown,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Film,
  MessageSquareQuote,
  Scissors,
  Video,
} from 'lucide-react';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag } from '../../../types/tag.types';
import { hasRealDriveLink } from '../../../utils/fileNameGenerator';
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
  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Film className="w-4 h-4 text-emerald-600" />
          <span>รายการฟุตเทจตามเงื่อนไข ({filteredFootages.length} รายการ)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              <span>เดี่ยว 1:1</span>
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
              <span>หั่น 1:N</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={footageSortMode}
              onChange={(e) => setFootageSortMode(e.target.value as FootageSortMode)}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="SMART_ROI">เรียง: คุ้มค่าพร้อมใช้ (ใหม่ & สดก่อน)</option>
              <option value="REST_DAYS_DESC">เรียง: พักมานานที่สุด</option>
              <option value="USAGE_DESC">เรียง: ใช้ซ้ำมากที่สุด</option>
              <option value="Usage_ASC">เรียง: ใช้ซ้ำน้อยที่สุด</option>
              <option value="ID_DESC">เรียง: รหัสล่าสุด</option>
            </select>
          </div>
        </div>
      </div>

      {filteredFootages.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="text-sm font-bold text-slate-700">
            ไม่พบฟุตเทจที่ตรงกับตัวกรอง
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-xl cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600">
                <th className="py-2.5 px-3">รหัส & ชื่อฟุตเทจ</th>
                <th className="py-2.5 px-3">สถานะเกณฑ์สี</th>
                <th className="py-2.5 px-3">สถิติการใช้ซ้ำ & วันพัก</th>
                <th className="py-2.5 px-3 hidden md:table-cell">หมวดหมู่</th>
                <th className="py-2.5 px-3 text-right">เครื่องมือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFootages.slice(0, footageLimit).map((ft) => {
                const isCopied = copiedId === ft.id;
                return (
                  <tr
                    key={ft.id}
                    onClick={() => setTraceabilityFootageId(ft.id)}
                    className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                  >
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
                        ใช้สะสม {ft.totalUsageCount} ครั้ง{' '}
                        <span className="text-slate-400 font-normal">
                          (90วัน: {ft.usageLast90Days})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ft.daysSinceLastUsed === null
                          ? 'ยังไม่เคยลงคลิปหลัก'
                          : `พักแล้ว ${ft.daysSinceLastUsed} วัน`}
                      </div>
                    </td>

                    <td className="py-3 px-3 hidden md:table-cell">
                      <div className="flex flex-wrap items-center gap-1">
                        {ft.tags.map((tid) => (
                          <button
                            key={tid}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCategoryIdFilter((prev) =>
                                prev === tid ? null : tid
                              );
                            }}
                            className="text-[11px] font-semibold text-indigo-700 hover:underline cursor-pointer"
                          >
                            #{tagMap[tid]?.name || tid}
                          </button>
                        ))}
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
                          title={`คัดลอกชื่อไฟล์: ${ft.standardFileName}`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="hidden sm:inline">ชื่อไฟล์</span>
                            </>
                          )}
                        </button>

                        {hasRealDriveLink(ft.driveFileUrl) && (
                          <a
                            href={ft.driveFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="hidden sm:inline">Drive</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setTraceabilityFootageId(ft.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ประวัติ</span>
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
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setFootageLimit((prev) => prev + 12)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            แสดงฟุตเทจเพิ่ม ({filteredFootages.length - footageLimit} รายการที่เหลือ)
          </button>
        </div>
      )}
    </div>
  );
};
