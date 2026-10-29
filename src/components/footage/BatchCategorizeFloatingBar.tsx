import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckSquare,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { isStagingTagId } from '../../services/seedData';
import { getEntityIconNode } from '../ui/TagPill';

export const BatchCategorizeFloatingBar: React.FC = () => {
  const {
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
    setIsBatchAssignCategoryModalOpen,
    batchDeleteFootage,
    tags,
    tagMap,
    quickAssignCategoryToFootage,
  } = useCMS();

  // Real categories for 1-click quick assignment on the floating bar
  const quickCategories = useMemo(() => {
    const realTags = tags.filter((t) => !isStagingTagId(t.id));
    const subTags = realTags.filter((t) => Boolean(t.parentId));
    const mainTags = realTags.filter((t) => !t.parentId);
    // Prioritize subcategories + main categories up to 10 quick chips
    return [...mainTags, ...subTags].slice(0, 12);
  }, [tags]);

  if (selectedFootageIdsForBatch.length === 0) return null;

  const count = selectedFootageIdsForBatch.length;

  const handleOpenBatchAssignModal = () => {
    setIsBatchAssignCategoryModalOpen(true);
  };

  const handleBatchDelete = () => {
    if (
      window.confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบฟุตเทจที่เลือกทั้ง ${count} รายการออกจากระบบ?`
      )
    ) {
      batchDeleteFootage(selectedFootageIdsForBatch);
      setSelectedFootageIdsForBatch([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedFootageIdsForBatch([]);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white backdrop-blur-md px-4 sm:px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col gap-2.5 max-w-3xl w-[94%]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>เลือกแล้ว {count} ฟุตเทจ</span>
                <span className="text-[10px] font-mono text-slate-400">
                  (พร้อมย้ายเข้าหมวดหมู่ทันที)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                คลิกปุ่มหมวดหมู่ด่วนด้านล่างเพื่อย้ายใน 1 คลิก หรือลากการ์ดไปวางบนแผงหมวดหมู่ด้านบน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenBatchAssignModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Tag className="w-3.5 h-3.5 text-amber-300" />
              <span>เลือกหมวดหมู่แบบละเอียด</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="ลบรายการที่เลือก"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="ยกเลิกการเลือก"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1-Click Quick Category Strip */}
        {quickCategories.length > 0 && (
          <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 shrink-0 mr-1">
              <Sparkles className="w-3 h-3" />
              <span>ย้ายด่วน 1 คลิก:</span>
            </span>
            {quickCategories.map((cat) => {
              const parent = cat.parentId ? tagMap[cat.parentId] : null;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    quickAssignCategoryToFootage(selectedFootageIdsForBatch, cat.id)
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-emerald-400 text-[11px] font-bold transition-all shrink-0 cursor-pointer"
                  title={
                    parent
                      ? `ย้าย ${count} คลิปเข้า #${parent.name} ➔ ${cat.name}`
                      : `ย้าย ${count} คลิปเข้า #${cat.name}`
                  }
                >
                  {getEntityIconNode(cat)}
                  {parent && (
                    <span className="opacity-70 font-normal">
                      {parent.name} &rsaquo;
                    </span>
                  )}
                  <span>#{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
