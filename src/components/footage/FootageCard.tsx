import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, FolderCheck, Bookmark } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { STAGING_TAG_ID, isFootageInStaging } from '../../services/seedData';
import { ComputedFootage } from '../../types/footage.types';
import { hasRealDriveLink } from '../../utils/fileNameGenerator';
import { StatusBadge } from '../ui/StatusBadge';
import { TagPill } from '../ui/TagPill';

interface FootageCardProps {
  footage: ComputedFootage;
  onSelectForTraceability: (footageId: string) => void;
  onQuickTagClick?: (tagId: string) => void;
}

export const FootageCard: React.FC<FootageCardProps> = ({
  footage,
  onSelectForTraceability,
  onQuickTagClick,
}) => {
  const {
    tagMap,
    settings,
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
  } = useCMS();
  const hasDrive = hasRealDriveLink(footage.driveFileUrl);
  const inStaging = isFootageInStaging(footage.tags);
  const isSelected = selectedFootageIdsForBatch.includes(footage.id);

  const handleToggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFootageIdsForBatch((prev) =>
      prev.includes(footage.id)
        ? prev.filter((id) => id !== footage.id)
        : [...prev, footage.id]
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => onSelectForTraceability(footage.id)}
      className={`group rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between gap-3.5 border ${
        isSelected
          ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-300/60 shadow-xs'
          : 'bg-white border-slate-200/90 hover:border-slate-400 hover:shadow-xs'
      }`}
    >
      <div className="space-y-2.5">
        {/* Top Row: Checkbox + ID + Link Readiness Badge + Clean Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onClick={handleToggleSelect}
              onChange={() => {}}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
              title="เลือกฟุตเทจนี้"
            />
            <span className="font-mono text-sm font-bold text-slate-600 tabular-nums">
              {footage.id}
            </span>

            {hasDrive ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md"
                title="อัปโหลดไฟล์ขึ้น Google Drive พร้อมใช้งานแล้ว"
              >
                <FolderCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>มีไฟล์ Drive</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-md"
                title="เก็บลิงก์ต้นฉบับไว้ก่อน — ยังไม่ได้วางลิงก์ Google Drive"
              >
                <Bookmark className="w-3 h-3 text-amber-600 shrink-0" />
                <span>รออัป Drive</span>
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
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-950 transition-colors">
          {footage.title}
        </h3>
      </div>

      {/* Bottom Row: Category Tags + Open Details Trigger */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
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

        <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors shrink-0">
          <span>{inStaging ? 'จัดหมวดหมู่' : 'รายละเอียด'}</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </motion.div>
  );
};

