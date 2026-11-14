import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  CornerDownRight,
  Loader2,
  Palette,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  BatchTagMoveDestination,
  TagReorgUndoRecord,
} from '../../../context/cms/cms.types';
import {
  CategoryGroup,
  CategoryTag,
  CategoryTier,
  DEFAULT_TIER_SUBCATEGORIES,
  EntitySubtype,
  TierSubCategoriesConfig,
} from '../../../types/tag.types';
import { COLOR_OPTIONS } from '../constants/tagPastelPalette';

interface ThreeTierBatchMoveBarProps {
  categoryGroups: CategoryGroup[];
  tags: CategoryTag[];
  tierSubCategories?: TierSubCategoriesConfig;
  selectedTagIds: string[];
  isBatchMovingTags: boolean;
  batchMoveProgressText: string | null;
  lastTagReorgUndoRecord: TagReorgUndoRecord | null;
  onExecuteBatchMove: (
    tagIdsToMove: string[],
    destination: BatchTagMoveDestination
  ) => void;
  onExecuteBatchMetadataUpdate?: (
    tagIds: string[],
    updates: { color?: string; entityType?: EntitySubtype }
  ) => void;
  onRequestBatchDelete?: () => void;
  onClearSelectedTags: () => void;
  onUndoLastTagReorg: () => void;
  onDismissTagReorgUndoRecord: () => void;
}

export const ThreeTierBatchMoveBar: React.FC<ThreeTierBatchMoveBarProps> = ({
  tierSubCategories = DEFAULT_TIER_SUBCATEGORIES,
  selectedTagIds,
  isBatchMovingTags,
  batchMoveProgressText,
  lastTagReorgUndoRecord,
  onExecuteBatchMove,
  onExecuteBatchMetadataUpdate,
  onRequestBatchDelete,
  onClearSelectedTags,
  onUndoLastTagReorg,
  onDismissTagReorgUndoRecord,
}) => {
  const [batchEditEntityType, setBatchEditEntityType] =
    useState<EntitySubtype>('PERSON');

  const selectedCount = selectedTagIds.length;
  const shouldShowBar =
    selectedCount > 0 || isBatchMovingTags || Boolean(lastTagReorgUndoRecord);

  if (!shouldShowBar) return null;

  const handleMoveToTierSub = (tier: CategoryTier, subCategory: string) => {
    onExecuteBatchMove(selectedTagIds, {
      mode: 'MOVE_TO_TIER_SUBCATEGORY',
      targetTier: tier,
      targetSubCategory: subCategory,
    });
  };

  return (
    <div className="border-t border-[#E2D5C4] bg-[#FDFBF7] px-3 sm:px-4 py-2.5 shrink-0 space-y-2 shadow-sm">
      {/* 1. Undo Notification Strip */}
      <AnimatePresence initial={false}>
        {lastTagReorgUndoRecord && !isBatchMovingTags && (
          <motion.div
            key={lastTagReorgUndoRecord.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16 }}
            className="px-3.5 py-2 rounded-xl bg-[#EEF5EE] border border-[#BAD8BF] text-[#1C4824] flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#3B6845] shrink-0" />
              <span>{lastTagReorgUndoRecord.summaryText}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onUndoLastTagReorg}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3B6845] hover:bg-[#2C5235] text-white font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>เลิกทำ (Undo)</span>
              </button>
              <button
                type="button"
                onClick={onDismissTagReorgUndoRecord}
                className="p-1 rounded-lg text-[#3B6845] hover:bg-[#DCECE0] transition-colors cursor-pointer"
                title="ปิดแจ้งเตือน"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Active Batch Progress Indicator */}
      {isBatchMovingTags && (
        <div className="px-3.5 py-2 rounded-xl bg-[#FEF8ED] border border-[#EDD7AF] text-[#734B17] flex items-center gap-2 text-xs font-bold">
          <Loader2 className="w-4 h-4 animate-spin text-[#A67438] shrink-0" />
          <span>
            {batchMoveProgressText || 'กำลังบันทึกและซิงก์หมวดหมู่ขึ้น Cloud...'}
          </span>
        </div>
      )}

      {/* 3. Multi-Select Bulk Action Studio (Move to Tier 1/2/3 Subcategory, Edit Color/Type, Delete) */}
      {selectedCount > 0 && !isBatchMovingTags && (
        <div className="bg-white border border-[#E2D5C4] rounded-2xl p-2.5 shadow-2xs space-y-2">
          {/* Top Row: Selection Count + Batch Edit Color/Type + Batch Delete */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EFE7DC]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EEF5EE] border border-[#BAD8BF] text-[#1C4824] text-xs font-extrabold tabular-nums">
                <Sparkles className="w-3.5 h-3.5 text-[#3B6845]" />
                <span>เลือก {selectedCount} แท็ก</span>
              </span>

              <button
                type="button"
                onClick={onClearSelectedTags}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FAF7F2] hover:bg-[#EFE7DC] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer whitespace-nowrap"
              >
                ยกเลิกที่เลือก
              </button>

              {/* Batch Edit Pastel Color Swatches */}
              {onExecuteBatchMetadataUpdate && (
                <div className="flex flex-wrap items-center gap-1.5 pl-2 border-l border-[#E8DFD3]">
                  <span className="text-[11px] font-bold text-[#524538] flex items-center gap-1 whitespace-nowrap">
                    <Palette className="w-3.5 h-3.5 text-[#2C5378]" />
                    <span>เปลี่ยนสีพาสเทล:</span>
                  </span>
                  <div className="flex items-center gap-1 bg-[#FAF8F5] px-2 py-1 rounded-xl border border-[#E8DFD3]">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() =>
                          onExecuteBatchMetadataUpdate(selectedTagIds, {
                            color: c.value,
                          })
                        }
                        title={`เปลี่ยนทั้ง ${selectedCount} แท็กเป็นสี ${c.label}`}
                        className="group relative w-5 h-5 rounded-full border border-black/10 flex items-center justify-center hover:scale-115 active:scale-95 transition-transform cursor-pointer"
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full ${c.swatchBg}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Batch Edit Entity Type */}
              {onExecuteBatchMetadataUpdate && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-[#E8DFD3]">
                  <span className="text-[11px] font-bold text-[#524538] whitespace-nowrap">
                    สัญลักษณ์:
                  </span>
                  <select
                    value={batchEditEntityType}
                    onChange={(e) =>
                      setBatchEditEntityType(e.target.value as EntitySubtype)
                    }
                    className="bg-[#FAF8F5] border border-[#E2D5C4] rounded-lg px-2 py-1 text-xs font-semibold text-[#3D332A] focus:outline-none"
                  >
                    <option value="TOPIC">🎯 หมวด/ประเด็น</option>
                    <option value="ACTION">⚡ สถานการณ์/สไตล์</option>
                    <option value="PERSON">👤 บุคคล/รายการ</option>
                    <option value="ANIMAL">🐾 สัตว์</option>
                    <option value="GENERAL">🏷️ ทั่วไป</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      onExecuteBatchMetadataUpdate(selectedTagIds, {
                        entityType: batchEditEntityType,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EDF4FA] hover:bg-[#2C5378] text-[#1B4369] hover:text-white border border-[#B2D5ED] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    ใช้สัญลักษณ์นี้
                  </button>
                </div>
              )}
            </div>

            {/* Batch Delete Button */}
            {onRequestBatchDelete && (
              <button
                type="button"
                onClick={onRequestBatchDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#FDF2F0] hover:bg-[#8A3C31] text-[#8A3C31] hover:text-white border border-[#F0CEC8] transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                title={`ลบแท็กที่เลือกทั้ง ${selectedCount} รายการออกจากคลังและ Cloud`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบที่เลือก ({selectedCount} แท็ก)</span>
              </button>
            )}
          </div>

          {/* Bottom Row: Instant 1-Click Move into Tier 1, Tier 2, or Tier 3 Sub-categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {/* Tier 1 Destinations */}
            <div className="flex flex-wrap items-center gap-1 bg-[#F4F9FD] px-2.5 py-1.5 rounded-xl border border-[#D5E6F5]">
              <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-[#2C5378] text-white shrink-0">
                ย้ายไป TIER 1
              </span>
              {tierSubCategories.tier1.map((sub) => (
                <button
                  key={`t1-${sub}`}
                  type="button"
                  onClick={() => handleMoveToTierSub(1, sub)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white hover:bg-[#2C5378] text-[#184366] hover:text-white border border-[#C5DCEF] transition-colors cursor-pointer"
                >
                  <CornerDownRight className="w-3 h-3" />
                  <span>{sub}</span>
                </button>
              ))}
            </div>

            {/* Tier 2 Destinations */}
            <div className="flex flex-wrap items-center gap-1 bg-[#FFFDF9] px-2.5 py-1.5 rounded-xl border border-[#EFE0C6]">
              <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-[#8A5A22] text-white shrink-0">
                ย้ายไป TIER 2
              </span>
              {tierSubCategories.tier2.map((sub) => (
                <button
                  key={`t2-${sub}`}
                  type="button"
                  onClick={() => handleMoveToTierSub(2, sub)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white hover:bg-[#8A5A22] text-[#6B4415] hover:text-white border border-[#E8CFA6] transition-colors cursor-pointer"
                >
                  <CornerDownRight className="w-3 h-3" />
                  <span>{sub}</span>
                </button>
              ))}
            </div>

            {/* Tier 3 Destinations */}
            <div className="flex flex-wrap items-center gap-1 bg-[#F6FBF7] px-2.5 py-1.5 rounded-xl border border-[#CEE8D5]">
              <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-[#2D623C] text-white shrink-0">
                ย้ายไป TIER 3
              </span>
              {tierSubCategories.tier3.map((sub) => (
                <button
                  key={`t3-${sub}`}
                  type="button"
                  onClick={() => handleMoveToTierSub(3, sub)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white hover:bg-[#2D623C] text-[#1D4D2B] hover:text-white border border-[#BFE0C8] transition-colors cursor-pointer"
                >
                  <CornerDownRight className="w-3 h-3" />
                  <span>{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
