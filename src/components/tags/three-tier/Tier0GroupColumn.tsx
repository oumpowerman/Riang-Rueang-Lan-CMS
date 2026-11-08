import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Edit2, Trash2, ChevronRight, FolderPlus } from 'lucide-react';
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
    <div className="flex flex-col h-full min-h-0 bg-[#faf8f5] overflow-hidden">
      <div className="p-3 border-b border-[#e5ded4] flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-[#eedbc0] text-[#523715] text-[11px] font-bold flex items-center justify-center">
            1
          </span>
          <span className="text-xs font-bold text-[#3e3427]">มิติกลุ่มแท็ก (Dimensions)</span>
          <span className="text-[10px] font-mono bg-[#eee7dc] text-[#635749] px-1.5 py-0.2 rounded-full">
            {categoryGroups.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAddGroup}
          className="text-[11px] font-semibold text-[#614524] hover:text-[#3d2912] bg-[#f5ede0] hover:bg-[#ebdcc8] px-2 py-1 rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>เพิ่มมิติ</span>
        </button>
      </div>

      {/* Add / Edit Group Form Inline */}
      <AnimatePresence>
        {isEditingGroup && (
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
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2.5 space-y-1.5">
        {categoryGroups.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-11 h-11 rounded-2xl bg-[#f5ede0] border border-[#e8dbc6] text-[#8c673b] flex items-center justify-center mb-3">
              <FolderPlus className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#453728] mb-1">
              ยังไม่มีมิติกลุ่มแท็ก
            </p>
            <p className="text-[11px] text-[#7d7162] max-w-[210px] leading-relaxed">
              กรอกชื่อและเลือกไอคอนด้านบนเพื่อสร้างมิติกลุ่มแท็กแรกของคุณ
            </p>
          </div>
        ) : (
          categoryGroups.map((group) => {
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
                    ? 'bg-[#f0e4d2] text-[#3d2912] border-[#dcbe93] shadow-2xs font-semibold ring-1 ring-[#e5cdab]'
                    : 'bg-white hover:bg-[#faf7f2] border-[#e8e2d8] text-[#4d4133] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#e5d0b1] text-[#3f2a11]'
                        : 'bg-[#f5eee3] text-[#755938] border border-[#e6dbc9]'
                    }`}
                  >
                    <CategoryGroupIcon icon={group.icon} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs truncate flex items-center gap-1.5">
                      <span>{group.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-[#dfc5a0] text-[#3d2912]' : 'bg-[#eee7dc] text-[#695d4f]'
                        }`}
                      >
                        {catCount} แท็กหลัก
                      </span>
                    </div>
                    {group.description && (
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
                  <button
                    type="button"
                    onClick={(e) => onOpenEditGroup(group, e)}
                    className={`p-1 rounded-md transition-colors ${
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
                    className={`p-1 rounded-md transition-colors ${
                      isSelected
                        ? 'text-[#8a3c31] hover:text-[#612117] hover:bg-[#f8deda]'
                        : 'text-[#8c8072] hover:text-[#8a3c31] hover:bg-[#faeae8]'
                    }`}
                    title="ลบมิตินี้"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-[#5a3f1f] translate-x-0.5' : 'text-[#c7bdb0]'
                    }`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
