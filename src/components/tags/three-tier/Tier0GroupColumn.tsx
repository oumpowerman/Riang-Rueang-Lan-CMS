import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  FolderPlus,
  FolderInput,
  ArrowDownToDot,
} from 'lucide-react';
import { BatchTagMoveDestination } from '../../../context/cms/cms.types';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import {
  CategoryGroupIcon,
  GROUP_ICON_OPTIONS,
  resolveIconKey,
} from '../../ui/CategoryGroupIcon';

interface Tier0GroupColumnProps {
  categoryGroups: CategoryGroup[];
  tags: CategoryTag[];
  activeGroup: CategoryGroup | null;
  selectedTagIds: string[];
  draggingTagIds: string[];
  isBatchMovingTags: boolean;
  onExecuteBatchMove: (
    tagIdsToMove: string[],
    destination: BatchTagMoveDestination
  ) => void;
  isEditingGroup: boolean;
  setIsEditingGroup: (val: boolean) => void;
  editingGroupId: string | null;
  groupFormName: string;
  setGroupFormName: (val: string) => void;
  groupFormIcon: string;
  setGroupFormIcon: (val: string) => void;
  groupFormDesc: string;
  setGroupFormDesc: (val: string) => void;
  onOpenAddGroup: () => void;
  onOpenEditGroup: (group: CategoryGroup, e: React.MouseEvent) => void;
  onSaveGroup: (e: React.FormEvent) => void;
  onSelectGroup: (groupId: string) => void;
  onRequestDeleteGroup: (groupId: string) => void;
  isCompactRail?: boolean;
}

export const Tier0GroupColumn: React.FC<Tier0GroupColumnProps> = ({
  categoryGroups,
  tags,
  activeGroup,
  selectedTagIds,
  draggingTagIds,
  isBatchMovingTags,
  onExecuteBatchMove,
  isEditingGroup,
  setIsEditingGroup,
  editingGroupId,
  groupFormName,
  setGroupFormName,
  groupFormIcon,
  setGroupFormIcon,
  groupFormDesc,
  setGroupFormDesc,
  onOpenAddGroup,
  onOpenEditGroup,
  onSaveGroup,
  onSelectGroup,
  onRequestDeleteGroup,
  isCompactRail = false,
}) => {
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

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

  const handleDragOverGroup = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGroupId !== groupId) {
      setDragOverGroupId(groupId);
    }
  };

  const handleDragLeaveGroup = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverGroupId === groupId) {
      setDragOverGroupId(null);
    }
  };

  const handleDropOnGroup = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGroupId(null);
    const idsToMove = extractDraggedTagIds(e);
    if (idsToMove.length > 0) {
      onExecuteBatchMove(idsToMove, {
        mode: 'MOVE_TO_GROUP',
        targetGroupId: groupId,
      });
    }
  };

  const isDraggingAny = draggingTagIds.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#faf8f5] overflow-hidden">
      <div className="p-2.5 sm:p-3 border-b border-[#e5ded4] flex items-center justify-between bg-white shrink-0 gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-[#eedbc0] text-[#523715] text-[11px] font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <span className="text-xs font-bold text-[#3e3427] truncate">
            {isCompactRail ? 'มิติปลายทาง' : 'มิติกลุ่มแท็ก (Dimensions)'}
          </span>
          <span className="text-[10px] font-mono bg-[#eee7dc] text-[#635749] px-1.5 py-0.2 rounded-full tabular-nums shrink-0">
            {categoryGroups.length}
          </span>
        </div>
        {!isCompactRail && (
          <button
            type="button"
            onClick={onOpenAddGroup}
            className="text-[11px] font-semibold text-[#614524] hover:text-[#3d2912] bg-[#f5ede0] hover:bg-[#ebdcc8] px-2 py-1 rounded-md transition-colors flex items-center gap-0.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>เพิ่มมิติ</span>
          </button>
        )}
      </div>

      {/* Helpful hint banner when dragging or selecting tags */}
      <AnimatePresence initial={false}>
        {(isDraggingAny || selectedTagIds.length > 0) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden shrink-0"
          >
            <div className="px-2.5 py-1.5 bg-[#EEF5EE] border-b border-[#BAD8BF] text-[10px] text-[#1C4824] font-semibold flex items-center gap-1.5">
              <ArrowDownToDot className="w-3.5 h-3.5 text-[#3B6845] shrink-0" />
              <span className="leading-snug">
                {isDraggingAny
                  ? `ปล่อยที่มิติใดก็ได้เพื่อย้าย ${draggingTagIds.length} แท็ก`
                  : isCompactRail
                  ? `เลือก ${selectedTagIds.length} แท็ก — กด "ย้าย" หรือลากมาวาง`
                  : `เลือกอยู่ ${selectedTagIds.length} แท็ก — กดปุ่ม "ย้ายมานี่" หรือลากมาวางที่มิติปลายทางได้เลย`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Group Form Inline */}
      <AnimatePresence>
        {isEditingGroup && !isCompactRail && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={onSaveGroup}
            className="p-3 bg-[#faf5eb] border-b border-[#e3d3ba] space-y-2.5 shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#453119]">
                {editingGroupId ? 'แก้ไขมิติกลุ่มแท็ก' : 'สร้างมิติกลุ่มแท็กใหม่'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingGroup(false)}
                className="text-xs text-[#8c8072] hover:text-[#3d3429] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#5a4224] block mb-0.5">
                ชื่อมิติ (เช่น มิติตัวละคร, ลีลามุก/แกล้ง, ธีมและสถานการณ์):
              </label>
              <input
                type="text"
                value={groupFormName}
                onChange={(e) => setGroupFormName(e.target.value)}
                placeholder="ชื่อมิติ..."
                autoFocus
                className="w-full bg-white border border-[#d8c5a6] rounded-md px-2.5 py-1 text-xs text-[#3e3427] focus:outline-hidden focus:ring-1 focus:ring-[#9e7c4f]"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#5a4224] block mb-1">
                ไอคอนมิติ (เลือก Vector Icon):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 p-1.5 bg-white/90 rounded-xl border border-[#d8c5a6]">
                {GROUP_ICON_OPTIONS.map((opt) => {
                  const IconComp = opt.icon;
                  const currentResolved = resolveIconKey(groupFormIcon);
                  const isOptSelected = currentResolved === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      title={opt.label}
                      onClick={() => setGroupFormIcon(opt.key)}
                      className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        isOptSelected
                          ? 'bg-[#eedbc0] text-[#4f3414] shadow-2xs ring-2 ring-[#dfc6a3]'
                          : 'bg-[#faf8f5] hover:bg-[#f3ebd9] text-[#695d4f] hover:text-[#3d3122] border border-[#e8e2d8]'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#5a4224] block mb-0.5">
                คำอธิบายมิติ (ไม่บังคับ):
              </label>
              <input
                type="text"
                value={groupFormDesc}
                onChange={(e) => setGroupFormDesc(e.target.value)}
                placeholder="รายละเอียด เช่น มิติสำหรับจัดกลุ่มตามคนดัง..."
                className="w-full bg-white border border-[#d8c5a6] rounded-md px-2.5 py-1 text-xs text-[#3e3427] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="submit"
                disabled={!groupFormName.trim()}
                className="bg-[#78593a] hover:bg-[#62462a] disabled:opacity-50 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                บันทึกมิติ
              </button>
              <button
                type="button"
                onClick={() => setIsEditingGroup(false)}
                className="text-xs text-[#7d7162] hover:text-[#3d3429] px-2 py-1"
              >
                ยกเลิก
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Group List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 space-y-1.5">
        {categoryGroups.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-[#f5ede0] border border-[#e8dbc6] text-[#8c673b] flex items-center justify-center mb-2">
              <FolderPlus className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#453728] mb-1">
              ยังไม่มีมิติกลุ่มแท็ก
            </p>
          </div>
        ) : (
          categoryGroups.map((group) => {
            const isSelected = activeGroup?.id === group.id;
            const isDragOver = dragOverGroupId === group.id;
            const catCount = tags.filter((t) => {
              if (t.tier === 2) return false;
              if (t.groupId) return t.groupId === group.id;
              return t.groupType === group.id.replace('GRP-', '');
            }).length;

            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                onDragOver={(e) => handleDragOverGroup(e, group.id)}
                onDragLeave={(e) => handleDragLeaveGroup(e, group.id)}
                onDrop={(e) => handleDropOnGroup(e, group.id)}
                className={`group ${
                  isCompactRail ? 'p-2' : 'p-2.5'
                } rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                  isDragOver
                    ? 'bg-[#EEF5EE] text-[#1C4824] border-2 border-[#3B6845] ring-2 ring-[#BAD8BF] shadow-sm scale-[1.01]'
                    : isSelected
                    ? 'bg-[#f0e4d2] text-[#3d2912] border-[#dcbe93] shadow-2xs font-semibold ring-1 ring-[#e5cdab]'
                    : 'bg-white hover:bg-[#faf7f2] border-[#e8e2d8] text-[#4d4133] font-medium'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`${
                        isCompactRail ? 'w-6 h-6' : 'w-7 h-7'
                      } rounded-lg flex items-center justify-center shrink-0 ${
                        isDragOver
                          ? 'bg-[#3B6845] text-white'
                          : isSelected
                          ? 'bg-[#e5d0b1] text-[#3f2a11]'
                          : 'bg-[#f5eee3] text-[#755938] border border-[#e6dbc9]'
                      }`}
                    >
                      <CategoryGroupIcon
                        icon={group.icon}
                        className={isCompactRail ? 'w-3.5 h-3.5' : 'w-4 h-4'}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs truncate flex items-center gap-1">
                        <span className="truncate">{group.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums shrink-0 ${
                            isDragOver
                              ? 'bg-[#BAD8BF] text-[#1C4824]'
                              : isSelected
                              ? 'bg-[#dfc5a0] text-[#3d2912]'
                              : 'bg-[#eee7dc] text-[#695d4f]'
                          }`}
                        >
                          {isCompactRail ? catCount : `${catCount} แท็กหลัก`}
                        </span>
                      </div>
                      {!isCompactRail && group.description && (
                        <p
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-[#614524]' : 'text-[#8c8072]'
                          }`}
                        >
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {selectedTagIds.length > 0 && !isSelected && (
                      <button
                        type="button"
                        disabled={isBatchMovingTags}
                        onClick={(e) => {
                          e.stopPropagation();
                          onExecuteBatchMove(selectedTagIds, {
                            mode: 'MOVE_TO_GROUP',
                            targetGroupId: group.id,
                          });
                        }}
                        className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#EEF5EE] hover:bg-[#3B6845] text-[#1C4824] hover:text-white border border-[#BAD8BF] transition-colors flex items-center gap-0.5 cursor-pointer"
                        title={`ย้าย ${selectedTagIds.length} แท็กที่เลือกเข้าสู่มิติ "${group.name}"`}
                      >
                        <FolderInput className="w-3 h-3" />
                        <span>
                          {isCompactRail
                            ? 'ย้าย'
                            : `ย้ายมานี่ (${selectedTagIds.length})`}
                        </span>
                      </button>
                    )}

                    {!isCompactRail && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => onOpenEditGroup(group, e)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            isSelected
                              ? 'text-[#614524] hover:text-[#382613] hover:bg-[#e4d0b1]'
                              : 'text-[#8c8072] hover:text-[#3d3429] hover:bg-[#eee7dc]'
                          }`}
                          title="แก้ไขมิตินี้"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDeleteGroup(group.id);
                          }}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            isSelected
                              ? 'text-[#8a3c31] hover:text-[#612117] hover:bg-[#f8deda]'
                              : 'text-[#8c8072] hover:text-[#8a3c31] hover:bg-[#faeae8]'
                          }`}
                          title="ลบมิตินี้"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected
                          ? 'text-[#5a3f1f] translate-x-0.5'
                          : 'text-[#c7bdb0]'
                      }`}
                    />
                  </div>
                </div>

                {isDragOver && (
                  <div className="px-2 py-1 rounded-lg bg-[#3B6845] text-white text-[10px] font-bold flex items-center justify-center gap-1">
                    <ArrowDownToDot className="w-3 h-3" />
                    <span className="truncate">
                      ปล่อยเพื่อย้าย {draggingTagIds.length || 1} แท็กเข้า &ldquo;
                      {group.name}&rdquo;
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
