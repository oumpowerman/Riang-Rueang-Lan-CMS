import React from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { STAGING_TAG_ID, isFootageInStaging, isStagingTagId } from '../../services/seedData';
import { ComputedFootage } from '../../types/footage.types';
import {
  DuplicateMatchReason,
  getDuplicateReasonLabel,
} from '../../utils/duplicateClusterScanner';
import { extractDefaultRankFields } from '../../utils/episodeScriptGenerator';
import { hasRealDriveLink } from '../../utils/fileNameGenerator';
import { StatusBadge } from '../ui/StatusBadge';
import { TagPill } from '../ui/TagPill';
import { VideoThumbnailPreview } from './VideoThumbnailPreview';

interface FootageCardProps {
  footage: ComputedFootage;
  duplicateReasons?: DuplicateMatchReason[];
  onSelectForTraceability: (footageId: string) => void;
  onQuickTagClick?: (tagId: string) => void;
  onSelectWithRange?: (footageId: string, shiftKey?: boolean) => void;
  onStartDragFootage?: (footageId: string) => string[];
  onEndDragFootage?: () => void;
}

export const FootageCard: React.FC<FootageCardProps> = ({
  footage,
  duplicateReasons,
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
  const { punchlineNote } = extractDefaultRankFields(footage);

  const resolvedRealTags = Array.from(new Set(footage.tags || []))
    .filter((tid) => !isStagingTagId(tid))
    .map((tid) => tagMap[tid])
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const stagingTag = tagMap[STAGING_TAG_ID];

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
      className={`relative group rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5 border ${
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

      {/* Full-Width Top Control & Status Strip (Prevents Badge Overlap) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
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

          <span className="font-mono text-xs font-bold text-slate-700 tabular-nums shrink-0">
            {footage.id}
          </span>

          {!hasDrive && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 truncate"
              title="ยังไม่มีลิงก์ Google Drive"
            >
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="truncate">รอลิงก์ Drive</span>
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

      {/* Middle Area: Thumbnail + Title / Catchphrase */}
      <div className="flex items-start gap-3">
        <VideoThumbnailPreview
          footage={footage}
          onClick={handleOpenPreview}
          size="md"
        />

        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-950 transition-colors">
            {footage.title}
          </h3>

          {punchlineNote && (
            <p className="text-xs font-medium text-[#2B5435] truncate">
              คำสร้อย: &ldquo;{punchlineNote}&rdquo;
            </p>
          )}

          {duplicateReasons && duplicateReasons.length > 0 && (
            <p className="text-[11px] font-semibold text-[#8A4A18] truncate">
              ซ้ำ:{' '}
              {duplicateReasons
                .map((reason) => getDuplicateReasonLabel(reason))
                .join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Row: Category Tags + Subtle Chevron */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div
          className="flex flex-wrap items-center gap-1.5 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {inStaging ? (
            stagingTag ? (
              <TagPill
                tag={stagingTag}
                onClick={
                  onQuickTagClick
                    ? () => onQuickTagClick(STAGING_TAG_ID)
                    : undefined
                }
              />
            ) : (
              <span className="text-[11px] font-medium text-amber-800/80">
                ไม่มีหมวดหมู่
              </span>
            )
          ) : resolvedRealTags.length > 0 ? (
            resolvedRealTags.map((tagItem) => (
              <TagPill
                key={tagItem.id}
                tag={tagItem}
                onClick={
                  onQuickTagClick
                    ? () => onQuickTagClick(tagItem.id)
                    : undefined
                }
              />
            ))
          ) : (
            <span className="text-[11px] font-medium text-slate-400">
              ไม่มีหมวดหมู่
            </span>
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
