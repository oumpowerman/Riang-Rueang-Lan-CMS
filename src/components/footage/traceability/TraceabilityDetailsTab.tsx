import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileCode,
  Film,
  FolderCheck,
  Inbox,
  Link2,
  Mic,
  Quote,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { TagSelectorInput } from '../../tags/TagSelectorInput';
import { TagPill } from '../../ui/TagPill';
import { useCMS } from '../../../context/CMSContext';
import {
  isFootageInStaging,
  isStagingTagId,
  STAGING_TAG_ID,
} from '../../../services/seedData';
import { extractDefaultRankFields } from '../../../utils/episodeScriptGenerator';
import { TraceabilityDetailsTabProps } from './traceability.types';

export const TraceabilityDetailsTab: React.FC<TraceabilityDetailsTabProps> = ({
  footage,
  copiedFileName,
  onCopyFileName,
  onUpdateTitle,
  onUpdatePunchlineNote,
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
  const extractedFields = extractDefaultRankFields(footage);
  const currentPunchline =
    typeof footage.punchlineNote === 'string'
      ? footage.punchlineNote
      : extractedFields.punchlineNote;

  const handleRemoveSingleTag = (tagIdToRemove: string) => {
    const remaining = footage.tags.filter(
      (id) => id !== tagIdToRemove && !isStagingTagId(id)
    );
    onUpdateTags(remaining.length > 0 ? remaining : [STAGING_TAG_ID]);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Section 1: Title, Real-time Catchphrase (คำสร้อย) & Mascot Notes Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* 1. Footage Title */}
          <div className="md:col-span-6 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>ชื่อช็อตฟุตเทจ (ชื่อฟุตในสคริปต์)</span>
              </label>

              {/* Compact Standard Filename Copy Button */}
              <button
                type="button"
                onClick={onCopyFileName}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer max-w-[190px] sm:max-w-[240px]"
                title={`คัดลอกชื่อไฟล์มาตรฐาน: ${footage.standardFileName}`}
              >
                {copiedFileName ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 font-bold">คัดลอกชื่อไฟล์แล้ว</span>
                  </>
                ) : (
                  <>
                    <FileCode className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-mono truncate">{footage.standardFileName}</span>
                    <Copy className="w-3 h-3 text-slate-500 shrink-0 ml-0.5" />
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={footage.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              placeholder="ระบุชื่อช็อตสั้นๆ ให้เข้าใจง่าย..."
              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

          {/* 2. Dedicated Catchphrase (คำสร้อยประจำฟุตเทจ — ซิงก์ Realtime) */}
          <div className="md:col-span-6 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#244B2F] flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-[#386B46] shrink-0" />
                <span>คำสร้อยประจำฟุตเทจ (Punchline)</span>
              </label>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EDF4ED] border border-[#BBD6B9] text-[#244B2F] text-[10px] font-bold">
                <RefreshCw className="w-2.5 h-2.5 text-[#386B46]" />
                <span>
                  ซิงก์ทุก EP แบบ Realtime
                  {footage.usageHistory.length > 0
                    ? ` (${footage.usageHistory.length} EP)`
                    : ''}
                </span>
              </span>
            </div>
            <input
              type="text"
              value={currentPunchline}
              onChange={(e) => onUpdatePunchlineNote(e.target.value)}
              placeholder="พิมพ์คำสร้อยประจำฟุตเทจนี้ (เปลี่ยนที่นี่จะอัปเดตไปทุก EP ที่ใช้ฟุตนี้ทันที)..."
              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-[#F6FAF6] border border-[#BBD6B9] rounded-xl focus:outline-none focus:bg-white focus:border-[#386B46] text-[#1D3B26]"
            />
          </div>

          {/* 3. Mascot Notes / Extra Guidance */}
          <div className="md:col-span-12 space-y-1 pt-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>บทพากย์มาสคอต / โน้ตจังหวะขยี้มุกเพิ่มเติม</span>
            </label>
            <input
              type="text"
              value={footage.mascotNotes || ''}
              onChange={(e) => onUpdateMascotNotes(e.target.value)}
              placeholder="โน้ตจังหวะพากย์ขยี้มุกสำหรับดึงไปใช้ในช่องจัดอันดับ..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Unified Link Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
        {/* Google Drive Link */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FolderCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Google Drive</span>
            </label>

            {hasDriveUrl ? (
              <a
                href={footage.driveFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-emerald-600" />
                <span>เปิด Drive</span>
              </a>
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>คลิปต้นฉบับ</span>
            </label>

            {hasOriginalUrl ? (
              <a
                href={footage.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[11px] font-bold transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-indigo-600" />
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

      {/* Section 3: Collapsible 3-Tier Category Management */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-xs font-bold text-slate-800 shrink-0">
              หมวดหมู่ 3 ชั้น:
            </span>

            {/* Currently Active Tag Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {footage.tags.map((tid) => (
                <TagPill
                  key={tid}
                  tag={tagMap[tid]}
                  onRemove={
                    !inStaging ? () => handleRemoveSingleTag(tid) : undefined
                  }
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs shrink-0">
            {/* Only show "Move to Staging" button if the clip actually has tags */}
            {!inStaging && (
              <button
                type="button"
                onClick={() => onUpdateTags([STAGING_TAG_ID])}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 transition-colors cursor-pointer text-xs"
                title="ล้างแท็กทั้งหมดและย้ายไปพื้นที่พัก"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>ย้ายไปพื้นที่พัก</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCategorySelectorOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
                isCategorySelectorOpen
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-900 border border-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                {isCategorySelectorOpen
                  ? 'ซ่อนตัวเลือก'
                  : inStaging
                  ? 'เลือกหมวดหมู่'
                  : 'แก้ไขหมวดหมู่'}
              </span>
            </button>
          </div>
        </div>

        {/* Collapsible Category Cascade Selector (without duplicate header/tray) */}
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
                hideHeaderAndTray={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

