import React from 'react';
import { motion } from 'motion/react';
import { TagSelectorInput } from '../../tags/TagSelectorInput';
import { MessageSquareText, Check, ArrowLeft, BookmarkPlus } from 'lucide-react';
import { isFootageInStaging, isStagingTagId } from '../../../services/seedData';

interface DirectStepTagsAndNotesProps {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  mascotNotes: string;
  setMascotNotes: (notes: string) => void;
  previewNextId: string;
  hasDriveUrl: boolean;
  hasOriginalUrl: boolean;
  canSubmit: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const DirectStepTagsAndNotes: React.FC<DirectStepTagsAndNotesProps> = ({
  selectedTags,
  setSelectedTags,
  mascotNotes,
  setMascotNotes,
  previewNextId,
  hasDriveUrl,
  hasOriginalUrl,
  canSubmit,
  onBack,
  onSubmit,
}) => {
  const isInStaging = isFootageInStaging(selectedTags);
  const realTagCount = selectedTags.filter((id) => !isStagingTagId(id)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900">3. หมวดหมู่ & โน้ต</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            เลือกหมวดหมู่หรือพักรอไว้ก่อน พร้อมระบุโน้ตมุกเชื่อมเรื่อง
          </p>
        </div>

        {isInStaging ? (
          <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
            พื้นที่พักรอ
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            {realTagCount} หมวดหมู่
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Tag Selector */}
        <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200">
          <TagSelectorInput
            selectedTagIds={selectedTags}
            onChange={setSelectedTags}
            label="เลือกหมวดหมู่"
            helperText="ข้ามได้ ระบบจะตั้งเป็นพื้นที่พักรอให้อัตโนมัติ"
          />
        </div>

        {/* Mascot Notes */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MessageSquareText className="w-4 h-4 text-amber-700 shrink-0" />
              <span>โน้ตมุกมาสคอต</span>
            </span>
            <span className="text-xs text-stone-400 font-normal">ไม่บังคับ</span>
          </label>
          <textarea
            rows={2}
            value={mascotNotes}
            onChange={(e) => setMascotNotes(e.target.value)}
            placeholder="ระบุจังหวะตบมุก หรือจุดน่าสนใจ..."
            className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all text-stone-900 placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Footer Navigation & Submit */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับ</span>
        </button>

        <motion.button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          whileHover={canSubmit ? { scale: 1.01 } : undefined}
          whileTap={canSubmit ? { scale: 0.98 } : undefined}
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm sm:text-base font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
            canSubmit
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          {hasDriveUrl ? (
            <>
              <Check className="w-4 h-4" />
              <span>บันทึกฟุตพร้อมใช้ ({previewNextId})</span>
            </>
          ) : hasOriginalUrl ? (
            <>
              <BookmarkPlus className="w-4 h-4" />
              <span>บันทึกเก็บไว้ก่อน ({previewNextId})</span>
            </>
          ) : (
            <span>บันทึกฟุตเดี่ยว ({previewNextId})</span>
          )}
        </motion.button>
      </div>
    </div>
  );
};
