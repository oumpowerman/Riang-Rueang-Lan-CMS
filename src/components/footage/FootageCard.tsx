import React from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  Bookmark,
  GripVertical,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { STAGING_TAG_ID, isFootageInStaging } from '../../services/seedData';
import { ComputedFootage } from '../../types/footage.types';
import { hasRealDriveLink } from '../../utils/fileNameGenerator';
import { GoogleDriveIcon } from '../ui/GoogleDriveIcon';
import { StatusBadge } from '../ui/StatusBadge';
import { TagPill } from '../ui/TagPill';
import { VideoThumbnailPreview } from './VideoThumbnailPreview';

interface FootageCardProps {
  footage: ComputedFootage;
  onSelectForTraceability: (footageId: string) => void;
  onQuickTagClick?: (tagId: string) => void;
  onSelectWithRange?: (footageId: string, shiftKey?: boolean) => void;
  onStartDragFootage?: (footageId: string) => string[];
  onEndDragFootage?: () => void;
}

export const FootageCard: React.FC<FootageCardProps> = ({
  footage,
  onSelectForTraceability,
  onQuickTagClick,
  onSelectWithRange,
  onStartDragFootage,
  onEndDragFootage,
}) => {
  const {
    tagMap,
    settings,
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
    activeDragFootageIds,
    setActiveDragFootageIds,
    setPreviewFootageId,
  } = useCMS();
  const hasDrive = hasRealDriveLink(footage.driveFileUrl);
  const inStaging = isFootageInStaging(footage.tags);
  const isSelected = selectedFootageIdsForBatch.includes(footage.id);
  const isBeingDragged = activeDragFootageIds.includes(footage.id);

  const handleToggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectWithRange) {
      onSelectWithRange(footage.id, e.shiftKey);
      return;
    }
    setSelectedFootageIdsForBatch((prev) =>
      prev.includes(footage.id)
        ? prev.filter((id) => id !== footage.id)
        : [...prev, footage.id]
    );
  };

  const handleOpenPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewFootageId(footage.id);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const batchIds = onStartDragFootage
      ? onStartDragFootage(footage.id)
      : selectedFootageIdsForBatch.includes(footage.id)
      ? selectedFootageIdsForBatch
      : [footage.id];

    if (!onStartDragFootage) {
      setActiveDragFootageIds(batchIds);
    }

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-footage-ids', JSON.stringify(batchIds));
    e.dataTransfer.setData('text/plain', batchIds.join(','));
  };

  const handleDragEnd = () => {
    if (onEndDragFootage) {
      onEndDragFootage();
    } else {
      setActiveDragFootageIds([]);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      draggable
      onDragStartCapture={handleDragStart}
      onDragEndCapture={handleDragEnd}
      onClick={(e) => {
        if (e.shiftKey) {
          handleToggleSelect(e);
          return;
        }
        onSelectForTraceability(footage.id);
      }}
      className={`relative group rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-3 border ${
        isBeingDragged
          ? 'opacity-65 scale-[0.98] bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400 border-dashed'
          : isSelected
          ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-300/60 shadow-xs'
          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
      }`}
    >
      {/* Multi-Drag Indicator Badge */}
      {isBeingDragged && activeDragFootageIds.length > 1 && (
        <div className="absolute -top-2.5 right-3 z-20 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold shadow-md">
          ย้าย {activeDragFootageIds.length} คลิป
        </div>
      )}

      {/* Top Content Area: Compact Left Thumbnail + Right Clip Metadata */}
      <div className="flex items-start gap-3">
        <VideoThumbnailPreview
          footage={footage}
          onClick={handleOpenPreview}
          size="md"
        />

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Top Row: Drag Handle + Checkbox + ID + Drive Status + Cooldown Badge */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="p-0.5 -ml-1 text-slate-400 group-hover:text-indigo-600 hover:bg-indigo-50 rounded-md cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                title="ลากเพื่อย้ายหมวดหมู่"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </span>

              <input
                type="checkbox"
                checked={isSelected}
                onClick={handleToggleSelect}
                onChange={() => {}}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                title="เลือกคลิป (Shift+คลิก เลือกเป็นช่วง)"
              />
              <span className="font-mono text-xs font-bold text-slate-600 tabular-nums shrink-0">
                {footage.id}
              </span>

              {hasDrive ? (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/90 rounded-md shrink-0"
                  title="เชื่อมลิงก์ Google Drive แล้ว"
                >
                  <GoogleDriveIcon className="w-2.5 h-2.5 shrink-0" />
                  <span>Drive</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-md shrink-0"
                  title="ยังไม่มีลิงก์ Google Drive"
                >
                  <Bookmark className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                  <span>รอลิงก์</span>
                </span>
              )}
            </div>

            <StatusBadge
              status={footage.cooldownStatus}
              daysSinceLastUse={footage.daysSinceLastUsed}
              cooldownDays={settings.cooldownDays}
              greenReadyDays={settings.greenReadyDays}
              usageLast90Days={footage.usageLast90Days}
              totalUsageCount={footage.totalUsageCount}
              maxTotalUsageCount={settings.maxTotalUsageCount}
              compact
            />
          </div>

          {/* Clip Title */}
          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-950 transition-colors">
            {footage.title}
          </h3>
        </div>
      </div>

      {/* Bottom Row: Category Tags + Subtle Chevron */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div
          className="flex flex-wrap items-center gap-1.5 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {inStaging ? (
            <TagPill
              tag={tagMap[STAGING_TAG_ID]}
              onClick={onQuickTagClick ? () => onQuickTagClick(STAGING_TAG_ID) : undefined}
            />
          ) : (
            footage.tags.map((tid) => (
              <TagPill
                key={tid}
                tag={tagMap[tid]}
                onClick={onQuickTagClick ? () => onQuickTagClick(tid) : undefined}
              />
            ))
          )}
        </div>

        <span
          className="p-1 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors shrink-0"
          title="ดูรายละเอียดและแก้ไขหมวดหมู่"
        >
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </motion.div>
  );
};
