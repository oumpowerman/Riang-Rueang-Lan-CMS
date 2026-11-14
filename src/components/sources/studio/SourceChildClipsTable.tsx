import React, { useState } from 'react';
import {
  CheckSquare,
  Edit2,
  Film,
  Plus,
  Rocket,
  Sparkles,
  Square,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { ComputedFootage } from '../../../types/footage.types';
import { RawSource } from '../../../types/source.types';
import { SystemSettings } from '../../../types/tag.types';
import { hasRealDriveLink } from '../../../utils/fileNameGenerator';
import { VideoThumbnailPreview } from '../../footage/VideoThumbnailPreview';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';
import { PaginationBar } from '../../ui/PaginationBar';
import { StatusBadge } from '../../ui/StatusBadge';
import { QuickDriveLinkPopover } from './QuickDriveLinkPopover';

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
  const { setPreviewFootageId, updateFootage } = useCMS();
  const [popoverFootage, setPopoverFootage] = useState<{
    id: string;
    title: string;
    driveFileUrl: string;
  } | null>(null);

  const handleSaveDriveUrl = (newUrl: string) => {
    if (!popoverFootage) return;
    updateFootage(popoverFootage.id, { driveFileUrl: newUrl });
  };

  const paginatedChildFootages = childFootages.slice(
    (currentChildPage - 1) * childPageSize,
    currentChildPage * childPageSize
  );

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-[#554d44] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-[#3b6845]" />
          <span className="font-bold text-[#2d2926]">
            คลิปย่อย ({childFootages.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {usableChildrenCount > 0 && (
            <button
              type="button"
              onClick={() => onSelectTop5Ready(source)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#244b2f] bg-[#edf4ed] hover:bg-[#dceadc] border border-[#bad8b9] rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#3b6845]" />
              <span>เลือก 5 คลิปพร้อมใช้</span>
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
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-[#3b6845] hover:bg-[#2c5234] rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>จัด 5 อันดับ ({selectedIdsForSource.length})</span>
            </button>
          )}
        </div>
      </div>

      <div className="border border-[#e8dfd3] rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#faf7f2] border-b border-[#e8dfd3] text-[11px] font-bold text-[#554d44]">
              <th className="py-2 px-3 w-10 text-center"></th>
              <th className="py-2 px-3">#</th>
              <th className="py-2 px-3">พรีวิว</th>
              <th className="py-2 px-3">รหัส</th>
              <th className="py-2 px-3">เวลา</th>
              <th className="py-2 px-3">ชื่อคลิป</th>
              <th className="py-2 px-3">Drive</th>
              <th className="py-2 px-3">การใช้งาน</th>
              <th className="py-2 px-3">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee6da] text-xs">
            {paginatedChildFootages.map((ft, idx) => {
              const globalIdx = (currentChildPage - 1) * childPageSize + idx + 1;
              const isSelected = selectedIdsForSource.includes(ft.id);
              const hasDrive = hasRealDriveLink(ft.driveFileUrl);

              return (
                <tr
                  key={ft.id}
                  onClick={() => onSelectForTraceability(ft.id)}
                  className={`hover:bg-[#faf7f2] cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#edf4ed]/60' : ''
                  }`}
                >
                  <td
                    className="py-2 px-3 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectClip(source.id, ft.id);
                    }}
                  >
                    <button
                      type="button"
                      className="text-[#8c8275] hover:text-[#3b6845] cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#3b6845]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums text-[#8c8275]">
                    #{globalIdx}
                  </td>
                  <td
                    className="py-2 px-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <VideoThumbnailPreview
                      footage={ft}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFootageId(ft.id);
                      }}
                    />
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-[#244b2f] whitespace-nowrap">
                    {ft.id}
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums text-[#554d44] whitespace-nowrap">
                    {ft.timestampRange || '-'}
                  </td>
                  <td className="py-2 px-3 font-medium text-[#2d2926]">
                    {ft.title}
                  </td>
                  <td
                    className="py-2 px-3 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasDrive ? (
                      <div className="inline-flex items-center gap-1">
                        <a
                          href={ft.driveFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fdfbf7] text-[#4d4740] hover:bg-[#f4eee4] border border-[#e2d8cb] font-semibold text-[11px]"
                          title="เปิดไฟล์ Google Drive"
                        >
                          <GoogleDriveIcon className="w-3 h-3" />
                          <span>Drive</span>
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setPopoverFootage({
                              id: ft.id,
                              title: ft.title,
                              driveFileUrl: ft.driveFileUrl,
                            })
                          }
                          className="p-1 text-stone-400 hover:text-indigo-600 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                          title="แก้ไขลิงก์ Drive"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setPopoverFootage({
                            id: ft.id,
                            title: ft.title,
                            driveFileUrl: '',
                          })
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-300/80 font-bold text-[11px] transition-all cursor-pointer shadow-2xs hover:scale-102"
                        title="คลิกเพื่อวางลิงก์ Google Drive ด่วน"
                      >
                        <Plus className="w-3 h-3 text-amber-700" />
                        <span>รอลิงก์</span>
                      </button>
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums text-[#554d44]">
                    {ft.velocitySummaryText}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
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

      {childFootages.length > childPageSize && (
        <PaginationBar
          currentPage={currentChildPage}
          totalItems={childFootages.length}
          pageSize={childPageSize}
          onPageChange={onChildPageChange}
          onPageSizeChange={onChildPageSizeChange}
          pageSizeOptions={[4, 6, 10]}
          itemLabel="คลิปย่อย"
          compact
        />
      )}

      {popoverFootage && (
        <QuickDriveLinkPopover
          footageId={popoverFootage.id}
          footageTitle={popoverFootage.title}
          currentUrl={popoverFootage.driveFileUrl}
          isOpen={Boolean(popoverFootage)}
          onClose={() => setPopoverFootage(null)}
          onSave={handleSaveDriveUrl}
        />
      )}
    </div>
  );
};
