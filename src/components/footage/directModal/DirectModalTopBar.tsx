import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, ExternalLink, FolderOpen, Layers } from 'lucide-react';
import { detectPlatformFromUrl } from '../../../utils/platformDetector';
import { PlatformIcon } from './PlatformIcons';

interface DirectModalTopBarProps {
  previewNextId: string;
  previewFileName: string;
  originalUrl: string;
  driveFileUrl: string;
  isInStaging: boolean;
  tagCount: number;
  currentStep: number;
  onSelectStep: (step: number) => void;
  canProceedToStep2: boolean;
  canProceedToStep3: boolean;
}

export const DirectModalTopBar: React.FC<DirectModalTopBarProps> = ({
  previewNextId,
  previewFileName,
  originalUrl,
  driveFileUrl,
  isInStaging,
  tagCount,
  currentStep,
  onSelectStep,
  canProceedToStep2,
  canProceedToStep3,
}) => {
  const [copiedFileName, setCopiedFileName] = useState(false);
  const detectedPlatform = detectPlatformFromUrl(originalUrl);
  const detectedDrive = detectPlatformFromUrl(driveFileUrl);

  const handleCopyFileName = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(previewFileName);
    setCopiedFileName(true);
    setTimeout(() => setCopiedFileName(false), 1600);
  };

  const steps = [
    { num: 1, label: 'ลิงก์คลิป', ready: true },
    { num: 2, label: 'ข้อมูลคลิป', ready: canProceedToStep2 },
    { num: 3, label: 'หมวดหมู่ & โน้ต', ready: canProceedToStep3 },
  ];

  return (
    <div className="bg-[#FAF7F2] text-stone-800 rounded-2xl p-3 sm:p-3.5 border border-amber-200/70 shadow-2xs">
      {/* Upper row: Dynamic Pastel Badges & Quick Links */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-amber-200/50">
        <div className="flex flex-wrap items-center gap-2">
          {/* Footage ID Badge (Pastel Warm Honey) */}
          <div
            onClick={handleCopyFileName}
            title={`คลิกเพื่อคัดลอกชื่อไฟล์: ${previewFileName}`}
            className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100/90 hover:bg-amber-200/80 text-amber-900 border border-amber-300/80 font-mono font-bold text-xs sm:text-sm cursor-pointer transition-all select-none shadow-2xs"
          >
            <span>{previewNextId}</span>
            {copiedFileName ? (
              <Check className="w-3.5 h-3.5 text-emerald-700 animate-in zoom-in" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-amber-700/70 group-hover:text-amber-900" />
            )}
          </div>

          {/* Original Source Platform Badge (Dynamic on URL - Pastel) */}
          <AnimatePresence>
            {detectedPlatform && (
              <motion.a
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`เปิดคลิปต้นฉบับ: ${originalUrl}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${detectedPlatform.badgeBg} ${detectedPlatform.badgeBorder} ${detectedPlatform.badgeText} ${detectedPlatform.hoverColor} hover:shadow-xs`}
              >
                <PlatformIcon platform={detectedPlatform.type} className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[110px]">{detectedPlatform.name}</span>
                <ExternalLink className="w-3 h-3 opacity-60 hover:opacity-100 shrink-0" />
              </motion.a>
            )}
          </AnimatePresence>

          {/* Google Drive Link Badge (Pastel Emerald) */}
          <AnimatePresence>
            {detectedDrive && (
              <motion.a
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                href={driveFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`เปิดไฟล์ใน Google Drive: ${driveFileUrl}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/80 transition-all cursor-pointer hover:shadow-xs"
              >
                <FolderOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Google Drive</span>
                <ExternalLink className="w-3 h-3 opacity-60 hover:opacity-100 shrink-0" />
              </motion.a>
            )}
          </AnimatePresence>

          {/* Category Status Badge (Pastel Sage) */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border ${
              isInStaging
                ? 'bg-stone-100 text-stone-700 border-stone-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>{isInStaging ? 'พื้นที่พักรอ' : `${tagCount} หมวดหมู่`}</span>
          </div>
        </div>

        {/* Copy preview filename helper hint */}
        <div className="hidden md:flex items-center gap-1 text-[11px] text-stone-500 font-mono truncate max-w-xs">
          <span className="truncate">{previewFileName}</span>
        </div>
      </div>

      {/* Lower row: Step Navigation Indicators in Warm Pastel Earth-tone */}
      <div className="grid grid-cols-3 gap-2 pt-2.5">
        {steps.map((s) => {
          const isActive = currentStep === s.num;
          const isPassed = currentStep > s.num;
          const canClick = s.ready || isPassed;

          return (
            <button
              key={s.num}
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onSelectStep(s.num)}
              className={`relative flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : isPassed
                  ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                  : canClick
                  ? 'bg-white/80 text-stone-700 border border-stone-200/80 hover:bg-white cursor-pointer'
                  : 'bg-stone-100/50 text-stone-400 border border-stone-200/40 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                  isActive
                    ? 'bg-white text-emerald-800'
                    : isPassed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
