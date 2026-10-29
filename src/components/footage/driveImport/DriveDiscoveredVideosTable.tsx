import React from 'react';
import { Check, FolderOpen, Inbox, Search, Tag } from 'lucide-react';
import {
  DiscoveredDriveVideo,
  RecursiveScanResult,
} from '../../../services/driveScannerService';
import { ReconciledCategoryResult } from '../../../utils/tagReconciler';
import { DriveClipIdPrefix } from './driveImport.types';

interface DriveDiscoveredVideosTableProps {
  scanResult: RecursiveScanResult;
  displayedVideos: DiscoveredDriveVideo[];
  selectedVideoIds: Set<string>;
  onToggleSelectAll: (filteredVideos: DiscoveredDriveVideo[]) => void;
  onToggleOne: (id: string) => void;
  selectedFolderFilter: string;
  onSelectedFolderFilterChange: (folder: string) => void;
  previewSearch: string;
  onPreviewSearchChange: (search: string) => void;
  folderCategoryMap: Map<string, ReconciledCategoryResult>;
  isFolderRoutedToStaging: (folderName: string) => boolean;
  idPrefix: DriveClipIdPrefix;
  computedFootageCount: number;
}

export const DriveDiscoveredVideosTable: React.FC<DriveDiscoveredVideosTableProps> = ({
  scanResult,
  displayedVideos,
  selectedVideoIds,
  onToggleSelectAll,
  onToggleOne,
  selectedFolderFilter,
  onSelectedFolderFilterChange,
  previewSearch,
  onPreviewSearchChange,
  folderCategoryMap,
  isFolderRoutedToStaging,
  idPrefix,
  computedFootageCount,
}) => {
  return (
    <>
      {/* Video Table Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSelectAll(displayedVideos)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {displayedVideos.every((v) => selectedVideoIds.has(v.id))
                ? 'ยกเลิกเลือกทั้งหมด'
                : 'เลือกทั้งหมดในมุมมองนี้'}
            </span>
          </button>

          <span className="text-xs text-slate-500 font-mono">
            เลือกอยู่ {selectedVideoIds.size} / {scanResult.totalVideosDiscovered} ไฟล์
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Subfolder Filter Dropdown */}
          <select
            value={selectedFolderFilter}
            onChange={(e) => onSelectedFolderFilterChange(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
          >
            <option value="ALL">ทุกโฟลเดอร์ย่อย ({scanResult.videos.length})</option>
            {Array.from(folderCategoryMap.keys()).map((fname, i) => (
              <option key={i} value={fname}>
                โฟลเดอร์: {fname}
              </option>
            ))}
          </select>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={previewSearch}
              onChange={(e) => onPreviewSearchChange(e.target.value)}
              placeholder="ค้นหาชื่อไฟล์..."
              className="pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 outline-none w-36"
            />
          </div>
        </div>
      </div>

      {/* Video List Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold z-10">
            <tr>
              <th className="py-2 px-3 w-10 text-center">เลือก</th>
              <th className="py-2 px-3 w-28 font-mono">รหัสใหม่</th>
              <th className="py-2 px-3">ชื่อคลิปวิดีโอ</th>
              <th className="py-2 px-3 w-36">โฟลเดอร์ต้นทาง</th>
              <th className="py-2 px-3 w-44">หมวดหมู่ที่จะได้รับ</th>
              <th className="py-2 px-3 w-20 text-right">ความยาว</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {displayedVideos.slice(0, 150).map((video, idx) => {
              const isSelected = selectedVideoIds.has(video.id);
              const previewId = `${idPrefix}-${String(computedFootageCount + idx + 1).padStart(
                idPrefix === 'CLP' ? 3 : 4,
                '0'
              )}`;
              const folderName = video.parentFolderName || scanResult.rootFolderName;
              const isStaged = isFolderRoutedToStaging(folderName);
              const reconciled = folderCategoryMap.get(folderName);

              return (
                <tr
                  key={video.id}
                  onClick={() => onToggleOne(video.id)}
                  className={`hover:bg-slate-50 cursor-pointer ${
                    isSelected ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <td className="py-1.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleOne(video.id)}
                      className="rounded text-indigo-600 cursor-pointer"
                    />
                  </td>
                  <td className="py-1.5 px-3 font-bold text-indigo-700">{previewId}</td>
                  <td className="py-1.5 px-3 font-sans font-bold text-slate-900 truncate max-w-xs">
                    {video.cleanTitle}
                  </td>
                  <td className="py-1.5 px-3 font-sans text-slate-600 truncate max-w-[130px]">
                    <span className="inline-flex items-center gap-1 truncate">
                      <FolderOpen className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{video.parentFolderName}</span>
                    </span>
                  </td>
                  <td className="py-1.5 px-3 font-sans">
                    {isStaged ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                        <Inbox className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>พื้นที่พักรอจัดหมวดหมู่</span>
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          reconciled?.isNew
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        <Tag className="w-2.5 h-2.5 shrink-0" />
                        <span>#{reconciled?.cleanedCategoryName || 'ทั่วไป'}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-500 font-mono">
                    {video.durationSec}s
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {displayedVideos.length > 150 && (
        <p className="text-[11px] text-slate-400 text-right">
          * แสดง 150 รายการแรกจากทั้งหมด {displayedVideos.length} ไฟล์
        </p>
      )}
    </>
  );
};
