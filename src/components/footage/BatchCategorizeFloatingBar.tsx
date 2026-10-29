import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Tag, Trash2, X, AlertTriangle } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';

export const BatchCategorizeFloatingBar: React.FC = () => {
  const {
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
    setIsBatchAssignCategoryModalOpen,
    batchDeleteFootage,
  } = useCMS();

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
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 sm:gap-5 max-w-2xl w-[94%]"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>เลือกแล้ว {count} ฟุตเทจ</span>
              <span className="text-[10px] font-mono text-slate-400">
                (จากพื้นที่พัก / คลัง)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              พร้อมสำหรับการจัดหมวดหมู่แบบกลุ่มหรือจัดการรายการ
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
            <span>จัดหมวดหมู่พร้อมกัน</span>
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
      </motion.div>
    </AnimatePresence>
  );
};
