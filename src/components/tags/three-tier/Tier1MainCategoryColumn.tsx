import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  Layers,
  MousePointerClick,
  Check,
  Search,
  GripVertical,
  CheckSquare,
  Square,
  CornerDownRight,
  ArrowDownToDot,
  Maximize2,
  Minimize2,
  PencilLine,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { BatchTagMoveDestination } from '../../../context/cms/cms.types';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import {
  COLOR_OPTIONS,
  getPastelColorConfig,
} from '../constants/tagPastelPalette';

interface Tier1MainCategoryColumnProps {
  activeGroup: CategoryGroup | null;
  mainCategoriesInActiveGroup: CategoryTag[];
  filteredMainCategoriesInActiveGroup: CategoryTag[];
  activeMainCat: CategoryTag | null;
  tags: CategoryTag[];
  categoryMatrix: CategoryMatrixStat[];
  tier1SearchQuery: string;
  setTier1SearchQuery: (val: string) => void;
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
  // Inline Rename Props
  inlineEditingTagId?: string | null;
  inlineEditingName?: string;
  setInlineEditingName?: (val: string) => void;
  onStartInlineRename?: (tag: CategoryTag, e?: React.MouseEvent) => void;
  onCommitInlineRename?: (tagId: string) => void;
  onCancelInlineRename?: () => void;
  // Full Edit Form Props
  isEditingMainCat: boolean;
  setIsEditingMainCat: (val: boolean) => void;
  editingMainCatId: string | null;
  mainCatFormName: string;
  setMainCatFormName: (val: string) => void;
  mainCatFormColor: string;
  setMainCatFormColor: (val: string) => void;
  mainCatFormDesc: string;
  setMainCatFormDesc: (val: string) => void;
  onOpenAddMainCat: () => void;
  onOpenEditMainCat: (cat: CategoryTag, e: React.MouseEvent) => void;
  onSaveMainCat: (e: React.FormEvent) => void;
  onSelectMainCat: (catId: string) => void;
  onRequestDeleteTag: (tagId: string) => void;
  isExpandedGrid?: boolean;
  isCompactRail?: boolean;
  onToggleExpandColumn?: () => void;
}

export const Tier1MainCategoryColumn: React.FC<Tier1MainCategoryColumnProps> = ({
  activeGroup,
  mainCategoriesInActiveGroup,
  filteredMainCategoriesInActiveGroup,
  activeMainCat,
  tags,
  categoryMatrix,
  tier1SearchQuery,
  setTier1SearchQuery,
  selectedTagIds,
  draggingTagIds,
  isBatchMovingTags,
  onToggleSelectTag,
  onToggleSelectAllVisible,
  onStartDragTag,
  onEndDragTag,
  onExecuteBatchMove,
  inlineEditingTagId,
  inlineEditingName = '',
  setInlineEditingName,
  onStartInlineRename,
  onCommitInlineRename,
  onCancelInlineRename,
  isEditingMainCat,
  setIsEditingMainCat,
  editingMainCatId,
  mainCatFormName,
  setMainCatFormName,
  mainCatFormColor,
  setMainCatFormColor,
  mainCatFormDesc,
  setMainCatFormDesc,
  onOpenAddMainCat,
  onOpenEditMainCat,
  onSaveMainCat,
  onSelectMainCat,
  onRequestDeleteTag,
  isExpandedGrid = false,
  isCompactRail = false,
  onToggleExpandColumn,
}) => {
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);

  const visibleOrderIds = useMemo(
    () => filteredMainCategoriesInActiveGroup.map((c) => c.id),
    [filteredMainCategoriesInActiveGroup]
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

  const handleRowDragStart = (e: React.DragEvent, catId: string) => {
    if (inlineEditingTagId === catId) {
      e.preventDefault();
      return;
    }
    const batch = onStartDragTag(catId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-cms-tag-ids', JSON.stringify(batch));
    e.dataTransfer.setData('text/plain', batch.join(','));
  };

  const handleDragOverCat = (e: React.DragEvent, targetCatId: string) => {
    if (draggingTagIds.includes(targetCatId)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCatId !== targetCatId) {
      setDragOverCatId(targetCatId);
    }
  };

  const handleDragLeaveCat = (e: React.DragEvent, targetCatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverCatId === targetCatId) {
      setDragOverCatId(null);
    }
  };

  const handleDropOnCat = (e: React.DragEvent, targetCatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCatId(null);
    const idsToMove = extractDraggedTagIds(e).filter((id) => id !== targetCatId);
    if (idsToMove.length > 0) {
      onExecuteBatchMove(idsToMove, {
        mode: 'MOVE_TO_PARENT_TAG',
        targetParentTagId: targetCatId,
      });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#faf8f5] overflow-hidden">
      {/* Column Header */}
      <div className="p-2.5 sm:p-3 border-b border-[#e5ded4] flex flex-wrap items-center justify-between bg-white shrink-0 gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-[#dce9f4] text-[#1b3d5b] text-[11px] font-bold flex items-center justify-center shrink-0">
            2
          </span>
          <span className="text-xs font-bold text-[#3e3427] truncate">
            {isCompactRail ? (
              'แท็กหลัก'
            ) : (
              <>
                ป้ายแท็กหลักใน:{' '}
                <span className="text-[#2b4c6b]">
                  {activeGroup?.name || 'มิตินี้'}
                </span>
              </>
            )}
          </span>
          <span className="text-[10px] font-mono bg-[#eee7dc] text-[#635749] px-1.5 py-0.2 rounded-full shrink-0 tabular-nums">
            {mainCategoriesInActiveGroup.length}
          </span>
          {isExpandedGrid && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] px-2 py-0.5 rounded-md shrink-0">
              โหมดตารางอ่านชื่อเต็ม — ดับเบิลคลิกชื่อเพื่อแก้ด่วน หรือติ๊กเลือกจัดการเป็นกลุ่ม
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {activeGroup && !isCompactRail && (
            <button
              type="button"
              onClick={onOpenAddMainCat}
              className="text-[11px] font-semibold text-[#24496b] hover:text-[#14324d] bg-[#edf4fa] hover:bg-[#dfeaf4] border border-[#b8cfe3] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>เพิ่มแท็กหลัก</span>
            </button>
          )}

          {activeGroup && onToggleExpandColumn && (
            <button
              type="button"
              onClick={onToggleExpandColumn}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1 cursor-pointer ${
                isExpandedGrid
                  ? 'bg-[#2C5378] text-white border-[#2C5378] shadow-2xs'
                  : 'bg-[#FAF5EB] hover:bg-[#EFE4D2] text-[#523715] border-[#DFC9A8]'
              }`}
              title={
                isExpandedGrid
                  ? 'ย่อกลับเป็นคอลัมน์ปกติ'
                  : 'กางคอลัมน์ป้ายแท็กหลักเป็นตารางหลายคอลัมน์เพื่ออ่านชื่อเต็มและจัดการจำนวนมาก'
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
                  <span>{isCompactRail ? 'กาง' : 'ขยายเต็มพื้นที่'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Column 2 Search Filter & Multi-Select Toolbar */}
      {activeGroup && mainCategoriesInActiveGroup.length > 0 && (
        <div className="px-2.5 py-2 bg-[#FDFBF7] border-b border-[#E8DFD3] flex flex-wrap items-center gap-1.5 shrink-0">
          {!isCompactRail && (
            <button
              type="button"
              onClick={() => onToggleSelectAllVisible(visibleOrderIds)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                isAllVisibleSelected
                  ? 'bg-[#2C5378] text-white border-[#2C5378]'
                  : selectedInVisibleCount > 0
                  ? 'bg-[#E7F1F9] text-[#1B4369] border-[#B2D5ED]'
                  : 'bg-white hover:bg-[#F5EFE6] text-[#524538] border-[#E2D5C4]'
              }`}
              title="เลือกหรือยกเลิกการเลือกแท็กหลักทั้งหมดที่แสดงในคอลัมน์นี้ (รองรับกด Shift+คลิก เพื่อเลือกเป็นช่วง)"
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

          <div className="relative flex-1 min-w-[120px]">
            <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tier1SearchQuery}
              onChange={(e) => setTier1SearchQuery(e.target.value)}
              placeholder={
                isCompactRail
                  ? 'กรองแท็กหลัก...'
                  : `ค้นหาแท็กใน ${activeGroup.name} (${mainCategoriesInActiveGroup.length})...`
              }
              className="w-full pl-7 pr-6 py-1 rounded-lg bg-white border border-[#E3D8CB] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#628FB6]"
            />
            {tier1SearchQuery && (
              <button
                type="button"
                onClick={() => setTier1SearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Main Cat Inline Form (Available in both Standard and Expanded Grid modes!) */}
      <AnimatePresence>
        {isEditingMainCat && !isCompactRail && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={onSaveMainCat}
            className="p-3 bg-[#f2f7fb] border-b border-[#caddee] space-y-2.5 shrink-0 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1b3c5c]">
                {editingMainCatId
                  ? 'แก้ไขป้ายแท็กหลัก & โทนสีพาสเทล'
                  : `เพิ่มป้ายแท็กหลักใต้ ${activeGroup?.name}`}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingMainCat(false)}
                className="text-xs text-[#8c8072] hover:text-[#3d3429] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-[#2b4b6a] block mb-0.5">
                  ชื่อป้ายแท็กหลัก (เช่น ดาราฮาๆ, แกล้งสุดฮา, สัมภาษณ์ฮาๆ):
                </label>
                <input
                  type="text"
                  value={mainCatFormName}
                  onChange={(e) => setMainCatFormName(e.target.value)}
                  placeholder="ชื่อป้ายแท็กหลัก..."
                  autoFocus
                  className="w-full bg-white border border-[#b8cfe3] rounded-md px-2.5 py-1.5 text-xs text-[#3e3427] focus:outline-hidden focus:ring-1 focus:ring-[#628fb6]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#2b4b6a] block mb-0.5">
                  คำอธิบายแท็ก (ไม่บังคับ):
                </label>
                <input
                  type="text"
                  value={mainCatFormDesc}
                  onChange={(e) => setMainCatFormDesc(e.target.value)}
                  placeholder="รายละเอียดสั้นๆ..."
                  className="w-full bg-white border border-[#b8cfe3] rounded-md px-2.5 py-1.5 text-xs text-[#3e3427] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Pastel Color Swatch Picker */}
            <div>
              <label className="text-[10px] font-semibold text-[#2b4b6a] block mb-1">
                เลือกโทนสีพาสเทลประจำป้าย (Pastel Color Swatch):
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/95 rounded-xl border border-[#b8cfe3]">
                {COLOR_OPTIONS.map((c) => {
                  const isColorSelected = mainCatFormColor === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setMainCatFormColor(c.value)}
                      title={c.label}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isColorSelected
                          ? `${c.badgeBg} ring-2 ${c.ringColor} shadow-2xs`
                          : 'bg-[#FAF8F5] border-[#E8E2D8] text-[#524538] hover:bg-white'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${c.swatchBg}`}
                      />
                      <span>{c.shortLabel.split(' ')[0]}</span>
                      {isColorSelected && <Check className="w-2.5 h-2.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="submit"
                disabled={!mainCatFormName.trim()}
                className="bg-[#2c5378] hover:bg-[#1e3c59] disabled:opacity-50 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                บันทึกแท็กหลัก
              </button>
              <button
                type="button"
                onClick={() => setIsEditingMainCat(false)}
                className="text-xs text-[#7d7162] hover:text-[#3d3429] px-2 py-1 cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main Categories List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 sm:p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGroup?.id || 'no-group'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={
              isExpandedGrid &&
              activeGroup &&
              filteredMainCategoriesInActiveGroup.length > 0
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 content-start'
                : 'h-full space-y-2'
            }
          >
            {!activeGroup ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-[#f0ebd9] border border-[#ded5be] text-[#78613d] flex items-center justify-center mb-3">
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#453728] mb-1">
                  ยังไม่ได้เลือกมิติกลุ่มแท็ก
                </p>
                <p className="text-[11px] text-[#7d7162] max-w-[210px] leading-relaxed">
                  กรุณาเลือกมิติในคอลัมน์ที่ 1 เพื่อดูหรือจัดการป้ายแท็กหลัก
                </p>
              </div>
            ) : mainCategoriesInActiveGroup.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-[#edf4fa] border border-[#d2e3f2] text-[#2f557b] flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#453728] mb-1">
                  ยังไม่มีแท็กหลักในมิติ &quot;{activeGroup.name}&quot;
                </p>
                <p className="text-[11px] text-[#7d7162] max-w-[220px] leading-relaxed mb-3.5">
                  สร้างป้ายแท็กหลักเพื่อใช้จัดกลุ่มเนื้อหาและเชื่อมโยงไปยังป้ายแท็กย่อย / คุณลักษณะ
                </p>
                {!isEditingMainCat && (
                  <button
                    type="button"
                    onClick={onOpenAddMainCat}
                    className="text-xs font-semibold text-[#24496b] bg-[#edf4fa] hover:bg-[#dfeaf4] border border-[#b8cfe3] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มป้ายแท็กหลักรายการแรก</span>
                  </button>
                )}
              </div>
            ) : filteredMainCategoriesInActiveGroup.length === 0 ? (
              <div className="p-6 text-center space-y-2 col-span-full">
                <p className="text-xs font-bold text-[#453728]">
                  ไม่พบแท็กหลักที่ตรงกับ &ldquo;{tier1SearchQuery}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setTier1SearchQuery('')}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FAF7F2] hover:bg-[#EFE7DC] text-[#524538] border border-[#E2D5C4] cursor-pointer"
                >
                  ล้างคำค้นหา
                </button>
              </div>
            ) : (
              filteredMainCategoriesInActiveGroup.map((cat) => {
                const isSelected = activeMainCat?.id === cat.id;
                const isChecked = selectedTagIds.includes(cat.id);
                const isBeingDragged = draggingTagIds.includes(cat.id);
                const isDragOver =
                  dragOverCatId === cat.id && !draggingTagIds.includes(cat.id);
                const isInlineEditing = inlineEditingTagId === cat.id;

                const subCount = tags.filter(
                  (t) => t.tier === 2 && t.parentId === cat.id
                ).length;
                const stat = categoryMatrix.find((m) => m.tag.id === cat.id);
                const usableCount = stat?.usableCount || 0;
                const totalCount = stat?.totalCount || 0;
                const epCount = stat?.producibleEpisodesCount || 0;
                const colorCfg = getPastelColorConfig(cat.color);

                const canNestSelectedHere =
                  selectedTagIds.length > 0 && !selectedTagIds.includes(cat.id);

                // SLIM DROP RAIL MODE (Only when Column 3 is expanded)
                if (isCompactRail) {
                  return (
                    <div
                      key={cat.id}
                      draggable={!isInlineEditing}
                      onDragStart={(e) => handleRowDragStart(e, cat.id)}
                      onDragEnd={onEndDragTag}
                      onDragOver={(e) => handleDragOverCat(e, cat.id)}
                      onDragLeave={(e) => handleDragLeaveCat(e, cat.id)}
                      onDrop={(e) => handleDropOnCat(e, cat.id)}
                      onClick={() => onSelectMainCat(cat.id)}
                      className={`group p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        isDragOver
                          ? 'bg-[#EEF5EE] text-[#1C4824] border-2 border-[#3B6845] ring-2 ring-[#BAD8BF] shadow-sm'
                          : isSelected
                          ? 'bg-[#e7f1f9] text-[#1b4369] border-[#b2d5ed] font-semibold'
                          : 'bg-white hover:bg-[#faf7f2] border-[#e8e2d8] text-[#3e3427]'
                      }`}
                    >
                      <div className="flex items-start gap-1.5 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${colorCfg.swatchBg}`}
                        />
                        <span className="text-xs font-bold leading-snug line-clamp-2 break-words flex-1">
                          #{cat.name}
                        </span>
                        <span className="text-[10px] font-mono bg-[#F2ECE4] text-[#635749] px-1.5 py-0.2 rounded shrink-0 tabular-nums">
                          {totalCount}
                        </span>
                      </div>
                    </div>
                  );
                }

                // UNIFIED TWO-DECK READABLE CARD (Works seamlessly in both Expanded Grid and Standard Column!)
                return (
                  <div
                    key={cat.id}
                    draggable={!isInlineEditing}
                    onDragStart={(e) => handleRowDragStart(e, cat.id)}
                    onDragEnd={onEndDragTag}
                    onDragOver={(e) => handleDragOverCat(e, cat.id)}
                    onDragLeave={(e) => handleDragLeaveCat(e, cat.id)}
                    onDrop={(e) => handleDropOnCat(e, cat.id)}
                    onClick={() => {
                      if (!isInlineEditing) {
                        onSelectMainCat(cat.id);
                      }
                    }}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isDragOver
                        ? 'bg-[#EEF5EE] text-[#1C4824] border-2 border-[#3B6845] ring-2 ring-[#BAD8BF] shadow-sm scale-[1.01]'
                        : isBeingDragged
                        ? 'opacity-50 bg-[#E7F1F9] border-dashed border-[#628FB6]'
                        : isChecked
                        ? 'bg-[#EEF5EE] text-[#1C4824] border-[#3B6845] ring-1 ring-[#BAD8BF] shadow-2xs'
                        : isSelected
                        ? 'bg-[#e7f1f9] text-[#1b4369] border-[#9ec5e6] shadow-2xs ring-1 ring-[#c2def4]'
                        : 'bg-white hover:bg-[#faf7f2] border-[#e8e2d8] text-[#3e3427]'
                    }`}
                  >
                    {/* DECK 1: Drag Handle + Checkbox + Pastel Dot + Full 2-Line Tag Name (or Inline Rename Input) */}
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                        <span
                          className="text-[#B8AB9C] group-hover:text-[#6E5F52] cursor-grab active:cursor-grabbing"
                          title="คลิกค้างเพื่อลากไปวางที่มิติอื่น (คอลัมน์ 1) หรือวางทับแท็กหลักอื่นเพื่อแปลงเป็นแท็กย่อย"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelectTag(
                              cat.id,
                              visibleOrderIds,
                              e.shiftKey
                            );
                          }}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-[#3B6845] text-white'
                              : 'bg-white border border-[#C7BDB0] hover:border-[#3B6845] text-transparent'
                          }`}
                          title="ติ๊กเลือกเพื่อแก้ไข/ย้าย/ลบหลายรายการพร้อมกัน (กด Shift+คลิก เพื่อเลือกเป็นช่วง)"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>

                        <span
                          className={`w-3 h-3 rounded-full shrink-0 border border-black/10 ${colorCfg.swatchBg}`}
                          title={`โทนสี: ${colorCfg.shortLabel}`}
                        />
                      </div>

                      {/* Tag Name or Inline Input */}
                      <div className="min-w-0 flex-1">
                        {isInlineEditing &&
                        setInlineEditingName &&
                        onCommitInlineRename &&
                        onCancelInlineRename ? (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={inlineEditingName}
                              onChange={(e) =>
                                setInlineEditingName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  onCommitInlineRename(cat.id);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  onCancelInlineRename();
                                }
                              }}
                              autoFocus
                              className="w-full bg-white border border-[#2C5378] rounded-md px-2 py-0.5 text-xs font-bold text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#628FB6]"
                            />
                            <button
                              type="button"
                              onClick={() => onCommitInlineRename(cat.id)}
                              className="p-1 rounded-md bg-[#3B6845] text-white hover:bg-[#2C5235] cursor-pointer shrink-0"
                              title="บันทึกชื่อใหม่ (Enter)"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={onCancelInlineRename}
                              className="p-1 rounded-md bg-[#FAF7F2] text-[#6E5F52] hover:bg-[#EFE7DC] border border-[#E2D5C4] cursor-pointer shrink-0"
                              title="ยกเลิก (Esc)"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onDoubleClick={(e) => {
                              if (onStartInlineRename) {
                                onStartInlineRename(cat, e);
                              }
                            }}
                            title={`#${cat.name} (ดับเบิลคลิกเพื่อแก้ไขชื่อด่วน)`}
                            className="text-[13px] font-extrabold leading-snug text-[#2D241E] line-clamp-2 break-words"
                          >
                            #{cat.name}
                          </div>
                        )}

                        {cat.description && !isExpandedGrid && (
                          <p
                            className={`text-[10px] mt-0.5 line-clamp-1 ${
                              isSelected ? 'text-[#31567d]' : 'text-[#8c8072]'
                            }`}
                          >
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* DECK 2: Statistics + Direct Action Buttons (Rename, Edit Color/Details, Nest, Delete) */}
                    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-[#EFE9E0]">
                      {/* Left: Unboxed / Clean Tabular Metrics */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono tabular-nums text-[#635749]">
                        <span
                          className={
                            totalCount > 0
                              ? 'font-bold text-[#1C4824]'
                              : 'text-[#8C7B6C]'
                          }
                        >
                          {totalCount} คลิป
                        </span>
                        {!isExpandedGrid && totalCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>พร้อม {usableCount}</span>
                          </>
                        )}
                        {subCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#2B4C6B] font-semibold">
                              {subCount} ย่อย
                            </span>
                          </>
                        )}
                        {epCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#1C4824] font-bold">
                              {epCount} EP
                            </span>
                          </>
                        )}
                      </div>

                      {/* Right: Direct Card Actions (Always visible & accessible!) */}
                      <div className="flex items-center gap-1 shrink-0">
                        {canNestSelectedHere && (
                          <button
                            type="button"
                            disabled={isBatchMovingTags}
                            onClick={(e) => {
                              e.stopPropagation();
                              onExecuteBatchMove(selectedTagIds, {
                                mode: 'MOVE_TO_PARENT_TAG',
                                targetParentTagId: cat.id,
                              });
                            }}
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#EEF5EE] hover:bg-[#3B6845] text-[#1C4824] hover:text-white border border-[#BAD8BF] transition-colors flex items-center gap-0.5 cursor-pointer"
                            title={`แปลง/ย้าย ${selectedTagIds.length} แท็กที่เลือกให้มาเป็นแท็กย่อย (Tier 2) ใต้ #${cat.name}`}
                          >
                            <CornerDownRight className="w-2.5 h-2.5" />
                            <span>ใส่ย่อย</span>
                          </button>
                        )}

                        {onStartInlineRename && !isInlineEditing && (
                          <button
                            type="button"
                            onClick={(e) => onStartInlineRename(cat, e)}
                            className="p-1 rounded-md text-[#7D6E61] hover:text-[#1B4369] hover:bg-[#E7F1F9] transition-colors cursor-pointer"
                            title="เปลี่ยนชื่อแท็กด่วนบนการ์ด (หรือดับเบิลคลิกที่ชื่อ)"
                          >
                            <PencilLine className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => onOpenEditMainCat(cat, e)}
                          className="p-1 rounded-md text-[#7D6E61] hover:text-[#1B4369] hover:bg-[#E7F1F9] transition-colors cursor-pointer"
                          title="แก้ไขโทนสีพาสเทลและรายละเอียดแท็ก"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDeleteTag(cat.id);
                          }}
                          className="p-1 rounded-md text-[#8C7B6C] hover:text-[#8A3C31] hover:bg-[#FDF2F0] transition-colors cursor-pointer"
                          title="ลบแท็กนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {!isExpandedGrid && (
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              isSelected
                                ? 'text-[#1e4770] translate-x-0.5'
                                : 'text-[#c7bdb0]'
                            }`}
                          />
                        )}
                      </div>
                    </div>

                    {isDragOver && (
                      <div className="px-2 py-1 rounded-lg bg-[#3B6845] text-white text-[10px] font-bold flex items-center justify-center gap-1">
                        <ArrowDownToDot className="w-3 h-3" />
                        <span className="truncate">
                          ปล่อยเพื่อแปลงเป็นแท็กย่อยใต้ &ldquo;#{cat.name}&rdquo;
                        </span>
                      </div>
                    )}
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
