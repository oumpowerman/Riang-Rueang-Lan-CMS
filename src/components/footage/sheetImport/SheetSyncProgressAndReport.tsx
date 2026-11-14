import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Film,
  Loader2,
  Tag,
} from 'lucide-react';
import {
  SheetSyncSuccessReport,
  SyncProgressState,
} from './sheetImport.types';

interface SheetPasteAnalyzingViewProps {
  detectedLineCount: number;
  matchedCount: number;
  episodeGroupsCount: number;
}

export const SheetPasteAnalyzingView: React.FC<
  SheetPasteAnalyzingViewProps
> = ({ detectedLineCount, matchedCount, episodeGroupsCount }) => {
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setActiveStep(1), 240);
    const t2 = window.setTimeout(() => setActiveStep(2), 500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const steps = [
    {
      idx: 0,
      icon: FileSpreadsheet,
      label: `อ่านข้อมูลตารางหลัก 10 คอลัมน์ ${detectedLineCount.toLocaleString()} แถว`,
    },
    {
      idx: 1,
      icon: Tag,
      label: `จับคู่คลิปในคลัง ${matchedCount.toLocaleString()} รายการ & แยกแท็ก 3 ชั้น (Tier 1–3)`,
    },
    {
      idx: 2,
      icon: Film,
      label:
        episodeGroupsCount > 0
          ? `จัดกลุ่มคลิปหลักได้ ${episodeGroupsCount.toLocaleString()} EP พร้อมชื่ออันดับ & คำสร้อย`
          : 'เตรียมตารางตรวจสอบฟุตเทจ & แท็ก 3 ชั้น',
    },
  ];

  return (
    <motion.div
      key="paste-analyzing-morph"
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.02, y: -10 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className="flex-1 min-h-0 flex items-center justify-center p-6 bg-[#FAF8F5]"
    >
      <div className="max-w-md w-full p-6 rounded-3xl bg-[#FFFFFF] border border-[#E8DFD3] shadow-sm text-center space-y-4">
        <motion.div
          initial={{ scale: 0.85, rotate: -6 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="w-14 h-14 mx-auto rounded-2xl bg-[#EEF5EE] border border-[#BAD8BF] flex items-center justify-center text-[#3B6845] relative"
        >
          <FileSpreadsheet className="w-6 h-6" />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#3B6845] text-white flex items-center justify-center">
            <Loader2 className="w-3 h-3 animate-spin" />
          </span>
        </motion.div>

        <div className="space-y-1">
          <h4 className="text-base font-extrabold text-[#3D332A]">
            กำลังแยกคอลัมน์ A–J และจับคู่ระบบแท็ก 3 ชั้น...
          </h4>
          <p className="text-xs text-[#7D6E61]">
            ระบบกำลังเทียบชื่อฟุตเทจ แยกแท็ก Tier 1/2/3 จัดอันดับ EP และอ่านวันที่เผยแพร่
          </p>
        </div>

        {/* Step Morphing Checklist */}
        <div className="space-y-1.5 text-left">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = activeStep > step.idx;
            const isCurrent = activeStep === step.idx;

            return (
              <motion.div
                key={step.idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: activeStep >= step.idx ? 1 : 0.45,
                  x: 0,
                }}
                transition={{ duration: 0.2, delay: step.idx * 0.08 }}
                className={`px-3.5 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                  isCurrent
                    ? 'bg-[#FEF8ED] border-[#EDD7AF] text-[#734B17] font-bold'
                    : isCompleted
                    ? 'bg-[#EEF5EE] border-[#BAD8BF] text-[#1C4824] font-bold'
                    : 'bg-[#FAF8F5] border-[#EFE7DC] text-[#998A7C]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{step.label}</span>
                </div>
                <span className="shrink-0">
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-[#3B6845]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8A5A22]" />
                  ) : null}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Animated Progress Strip */}
        <div className="w-full h-2 rounded-full bg-[#EFE7DC] overflow-hidden">
          <motion.div
            initial={{ width: '12%' }}
            animate={{ width: '98%' }}
            transition={{ duration: 0.72, ease: 'easeInOut' }}
            className="h-full bg-[#3B6845] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};

interface SheetSyncProgressViewProps {
  progress: SyncProgressState;
}

export const SheetSyncProgressView: React.FC<SheetSyncProgressViewProps> = ({
  progress,
}) => {
  const phases = [
    { idx: 1, label: '1. สร้างแท็กใหม่แยกตาม Tier 1 / 2 / 3' },
    { idx: 2, label: '2. สร้างฟุตเทจใหม่พร้อมชื่ออันดับ/คำสร้อย' },
    { idx: 3, label: '3. ผสานแท็ก 3 ชั้นให้ฟุตเทจในคลัง' },
    { idx: 4, label: '4. บันทึกคลังคลิปหลัก (EP) & คำนวณวันพักฟุต' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-10 px-4 max-w-xl w-full mx-auto text-center space-y-6"
    >
      <div className="w-14 h-14 mx-auto rounded-3xl bg-[#EEF5EE] border border-[#BAD8BF] flex items-center justify-center text-[#3B6845]">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>

      <div className="space-y-1.5">
        <h4 className="text-lg font-extrabold text-[#3D332A]">
          กำลังซิงค์ตารางหลัก 10 คอลัมน์ขึ้น Cloud...
        </h4>
        <p className="text-xs text-[#6E5F52]">{progress.phaseLabel}</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 text-left bg-[#FFFFFF] p-4 rounded-2xl border border-[#E8DFD3] shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-[#3D332A]">
          <span>ความคืบหน้าโดยรวม</span>
          <span className="font-mono text-[#1C4824] tabular-nums">
            {progress.completedItems.toLocaleString()} /{' '}
            {progress.totalItems.toLocaleString()} รายการ ({progress.percent}%)
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-[#EFE7DC] overflow-hidden">
          <div
            className="h-full bg-[#3B6845] transition-all duration-200 rounded-full"
            style={{ width: `${Math.min(100, Math.max(4, progress.percent))}%` }}
          />
        </div>

        {/* 4 Phase Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {phases.map((p) => {
            const isDone = progress.phaseIndex > p.idx;
            const isCurrent = progress.phaseIndex === p.idx;
            return (
              <div
                key={p.idx}
                className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-[#FEF8ED] border-[#EDD7AF] text-[#734B17] font-bold'
                    : isDone
                    ? 'bg-[#EEF5EE] border-[#BAD8BF] text-[#1C4824] font-semibold'
                    : 'bg-[#FAF8F5] border-[#EFE7DC] text-[#998A7C]'
                }`}
              >
                <span className="font-mono">
                  {isDone ? '✓' : isCurrent ? '●' : '○'}
                </span>
                <span className="truncate">{p.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

interface SheetSyncSuccessReportViewProps {
  report: SheetSyncSuccessReport;
  onClose: () => void;
  onGoToMasterEpisodes: () => void;
  onGoToYouTubeDateSyncTab?: () => void;
}

export const SheetSyncSuccessReportView: React.FC<
  SheetSyncSuccessReportViewProps
> = ({
  report,
  onClose,
  onGoToMasterEpisodes,
  onGoToYouTubeDateSyncTab,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-6 px-4 text-center space-y-5"
    >
      <div className="w-16 h-16 mx-auto rounded-3xl bg-[#EEF5EE] border border-[#BAD8BF] flex items-center justify-center text-[#3B6845]">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-1.5 max-w-xl mx-auto">
        <h4 className="text-xl font-extrabold text-[#3D332A]">
          ซิงก์ตารางหลัก 10 คอลัมน์ (ฟุตเทจ + แท็ก 3 ชั้น + EP + วันที่) สำเร็จ!
        </h4>
        <p className="text-xs sm:text-sm text-[#6E5F52] leading-relaxed">
          ระบบได้ผูกแท็ก 3 ชั้น บันทึกชื่ออันดับ/คำสร้อย จัดชุดคลิปหลัก 5 อันดับ และคำนวณวันพักฟุตเทจ (Cooldown) เรียบร้อยแล้ว
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8DFD3]">
          <span className="text-xs text-[#7D6E61] block">อัปเดตฟุตเทจในคลัง</span>
          <span className="text-lg font-extrabold font-mono text-[#1C4824]">
            {report.updatedClipsCount.toLocaleString()} คลิป
          </span>
          {report.movedFromStagingCount > 0 && (
            <span className="text-xs text-[#3B6845] block mt-0.5 font-semibold">
              (พ้นพื้นที่พัก {report.movedFromStagingCount.toLocaleString()} คลิป)
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8DFD3]">
          <span className="text-xs text-[#7D6E61] block">สร้างฟุตเทจใหม่</span>
          <span className="text-lg font-extrabold font-mono text-[#734B17]">
            {report.createdClipsCount.toLocaleString()} คลิป
          </span>
          <span className="text-xs text-[#8C7B6C] block mt-0.5">
            {report.skippedRowsCount > 0
              ? `ข้าม ${report.skippedRowsCount.toLocaleString()} แถว`
              : 'พร้อมชื่ออันดับและคำสร้อย'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8DFD3]">
          <span className="text-xs text-[#7D6E61] block">สร้างแท็ก 3 ชั้นใหม่</span>
          <span className="text-lg font-extrabold font-mono text-[#1E40AF]">
            {report.createdTagsCount.toLocaleString()} แท็ก
          </span>
          <span className="text-[11px] text-[#6E5F52] block mt-0.5 font-mono">
            T1:{report.createdTier1TagsCount} · T2:{report.createdTier2TagsCount} · T3:{report.createdTier3TagsCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#EEF5EE] border border-[#BAD8BF]">
          <span className="text-xs text-[#254B2D] block font-semibold">
            ซิงค์คลังคลิปหลัก (EP)
          </span>
          <span className="text-lg font-extrabold font-mono text-[#1C4824]">
            {(report.createdEpisodesCount + report.updatedEpisodesCount).toLocaleString()} ตอน
          </span>
          <span className="text-xs text-[#3B6845] block mt-0.5">
            สร้างใหม่ {report.createdEpisodesCount.toLocaleString()} · อัปเดต{' '}
            {report.updatedEpisodesCount.toLocaleString()}
          </span>
        </div>
      </div>

      {report.syncedEpisodeTitles.length > 0 && (
        <div className="max-w-3xl mx-auto p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8DFD3] text-left">
          <span className="text-xs font-bold text-[#3D332A] block mb-2">
            รายการคลิปหลัก (Master Episodes) ที่จัดอันดับเสร็จสิ้น (
            {report.syncedEpisodeTitles.length.toLocaleString()} ตอน):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin">
            {report.syncedEpisodeTitles.slice(0, 40).map((epTitle, idx) => (
              <span
                key={`${epTitle}-${idx}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF]"
              >
                <Film className="w-3.5 h-3.5 text-[#3B6845]" />
                <span>{epTitle}</span>
              </span>
            ))}
            {report.syncedEpisodeTitles.length > 40 && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#FAF7F2] text-[#6E5F52] border border-[#E2D5C4]">
                +อีก {(report.syncedEpisodeTitles.length - 40).toLocaleString()} ตอน
              </span>
            )}
          </div>
        </div>
      )}

      {report.createdTagNames.length > 0 && (
        <div className="max-w-3xl mx-auto p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8DFD3] text-left">
          <span className="text-xs font-bold text-[#3D332A] block mb-1.5">
            แท็กใหม่ที่ถูกสร้างขึ้นในระบบ ({report.createdTagNames.length.toLocaleString()} แท็ก):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto scrollbar-thin">
            {report.createdTagNames.slice(0, 50).map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#FEF8ED] text-[#734B17] border border-[#EDD7AF]"
              >
                #{name}
              </span>
            ))}
            {report.createdTagNames.length > 50 && (
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#FAF7F2] text-[#6E5F52] border border-[#E2D5C4]">
                +อีก {(report.createdTagNames.length - 50).toLocaleString()} แท็ก
              </span>
            )}
          </div>
        </div>
      )}

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#3D332A] border border-[#E2D5C4] transition-colors cursor-pointer"
        >
          กลับไปหน้าคลังฟุตเทจ
        </button>

        {report.syncedEpisodeTitles.length > 0 && (
          <button
            type="button"
            onClick={onGoToMasterEpisodes}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#3B6845] hover:bg-[#2C5235] text-white shadow-xs transition-colors cursor-pointer"
          >
            <Film className="w-4 h-4" />
            <span>เปิดดูคลังคลิปหลักที่จัดอันดับแล้ว ➔</span>
          </button>
        )}

        {onGoToYouTubeDateSyncTab && (
          <button
            type="button"
            onClick={onGoToYouTubeDateSyncTab}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#FEF6E8] hover:bg-[#FAEBD0] text-[#734B17] border border-[#EAD5AE] transition-colors cursor-pointer"
          >
            <CalendarClock className="w-4 h-4" />
            <span>อัปเดตเฉพาะวันที่เพิ่มเติม (2 คอลัมน์)</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
