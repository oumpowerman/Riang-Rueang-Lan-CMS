import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Copy,
  ExternalLink,
  FolderOpen,
  Link2,
  MessageSquareText,
  Clock,
  AlertCircle,
  BookmarkPlus,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import {
  STAGING_TAG_ID,
  isFootageInStaging,
  isStagingTagId,
  normalizeFootageTags,
} from '../../services/seedData';
import { generateNextId, generateStandardFileName } from '../../utils/fileNameGenerator';
import { TagSelectorInput } from '../tags/TagSelectorInput';
import { Modal } from '../ui/Modal';

export const DirectFootageModal: React.FC = () => {
  const {
    isDirectFootageModalOpen,
    setIsDirectFootageModalOpen,
    computedFootage,
    addDirectFootage,
  } = useCMS();

  // Core Fields: Title is required (*), and AT LEAST ONE of (driveFileUrl OR originalUrl) is required (*)
  const [title, setTitle] = useState('');
  const [driveFileUrl, setDriveFileUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');

  // Optional Fields (Default to Staging Area when no real category is chosen)
  const [durationSec, setDurationSec] = useState<number>(25);
  const [selectedTags, setSelectedTags] = useState<string[]>([STAGING_TAG_ID]);
  const [mascotNotes, setMascotNotes] = useState('');

  // Copy feedback state
  const [copiedFile, setCopiedFile] = useState(false);

  const previewNextId = generateNextId(
    'FT',
    computedFootage.map((f) => f.id)
  );
  const previewFileName = generateStandardFileName(previewNextId, title || 'ชื่อช็อตฮา');

  // Validation: Title + (Google Drive Link OR Original Clip Link)
  const hasTitle = Boolean(title.trim());
  const hasDriveUrl = Boolean(driveFileUrl.trim());
  const hasOriginalUrl = Boolean(originalUrl.trim());
  const hasAnyLink = hasDriveUrl || hasOriginalUrl;
  const canSubmit = hasTitle && hasAnyLink;
  const isInStaging = isFootageInStaging(selectedTags);
  const realTagCount = selectedTags.filter((id) => !isStagingTagId(id)).length;

  const handleCopyPreviewName = () => {
    navigator.clipboard?.writeText(previewFileName);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    addDirectFootage({
      title: title.trim(),
      originalUrl: originalUrl.trim(),
      tags: normalizeFootageTags(selectedTags),
      driveFileUrl: driveFileUrl.trim(),
      mascotNotes: mascotNotes.trim(),
      durationSec: durationSec || 25,
    });

    // Reset Form to initial clean state (default back to Staging Area)
    setTitle('');
    setDriveFileUrl('');
    setOriginalUrl('');
    setDurationSec(25);
    setSelectedTags([STAGING_TAG_ID]);
    setMascotNotes('');
    setIsDirectFootageModalOpen(false);
  };

  return (
    <Modal
      isOpen={isDirectFootageModalOpen}
      onClose={() => setIsDirectFootageModalOpen(false)}
      title="นำเข้าฟุตเทจเดี่ยว (Flow 1:1 — ฟาร์มฟุต หรือ เก็บคลิปน่าสนใจไว้ก่อน)"
      subtitle="กรอกชื่อช็อตฮา และเลือกใส่ลิงก์อย่างใดอย่างหนึ่ง: ลิงก์คลิปต้นฉบับ (เก็บไว้ก่อนยังไม่ทันอัป Drive) หรือ ลิงก์ Google Drive (พร้อมใช้)"
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* =====================================================================
            TOP BAR: Auto-ID & Standard Google Drive File Name Banner
        ====================================================================== */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-3 py-1 text-sm font-mono font-bold tabular-nums bg-amber-400 text-slate-950 rounded-xl shrink-0">
              {previewNextId}
            </span>
            <div className="min-w-0">
              <span className="text-xs text-slate-300 font-medium block">
                ชื่อไฟล์มาตรฐานสำหรับตั้งใน Google Drive (คัดลอกไว้ใช้ตอนอัปโหลดได้ทันที)
              </span>
              <span
                className="text-sm sm:text-base font-mono font-bold text-white truncate block mt-0.5"
                title={previewFileName}
              >
                {previewFileName}
              </span>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCopyPreviewName}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl shrink-0 transition-colors cursor-pointer border border-slate-700"
            title="คัดลอกชื่อไฟล์สำหรับตั้งชื่อในเครื่องก่อนอัปขึ้น Google Drive"
          >
            {copiedFile ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">คัดลอกชื่อไฟล์แล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" />
                <span>คัดลอกชื่อไฟล์</span>
              </>
            )}
          </motion.button>
        </div>

        {/* =====================================================================
            SECTION 1: ข้อมูลหลักที่ต้องกรอก (บังคับ *) — ชื่อช็อตฮา + เลือกใส่ลิงก์อย่างน้อย 1 ช่อง
        ====================================================================== */}
        <div className="rounded-2xl p-5 bg-white border-2 border-indigo-200/90 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-sm font-mono font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <h3 className="text-base font-bold text-slate-900">
                ข้อมูลหลักของฟุตเทจ (ระบุชื่อ + เลือกใส่ลิงก์อย่างน้อย 1 ช่อง)
              </h3>
            </div>

            {canSubmit ? (
              hasDriveUrl && hasOriginalUrl ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>ครบทั้งลิงก์ต้นฉบับ & Google Drive</span>
                </span>
              ) : hasDriveUrl ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>โหมดฟุตพร้อมใช้ (มีลิงก์ Google Drive)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                  <BookmarkPlus className="w-4 h-4 text-indigo-600" />
                  <span>โหมดเก็บคลิปน่าสนใจไว้ก่อน (ค่อยอัป Drive ทีหลัง)</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                <span>กรอกชื่อช็อตฮา + เลือกลิงก์อย่างน้อย 1 ช่อง (*)</span>
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* 1.1 Footage Title (Required) */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                ชื่อช็อตฮา / รายละเอียดมุกที่เจอ <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ลุงขับซาเล้งเปิดไฟเลี้ยวซ้ายแต่เลี้ยวขวา, หมาวิ่งตัดหน้านักวิ่ง..."
                className="w-full px-4 py-3 text-base bg-slate-50/70 focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 transition-all placeholder:text-slate-400 text-slate-900 font-medium"
              />
            </div>

            {/* 1.2 Dual Flexible Link Box: Either Original URL OR Google Drive URL (or Both) */}
            <div className="rounded-xl bg-slate-50/90 border border-slate-200 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold text-slate-900">
                  เลือกวางลิงก์อย่างใดอย่างหนึ่ง (หรือใส่ทั้ง 2 ลิงก์ได้เลย){' '}
                  <span className="text-rose-600">*</span>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  เจอคลิปน่าสนใจแปะลิงก์ต้นฉบับไว้ก่อนได้ ไม่ต้องรออัปขึ้น Drive
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Option A: Original Clip Link (For quick bookmarking / source tracking) */}
                <div
                  className={`rounded-xl p-3.5 border transition-all ${
                    hasOriginalUrl
                      ? 'bg-indigo-50/40 border-indigo-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>ทางเลือกที่ 1: ลิงก์คลิปต้นฉบับ (TikTok / Reels / FB / Shorts / YouTube)</span>
                    </label>

                    {hasOriginalUrl ? (
                      <a
                        href={originalUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ทดสอบเปิดลิงก์ต้นฉบับ</span>
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        เหมาะสำหรับเก็บคลิปที่เพิ่งเจอไว้ก่อน
                      </span>
                    )}
                  </div>

                  <input
                    type="url"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@creator/video/... (วางลิงก์คลิปต้นฉบับเพื่อเก็บเข้าคลังไว้ก่อนได้เลย)"
                    className="w-full px-4 py-2.5 text-sm sm:text-base font-mono bg-slate-50/70 focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 transition-all placeholder:text-slate-400 text-slate-900"
                  />
                </div>

                {/* Option B: Google Drive File Link (For ready-to-use farmed footage) */}
                <div
                  className={`rounded-xl p-3.5 border transition-all ${
                    hasDriveUrl
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>ทางเลือกที่ 2: ลิงก์ไฟล์วิดีโอใน Google Drive (เมื่ออัปโหลดไฟล์แล้ว)</span>
                    </label>

                    {hasDriveUrl ? (
                      <a
                        href={driveFileUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ทดสอบเปิดลิงก์ Google Drive</span>
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">
                        {hasOriginalUrl
                          ? 'เว้นว่างไว้มาเติมทีหลังได้ (มีลิงก์ต้นฉบับแล้ว)'
                          : 'สำหรับฟุตที่อัปขึ้น Google Drive พร้อมใช้งานแล้ว'}
                      </span>
                    )}
                  </div>

                  <input
                    type="url"
                    value={driveFileUrl}
                    onChange={(e) => setDriveFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... (หากยังไม่ได้อัปขึ้น Drive ให้ใส่ลิงก์คลิปต้นฉบับด้านบนแทน)"
                    className="w-full px-4 py-2.5 text-sm sm:text-base font-mono bg-slate-50/70 focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all placeholder:text-slate-400 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION 2: หมวดหมู่ 3 ชั้น & ป้ายกำกับ (กลุ่ม ➔ หมวดหลัก ➔ หมวดย่อย)
        ====================================================================== */}
        <div className="rounded-2xl p-5 bg-white border border-slate-200/90 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-sm font-mono font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <h3 className="text-base font-bold text-slate-900">
                หมวดหมู่ 3 ชั้น & พื้นที่พักรอจัดหมวดหมู่
              </h3>
            </div>

            {isInStaging ? (
              <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-lg">
                ค่าเริ่มต้น: พื้นที่พักรอจัดหมวดหมู่ (ยังไม่เลือกแท็กจริง)
              </span>
            ) : (
              <span className="text-xs font-mono tabular-nums font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                เลือกหมวดหมู่จริงแล้ว {realTagCount} แท็ก
              </span>
            )}
          </div>

          <TagSelectorInput
            selectedTagIds={selectedTags}
            onChange={setSelectedTags}
            label="เลือกกลุ่มหมวดหมู่ ➔ หมวดหลัก ➔ หมวดย่อย หรือเก็บไว้ในพื้นที่พักรอจัดหมวดหมู่ก่อน"
            helperText="หากต้องการบันทึกเร็วๆ สามารถข้ามไปกดบันทึกได้เลย ระบบจะจัดเก็บเข้า 'พื้นที่พักรอจัดหมวดหมู่' ให้อัตโนมัติ"
          />
        </div>

        {/* =====================================================================
            SECTION 3: ไกด์มุกมาสคอตเชื่อมเรื่อง & ความยาวคลิป (ไม่บังคับ)
        ====================================================================== */}
        <div className="rounded-2xl p-5 bg-slate-50/80 border border-slate-200/90 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 text-sm font-mono font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <h3 className="text-base font-bold text-slate-900">
                ไกด์มุกมาสคอตเชื่อมเรื่อง & ความยาวฟุตเทจ
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
              ไม่บังคับ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
            <div className="sm:col-span-8">
              <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <MessageSquareText className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ไกด์มุกมาสคอตเชื่อมเรื่อง / โน้ตกันลืม (Mascot Notes)</span>
              </label>
              <textarea
                rows={2}
                value={mascotNotes}
                onChange={(e) => setMascotNotes(e.target.value)}
                placeholder="ระบุจุดพีคของคลิป จังหวะตบมุก หรือโน้ตช่วงเวลาที่สนใจเผื่อกลับมาตัดลง Drive ทีหลัง..."
                className="w-full px-4 py-2.5 text-sm sm:text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 text-slate-900"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>ความยาวโดยประมาณ (วินาที)</span>
              </label>
              <input
                type="number"
                min={3}
                max={600}
                value={durationSec}
                onChange={(e) => setDurationSec(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-base font-mono tabular-nums font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 transition-all text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* =====================================================================
            ACTION BAR FOOTER
        ====================================================================== */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-t border-slate-200">
          <div className="text-sm">
            {!hasTitle && !hasAnyLink ? (
              <span className="text-amber-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>โปรดระบุชื่อช็อตฮา และใส่ลิงก์อย่างน้อย 1 ช่อง (ต้นฉบับ หรือ Google Drive) (*)</span>
              </span>
            ) : !hasTitle ? (
              <span className="text-amber-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>โปรดระบุชื่อช็อตฮา / รายละเอียดมุก (*)</span>
              </span>
            ) : !hasAnyLink ? (
              <span className="text-amber-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>โปรดวางลิงก์อย่างใดอย่างหนึ่ง: ลิงก์คลิปต้นฉบับ หรือ ลิงก์ Google Drive (*)</span>
              </span>
            ) : hasDriveUrl ? (
              <span className="text-emerald-700 font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>พร้อมบันทึกฟุตเดี่ยวพร้อมใช้ ({previewNextId}) เข้าคลังทันที</span>
              </span>
            ) : (
              <span className="text-indigo-700 font-bold flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>พร้อมบันทึกเก็บคลิปต้นฉบับ ({previewNextId}) ไว้ก่อน — ค่อยอัปขึ้น Drive ทีหลังได้</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 shrink-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsDirectFootageModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </motion.button>
            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileHover={canSubmit ? { y: -1, scale: 1.01 } : undefined}
              whileTap={canSubmit ? { scale: 0.97 } : undefined}
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm sm:text-base font-bold rounded-xl transition-all whitespace-nowrap shadow-xs ${
                canSubmit
                  ? hasDriveUrl
                    ? 'text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  : 'text-slate-400 bg-slate-200 cursor-not-allowed'
              }`}
            >
              <span>
                {hasDriveUrl
                  ? `บันทึกฟุตพร้อมใช้ (${previewNextId})`
                  : hasOriginalUrl
                  ? `บันทึกเก็บไว้ก่อน (${previewNextId})`
                  : `บันทึกฟุตเดี่ยว (${previewNextId})`}
              </span>
              <Check className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

