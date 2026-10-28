import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileCode,
  FileText,
  Film,
  FolderCheck,
  Inbox,
  Link2,
  Mic,
  SlidersHorizontal,
} from 'lucide-react';
import { TagSelectorInput } from '../../tags/TagSelectorInput';
import { TagPill } from '../../ui/TagPill';
import { useCMS } from '../../../context/CMSContext';
import { isFootageInStaging, STAGING_TAG_ID } from '../../../services/seedData';
import { TraceabilityDetailsTabProps } from './traceability.types';

export const TraceabilityDetailsTab: React.FC<TraceabilityDetailsTabProps> = ({
  footage,
  copiedFileName,
  onCopyFileName,
  onUpdateTitle,
  onUpdateMascotNotes,
  onUpdateOriginalUrl,
  onUpdateDriveFileUrl,
  onUpdateTags,
}) => {
  const { tagMap } = useCMS();
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);

  const hasDriveUrl = Boolean(footage.driveFileUrl?.trim());
  const hasOriginalUrl = Boolean(footage.originalUrl?.trim());
  const inStaging = isFootageInStaging(footage.tags);

  const handleToggleStaging = () => {
    if (inStaging) {
      setIsCategorySelectorOpen(true);
    } else {
      onUpdateTags([STAGING_TAG_ID]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section 1: Title, Mascot Notes & Standard Filename Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>ข้อมูลช็อตฟุตเทจ & ชื่อไฟล์มาตรฐาน</span>
          </div>

          {/* Standard Google Drive Filename Pill */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-mono text-[11px] font-semibold text-slate-800 truncate max-w-[240px] sm:max-w-xs">
              {footage.standardFileName}
            </span>
            <button
              type="button"
              onClick={onCopyFileName}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer shrink-0"
              title="คัดลอกชื่อไฟล์มาตรฐาน"
            >
              {copiedFileName ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>คัดลอก</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-slate-500" />
              <span>ชื่อช็อตฟุตเทจ (Title)</span>
            </label>
            <input
              type="text"
              value={footage.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              placeholder="ระบุชื่อช็อตสั้นๆ ให้เข้าใจง่าย..."
              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

          <div className="md:col-span-6 space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-indigo-600" />
              <span>บทพากย์มาสคอต / จังหวะขยี้มุก (Mascot Notes)</span>
            </label>
            <input
              type="text"
              value={footage.mascotNotes || ''}
              onChange={(e) => onUpdateMascotNotes(e.target.value)}
              placeholder="โน้ตจังหวะพากย์ขยี้มุกสำหรับดึงไปใช้ในช่องจัดอันดับ..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Unified Link Cards with Platform/Status SVG Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Google Drive Link */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FolderCheck className="w-4 h-4 text-emerald-600" />
              <span>Google Drive</span>
            </label>

            {hasDriveUrl ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>พร้อมใช้</span>
                </span>
                <a
                  href={footage.driveFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิด Drive</span>
                </a>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>รออัปโหลด</span>
              </span>
            )}
          </div>

          <input
            type="url"
            value={footage.driveFileUrl || ''}
            onChange={(e) => onUpdateDriveFileUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600"
          />
        </div>

        {/* Original Clip Link */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-indigo-600" />
              <span>คลิปต้นฉบับ</span>
            </label>

            {hasOriginalUrl ? (
              <a
                href={footage.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดต้นฉบับ</span>
              </a>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400">
                ไม่ได้ระบุลิงก์
              </span>
            )}
          </div>

          <input
            type="url"
            value={footage.originalUrl || ''}
            onChange={(e) => onUpdateOriginalUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@creator/video/..."
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Section 3: Collapsible 3-Tier Category Management (Clean by default) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              หมวดหมู่ 3 ชั้นที่จัดไว้:
            </span>

            {/* Currently Active Tag Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {footage.tags.map((tid) => (
                <TagPill key={tid} tag={tagMap[tid]} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleToggleStaging}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                inStaging
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>{inStaging ? 'อยู่ในพื้นที่พัก' : 'ย้ายไปพื้นที่พัก'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCategorySelectorOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                isCategorySelectorOpen
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-900 border border-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                {isCategorySelectorOpen ? 'ซ่อนตัวเลือก' : 'แก้ไขหมวดหมู่'}
              </span>
            </button>
          </div>
        </div>

        {/* Collapsible Category Cascade Selector */}
        <AnimatePresence initial={false}>
          {isCategorySelectorOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden pt-2 border-t border-slate-100"
            >
              <TagSelectorInput
                selectedTagIds={footage.tags}
                onChange={onUpdateTags}
                label="เลือกหมวดหมู่ 3 ชั้นของฟุตเทจนี้"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
