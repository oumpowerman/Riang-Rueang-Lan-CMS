import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Eraser,
  ListOrdered,
  Maximize2,
  Minimize2,
  RotateCcw,
  Rows3,
  Settings2,
} from 'lucide-react';
import { RankingOrderDirection, TableRowDensity } from './sheetImport.types';

interface SwitchToggleRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: React.ReactNode;
}

const SwitchToggleRow: React.FC<SwitchToggleRowProps> = ({
  checked,
  onChange,
  title,
  description,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="w-full flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F5EFE6] border border-[#E8DFD3] transition-colors cursor-pointer text-left"
  >
    <div className="text-xs min-w-0 flex-1">
      <span className="font-bold text-[#3D332A] block leading-snug">{title}</span>
      <span className="text-[11px] text-[#7D6E61] leading-snug block mt-0.5">
        {description}
      </span>
    </div>

    <span
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors mt-0.5 ${
        checked ? 'bg-[#3B6845]' : 'bg-[#D5C9B8]'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-xs transition-transform ${
          checked ? 'translate-x-4.5' : 'translate-x-1'
        }`}
      />
    </span>
  </button>
);

interface SheetSettingsPopoverProps {
  hasData: boolean;
  syncEpisodesFromColD: boolean;
  onChangeSyncEpisodesFromColD: (val: boolean) => void;
  autoCreateMissingFootage: boolean;
  onChangeAutoCreateMissingFootage: (val: boolean) => void;
  includeSeriesTagOnFootage: boolean;
  onChangeIncludeSeriesTagOnFootage: (val: boolean) => void;
  rankingOrder: RankingOrderDirection;
  onChangeRankingOrder: (dir: RankingOrderDirection) => void;
  rowDensity: TableRowDensity;
  onToggleRowDensity: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onClearPastedText: () => void;
  onOpenJunkTagCleanup?: () => void;
}

export const SheetSettingsPopover: React.FC<SheetSettingsPopoverProps> = ({
  hasData,
  syncEpisodesFromColD,
  onChangeSyncEpisodesFromColD,
  autoCreateMissingFootage,
  onChangeAutoCreateMissingFootage,
  includeSeriesTagOnFootage,
  onChangeIncludeSeriesTagOnFootage,
  rankingOrder,
  onChangeRankingOrder,
  rowDensity,
  onToggleRowDensity,
  isFullScreen,
  onToggleFullScreen,
  onClearPastedText,
  onOpenJunkTagCleanup,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
          isOpen
            ? 'bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF]'
            : 'bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border-[#E2D5C4]'
        }`}
        aria-expanded={isOpen}
        title="ตั้งค่าการซิงก์ มุมมองตาราง และเครื่องมือเสริม"
      >
        <Settings2 className="w-3.5 h-3.5 text-[#3B6845]" />
        <span>ตั้งค่า</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8DFD3] shadow-xl z-50 space-y-2.5 text-left"
          >
            <div className="flex items-center justify-between border-b border-[#F2EBE0] pb-2">
              <span className="text-xs font-extrabold text-[#3D332A]">
                ตั้งค่าการซิงก์และเครื่องมือเสริม
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-semibold text-[#7D6E61] hover:text-[#3D332A] cursor-pointer"
              >
                ปิด
              </button>
            </div>

            <SwitchToggleRow
              checked={syncEpisodesFromColD}
              onChange={onChangeSyncEpisodesFromColD}
              title="1. จัดกลุ่มสร้าง/อัปเดต EP และซิงก์วันที่"
              description="รวมแถวที่อยู่คลิปหลักเดียวกันเป็น 1 EP พร้อมสล็อตจัดอันดับ ลิงก์ และวันที่ลง"
            />

            <SwitchToggleRow
              checked={autoCreateMissingFootage}
              onChange={onChangeAutoCreateMissingFootage}
              title="2. สร้างฟุตเทจใหม่ในคลังอัตโนมัติ (Col A)"
              description="หากไม่พบชื่อฟุตในคลังเดิม จะสร้างรหัส FT ใหม่ให้โดยไม่สร้างซ้ำข้าม EP"
            />

            <SwitchToggleRow
              checked={includeSeriesTagOnFootage}
              onChange={onChangeIncludeSeriesTagOnFootage}
              title="3. ติดแท็กชื่อซีรีส์จาก Col B ให้คลิปย่อย"
              description={
                <>
                  เช่น{' '}
                  <span className="font-semibold text-[#254B2D]">
                    5 อันดับพี่เสกสุดฮา EP.1
                  </span>{' '}
                  จะติด{' '}
                  <span className="font-semibold text-[#254B2D]">
                    #พี่เสกสุดฮา
                  </span>{' '}
                  เพิ่มให้ด้วย
                </>
              }
            />

            {/* Ranking Order */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3]">
              <div className="flex items-center gap-2 text-xs">
                <ListOrdered className="w-3.5 h-3.5 text-[#3B6845] shrink-0" />
                <div>
                  <span className="font-bold text-[#3D332A] block">
                    ลำดับแถวในชีท
                  </span>
                  <span className="text-[11px] text-[#7D6E61]">
                    แถวแรกของแต่ละ EP คืออันดับใด
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#EFE7DC] border border-[#E2D5C4] text-[11px] font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => onChangeRankingOrder('RANK_5_TO_1')}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    rankingOrder === 'RANK_5_TO_1'
                      ? 'bg-white text-[#1C4824] shadow-2xs'
                      : 'text-[#6E5F52] hover:text-[#3D332A]'
                  }`}
                >
                  5 ➔ 1
                </button>
                <button
                  type="button"
                  onClick={() => onChangeRankingOrder('RANK_1_TO_5')}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    rankingOrder === 'RANK_1_TO_5'
                      ? 'bg-white text-[#1C4824] shadow-2xs'
                      : 'text-[#6E5F52] hover:text-[#3D332A]'
                  }`}
                >
                  1 ➔ 5
                </button>
              </div>
            </div>

            {/* Consolidated Utility Actions */}
            <div className="pt-2 border-t border-[#F2EBE0] space-y-1.5">
              <div className="text-[11px] font-bold text-[#7D6E61] px-1">
                มุมมองและเครื่องมือจัดการ
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={onToggleRowDensity}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] hover:bg-[#F2EBE0] text-xs font-semibold text-[#3D332A] transition-colors cursor-pointer"
                >
                  <Rows3 className="w-3.5 h-3.5 text-[#3B6845] shrink-0" />
                  <span className="truncate">
                    แถว: {rowDensity === 'COMPACT' ? 'กระชับ' : 'ปกติ'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleFullScreen();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] hover:bg-[#F2EBE0] text-xs font-semibold text-[#3D332A] transition-colors cursor-pointer"
                >
                  {isFullScreen ? (
                    <Minimize2 className="w-3.5 h-3.5 text-[#3B6845] shrink-0" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-[#3B6845] shrink-0" />
                  )}
                  <span className="truncate">
                    {isFullScreen ? 'ย่อหน้าต่าง' : 'ขยายเต็มจอ'}
                  </span>
                </button>

                {onOpenJunkTagCleanup && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenJunkTagCleanup();
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] hover:bg-[#FEF6E8] text-xs font-semibold text-[#8A4D1F] transition-colors cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">ล้างแท็กขยะ</span>
                  </button>
                )}

                {hasData && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onClearPastedText();
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">ล้างข้อมูลที่วาง</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
