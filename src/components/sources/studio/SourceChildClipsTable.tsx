import React from 'react';
import {
  CheckSquare,
  Film,
  HardDrive,
  Rocket,
  Sparkles,
  Square,
  Zap,
} from 'lucide-react';
import { ComputedFootage } from '../../../types/footage.types';
import { RawSource } from '../../../types/source.types';
import { SystemSettings } from '../../../types/settings.types';
import { hasRealDriveLink } from '../../../utils/fileNameGenerator';
import { PaginationBar } from '../../ui/PaginationBar';
import { StatusBadge } from '../../ui/StatusBadge';

interface SourceChildClipsTableProps {
  source: RawSource;
  childFootages: ComputedFootage[];
  usableChildrenCount: number;
  selectedIdsForSource: string[];
  primaryTagId: string;
  currentChildPage: number;
  childPageSize: number;
  settings: SystemSettings;
  onSelectTop5Ready: (source: RawSource) => void;
  onLaunchEpisodeWithCustomClips: (
    clipIds: string[],
    categoryTagId: string,
    suggestedTitle: string
  ) => void;
  onToggleSelectClip: (sourceId: string, footageId: string) => void;
  onSelectForTraceability: (footageId: string) => void;
  onChildPageChange: (page: number) => void;
  onChildPageSizeChange: (size: number) => void;
}

export const SourceChildClipsTable: React.FC<SourceChildClipsTableProps> = ({
  source,
  childFootages,
  usableChildrenCount,
  selectedIdsForSource,
  primaryTagId,
  currentChildPage,
  childPageSize,
  settings,
  onSelectTop5Ready,
  onLaunchEpisodeWithCustomClips,
  onToggleSelectClip,
  onSelectForTraceability,
  onChildPageChange,
  onChildPageSizeChange,
}) => {
  const paginatedChildFootages = childFootages.slice(
    (currentChildPage - 1) * childPageSize,
    currentChildPage * childPageSize
  );

  return (
    <div className="space-y-2.5">
      <div className="text-xs font-semibold text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Film className="w-3.5 h-3.5 text-slate-500" />
          <span>
            รายการฟุตเทจย่อยที่ถูกหั่นออกจาก {source.id} ({childFootages.length}{' '}
            รายการ):
          </span>
          <span className="text-[11px] font-mono text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <Zap className="w-3 h-3 text-emerald-600" />
            <span>
              พร้อมหยิบไปทำคลิป {usableChildrenCount}/{childFootages.length} ฟุต
            </span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {usableChildrenCount > 0 && (
            <button
              type="button"
              onClick={() => onSelectTop5Ready(source)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>ติ๊กเลือกช็อตพร้อมใช้สูงสุด 5 อันดับแรก</span>
            </button>
          )}

          {selectedIdsForSource.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onLaunchEpisodeWithCustomClips(
                  selectedIdsForSource,
                  primaryTagId,
                  `5 อันดับ ${source.title.slice(0, 32)} คัดช็อตเน้นๆ`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>
                ส่ง {selectedIdsForSource.length} ช็อตที่ติ๊กไปหน้าจัด 5 อันดับทันที
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <th className="py-2.5 px-3 w-10 text-center">เลือก</th>
              <th className="py-2.5 px-3">ช็อตที่</th>
              <th className="py-2.5 px-3">รหัสฟุต</th>
              <th className="py-2.5 px-3">ช่วงเวลา (Timestamp)</th>
              <th className="py-2.5 px-3">รายละเอียดช็อตฮา</th>
              <th className="py-2.5 px-3">ไฟล์ Google Drive</th>
              <th className="py-2.5 px-3">สถิติความถี่เทียบเวลา</th>
              <th className="py-2.5 px-3">สถานะความสด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginatedChildFootages.map((ft, idx) => {
              const globalIdx = (currentChildPage - 1) * childPageSize + idx + 1;
              const isSelected = selectedIdsForSource.includes(ft.id);
              const hasDrive = hasRealDriveLink(ft.driveFileUrl);

              return (
                <tr
                  key={ft.id}
                  onClick={() => onSelectForTraceability(ft.id)}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <td
                    className="py-2.5 px-3 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectClip(source.id, ft.id);
                    }}
                  >
                    <button
                      type="button"
                      className="text-slate-500 hover:text-indigo-600 cursor-pointer"
                      title="ติ๊กเลือกช็อตนี้เพื่อส่งไปจัด 5 อันดับ"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                    #{globalIdx}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {ft.id}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-indigo-700 whitespace-nowrap">
                    {ft.timestampRange || '-'}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {ft.title}
                  </td>
                  <td
                    className="py-2.5 px-3 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasDrive ? (
                      <a
                        href={ft.driveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-[11px]"
                      >
                        <HardDrive className="w-3 h-3" />
                        <span>เปิดไฟล์ Drive</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px]">
                        รอแนบลิงก์
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600">
                    {ft.velocitySummaryText}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <StatusBadge
                      status={ft.cooldownStatus}
                      daysSinceLastUse={ft.daysSinceLastUsed}
                      cooldownDays={settings.cooldownDays}
                      usageLast90Days={ft.usageLast90Days}
                      compact
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Child Split Footages Pagination */}
      {childFootages.length > childPageSize && (
        <PaginationBar
          currentPage={currentChildPage}
          totalItems={childFootages.length}
          pageSize={childPageSize}
          onPageChange={onChildPageChange}
          onPageSizeChange={onChildPageSizeChange}
          pageSizeOptions={[4, 6, 10]}
          itemLabel="ช็อตย่อย"
          compact
        />
      )}
    </div>
  );
};
