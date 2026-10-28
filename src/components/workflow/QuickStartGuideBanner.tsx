import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Film,
  Lightbulb,
  Package,
  Plus,
  Scissors,
  Sparkles,
  Trophy,
  Video,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';

export const QuickStartGuideBanner: React.FC = () => {
  const {
    setActiveTab,
    setIsDirectFootageModalOpen,
    openSourceSplitterFor,
  } = useCMS();

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      className="bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-emerald-50/70 text-slate-900 rounded-2xl border border-indigo-200/80 shadow-2xs overflow-hidden"
    >
      {/* Top Bar of the Guide */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/60 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Compass className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              คู่มือลัด 4 ขั้นตอน: 1. เติมฟุต → 2. เช็กความสด → 3. จัด 5 อันดับ → 4. ดูภาพรวมความคุ้มค่า
            </h2>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-xl shrink-0 shadow-2xs"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>{isExpanded ? 'พับเก็บ' : 'ดูวิธีใช้'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </motion.button>
      </div>

      {/* 4 Compact Step Cards */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-indigo-100/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {/* Step 1 */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono font-bold text-indigo-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 text-[10px] flex items-center justify-center font-bold">1</span>
                      <span>เติมวัตถุดิบ (FT-XXXX)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>คลิปสั้น:</strong> กด <em>&ldquo;+ ฟุตเดี่ยว 1:1&rdquo;</em>
                      <br />
                      <strong>ไลฟ์สด/คลิปยาว:</strong> กด <em>&ldquo;หั่นไลฟ์ 1:N&rdquo;</em>
                    </p>
                  </div>
                  <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsDirectFootageModalOpen(true)}
                      className="flex-1 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <Video className="w-3 h-3 text-indigo-600" />
                      <span>1:1 เดี่ยว</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openSourceSplitterFor(null)}
                      className="flex-1 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>1:N หั่นไลฟ์</span>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono font-bold text-sky-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 text-[10px] flex items-center justify-center font-bold">2</span>
                      <span>ดูสีความสด (Time-Decay)</span>
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-sky-600 shrink-0" />
                        <span><strong>ใหม่:</strong> หยิบใช้ได้ทันที</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span><strong>พร้อมใช้:</strong> พักเกิน 14 วัน วนใช้ได้</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-rose-600 shrink-0" />
                        <span><strong>รอพัก:</strong> เพิ่งใช้ใน 14 วัน ห้ามซ้ำ</span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('FOOTAGE_LIBRARY')}
                    className="w-full py-1.5 text-xs font-bold bg-sky-50 text-sky-900 border border-sky-200 rounded-lg hover:bg-sky-100 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Film className="w-3.5 h-3.5 text-sky-600" />
                    <span>เปิดคลังฟุตเทจ →</span>
                  </motion.button>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">3</span>
                      <span>ผสมชุด 5 อันดับ (5→1)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      กดปุ่ม <strong>&ldquo;สูตร 2 ใหม่ + 3 เก่า&rdquo;</strong> ระบบสุ่มจัด 5 อันดับที่ไม่เคยเจอกันให้ทันที
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('EPISODE_BUILDER')}
                    className="w-full py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>ไปหน้าจัด 5 อันดับ →</span>
                  </motion.button>
                </motion.div>

                {/* Step 4 */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono font-bold text-indigo-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 text-[10px] flex items-center justify-center font-bold">4</span>
                      <span>ดูภาพรวมคลังคลิปหลัก</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      เปรียบเทียบสัดส่วนหมวดหมู่จากมากไปน้อย และเช็กความคุ้มค่าการใช้ฟุตเทจ
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('MASTER_ARCHIVE')}
                    className="w-full py-1.5 text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                    <span>เปิดคลังคลิปหลัก →</span>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
