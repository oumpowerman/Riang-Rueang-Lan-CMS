import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  CheckCheck,
  ChevronDown,
  Package,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  SUPABASE_CONTENT_STATUSES,
  SUPABASE_TARGET_PLATFORMS,
  SupabaseConnectionConfig,
} from '../../types/supabaseSync.types';

const CHANNEL_SELECT_PLACEHOLDER = '__SELECT_CHANNEL_PLACEHOLDER__';

interface SupabaseBulkEditPopoverProps {
  selectedCount: number;
  config: SupabaseConnectionConfig;
  savedDraftOverridesCount: number;
  onBatchSetStatus: (status: string) => void;
  onBatchSetChannel: (channelId: string) => void;
  onBatchTogglePlatform: (platformId: string) => void;
  onBatchToggleAssets: (include: boolean) => void;
  onBatchSetPillar: (include: boolean) => void;
  onBatchSetCategory: (include: boolean) => void;
  onResetAllRowDrafts: () => void;
  onBatchMarkAsSent?: () => void;
}

export const SupabaseBulkEditPopover: React.FC<SupabaseBulkEditPopoverProps> = ({
  selectedCount,
  config,
  savedDraftOverridesCount,
  onBatchSetStatus,
  onBatchSetChannel,
  onBatchTogglePlatform,
  onBatchToggleAssets,
  onBatchSetPillar,
  onBatchSetCategory,
  onResetAllRowDrafts,
  onBatchMarkAsSent,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const canOpen = selectedCount > 0 || savedDraftOverridesCount > 0;

  // Smart placement detection: calculate available space below vs above
  const updatePlacement = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const REQUIRED_HEIGHT = 420;

    // Flip upward if bottom space is restricted (less than 420px) and top has more room
    if (spaceBelow < REQUIRED_HEIGHT && spaceAbove > spaceBelow) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePlacement();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleScrollOrResize = () => {
      updatePlacement();
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          if (canOpen) {
            updatePlacement();
            setIsOpen((prev) => !prev);
          }
        }}
        disabled={!canOpen}
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 ${
          !canOpen
            ? 'bg-[#FAF8F5] text-[#A89A8C] border-[#E8DFD3] cursor-not-allowed'
            : isOpen
            ? 'bg-[#EEF5EE] text-[#1C4824] border-[#9CC5A4] cursor-pointer'
            : 'bg-white hover:bg-[#FAF7F2] text-[#3D332A] border-[#D8CFC3] cursor-pointer'
        }`}
        title={
          selectedCount > 0
            ? 'เปิดเมนูแก้ไขสถานะ ช่อง แพลตฟอร์ม ไฟล์ฟุตเทจ และหมวดหมู่พร้อมกันทุกแถวที่เลือก'
            : savedDraftOverridesCount > 0
            ? 'เปิดเพื่อรีเซ็ตค่าที่เคยปรับแต่งค้างไว้'
            : 'กรุณาติ๊กเลือกคลิปอย่างน้อย 1 เรื่องก่อนแก้ไขค่าพร้อมกัน'
        }
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#3B6845]" />
        <span>
          แก้ไขค่าที่เลือก (
          <span className="font-mono tabular-nums">
            {selectedCount.toLocaleString()}
          </span>
          )
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: openUpward ? -6 : 6,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: openUpward ? -4 : 4,
              scale: 0.98,
            }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute right-0 w-80 sm:w-96 rounded-2xl bg-white border border-[#E8DFD3] shadow-2xl z-50 text-left flex flex-col overflow-hidden ${
              openUpward ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'
            }`}
          >
            {/* Header (Pinned) */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#F2EBE0] bg-[#FAF8F5]/90 backdrop-blur-xs shrink-0">
              <div className="min-w-0 pr-2">
                <h4 className="text-xs font-extrabold text-[#3D332A] truncate">
                  ปรับค่าพร้อมกัน ({selectedCount.toLocaleString()} เรื่องที่เลือก)
                </h4>
                <p className="text-[10px] text-[#7D6E61] mt-0.5 leading-tight">
                  ค่าที่เลือกจะมีผลทันทีกับทุกรายการที่ติ๊กเลือกไว้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg text-[#7D6E61] hover:text-[#3D332A] hover:bg-[#F0EAE1] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="ปิดเมนู"
                aria-label="ปิดเมนู"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="max-h-[min(420px,calc(100vh-280px))] overflow-y-auto scrollbar-thin p-3.5 space-y-2.5 overscroll-contain">
              {selectedCount > 0 ? (
                <>
                  {/* Quick Action: Mark all selected as Sent */}
                  {onBatchMarkAsSent && (
                    <div className="p-2 rounded-xl bg-[#EEF5EE]/90 border border-[#BAD8BF] space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          onBatchMarkAsSent();
                          setIsOpen(false);
                        }}
                        className="w-full inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#1C4824] bg-white hover:bg-[#E2EFE2] border border-[#BAD8BF] shadow-2xs transition-colors cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                          <span>มาร์กส่งแล้ว ({selectedCount.toLocaleString()} เรื่อง)</span>
                        </span>
                        <span className="text-[9.5px] text-[#2E7D32] font-semibold bg-[#EEF5EE] px-1.5 py-0.5 rounded">
                          ปลดเลือกอัตโนมัติ
                        </span>
                      </button>
                      <div className="text-[9.5px] text-[#4E7A55] px-1">
                        สำหรับคลิปที่มีใน Kontent OS แล้ว เพื่อไม่ให้ส่งซ้ำ
                      </div>
                    </div>
                  )}

                  {/* 1. Status & Channel */}
                  <div
                    className={`grid gap-2 ${
                      config.channels.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-bold text-[#524538] block">
                        สถานะงานเริ่มต้น
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onBatchSetStatus(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="w-full px-2 py-1.5 rounded-lg border border-[#E3D8CB] bg-[#FAF8F5] text-xs font-semibold text-[#3D332A] focus:outline-none focus:ring-1 focus:ring-[#8FA892] cursor-pointer"
                      >
                        <option value="" disabled>
                          เลือกสถานะใหม่...
                        </option>
                        {SUPABASE_CONTENT_STATUSES.map((statusVal) => (
                          <option key={statusVal} value={statusVal}>
                            {statusVal}
                          </option>
                        ))}
                      </select>
                    </div>

                    {config.channels.length > 1 && (
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-[#524538] block">
                          ช่องปลายทาง
                        </label>
                        <select
                          onChange={(e) => {
                            if (e.target.value !== CHANNEL_SELECT_PLACEHOLDER) {
                              onBatchSetChannel(e.target.value);
                              e.target.value = CHANNEL_SELECT_PLACEHOLDER;
                            }
                          }}
                          defaultValue={CHANNEL_SELECT_PLACEHOLDER}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E3D8CB] bg-[#FAF8F5] text-xs font-semibold text-[#3D332A] focus:outline-none focus:ring-1 focus:ring-[#8FA892] cursor-pointer"
                        >
                          <option value={CHANNEL_SELECT_PLACEHOLDER} disabled>
                            เลือกช่องปลายทาง...
                          </option>
                          {config.channels.map((ch) => (
                            <option key={ch.id || '__default_ch__'} value={ch.id}>
                              {ch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 2. Platforms */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-bold text-[#524538] block">
                      สลับแพลตฟอร์มที่จะลง (คลิกเพื่อเปิด/ปิด)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SUPABASE_TARGET_PLATFORMS.map((plat) => (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => onBatchTogglePlatform(plat.id)}
                          className="px-2 py-1.5 rounded-lg border border-[#E3D8CB] bg-[#FAF8F5] hover:bg-[#EEF5EE] hover:border-[#BAD8BF] hover:text-[#1C4824] text-xs font-semibold text-[#3D332A] transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span>{plat.label}</span>
                          <span className="text-[9.5px] text-[#7D6E61]">สลับ</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Attach Assets */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-bold text-[#524538] block">
                      แนบไฟล์ฟุตเทจย่อย (5 อันดับ)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onBatchToggleAssets(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-[#BAD8BF] bg-[#EEF5EE] hover:bg-[#E2EFE2] text-xs font-bold text-[#1C4824] transition-colors cursor-pointer"
                      >
                        <Package className="w-3 h-3" />
                        <span>แนบไฟล์ฟุตเทจ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onBatchToggleAssets(false)}
                        className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg border border-[#E3D8CB] bg-[#FAF8F5] hover:bg-[#F2EBE0] text-xs font-semibold text-[#6E5F52] transition-colors cursor-pointer"
                      >
                        <span>ไม่แนบไฟล์ฟุต</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Pillar & Category Controls */}
                  <div className="pt-2 border-t border-[#F2EBE0] space-y-1.5">
                    <span className="text-[10.5px] font-bold text-[#524538] block">
                      ส่งค่าหมวดหมู่เสริมเข้า Kontent OS
                    </span>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[#6E5F52] text-[11px]">เสาหลัก (Pillar)</span>
                      <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD3]">
                        <button
                          type="button"
                          onClick={() => onBatchSetPillar(true)}
                          className="px-2 py-0.5 rounded-md text-[10.5px] font-bold text-[#1C4824] hover:bg-[#EEF5EE] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>ส่งชื่อหมวด</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onBatchSetPillar(false)}
                          className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold text-[#6E5F52] hover:bg-white transition-colors cursor-pointer"
                        >
                          เว้นว่าง
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[#6E5F52] text-[11px]">หมวดหมู่ (Category)</span>
                      <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD3]">
                        <button
                          type="button"
                          onClick={() => onBatchSetCategory(true)}
                          className="px-2 py-0.5 rounded-md text-[10.5px] font-bold text-[#1C4824] hover:bg-[#EEF5EE] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>ส่งชื่อหมวด</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onBatchSetCategory(false)}
                          className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold text-[#6E5F52] hover:bg-white transition-colors cursor-pointer"
                        >
                          เว้นว่าง
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-2 text-xs text-[#7D6E61]">
                  ยังไม่ได้ติ๊กเลือกคลิปสำหรับแก้ไขพร้อมกัน
                </div>
              )}

              {/* Reset saved overrides if any exist */}
              {savedDraftOverridesCount > 0 && (
                <div className="pt-2 border-t border-[#F2EBE0]">
                  <button
                    type="button"
                    onClick={() => {
                      onResetAllRowDrafts();
                      setIsOpen(false);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>
                      ล้างค่าที่ปรับแต่งค้างไว้ทั้งหมด (
                      <span className="font-mono tabular-nums">
                        {savedDraftOverridesCount.toLocaleString()}
                      </span>{' '}
                      รายการ)
                    </span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
