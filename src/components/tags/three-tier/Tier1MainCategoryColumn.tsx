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

  const isCompactMode = isExpandedGrid || isCompactRail;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#faf8f5] overflow-hidden">
      <div className="p-2.5 sm:p-3 border-b border-[#e5ded4] flex items-center justify-between bg-white shrink-0 gap-1.5">
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
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] px-2 py-0.5 rounded-md shrink-0">
              โหมดตารางจัดการด่วน — ลากไปวางคอลัมน์ซ้าย/ขวา หรือติ๊กเลือกหลายอัน
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {activeGroup && onToggleExpandColumn && (
            <button
              type="button"
              onClick={onToggleExpandColumn}
              className={`text-[11px] font-bold px-2 py-1 rounded-md border transition-colors flex items-center gap-1 cursor-pointer ${
                isExpandedGrid
                  ? 'bg-[#2C5378] text-white border-[#2C5378] shadow-2xs'
                  : 'bg-[#FAF5EB] hover:bg-[#EFE4D2] text-[#523715] border-[#DFC9A8]'
              }`}
              title={
                isExpandedGrid
                  ? 'ย่อกลับเป็นคอลัมน์ปกติ'
                  : 'กางคอลัมน์ป้ายแท็กหลักเป็นตารางหลายคอลัมน์เพื่อย้ายหมวดหมู่จำนวนมากได้ง่ายขึ้น'
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

          {activeGroup && !isCompactMode && (
            <button
              type="button"
              onClick={onOpenAddMainCat}
              className="text-[11px] font-semibold text-[#24496b] hover:text-[#14324d] bg-[#edf4fa] hover:bg-[#dfeaf4] px-2 py-1 rounded-md transition-colors flex items-center gap-0.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>เพิ่มแท็กหลัก</span>
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
              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
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

          <div className="relative flex-1 min-w-[110px]">
            <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tier1SearchQuery}
              onChange={(e) => setTier1SearchQuery(e.target.value)}
              placeholder={
                isCompactRail
                  ? 'กรองแท็กหลัก...'
                  : `กรองใน ${activeGroup.name} (${mainCategoriesInActiveGroup.length})...`
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

      {/* Add / Edit Main Cat Inline Form (Now includes Pastel Color Swatch Picker!) */}
      <AnimatePresence>
        {isEditingMainCat && !isCompactMode && (
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
                  ? 'แก้ไขป้ายแท็กหลัก & โทนสี'
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
                className="w-full bg-white border border-[#b8cfe3] rounded-md px-2.5 py-1 text-xs text-[#3e3427] focus:outline-hidden focus:ring-1 focus:ring-[#628fb6]"
              />
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

            <div>
              <label className="text-[10px] font-semibold text-[#2b4b6a] block mb-0.5">
                คำอธิบายแท็ก (ไม่บังคับ):
              </label>
              <input
                type="text"
                value={mainCatFormDesc}
                onChange={(e) => setMainCatFormDesc(e.target.value)}
                placeholder="รายละเอียดสั้นๆ..."
                className="w-full bg-white border border-[#b8cfe3] rounded-md px-2.5 py-1 text-xs text-[#3e3427] focus:outline-hidden"
              />
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
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 sm:p-2.5">
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
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 content-start'
                : 'h-full space-y-1.5'
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

                // COMPACT CARD MODE (Expanded Multi-Column Grid or Slim Drop Rail)
                if (isCompactMode) {
                  return (
                    <div
                      key={cat.id}
                      draggable
                      onDragStart={(e) => handleRowDragStart(e, cat.id)}
                      onDragEnd={onEndDragTag}
                      onDragOver={(e) => handleDragOverCat(e, cat.id)}
                      onDragLeave={(e) => handleDragLeaveCat(e, cat.id)}
                      onDrop={(e) => handleDropOnCat(e, cat.id)}
                      onClick={(e) => {
                        if (isExpandedGrid) {
                          onToggleSelectTag(
                            cat.id,
                            visibleOrderIds,
                            e.shiftKey
                          );
                          onSelectMainCat(cat.id);
                        } else {
                          onSelectMainCat(cat.id);
                        }
                      }}
                      className={`group px-2.5 py-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-center gap-1 ${
                        isDragOver
                          ? 'bg-[#EEF5EE] text-[#1C4824] border-2 border-[#3B6845] ring-2 ring-[#BAD8BF] shadow-sm scale-[1.01]'
                          : isBeingDragged
                          ? 'opacity-50 bg-[#E7F1F9] border-dashed border-[#628FB6]'
                          : isChecked
                          ? 'bg-[#EEF5EE] text-[#1C4824] border-[#3B6845] ring-1 ring-[#BAD8BF] shadow-2xs font-bold'
                          : isSelected
                          ? 'bg-[#e7f1f9] text-[#1b4369] border-[#b2d5ed] shadow-2xs font-semibold'
                          : 'bg-white hover:bg-[#faf7f2] border-[#e8e2d8] text-[#3e3427] font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
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
                                cat.id,
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

                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorCfg.swatchBg}`}
                          />
                          <span
                            className="text-xs font-bold truncate"
                            title={`#${cat.name} (${totalCount} คลิป)`}
                          >
                            #{cat.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono tabular-nums ${
                              isChecked
                                ? 'bg-[#BAD8BF] text-[#1C4824] font-bold'
                                : 'bg-[#F2ECE4] text-[#635749]'
                            }`}
                            title={`คลิปทั้งหมด ${totalCount} คลิป`}
                          >
                            {totalCount} คลิป
                          </span>

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
                              <span>ย่อย</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {isDragOver && (
                        <div className="px-2 py-0.5 rounded-md bg-[#3B6845] text-white text-[10px] font-bold flex items-center justify-center gap-1">
                          <ArrowDownToDot className="w-3 h-3" />
                          <span className="truncate">
                            ปล่อยเป็นย่อยใต้ #{cat.name}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                // STANDARD DETAILED CARD MODE
                return (
                  <div
                    key={cat.id}
                    draggable
                    onDragStart={(e) => handleRowDragStart(e, cat.id)}
                    onDragEnd={onEndDragTag}
                    onDragOver={(e) => handleDragOverCat(e, cat.id)}
                    onDragLeave={(e) => handleDragLeaveCat(e, cat.id)}
                    onDrop={(e) => handleDropOnCat(e, cat.id)}
                    onClick={() => onSelectMainCat(cat.id)}
                    className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isDragOver
                        ? 'bg-[#EEF5EE] text-[#1C4824] border-2 border-[#3B6845] ring-2 ring-[#BAD8BF] shadow-sm scale-[1.01]'
                        : isBeingDragged
                        ? 'opacity-50 bg-[#E7F1F9] border-dashed border-[#628FB6]'
                        : isChecked
                        ? 'bg-[#EEF5EE]/90 text-[#1C4824] border-[#8FA892] ring-1 ring-[#BAD8BF] shadow-2xs'
                        : isSelected
                        ? 'bg-[#e7f1f9] text-[#1b4369] border-[#b2d5ed] shadow-2xs font-semibold ring-1 ring-[#c2def4]'
                        : 'bg-white hover:bg-[#faf7f2] border-[#e8e2d8] text-[#4d4133] font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Left: Drag Handle + Multi-Select Checkbox + Tag Info */}
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div className="flex items-center gap-1 pt-0.5 shrink-0">
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
                            title="ติ๊กเลือกเพื่อย้ายหลายรายการ (กด Shift+คลิก เพื่อเลือกเป็นช่วง)"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="text-xs truncate flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorCfg.swatchBg}`}
                              title={`โทนสี: ${colorCfg.shortLabel}`}
                            />
                            <span className="font-bold">#{cat.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                                isSelected
                                  ? 'bg-[#cce2f4] text-[#123657]'
                                  : 'bg-[#eee7dc] text-[#695d4f]'
                              }`}
                            >
                              {subCount} ย่อย
                            </span>
                          </div>

                          {/* Integrated Footage & EP Capacity Statistics */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono tabular-nums">
                            <span className="px-1.5 py-0.2 rounded bg-white/90 border border-[#E2D5C4] text-[#524538]">
                              พร้อมใช้{' '}
                              <strong className="text-[#1C4824]">
                                {usableCount}
                              </strong>
                              /{totalCount} ฟุต
                            </span>
                            {epCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-[#EEF5EE] border border-[#BAD8BF] text-[#1C4824] font-bold">
                                {epCount} EP
                              </span>
                            )}
                          </div>

                          {cat.description && (
                            <p
                              className={`text-[10px] truncate ${
                                isSelected ? 'text-[#31567d]' : 'text-[#8c8072]'
                              }`}
                            >
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Actions */}
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
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#EEF5EE] hover:bg-[#3B6845] text-[#1C4824] hover:text-white border border-[#BAD8BF] transition-colors flex items-center gap-0.5 cursor-pointer"
                            title={`แปลง/ย้าย ${selectedTagIds.length} แท็กที่เลือกให้มาเป็นแท็กย่อย (Tier 2) ใต้ #${cat.name}`}
                          >
                            <CornerDownRight className="w-3 h-3" />
                            <span>ใส่เป็นย่อย ({selectedTagIds.length})</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => onOpenEditMainCat(cat, e)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            isSelected
                              ? 'text-[#2b5177] hover:text-[#142d45] hover:bg-[#d0e4f5]'
                              : 'text-[#8c8072] hover:text-[#3d3429] hover:bg-[#eee7dc]'
                          }`}
                          title="แก้ไขแท็กนี้และโทนสี"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDeleteTag(cat.id);
                          }}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            isSelected
                              ? 'text-[#8a3c31] hover:text-[#612117] hover:bg-[#f8deda]'
                              : 'text-[#8c8072] hover:text-[#8a3c31] hover:bg-[#faeae8]'
                          }`}
                          title="ลบแท็กนี้ (รวมถึงคุณลักษณะด้านใน)"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected
                              ? 'text-[#1e4770] translate-x-0.5'
                              : 'text-[#c7bdb0]'
                          }`}
                        />
                      </div>
                    </div>

                    {isDragOver && (
                      <div className="px-2 py-1 rounded-lg bg-[#3B6845] text-white text-[10px] font-bold flex items-center justify-center gap-1">
                        <ArrowDownToDot className="w-3 h-3" />
                        <span>
                          ปล่อยเพื่อแปลง {draggingTagIds.length || 1} แท็กเป็นแท็กย่อยใต้ &ldquo;#
                          {cat.name}&rdquo;
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
