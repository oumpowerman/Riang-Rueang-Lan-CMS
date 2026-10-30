import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Copy, Check, ArrowRight, ArrowLeft, FileText } from 'lucide-react';

interface DirectStepDetailsProps {
  title: string;
  setTitle: (val: string) => void;
  durationSec: number;
  setDurationSec: (val: number) => void;
  previewNextId: string;
  previewFileName: string;
  onBack: () => void;
  onNext: () => void;
}

export const DirectStepDetails: React.FC<DirectStepDetailsProps> = ({
  title,
  setTitle,
  durationSec,
  setDurationSec,
  previewNextId,
  previewFileName,
  onBack,
  onNext,
}) => {
  const [copied, setCopied] = useState(false);
  const hasTitle = Boolean(title.trim());

  const handleCopyFileName = () => {
    navigator.clipboard?.writeText(previewFileName);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hasTitle) {
      e.preventDefault();
      onNext();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-stone-900">2. ข้อมูลคลิป</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          ตั้งชื่อช็อตและระบุความยาวคร่าวๆ
        </p>
      </div>

      <div className="space-y-3">
        {/* Title Input */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>ชื่อช็อตฮา <span className="text-rose-500">*</span></span>
            </span>
            <span className="text-[11px] font-normal text-stone-400">กด Enter เพื่อไปต่อ</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="เช่น ลุงเปิดไฟเลี้ยวซ้ายแต่เลี้ยวขวา, แมวเต้นมุกกวน..."
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all text-stone-900 font-medium placeholder:text-stone-400"
          />
        </div>

        {/* Duration and Standard Drive Filename box */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-4">
            <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-stone-400 shrink-0" />
              <span>ความยาว (วิ)</span>
            </label>
            <input
              type="number"
              min={3}
              max={600}
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value) || 25)}
              className="w-full px-3 py-2 text-sm font-mono font-bold text-stone-900 bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="sm:col-span-8">
            <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5 flex items-center justify-between">
              <span>ชื่อไฟล์มาตรฐาน Google Drive</span>
              <span className="text-[11px] text-amber-700 font-medium">พร้อมคัดลอก</span>
            </label>
            <div className="flex items-center gap-2 p-2 px-3 bg-[#FAF7F2] border border-amber-200/70 rounded-xl">
              <span className="font-mono text-xs text-stone-700 truncate font-semibold flex-1" title={previewFileName}>
                {previewFileName}
              </span>
              <button
                type="button"
                onClick={handleCopyFileName}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-emerald-800">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                    <span>คัดลอก</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับ</span>
        </button>

        <button
          type="button"
          disabled={!hasTitle}
          onClick={onNext}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            hasTitle
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>ถัดไป</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
