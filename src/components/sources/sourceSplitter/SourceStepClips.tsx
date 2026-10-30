import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Clock, FileText, MessageSquareText, Scissors, Check, Copy, ArrowLeft } from 'lucide-react';
import { SplitClipDraft } from '../../../context/CMSContext';
import { generateStandardFileName } from '../../../utils/fileNameGenerator';

interface SourceStepClipsProps {
  clips: SplitClipDraft[];
  baseFootageIdNumber: number;
  initialShotOffset: number;
  onAddClip: () => void;
  onRemoveClip: (index: number) => void;
  onUpdateClip: (index: number, updates: Partial<SplitClipDraft>) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SourceStepClips: React.FC<SourceStepClipsProps> = ({
  clips,
  baseFootageIdNumber,
  initialShotOffset,
  onAddClip,
  onRemoveClip,
  onUpdateClip,
  onBack,
  onSubmit,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const validClipsCount = clips.filter((c) => c.title.trim() !== '').length;

  const handleCopyFileName = (filename: string, idx: number) => {
    navigator.clipboard?.writeText(filename);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900">2. รายการช็อตฮาที่หั่น</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            ระบุช่วงเวลา Timestamp และชื่อมุก ระบบจะคำนวณรหัส FT ให้อัตโนมัติ
          </p>
        </div>

        <button
          type="button"
          onClick={onAddClip}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-700" />
          <span>เพิ่มช็อต</span>
        </button>
      </div>

      {/* Split Clips Cards Stack */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {clips.map((clip, idx) => {
            const previewFtId = `FT-${String(baseFootageIdNumber + idx + 1).padStart(4, '0')}`;
            const previewFile = generateStandardFileName(
              previewFtId,
              clip.title || `ช็อตที่_${idx + 1}`
            );
            const shotOrderNum = initialShotOffset + idx + 1;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-3.5 space-y-3 transition-all hover:border-amber-300/70"
              >
                {/* Header row: Order, FT ID, Standard Filename, Remove */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-200/70">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold text-xs shrink-0 border border-amber-300/60">
                      #{shotOrderNum} · {previewFtId}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyFileName(previewFile, idx)}
                      title={`คัดลอก: ${previewFile}`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 hover:text-stone-800 truncate cursor-pointer bg-white/70 px-2 py-0.5 rounded-md border border-stone-200/60"
                    >
                      <span className="truncate max-w-[190px] sm:max-w-xs">{previewFile}</span>
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-stone-400 shrink-0" />
                      )}
                    </button>
                  </div>

                  {clips.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveClip(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="ลบช็อตนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Form fields: Timestamp, Title, Mascot Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Timestamp *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clip.timestampRange}
                      onChange={(e) => onUpdateClip(idx, { timestampRange: e.target.value })}
                      placeholder="05:10 - 05:50"
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>ชื่อช็อตฮา *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clip.title}
                      onChange={(e) => onUpdateClip(idx, { title: e.target.value })}
                      placeholder="เช่น จังหวะไมค์ดับ, วิ่งชนกรรมการ..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <MessageSquareText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>โน้ตมุกมาสคอต</span>
                    </label>
                    <input
                      type="text"
                      value={clip.mascotNotes}
                      onChange={(e) => onUpdateClip(idx, { mascotNotes: e.target.value })}
                      placeholder="ประโยคตบมุก/โน้ต..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ข้อมูลต้นฉบับ</span>
        </button>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onAddClip}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+1 ช็อต</span>
          </button>

          <motion.button
            type="button"
            disabled={validClipsCount === 0}
            onClick={onSubmit}
            whileHover={validClipsCount > 0 ? { scale: 1.01 } : undefined}
            whileTap={validClipsCount > 0 ? { scale: 0.98 } : undefined}
            className={`inline-flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
              validClipsCount > 0
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>บันทึกการหั่น ({validClipsCount} ช็อต)</span>
            <Check className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
