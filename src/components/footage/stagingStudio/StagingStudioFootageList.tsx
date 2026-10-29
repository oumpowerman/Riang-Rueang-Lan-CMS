import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  FileVideo,
  GripVertical,
  Search,
  Square,
  X,
  Bookmark,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { ComputedFootage } from '../../../types/footage.types';
import { hasRealDriveLink } from '../../../utils/fileNameGenerator';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';
import { PaginationBar } from '../../ui/PaginationBar';
import { VideoThumbnailPreview } from '../VideoThumbnailPreview';

interface StagingStudioFootageListProps {
  onStartDragFootage: (footageId: string) => string[];
  onEndDragFootage: () => void;
  onSelectWithRange: (footageId: string, shiftKey?: boolean) => void;
}

export const StagingStudioFootageList: React.FC<StagingStudioFootageListProps> = ({
  onStartDragFootage,
  onEndDragFootage,
  onSelectWithRange,
}) => {
  const {
    untaggedFootages,
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
    activeDragFootageIds,
    setPreviewFootageId,
  } = useCMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [driveFilter, setDriveFilter] = useState<'ALL' | 'HAS_DRIVE' | 'NO_DRIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'ID'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredFootages = useMemo(() => {
    let list = untaggedFootages;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          f.standardFileName.toLowerCase().includes(q) ||
          (f.mascotNotes && f.mascotNotes.toLowerCase().includes(q))
      );
    }

    if (driveFilter === 'HAS_DRIVE') {
      list = list.filter((f) => hasRealDriveLink(f.driveFileUrl));
    } else if (driveFilter === 'NO_DRIVE') {
      list = list.filter((f) => !hasRealDriveLink(f.driveFileUrl));
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      if (sortBy === 'OLDEST') {
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      return a.id.localeCompare(b.id);
    });
  }, [untaggedFootages, searchQuery, driveFilter, sortBy]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFootages.slice(start, start + pageSize);
  }, [filteredFootages, currentPage, pageSize]);

  const isAllPageSelected =
    paginatedList.length > 0 &&
    paginatedList.every((f) => selectedFootageIdsForBatch.includes(f.id));

  const isAllFilteredSelected =
    filteredFootages.length > 0 &&
    filteredFootages.every((f) => selectedFootageIdsForBatch.includes(f.id));

  const handleToggleSelectPage = () => {
    if (isAllPageSelected) {
      const pageIdSet = new Set(paginatedList.map((f) => f.id));
      setSelectedFootageIdsForBatch((prev) => prev.filter((id) => !pageIdSet.has(id)));
    } else {
      const newIds = Array.from(
        new Set([...selectedFootageIdsForBatch, ...paginatedList.map((f) => f.id)])
      );
      setSelectedFootageIdsForBatch(newIds);
    }
  };

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredFootages.map((f) => f.id));
      setSelectedFootageIdsForBatch((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newIds = Array.from(
        new Set([...selectedFootageIdsForBatch, ...filteredFootages.map((f) => f.id)])
      );
      setSelectedFootageIdsForBatch(newIds);
    }
  };

  const handleClearSelection = () => {
    setSelectedFootageIdsForBatch([]);
  };

  const handleDragStart = (e: React.DragEvent, ft: ComputedFootage) => {
    const batchIds = onStartDragFootage(ft.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-footage-ids', JSON.stringify(batchIds));
    e.dataTransfer.setData('text/plain', batchIds.join(','));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Top Controls Header */}
      <div className="p-3 border-b border-slate-200/90 space-y-2 shrink-0 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <FileVideo className="w-4 h-4 text-indigo-600" />
              <span>คลิปไม่มีหมวดหมู่</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 tabular-nums">
              {filteredFootages.length}
            </span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="NEWEST">เพิ่มล่าสุด</option>
            <option value="OLDEST">เก่าสุด</option>
            <option value="ID">ตามรหัส</option>
          </select>
        </div>

        {/* Search Bar + Drive Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาชื่อ หรือรหัส..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setDriveFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                driveFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => {
                setDriveFilter('HAS_DRIVE');
                setCurrentPage(1);
              }}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                driveFilter === 'HAS_DRIVE'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              มี Drive
            </button>
            <button
              type="button"
              onClick={() => {
                setDriveFilter('NO_DRIVE');
                setCurrentPage(1);
              }}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                driveFilter === 'NO_DRIVE'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              รอลิงก์
            </button>
          </div>
        </div>

        {/* Selection Strip Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSelectPage}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isAllPageSelected
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isAllPageSelected ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>เลือกหน้านี้ ({paginatedList.length})</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSelectAllFiltered}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isAllFilteredSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>เลือกทั้งหมด ({filteredFootages.length})</span>
            </button>
          </div>

          {selectedFootageIdsForBatch.length > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
            >
              ล้าง ({selectedFootageIdsForBatch.length})
            </button>
          )}
        </div>
      </div>

      {/* Footage Rows List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {paginatedList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700">ไม่พบคลิป</p>
          </div>
        ) : (
          paginatedList.map((ft) => {
            const isSelected = selectedFootageIdsForBatch.includes(ft.id);
            const isBeingDragged = activeDragFootageIds.includes(ft.id);
            const hasDrive = hasRealDriveLink(ft.driveFileUrl);

            return (
              <div
                key={ft.id}
                draggable
                onDragStart={(e) => handleDragStart(e, ft)}
                onDragEnd={onEndDragFootage}
                onClick={(e) => onSelectWithRange(ft.id, e.shiftKey)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                  isBeingDragged
                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300 opacity-60 border-dashed'
                    : isSelected
                    ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-300/80 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="p-1 -ml-1 text-slate-400 group-hover:text-indigo-600 hover:bg-indigo-50 rounded-md cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                    title="ลากไปวางบนหมวดหมู่ฝั่งขวา"
                  >
                    <GripVertical className="w-4 h-4" />
                  </span>

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                  />

                  <VideoThumbnailPreview
                    footage={ft}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFootageId(ft.id);
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 tabular-nums shrink-0">
                        {ft.id}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-950 truncate">
                        {ft.title}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {hasDrive ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200"
                      title="มีลิงก์ Google Drive"
                    >
                      <GoogleDriveIcon className="w-3 h-3" />
                      <span>Drive</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                      title="ยังไม่มีลิงก์ Google Drive"
                    >
                      <Bookmark className="w-3 h-3 text-amber-600" />
                      <span>รอลิงก์</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-2 border-t border-slate-200 bg-slate-50/70 shrink-0">
        <PaginationBar
          currentPage={currentPage}
          totalItems={filteredFootages.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[20, 50, 100]}
          itemLabel="คลิป"
        />
      </div>
    </div>
  );
};
