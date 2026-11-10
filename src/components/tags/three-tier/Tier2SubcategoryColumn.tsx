import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Tags,
  MousePointerClick,
  Search,
  GripVertical,
  Check,
  CheckSquare,
  Square,
  ArrowDownToDot,
  CornerDownRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { BatchTagMoveDestination } from '../../../context/cms/cms.types';
import { CategoryTag, EntitySubtype } from '../../../types/tag.types';
import { getEntityIconNode } from '../../ui/TagPill';

interface Tier2SubcategoryColumnProps {
  activeMainCat: CategoryTag | null;
  subcategoriesInActiveCat: CategoryTag[];
  filteredSubcategoriesInActiveCat: CategoryTag[];
  categoryMatrix: CategoryMatrixStat[];
  tier2SearchQuery: string;
  setTier2SearchQuery: (val: string) => void;
  selectedTagIds: string[];
  draggingTagIds: string[];
  isBatchMovingTags: boolean;
  onToggleSelectTag: (
    tagId: string,
    visibleOrderIds: string[],
    shiftKey?: boolean
  ) => void;
  onToggleSelectAllVisible: (visibleIds: string[]) => void;
  onStartDragTag: (tagId: string) => string[];
  onEndDragTag: () => void;
  onExecuteBatchMove: (
    tagIdsToMove: string[],
    destination: BatchTagMoveDestination
  ) => void;
  isEditingSubCat: boolean;
  setIsEditingSubCat: (val: boolean) => void;
  editingSubCatId: string | null;
  subCatFormName: string;
  setSubCatFormName: (val: string) => void;
  subCatFormType: EntitySubtype;
  setSubCatFormType: (val: EntitySubtype) => void;
  subCatFormDesc: string;
  setSubCatFormDesc: (val: string) => void;
  onOpenAddSubCat: () => void;
  onOpenEditSubCat: (sub: CategoryTag, e: React.MouseEvent) => void;
  onSaveSubCat: (e: React.FormEvent) => void;
  onRequestDeleteTag: (tagId: string) => void;
  isExpandedGrid?: boolean;
  isCompactRail?: boolean;
  onToggleExpandColumn?: () => void;
}

export const Tier2SubcategoryColumn: React.FC<Tier2SubcategoryColumnProps> = ({
  activeMainCat,
  subcategoriesInActiveCat,
  filteredSubcategoriesInActiveCat,
  categoryMatrix,
  tier2SearchQuery,
  setTier2SearchQuery,
  selectedTagIds,
  draggingTagIds,
  isBatchMovingTags,
  onToggleSelectTag,
  onToggleSelectAllVisible,
  onStartDragTag,
  onEndDragTag,
  onExecuteBatchMove,
  isEditingSubCat,
  setIsEditingSubCat,
  editingSubCatId,
  subCatFormName,
  setSubCatFormName,
  subCatFormType,
  setSubCatFormType,
  subCatFormDesc,
  setSubCatFormDesc,
  onOpenAddSubCat,
  onOpenEditSubCat,
  onSaveSubCat,
  onRequestDeleteTag,
  isExpandedGrid = false,
  isCompactRail = false,
  onToggleExpandColumn,
}) => {
  const [isDragOverColumn, setIsDragOverColumn] = useState(false);

  const visibleOrderIds = useMemo(
    () => filteredSubcategoriesInActiveCat.map((s) => s.id),
    [filteredSubcategoriesInActiveCat]
  );

  const isAllVisibleSelected =
    visibleOrderIds.length > 0 &&
    visibleOrderIds.every((id) => selectedTagIds.includes(id));

  const selectedInVisibleCount = useMemo(
    () => visibleOrderIds.filter((id) => selectedTagIds.includes(id)).length,
    [visibleOrderIds, selectedTagIds]
  );

  const extractDraggedTagIds = (e: React.DragEvent): string[] => {
    try {
      const raw = e.dataTransfer.getData('application/x-cms-tag-ids');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    return draggingTagIds;
  };

  const handleRowDragStart = (e: React.DragEvent, subId: string) => {
    const batch = onStartDragTag(subId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-cms-tag-ids', JSON.stringify(batch));
    e.dataTransfer.setData('text/plain', batch.join(','));
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    if (!activeMainCat || draggingTagIds.includes(activeMainCat.id)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOverColumn) {
      setIsDragOverColumn(true);
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverColumn(false);
  };

  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverColumn(false);
    if (!activeMainCat) return;
    const idsToMove = extractDraggedTagIds(e).filter(
      (id) => id !== activeMainCat.id
    );
    if (idsToMove.length > 0) {
      onExecuteBatchMove(idsToMove, {
        mode: 'MOVE_TO_PARENT_TAG',
        targetParentTagId: activeMainCat.id,
      });
    }
  };

  const canNestSelectedInActiveMain =
    Boolean(activeMainCat) &&
    selectedTagIds.length > 0 &&
    !selectedTagIds.includes(activeMainCat!.id) &&
    !selectedTagIds.every((id) =>
      subcategoriesInActiveCat.some((s) => s.id === id)
    );

  const isCompactMode = isExpandedGrid || isCompactRail;

  return (
    <div
      onDragOver={handleColumnDragOver}
      onDragLeave={handleColumnDragLeave}
      onDrop={handleColumnDrop}
      className={`flex flex-col h-full min-h-0 overflow-hidden transition-colors ${
        isDragOverColumn ? 'bg-[#EEF5EE]' : 'bg-[#faf8f5]'
      }`}
    >
      <div className="p-2.5 sm:p-3 border-b border-[#e5ded4] flex items-center justify-between bg-white shrink-0 gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-[#d8eedc] text-[#194523] text-[11px] font-bold flex items-center justify-center shrink-0">
            3
          </span>
          <span className="text-xs font-bold text-[#3e3427] truncate">
            {isCompactRail ? (
              <span className="text-[#255431]">
                ย่อยใต้ #{activeMainCat?.name || '-'}
              </span>
            ) : (
              <>
                ป้ายแท็กย่อยใต้:{' '}
                <span className="text-[#255431]">
                  {activeMainCat?.name || 'แท็กนี้'}
                </span>
              </>
            )}
          </span>
          <span className="text-[10px] font-mono bg-[#eee7dc] text-[#635749] px-1.5 py-0.2 rounded-full shrink-0 tabular-nums">
            {subcategoriesInActiveCat.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {canNestSelectedInActiveMain && activeMainCat && (
            <button
              type="button"
              disabled={isBatchMovingTags}
              onClick={() =>
                onExecuteBatchMove(selectedTagIds, {
                  mode: 'MOVE_TO_PARENT_TAG',
                  targetParentTagId: activeMainCat.id,
                })
              }
              className="text-[10px] font-bold bg-[#EEF5EE] hover:bg-[#3B6845] text-[#1C4824] hover:text-white border border-[#BAD8BF] px-1.5 py-1 rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
              title={`ย้าย ${selectedTagIds.length} แท็กที่เลือกมาเป็นแท็กย่อยใต้ #${activeMainCat.name}`}
            >
              <CornerDownRight className="w-3 h-3" />
              <span>
                {isCompactRail
                  ? `ใส่เป็นย่อย (${selectedTagIds.length})`
                  : `ย้ายมาเป็นย่อย (${selectedTagIds.length})`}
              </span>
            </button>
          )}

          {activeMainCat && onToggleExpandColumn && (
            <button
              type="button"
              onClick={onToggleExpandColumn}
              className={`text-[11px] font-bold px-2 py-1 rounded-md border transition-colors flex items-center gap-1 cursor-pointer ${
                isExpandedGrid
                  ? 'bg-[#2D5D39] text-white border-[#2D5D39] shadow-2xs'
                  : 'bg-[#FAF5EB] hover:bg-[#EFE4D2] text-[#523715] border-[#DFC9A8]'
              }`}
              title={
                isExpandedGrid
                  ? 'ย่อกลับเป็นคอลัมน์ปกติ'
                  : 'กางคอลัมน์ป้ายแท็กย่อยเป็นตารางหลายคอลัมน์'
              }
            >
              {isExpandedGrid ? (
                <>
                  <Minimize2 className="w-3 h-3" />
                  <span>ย่อกลับ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3" />
                  <span>{isCompactRail ? 'กาง' : 'ขยาย'}</span>
                </>
              )}
            </button>
          )}

          {activeMainCat && !isCompactMode && (
            <button
              type="button"
              onClick={onOpenAddSubCat}
              className="text-[11px] font-semibold text-[#22502f] hover:text-[#13371e] bg-[#edf6ef] hover:bg-[#dfefe2] px-2 py-1 rounded-md transition-colors flex items-center gap-0.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>เพิ่มแท็กย่อย</span>
            </button>
          )}
        </div>
      </div>

      {/* Column 3 Search Filter & Multi-Select Toolbar */}
      {activeMainCat && subcategoriesInActiveCat.length > 0 && (
        <div className="px-2.5 py-2 bg-[#FDFBF7] border-b border-[#E8DFD3] flex flex-wrap items-center gap-1.5 shrink-0">
          {!isCompactRail && (
            <button
              type="button"
              onClick={() => onToggleSelectAllVisible(visibleOrderIds)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                isAllVisibleSelected
                  ? 'bg-[#2D5D39] text-white border-[#2D5D39]'
                  : selectedInVisibleCount > 0
                  ? 'bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF]'
                  : 'bg-white hover:bg-[#F5EFE6] text-[#524538] border-[#E2D5C4]'
              }`}
              title="เลือกหรือยกเลิกการเลือกแท็กย่อยทั้งหมดในรายการนี้"
            >
              {isAllVisibleSelected ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>
                {isAllVisibleSelected
                  ? `ยกเลิก (${visibleOrderIds.length})`
                  : `เลือกทั้งหมด (${visibleOrderIds.length})`}
              </span>
            </button>
          )}

          <div className="relative flex-1 min-w-[110px]">
            <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tier2SearchQuery}
              onChange={(e) => setTier2SearchQuery(e.target.value)}
              placeholder={
                isCompactRail
                  ? 'กรองแท็กย่อย...'
                  : `กรองแท็กย่อยใต้ #${activeMainCat.name}...`
              }
              className="w-full pl-7 pr-6 py-1 rounded-lg bg-white border border-[#E3D8CB] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#5B9569]"
            />
            {tier2SearchQuery && (
              <button
                type="button"
                onClick={() => setTier2SearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Drop Zone Indicator Banner when dragging over Column 3 */}
      {isDragOverColumn && activeMainCat && (
        <div className="mx-2 mt-2 px-2.5 py-2 rounded-xl bg-[#3B6845] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs shrink-0">
          <ArrowDownToDot className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            ปล่อยที่นี่เพื่อย้ายเป็นย่อยใต้ &ldquo;#{activeMainCat.name}&rdquo;
          </span>
        </div>
      )}

      {/* Add / Edit Sub Cat Inline Form */}
      <AnimatePresence>
        {isEditingSubCat && !isCompactMode && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={onSaveSubCat}
            className="p-3 bg-[#f2f8f3] border-b border-[#c8dfce] space-y-2.5 shrink-0 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1a4725]">
                {editingSubCatId
                  ? 'แก้ไขป้ายแท็กย่อย'
                  : `เพิ่มป้ายแท็กย่อยใต้ #${activeMainCat?.name}`}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingSubCat(false)}
                className="text-xs text-[#8c8072] hover:text-[#3d3429] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#255431] block mb-0.5">
                ชื่อบุคคล / คุณลักษณะ (เช่น พี่แจ๊ส, เอก HRK, คอร์กี้, ในกองถ่าย):
              </label>
              <input
                type="text"
                value={subCatFormName}
                onChange={(e) => setSubCatFormName(e.target.value)}
                placeholder="ชื่อบุคคลหรือคุณลักษณะ..."
                autoFocus
                className="w-full bg-white border border-[#b8d6be] rounded-md px-2.5 py-1 text-xs text-[#3e3427] focus:outline-hidden focus:ring-1 focus:ring-[#5b9569]"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#255431] block mb-0.5">
                ประเภทข้อมูล (Entity Type):
              </label>
              <select
                value={subCatFormType}
                onChange={(e) =>
                  setSubCatFormType(e.target.value as EntitySubtype)
                }
                className="w-full bg-white border border-[#b8d6be] rounded-md px-2 py-1 text-xs text-[#3e3427] focus:outline-hidden"
              >
                <option value="PERSON">บุคคล / สตรีมเมอร์ / ดารา</option>
                <option value="ANIMAL">สัตว์</option>
                <option value="TOPIC">หัวข้อ / เกม / คอนเซ็ปต์</option>
                <option value="ACTION">กิริยา / มุก / ท่าทาง</option>
                <option value="GENERAL">ทั่วไป</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#255431] block mb-0.5">
                คำอธิบาย (ไม่บังคับ):
              </label>
              <input
                type="text"
                value={subCatFormDesc}
                onChange={(e) => setSubCatFormDesc(e.target.value)}
                placeholder="สไตล์มุกหรือจุดเด่น..."
                className="w-full bg-white border border-[#b8d6be] rounded-md px-2.5 py-1 text-xs text-[#3e3427] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="submit"
                disabled={!subCatFormName.trim()}
                className="bg-[#2d5d39] hover:bg-[#1d4327] disabled:opacity-50 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                บันทึกแท็กย่อย
              </button>
              <button
                type="button"
                onClick={() => setIsEditingSubCat(false)}
                className="text-xs text-[#7d7162] hover:text-[#3d3429] px-2 py-1 cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Subcategories List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 sm:p-2.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMainCat?.id || 'no-main-cat'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={
              isExpandedGrid &&
              activeMainCat &&
              filteredSubcategoriesInActiveCat.length > 0
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 content-start'
                : 'h-full space-y-1.5'
            }
          >
            {!activeMainCat ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-[#edf4fa] border border-[#d2e3f2] text-[#2f557b] flex items-center justify-center mb-2">
                  <MousePointerClick className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-[#453728] mb-1">
                  ยังไม่ได้เลือกป้ายแท็กหลัก
                </p>
                <p className="text-[11px] text-[#7d7162] max-w-[200px] leading-relaxed">
                  คลิกป้ายแท็กหลักเพื่อดูหรือลากแท็กอื่นมาวางเป็นแท็กย่อยที่นี่
                </p>
              </div>
            ) : subcategoriesInActiveCat.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-[#edf6ef] border border-[#cae4d0] text-[#2d5d39] flex items-center justify-center mb-2">
                  <Tags className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-[#453728] mb-1">
                  ยังไม่มีแท็กย่อยใต้ &quot;#{activeMainCat.name}&quot;
                </p>
                <p className="text-[11px] text-[#7d7162] max-w-[210px] leading-relaxed mb-3">
                  ลากแท็กหลักมาวางในช่องนี้เพื่อแปลงเป็นแท็กย่อยใต้ #{activeMainCat.name} ได้ทันที
                </p>
                {!isEditingSubCat && !isCompactMode && (
                  <button
                    type="button"
                    onClick={onOpenAddSubCat}
                    className="text-xs font-semibold text-[#22502f] bg-[#edf6ef] hover:bg-[#dfefe2] border border-[#b8d6be] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มป้ายแท็กย่อยรายการแรก</span>
                  </button>
                )}
              </div>
            ) : filteredSubcategoriesInActiveCat.length === 0 ? (
              <div className="p-6 text-center space-y-2 col-span-full">
                <p className="text-xs font-bold text-[#453728]">
                  ไม่พบแท็กย่อยที่ตรงกับ &ldquo;{tier2SearchQuery}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setTier2SearchQuery('')}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FAF7F2] hover:bg-[#EFE7DC] text-[#524538] border border-[#E2D5C4] cursor-pointer"
                >
                  ล้างคำค้นหา
                </button>
              </div>
            ) : (
              filteredSubcategoriesInActiveCat.map((sub) => {
                const isChecked = selectedTagIds.includes(sub.id);
                const isBeingDragged = draggingTagIds.includes(sub.id);
                const subStat = categoryMatrix.find((m) => m.tag.id === sub.id);
                const subTotal = subStat?.totalCount || 0;
                const subUsable = subStat?.usableCount || 0;
                const canSoloEp = subUsable >= 5;

                // COMPACT CARD MODE (Expanded Multi-Column Grid or Slim Drop Rail)
                if (isCompactMode) {
                  return (
                    <div
                      key={sub.id}
                      draggable
                      onDragStart={(e) => handleRowDragStart(e, sub.id)}
                      onDragEnd={onEndDragTag}
                      onClick={(e) =>
                        onToggleSelectTag(sub.id, visibleOrderIds, e.shiftKey)
                      }
                      className={`group px-2.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                        isBeingDragged
                          ? 'opacity-50 bg-[#EEF5EE] border-dashed border-[#3B6845]'
                          : isChecked
                          ? 'bg-[#EEF5EE] text-[#1C4824] border-[#3B6845] ring-1 ring-[#BAD8BF] shadow-2xs font-bold'
                          : 'border-[#e8e2d8] bg-white hover:bg-[#faf7f2] text-[#3e3427] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className="text-[#B8AB9C] group-hover:text-[#6E5F52] cursor-grab active:cursor-grabbing shrink-0"
                          title="คลิกค้างเพื่อลากย้ายหมวดหมู่"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelectTag(
                              sub.id,
                              visibleOrderIds,
                              e.shiftKey
                            );
                          }}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isChecked
                              ? 'bg-[#3B6845] text-white'
                              : 'bg-white border border-[#C7BDB0] hover:border-[#3B6845] text-transparent'
                          }`}
                          title="ติ๊กเลือกเพื่อย้ายหลายรายการ (กด Shift+คลิก เพื่อเลือกเป็นช่วง)"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>

                        <span className="text-xs shrink-0">
                          {getEntityIconNode(sub)}
                        </span>
                        <span
                          className="text-xs font-bold truncate"
                          title={`#${sub.name} (${subTotal} คลิป)`}
                        >
                          #{sub.name}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono tabular-nums shrink-0 ${
                          isChecked
                            ? 'bg-[#BAD8BF] text-[#1C4824] font-bold'
                            : 'bg-[#F2ECE4] text-[#635749]'
                        }`}
                      >
                        {subTotal} คลิป
                      </span>
                    </div>
                  );
                }

                // STANDARD DETAILED CARD MODE
                return (
                  <div
                    key={sub.id}
                    draggable
                    onDragStart={(e) => handleRowDragStart(e, sub.id)}
                    onDragEnd={onEndDragTag}
                    onClick={(e) =>
                      onToggleSelectTag(sub.id, visibleOrderIds, e.shiftKey)
                    }
                    className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isBeingDragged
                        ? 'opacity-50 bg-[#EEF5EE] border-dashed border-[#3B6845]'
                        : isChecked
                        ? 'bg-[#EEF5EE] text-[#1C4824] border-[#8FA892] ring-1 ring-[#BAD8BF] shadow-2xs'
                        : 'border-[#e8e2d8] bg-white hover:bg-[#faf7f2]'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="flex items-center gap-1 pt-0.5 shrink-0">
                        <span
                          className="text-[#B8AB9C] group-hover:text-[#6E5F52] cursor-grab active:cursor-grabbing"
                          title="คลิกค้างเพื่อลากไปวางที่มิติในคอลัมน์ 1 (เพื่อเลื่อนขั้นเป็นแท็กหลัก) หรือวางที่แท็กหลักอื่น"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelectTag(
                              sub.id,
                              visibleOrderIds,
                              e.shiftKey
                            );
                          }}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-[#3B6845] text-white'
                              : 'bg-white border border-[#C7BDB0] hover:border-[#3B6845] text-transparent'
                          }`}
                          title="ติ๊กเลือกเพื่อย้ายหลายรายการ (กด Shift+คลิก เพื่อเลือกเป็นช่วง)"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>

                      <span className="text-sm shrink-0 mt-0.5">
                        {getEntityIconNode(sub)}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#3e3427] truncate">
                            #{sub.name}
                          </span>
                          {canSoloEp && (
                            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF]">
                              Solo EP พร้อม!
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6E5F52] tabular-nums">
                          <span>ทั้งหมด {subTotal} ฟุต</span>
                          <span>·</span>
                          <span className="text-[#1C4824] font-bold">
                            พร้อมใช้ {subUsable}/5
                          </span>
                        </div>

                        {sub.description && (
                          <p className="text-[10px] text-[#8c8072] truncate">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => onOpenEditSubCat(sub, e)}
                        className="p-1 text-[#8c8072] hover:text-[#3d3429] hover:bg-[#eee7dc] rounded-md transition-colors cursor-pointer"
                        title="แก้ไขแท็กย่อยนี้"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDeleteTag(sub.id);
                        }}
                        className="p-1 text-[#8c8072] hover:text-[#8a3c31] hover:bg-[#faeae8] rounded-md transition-colors cursor-pointer"
                        title="ลบแท็กย่อยนี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
