import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  HelpCircle,
  X,
} from 'lucide-react';
import {
  SAMPLE_10COL_SHEET_DATA,
  SAMPLE_2COL_SHEET_DATA,
} from './sheetImportParser';
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
                  ? 'คู่มือตารางหลัก 10 คอลัมน์ (A–J: ฟุตเทจ + แท็ก 3 ชั้น + EP + วันที่)'
                  : 'คู่มือวางเฉพาะแท็ก (คอลัมน์ A–B)'}
              </span>
              {isGuideExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#3B6845]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#3B6845]" />
              )}
            </button>

            <span className="text-xs text-[#7D6E61] hidden md:inline">
              ก๊อปปี้ตาราง 10 คอลัมน์ (A–J) จาก Google Sheets มาวางครั้งเดียวจบ (รองรับ 4 หรือ 2 คอลัมน์แบบเดิมอัตโนมัติ)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!hasData && (
              <>
                <button
                  type="button"
                  onClick={() => onChangePastedText(SAMPLE_2COL_SHEET_DATA)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#EEF5FB] hover:bg-[#E1EDF8] text-[#1E40AF] border border-[#C6DDF2] transition-colors cursor-pointer whitespace-nowrap"
                  title="ทดลองวางตัวอย่างเฉพาะชื่อคลิปและแท็ก (คอลัมน์ A–B)"
                >
                  ลองวาง 2 คอลัมน์ (A–B)
                </button>
                <button
                  type="button"
                  onClick={() => onChangePastedText(SAMPLE_10COL_SHEET_DATA)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#FEF6E8] hover:bg-[#FAEBD0] text-[#734B17] border border-[#EAD5AE] transition-colors cursor-pointer whitespace-nowrap"
                  title="ทดลองวางตัวอย่างตารางหลัก 10 คอลัมน์ (A–J)"
                >
                  ลองวางตารางหลัก 10 คอลัมน์ (A–J)
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
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#6E5F52]">
                <div className="p-2.5 rounded-lg bg-white border border-[#E8DFD3] space-y-1">
                  <div className="font-bold text-[#1C4824] flex items-center gap-1.5">
                    <span>🎬 คอลัมน์ A–D (ข้อมูลฟุตเทจ & อันดับ)</span>
                  </div>
                  <div className="text-[11px] text-[#524538] leading-relaxed">
                    • <strong>Col A (ชื่อฟุต)</strong>: จับคู่คลังหรือสร้างฟุตใหม่<br />
                    • <strong>Col B (ชื่อคลิป)</strong>: เช่น <code className="bg-[#EEF5EE] px-1 py-0.5 rounded text-[#1C4824] font-bold">5 อันดับพี่เสกสุดฮา EP.1 #ตลก</code><br />
                    • <strong>Col C (ชื่ออันดับ)</strong> & <strong>Col D (คำสร้อย)</strong>: บันทึกลงบทพากย์และหมายเหตุอันดับอัตโนมัติ (ข้ามหากเป็น <code className="font-bold">-</code>)
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#E8DFD3] space-y-1">
                  <div className="font-bold text-[#1E40AF] flex items-center gap-1.5">
                    <span>🏷️ คอลัมน์ E–G (ระบบแท็ก 3 ชั้นอิสระ)</span>
                  </div>
                  <div className="text-[11px] text-[#524538] leading-relaxed">
                    • <strong className="text-[#1E40AF]">Col E (แท็ก Tier 1)</strong>: หมวดกว้าง/วงการ<br />
                    • <strong className="text-[#8A4D1F]">Col F (แท็ก Tier 2)</strong>: บริบท/สไตล์คลิป<br />
                    • <strong className="text-[#1C4824]">Col G (แท็ก Tier 3)</strong>: บุคคลเจาะจง/รายการ<br />
                    <span className="text-[10px] text-[#7D6E61]">
                      (หากแท็กมีในคลังแล้ว ระบบจะใช้ Tier เดิมให้อัตโนมัติ)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#E8DFD3] space-y-1">
                  <div className="font-bold text-[#734B17] flex items-center gap-1.5">
                    <span>📅 คอลัมน์ H–J (ลิงก์ & วันเวลาเผยแพร่)</span>
                  </div>
                  <div className="text-[11px] text-[#524538] leading-relaxed">
                    • <strong>Col H (ลิงค์)</strong>: ลิงก์ YouTube Shorts / คลิปหลัก<br />
                    • <strong>Col I (วันที่)</strong> & <strong>Col J (เวลา)</strong>: ซิงก์วันเผยแพร่จริง + คำนวณรอบเช้า/เย็น และปรับวันพักฟุตเทจ (Cooldown) ทันที
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
              วางข้อมูลตาราง 10 คอลัมน์ (A–J) ที่ก๊อปปี้จาก Google Sheets ที่นี่ (Ctrl+V / Cmd+V):
            </span>
          </label>

          <textarea
            rows={hasData ? 4 : 10}
            value={pastedText}
            onChange={(e) => onChangePastedText(e.target.value)}
            placeholder={`ก๊อปปี้แถวจากตารางหลัก 10 คอลัมน์ (A–J) มาวางได้เลย เช่น:\nชื่อฟุต\tชื่อคลิป\tชื่ออันดับ\tคำสร้อย\tแท็ก Tier 1\tแท็ก Tier 2\tแท็ก Tier 3\tลิงค์\tวันที่\tเวลา\nร้องเพลงหมาสี่แม่มึง\t5 อันดับพี่เสกสุดฮา EP.1 #ตลก\tจอมยุทธ์เสก\t-\t#คนดัง #ศิลปิน\t#ไลฟ์สด\t#พี่เสก\thttps://youtube.com/shorts/W0iciqjFznc\t29/09/2026\t06:00`}
            className={`w-full p-3.5 rounded-xl border border-[#E3D8CB] bg-[#FDFBF7] text-xs font-mono text-[#3D332A] placeholder:text-[#A89B8D] focus:outline-none focus:ring-1.5 focus:ring-[#8FA892] focus:border-[#8FA892] transition-colors leading-relaxed scrollbar-thin ${
              hasData ? 'resize-y max-h-44' : 'flex-1 min-h-[200px] resize-none'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};
