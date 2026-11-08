import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  FileVideo,
  GripVertical,
  Search,
  Square,
  X,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { ComputedFootage } from '../../../types/footage.types';
import { hasRealDriveLink } from '../../../utils/fileNameGenerator';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';
import { PaginationBar } from '../../ui/PaginationBar';
import { VideoThumbnailPreview } from '../VideoThumbnailPreview';

interface StagingStudioFootageListProps {
  activeFootageId: string | null;
  onSetActiveFootageId: (id: string) => void;
  onStartDragFootage: (footageId: string) => string[];
  onEndDragFootage: () => void;
  onSelectWithRange: (footageId: string, shiftKey?: boolean) => void;
}

export const StagingStudioFootageList: React.FC<StagingStudioFootageListProps> = ({
  activeFootageId,
  onSetActiveFootageId,
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
    <div className="flex flex-col h-full overflow-hidden bg-[#faf8f5] border-r border-[#e8dfd3]">
      {/* Top Controls Header - Pastel Earth-Tone */}
      <div className="p-3 border-b border-[#e8dfd3] space-y-2.5 shrink-0 bg-[#fdfbf7]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#eef5ee] border border-[#bad8bf] flex items-center justify-center shrink-0">
              <FileVideo className="w-3.5 h-3.5 text-[#2c5c36]" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-[#3d332a]">
              คลังรอจัดระเบียบ
            </span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#fef8ed] text-[#784f1b] border border-[#eedab8] tabular-nums">
              {filteredFootages.length} คลิป
            </span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold px-2 py-1 rounded-lg border border-[#e3d8cb] bg-white text-[#524538] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8fa892]"
          >
            <option value="NEWEST">เพิ่มล่าสุด</option>
            <option value="OLDEST">เก่าสุด</option>
            <option value="ID">ตามรหัส</option>
          </select>
        </div>

        {/* Search Bar + Drive Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#998a7c]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาชื่อ หรือรหัสคลิป..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-[#e3d8cb] bg-white text-[#3d332a] placeholder:text-[#a89b8d] focus:outline-none focus:ring-1.5 focus:ring-[#8fa892] focus:border-[#8fa892] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#998a7c] hover:text-[#524538] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0 bg-[#f4ece1] p-0.5 rounded-lg border border-[#e2d5c4]">
            <button
              type="button"
              onClick={() => {
                setDriveFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                driveFilter === 'ALL'
                  ? 'bg-white text-[#3d332a] shadow-2xs font-bold'
                  : 'text-[#6e5f52] hover:text-[#3d332a]'
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
                  ? 'bg-white text-[#254b2d] shadow-2xs font-bold'
                  : 'text-[#6e5f52] hover:text-[#254b2d]'
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
                  ? 'bg-white text-[#824a1c] shadow-2xs font-bold'
                  : 'text-[#6e5f52] hover:text-[#824a1c]'
              }`}
            >
              รอลิงก์
            </button>
          </div>
        </div>

        {/* Selection Strip Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#ebe2d5] text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleToggleSelectPage}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                isAllPageSelected
                  ? 'bg-[#3b6845] text-white border-[#3b6845]'
                  : 'bg-white hover:bg-[#faf7f2] text-[#524538] border-[#e2d6c7]'
              }`}
            >
              {isAllPageSelected ? (
                <CheckSquare className="w-3 h-3" />
              ) : (
                <Square className="w-3 h-3 text-[#998a7c]" />
              )}
              <span>เลือกหน้านี้ ({paginatedList.length})</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSelectAllFiltered}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                isAllFilteredSelected
                  ? 'bg-[#8a5a22] text-white border-[#8a5a22]'
                  : 'bg-[#fef8ed] hover:bg-[#fcf1df] text-[#734b17] border-[#edd7af]'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>เลือกทั้งหมด ({filteredFootages.length})</span>
            </button>
          </div>

          {selectedFootageIdsForBatch.length > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-semibold text-[#a34433] hover:text-[#802f20] hover:underline cursor-pointer"
            >
              ล้าง ({selectedFootageIdsForBatch.length})
            </button>
          )}
        </div>
      </div>

      {/* Footage Rows List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {paginatedList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#7d6e61] bg-white rounded-xl border border-dashed border-[#e8dfd3]">
            <p className="font-semibold text-[#4f4236]">ไม่พบคลิปในเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          paginatedList.map((ft, index) => {
            const isSelected = selectedFootageIdsForBatch.includes(ft.id);
            const isActive = ft.id === activeFootageId;
            const isBeingDragged = activeDragFootageIds.includes(ft.id);
            const hasDrive = hasRealDriveLink(ft.driveFileUrl);

            return (
              <div
                key={ft.id}
                draggable
                onDragStart={(e) => handleDragStart(e, ft)}
                onDragEnd={onEndDragFootage}
                onClick={() => {
                  onSetActiveFootageId(ft.id);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 group relative ${
                  isBeingDragged
                    ? 'bg-[#eef5ee] border-[#8fa892] ring-2 ring-[#a4c7a8] opacity-60 border-dashed'
                    : isActive
                    ? 'bg-[#edf6ee] border-[#93c39c] ring-1.5 ring-[#93c39c] shadow-xs'
                    : isSelected
                    ? 'bg-[#fcf3e8] border-[#e8cbb0] ring-1 ring-[#e8cbb0]'
                    : 'bg-white hover:bg-[#faf7f2] border-[#ebe3d7] hover:border-[#d9cbba]'
                }`}
              >
                {/* Active Indicator Strip */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#3b6845] rounded-r-md" />
                )}

                <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
                  <span
                    className="p-1 -ml-1 text-[#998a7c] group-hover:text-[#3b6845] hover:bg-[#edf6ee] rounded-md cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                    title="ลากไปวางบนหมวดหมู่ฝั่งขวา"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </span>

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onSelectWithRange(ft.id, (e.nativeEvent as MouseEvent).shiftKey);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded text-[#3b6845] focus:ring-[#8fa892] cursor-pointer accent-[#3b6845] shrink-0"
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-[#6e5f52] tabular-nums shrink-0">
                        {ft.id}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#3b6845] text-white">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>กำลังจัด</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#3d332a] group-hover:text-[#2c5c36] truncate">
                      {ft.title}
                    </h4>
                    {ft.mascotNotes && (
                      <p className="text-[11px] text-[#7d6e61] truncate line-clamp-1">
                        {ft.mascotNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {hasDrive ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#edf6ee] text-[#254b2d] border border-[#c4e0c9]"
                      title="มีลิงก์ Google Drive"
                    >
                      <GoogleDriveIcon className="w-3 h-3" />
                      <span>Drive</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#fef8ed] text-[#7e531e] border border-[#eedab8]"
                      title="ยังไม่มีลิงก์ Google Drive"
                    >
                      <Bookmark className="w-3 h-3 text-[#b47a32]" />
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
      <div className="p-2 border-t border-[#e8dfd3] bg-[#fdfbf7] shrink-0">
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
