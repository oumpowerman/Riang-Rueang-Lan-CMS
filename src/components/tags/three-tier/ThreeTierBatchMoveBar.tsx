import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  CornerDownRight,
  FolderInput,
  Loader2,
  Palette,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  BatchTagMoveDestination,
  TagReorgUndoRecord,
} from '../../../context/cms/cms.types';
import { isStagingGroupId, isStagingTagId } from '../../../services/seedData';
import {
  CategoryGroup,
  CategoryTag,
  EntitySubtype,
} from '../../../types/tag.types';
import { CategoryGroupIcon } from '../../ui/CategoryGroupIcon';
import { COLOR_OPTIONS } from '../constants/tagPastelPalette';

interface ThreeTierBatchMoveBarProps {
  categoryGroups: CategoryGroup[];
  tags: CategoryTag[];
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
  categoryGroups,
  tags,
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
  const [parentSearch, setParentSearch] = useState('');
  const [selectedTargetParentId, setSelectedTargetParentId] = useState('');
  const [selectedEntityType, setSelectedEntityType] =
    useState<EntitySubtype>('PERSON');
  const [batchEditEntityType, setBatchEditEntityType] =
    useState<EntitySubtype>('PERSON');

  const validGroups = useMemo(
    () => categoryGroups.filter((g) => !isStagingGroupId(g.id)),
    [categoryGroups]
  );

  const groupNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoryGroups.forEach((g) => {
      map[g.id] = g.name;
    });
    return map;
  }, [categoryGroups]);

  // Available Tier 1 Main Tags that are NOT currently in `selectedTagIds`
  const availableParentMainTags = useMemo(() => {
    const selectedSet = new Set(selectedTagIds);
    const q = parentSearch.trim().toLowerCase();

    return tags
      .filter((t) => {
        if (isStagingTagId(t.id)) return false;
        if (t.tier === 2 || Boolean(t.parentId)) return false;
        if (selectedSet.has(t.id)) return false;
        if (!q) return true;
        const gId = t.groupId || `GRP-${t.groupType || 'GENERAL'}`;
        const gName = (groupNameMap[gId] || '').toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          gName.includes(q) ||
          t.id.toLowerCase().includes(q)
        );
      })
      .map((t) => {
        const gId = t.groupId || `GRP-${t.groupType || 'GENERAL'}`;
        return {
          tag: t,
          groupName: groupNameMap[gId] || 'มิติหลัก',
        };
      });
  }, [tags, selectedTagIds, parentSearch, groupNameMap]);

  const effectiveTargetParentId = useMemo(() => {
    if (
      selectedTargetParentId &&
      availableParentMainTags.some((p) => p.tag.id === selectedTargetParentId)
    ) {
      return selectedTargetParentId;
    }
    return availableParentMainTags[0]?.tag.id || '';
  }, [selectedTargetParentId, availableParentMainTags]);

  const selectedCount = selectedTagIds.length;
  const shouldShowBar =
    selectedCount > 0 || isBatchMovingTags || Boolean(lastTagReorgUndoRecord);

  if (!shouldShowBar) return null;

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

      {/* 3. Multi-Select Bulk Action Studio (Move, Convert, Edit Color/Type, Delete) */}
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
                    <span>เปลี่ยนสีพาสเทลพร้อมกัน:</span>
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

              {/* Batch Edit Subcategory Entity Type */}
              {onExecuteBatchMetadataUpdate && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-[#E8DFD3]">
                  <span className="text-[11px] font-bold text-[#524538] whitespace-nowrap">
                    เปลี่ยนประเภท:
                  </span>
                  <select
                    value={batchEditEntityType}
                    onChange={(e) =>
                      setBatchEditEntityType(e.target.value as EntitySubtype)
                    }
                    className="bg-[#FAF8F5] border border-[#E2D5C4] rounded-lg px-2 py-1 text-xs font-semibold text-[#3D332A] focus:outline-none"
                  >
                    <option value="PERSON">บุคคล/ดารา</option>
                    <option value="TOPIC">หัวข้อ/คอนเซ็ปต์</option>
                    <option value="ACTION">กิริยา/มุก</option>
                    <option value="ANIMAL">สัตว์</option>
                    <option value="GENERAL">ทั่วไป</option>
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
                    ใช้ประเภทนี้
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

          {/* Bottom Row: Move to Dimension (Tier 1) OR Convert to Subcategory (Tier 2) */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
            {/* Option A — Move as Tier 1 Main Tag to Dimension */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#6E5F52] flex items-center gap-1 mr-0.5 whitespace-nowrap">
                <FolderInput className="w-3.5 h-3.5 text-[#78593A]" />
                <span>ย้ายข้ามมิติ (เป็นแท็กหลัก):</span>
              </span>

              {validGroups.map((grp) => (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() =>
                    onExecuteBatchMove(selectedTagIds, {
                      mode: 'MOVE_TO_GROUP',
                      targetGroupId: grp.id,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF5EB] hover:bg-[#78593A] text-[#453119] hover:text-white border border-[#DFC6A3] transition-colors cursor-pointer whitespace-nowrap"
                  title={`ย้าย ${selectedCount} แท็กไปเป็นแท็กหลักในมิติ "${grp.name}"`}
                >
                  <CategoryGroupIcon icon={grp.icon} className="w-3.5 h-3.5" />
                  <span>{grp.name}</span>
                </button>
              ))}
            </div>

            {/* Option B — Convert/Move as Tier 2 Subcategory under any Main Tag */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 xl:pt-0 border-t xl:border-t-0 xl:border-l border-[#E8DFD3] xl:pl-3">
              <span className="text-[11px] font-bold text-[#255431] flex items-center gap-1 whitespace-nowrap">
                <CornerDownRight className="w-3.5 h-3.5 text-[#3B6845]" />
                <span>แปลงเป็นแท็กย่อยใต้:</span>
              </span>

              {/* Search Filter for Target Main Tag */}
              <div className="relative w-32 sm:w-36">
                <Search className="w-3 h-3 text-[#8C7B6C] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  placeholder="ค้นหาแท็กแม่..."
                  className="w-full pl-6 pr-5 py-1 rounded-lg bg-[#FAF8F5] border border-[#D8C5A6] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:bg-white focus:border-[#3B6845]"
                />
                {parentSearch && (
                  <button
                    type="button"
                    onClick={() => setParentSearch('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Target Parent Main Tag Select */}
              <select
                value={effectiveTargetParentId}
                onChange={(e) => setSelectedTargetParentId(e.target.value)}
                className="max-w-[200px] bg-white border border-[#BAD8BF] rounded-lg px-2 py-1 text-xs font-bold text-[#1C4824] focus:outline-none focus:ring-1 focus:ring-[#3B6845]"
              >
                {availableParentMainTags.length === 0 ? (
                  <option value="">-- ไม่พบแท็กหลักปลายทาง --</option>
                ) : (
                  availableParentMainTags.map(({ tag, groupName }) => (
                    <option key={tag.id} value={tag.id}>
                      [{groupName}] #{tag.name}
                    </option>
                  ))
                )}
              </select>

              {/* Entity Type Selector for Subcategories */}
              <select
                value={selectedEntityType}
                onChange={(e) =>
                  setSelectedEntityType(e.target.value as EntitySubtype)
                }
                className="bg-white border border-[#E2D5C4] rounded-lg px-2 py-1 text-xs text-[#524538] focus:outline-none"
                title="ประเภทของแท็กย่อยเมื่อย้ายเข้าไป"
              >
                <option value="PERSON">บุคคล/ดารา</option>
                <option value="TOPIC">หัวข้อ/คอนเซ็ปต์</option>
                <option value="ACTION">กิริยา/มุก</option>
                <option value="ANIMAL">สัตว์</option>
                <option value="GENERAL">ทั่วไป</option>
              </select>

              <button
                type="button"
                disabled={!effectiveTargetParentId}
                onClick={() => {
                  if (!effectiveTargetParentId) return;
                  onExecuteBatchMove(selectedTagIds, {
                    mode: 'MOVE_TO_PARENT_TAG',
                    targetParentTagId: effectiveTargetParentId,
                    entityType: selectedEntityType,
                  });
                }}
                className="px-3 py-1 rounded-lg bg-[#3B6845] hover:bg-[#2C5235] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              >
                ย้ายเป็นแท็กย่อย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
