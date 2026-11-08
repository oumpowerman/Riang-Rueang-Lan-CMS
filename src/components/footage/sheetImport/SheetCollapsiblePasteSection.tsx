import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  HelpCircle,
  X,
} from 'lucide-react';
import { SAMPLE_4COL_SHEET_DATA, SAMPLE_2COL_SHEET_DATA } from './sheetImportParser';
import { SheetSyncSummaryStats } from './sheetImport.types';

interface SheetCollapsiblePasteSectionProps {
  pastedText: string;
  onChangePastedText: (text: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  stats: SheetSyncSummaryStats;
  syncEpisodesFromColD?: boolean;
}

export const SheetCollapsiblePasteSection: React.FC<
  SheetCollapsiblePasteSectionProps
> = ({
  pastedText,
  onChangePastedText,
  isExpanded,
  onToggleExpanded,
  stats,
  syncEpisodesFromColD = true,
}) => {
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const hasData = stats.totalRows > 0;

  // When data is loaded and the user hasn't opened the Edit Paste drawer, render nothing so the Table flushes right against the Modal Header!
  if (hasData && !isExpanded) {
    return null;
  }

  return (
    <motion.div
      initial={hasData ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={
        hasData
          ? 'border-b border-[#E8DFD3] bg-[#FDFBF7] px-5 py-3.5 shadow-sm shrink-0 z-20'
          : 'flex-1 min-h-0 flex flex-col p-4 sm:p-5 bg-[#FAF8F5]'
      }
    >
      <div
        className={
          hasData
            ? 'space-y-2.5'
            : 'flex-1 min-h-0 flex flex-col rounded-2xl bg-[#FFFFFF] border border-[#E8DFD3] p-4 shadow-2xs gap-3'
        }
      >
        {/* Top Row: Collapsible Guide Trigger & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsGuideExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EEF5EE] hover:bg-[#E2EFE2] text-[#1C4824] border border-[#BAD8BF] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#3B6845]" />
              <span>
                {syncEpisodesFromColD
                  ? 'คำอธิบายวิธีเตรียมข้อมูล 4 คอลัมน์ (A–D)'
                  : 'คำอธิบายวิธีเตรียมข้อมูล 2 คอลัมน์ (A–B)'}
              </span>
              {isGuideExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#3B6845]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#3B6845]" />
              )}
            </button>

            <span className="text-xs text-[#7D6E61] hidden sm:inline">
              {syncEpisodesFromColD
                ? 'ก๊อปปี้ 4 คอลัมน์ (A–D) หรือเลือกวางเฉพาะ 2 คอลัมน์ (A–B) ได้ทันที'
                : 'โหมดซิงค์เฉพาะแท็ก: วางเฉพาะคอลัมน์ A–B ได้ทันที (ไม่แตะต้องหรือสร้าง EP)'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!hasData && (
              <>
                <button
                  type="button"
                  onClick={() => onChangePastedText(SAMPLE_2COL_SHEET_DATA)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#F0F7FF] hover:bg-[#E0EFFE] text-[#1E40AF] border border-[#BFDBFE] transition-colors cursor-pointer whitespace-nowrap"
                  title="ทดลองวางตัวอย่างเฉพาะชื่อคลิปและแท็ก (คอลัมน์ A–B)"
                >
                  ลองวาง 2 คอลัมน์ (A–B)
                </button>
                <button
                  type="button"
                  onClick={() => onChangePastedText(SAMPLE_4COL_SHEET_DATA)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#FEF8ED] hover:bg-[#FAEED6] text-[#734B17] border border-[#EDD7AF] transition-colors cursor-pointer whitespace-nowrap"
                  title="ทดลองวางตัวอย่างครบ 4 คอลัมน์พร้อมข้อมูล EP"
                >
                  ลองวาง 4 คอลัมน์ (A–D)
                </button>
              </>
            )}

            {pastedText && (
              <button
                type="button"
                onClick={() => onChangePastedText('')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#8C7B6C] hover:text-[#B44335] hover:bg-[#FDF4EB] transition-colors cursor-pointer whitespace-nowrap"
              >
                ล้างข้อมูล
              </button>
            )}

            {hasData && (
              <button
                type="button"
                onClick={onToggleExpanded}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#3B6845] hover:bg-[#2D5236] text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>ซ่อนช่องวางข้อมูล</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Framer Motion Collapsible Instructions (Collapsed by Default) */}
        <AnimatePresence initial={false}>
          {isGuideExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden shrink-0"
            >
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-[#6E5F52]">
                <div className="p-2.5 rounded-lg bg-white border border-[#E8DFD3] space-y-1">
                  <div className="font-bold text-[#1E40AF] flex items-center gap-1.5">
                    <span>📌 รูปแบบที่ 1: ซิงค์เฉพาะแท็ก (คอลัมน์ A–B)</span>
                  </div>
                  <div className="text-[11px] text-[#524538] leading-relaxed">
                    • <strong>คอลัมน์ A (ชื่อคลิป)</strong>: จับคู่กับฟุตเทจในคลัง (ดึงคลิปพักรอจัดหมวดหมู่ออกมาทันที)<br />
                    • <strong>คอลัมน์ B (แท็ก)</strong>: เช่น <code className="bg-[#FAF8F5] px-1 py-0.5 rounded text-[#254B2D] font-bold border border-[#E2D5C4]">#พี่เสก #คนดัง</code> (ผสานแท็กให้คลิป ไม่แตะต้อง EP)
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#E8DFD3] space-y-1">
                  <div className="font-bold text-[#1C4824] flex items-center gap-1.5">
                    <span>🎬 รูปแบบที่ 2: ซิงค์แท็กพร้อมสร้าง EP (คอลัมน์ A–D)</span>
                  </div>
                  <div className="text-[11px] text-[#524538] leading-relaxed">
                    • <strong>คอลัมน์ C (ลิงก์)</strong>: ลิงก์คลิปหลัก เช่น YouTube Shorts / TikTok<br />
                    • <strong>คอลัมน์ D (ชื่อคลิปหลัก)</strong>: เช่น <code className="bg-[#EEF5EE] px-1 py-0.5 rounded text-[#1C4824] font-bold border border-[#BAD8BF]">พี่เสกสุดฮา EP.1</code> (รวม 5 แถวเป็น 1 EP อัตโนมัติ)
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paste Textarea */}
        <div
          className={
            hasData
              ? 'flex flex-col gap-1.5'
              : 'flex-1 min-h-0 flex flex-col gap-1.5'
          }
        >
          <label className="text-xs font-extrabold text-[#3D332A] flex items-center gap-1.5 shrink-0">
            <ClipboardPaste className="w-3.5 h-3.5 text-[#3B6845]" />
            <span>
              วางข้อมูลที่ก๊อปปี้จาก Google Sheets ที่นี่ (Ctrl+V / Cmd+V):
            </span>
          </label>

          <textarea
            rows={hasData ? 4 : 10}
            value={pastedText}
            onChange={(e) => onChangePastedText(e.target.value)}
            placeholder={`ก๊อปปี้แถวจาก Google Sheets มาวางที่นี่ได้เลย เช่น:\nร้องเพลงหมาสี่แม่มึง\t#พี่เสก #คนดัง #ศิลปิน #ไลฟ์สด\thttps://youtube.com/shorts/W0iciqjFznc\tพี่เสกสุดฮา EP.1`}
            className={`w-full p-3.5 rounded-xl border border-[#E3D8CB] bg-[#FDFBF7] text-xs font-mono text-[#3D332A] placeholder:text-[#A89B8D] focus:outline-none focus:ring-1.5 focus:ring-[#8FA892] focus:border-[#8FA892] transition-colors leading-relaxed scrollbar-thin ${
              hasData ? 'resize-y max-h-44' : 'flex-1 min-h-[200px] resize-none'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};
