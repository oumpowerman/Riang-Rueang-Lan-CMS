import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Edit2, Trash2, ChevronRight, Folder, FolderPlus } from 'lucide-react';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import { EMOJI_OPTIONS } from './useThreeTierCategoryState';

interface Tier0GroupColumnProps {
  categoryGroups: CategoryGroup[];
  tags: CategoryTag[];
  activeGroup: CategoryGroup | null;
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
}

export const Tier0GroupColumn: React.FC<Tier0GroupColumnProps> = ({
  categoryGroups,
  tags,
  activeGroup,
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
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50/50 overflow-hidden">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">
            1
          </span>
          <span className="text-xs font-bold text-slate-800">กลุ่มหมวดหมู่ (Clusters)</span>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full">
            {categoryGroups.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAddGroup}
          className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>เพิ่มกลุ่ม</span>
        </button>
      </div>

      {/* Add / Edit Group Form Modal/Inline */}
      <AnimatePresence>
        {isEditingGroup && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={onSaveGroup}
            className="p-3 bg-indigo-50/90 border-b border-indigo-200 space-y-2.5 shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950">
                {editingGroupId ? 'แก้ไขกลุ่มหมวดหมู่' : 'สร้างกลุ่มหมวดหมู่ใหม่'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingGroup(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-indigo-900 block mb-0.5">
                ชื่อกลุ่ม (เช่น คนมีชื่อเสียง, กีฬา, สัตว์):
              </label>
              <input
                type="text"
                value={groupFormName}
                onChange={(e) => setGroupFormName(e.target.value)}
                placeholder="ชื่อกลุ่ม..."
                autoFocus
                className="w-full bg-white border border-indigo-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-indigo-900 block mb-0.5">
                ไอคอนกลุ่ม (เลือก Emoji):
              </label>
              <div className="flex flex-wrap gap-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setGroupFormIcon(emoji)}
                    className={`w-7 h-7 rounded-md text-xs flex items-center justify-center transition-all ${
                      groupFormIcon === emoji
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-indigo-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-indigo-900 block mb-0.5">
                คำอธิบายสั้นๆ (ไม่บังคับ):
              </label>
              <input
                type="text"
                value={groupFormDesc}
                onChange={(e) => setGroupFormDesc(e.target.value)}
                placeholder="รายละเอียดกลุ่ม..."
                className="w-full bg-white border border-indigo-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="submit"
                disabled={!groupFormName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1 rounded-md font-semibold cursor-pointer"
              >
                บันทึกกลุ่ม
              </button>
              <button
                type="button"
                onClick={() => setIsEditingGroup(false)}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
              >
                ยกเลิก
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Group List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5">
        {categoryGroups.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center mb-3">
              <FolderPlus className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 mb-1">
              ยังไม่มีกลุ่มหมวดหมู่
            </p>
            <p className="text-[11px] text-slate-400 max-w-[210px] leading-relaxed">
              กรอกชื่อและเลือกไอคอนด้านบนเพื่อสร้างกลุ่มหมวดหมู่แรกของคุณ
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {categoryGroups.map((group) => {
              const isSelected = activeGroup?.id === group.id;
              const catCount = tags.filter((t) => {
                if (t.tier === 2) return false;
                if (t.groupId) return t.groupId === group.id;
                return t.groupType === group.id.replace('GRP-', '');
              }).length;

              return (
                <div
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-semibold'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {!group.icon || group.icon === '📁' ? (
                      <Folder className="w-4 h-4 shrink-0 opacity-80" />
                    ) : (
                      <span className="text-base shrink-0">{group.icon}</span>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs truncate flex items-center gap-1.5">
                        <span>{group.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {catCount} หมวด
                        </span>
                      </div>
                      {group.description && (
                        <p
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => onOpenEditGroup(group, e)}
                      className={`p-1 rounded-md transition-colors ${
                        isSelected
                          ? 'text-indigo-200 hover:text-white hover:bg-indigo-700'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                      }`}
                      title="แก้ไขกลุ่มนี้"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDeleteGroup(group.id);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        isSelected
                          ? 'text-indigo-200 hover:text-rose-200 hover:bg-rose-900/40'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title="ลบกลุ่มนี้"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-white translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
