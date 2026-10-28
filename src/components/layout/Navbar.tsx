import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Scissors,
  ChevronDown,
  Menu,
  Zap,
  LayoutDashboard,
  Film,
  ListOrdered,
  Archive,
  Clapperboard,
  type LucideIcon,
} from 'lucide-react';
import { ActiveNavTab, useCMS } from '../../context/CMSContext';

const TAB_LABELS: Record<ActiveNavTab, { icon: LucideIcon; title: string; subtitle: string }> = {
  DASHBOARD: { icon: LayoutDashboard, title: 'ภาพรวมระบบ', subtitle: 'สถิติภาพรวม & KPIs ช่อง' },
  E2E_PIPELINE: { icon: Zap, title: 'สายพานผลิต E2E', subtitle: 'Pipeline ควบคุมการผลิต' },
  FOOTAGE_LIBRARY: { icon: Film, title: 'คลังฟุตเทจ', subtitle: 'Footage Vault (1:1 & 1:N)' },
  SOURCE_SPLITTER: { icon: Scissors, title: 'คลังไลฟ์ / คลิปยาว', subtitle: 'Live Source & Video Clipper' },
  EPISODE_BUILDER: { icon: ListOrdered, title: 'จัดคลิป 5 อันดับ', subtitle: 'Episode Builder & Cooldown' },
  MASTER_ARCHIVE: { icon: Archive, title: 'คลังคลิปหลัก Master', subtitle: 'ภาพรวมสัดส่วนหมวดหมู่ & ความคุ้มค่าฟุตเทจ' },
};

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const {
    activeTab,
    setIsDirectFootageModalOpen,
    openSourceSplitterFor,
    setIsStatusRuleModalOpen,
    computedFootage,
  } = useCMS();

  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const importMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
        setIsImportMenuOpen(false);
      }
    };
    if (isImportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isImportMenuOpen]);

  const readyTotal = computedFootage.filter(
    (f) => f.cooldownStatus === 'NEW_UNTOUCHED' || f.cooldownStatus === 'READY_FRESH'
  ).length;

  const currentTab = TAB_LABELS[activeTab] || {
    icon: Clapperboard,
    title: 'ห้องทำงาน',
    subtitle: 'ระบบจัดการคอนเทนต์',
  };
  const CurrentIcon = currentTab.icon;

  return (
    <header className="sticky top-0 z-20 w-full max-w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
      {/* MOBILE HEADER (< md): Menu Trigger + Current Page Title + Ready Count + Import Action */}
      <div className="flex md:hidden items-center justify-between w-full gap-2">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="เปิดเมนูหลักและเครื่องมือจัดการ"
          className="min-w-[40px] min-h-[40px] -ml-1 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 flex items-center justify-center gap-1.5 px-2.5 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-4 h-4" />
          <span className="text-xs font-bold">เมนู</span>
        </button>

        <div className="flex items-center gap-2 min-w-0 flex-1 px-1">
          <CurrentIcon className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-sm font-bold text-slate-900 truncate">
            {currentTab.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsStatusRuleModalOpen(true)}
            className="text-[11px] font-mono tabular-nums px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 font-semibold cursor-pointer"
            title="จำนวนฟุตเทจพร้อมใช้ (คลิกเพื่อดูเกณฑ์สีสถานะ)"
          >
            พร้อมใช้ <span className="font-bold text-slate-900">{readyTotal}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDirectFootageModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
            title="นำเข้าฟุตเทจ"
          >
            <Plus className="w-3.5 h-3.5 text-white shrink-0" />
            <span>นำเข้า</span>
          </button>
        </div>
      </div>

      {/* DESKTOP & LAPTOP HEADER (md+): Focused 2-Zone Layout */}
      {/* Left Zone: Current Page Context */}
      <div className="hidden md:flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
          <CurrentIcon className="w-4 h-4" />
        </div>
        <div className="flex items-baseline gap-2.5 min-w-0 overflow-hidden">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {currentTab.title}
          </h1>
          <span className="text-slate-300 select-none hidden sm:inline">/</span>
          <span className="hidden sm:inline text-sm text-slate-500 font-medium truncate">
            {currentTab.subtitle}
          </span>
        </div>
      </div>

      {/* Right Zone: Subtle Ready Footage Counter + Dominant Primary Import CTA */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        {/* Neutral Ready Footage Counter */}
        <button
          type="button"
          onClick={() => setIsStatusRuleModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 text-sm font-medium transition-colors cursor-pointer"
          title="จำนวนฟุตเทจพร้อมใช้งาน (คลิกเพื่อดูหรือตั้งค่าเกณฑ์สีสถานะ)"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span>ฟุตพร้อมใช้</span>
          <span className="font-mono tabular-nums font-bold text-slate-900">
            {readyTotal}
          </span>
          <span className="text-slate-500 text-xs">ฟุต</span>
        </button>

        {/* Primary Focal Point: "+ นำเข้าฟุตเทจ" Dropdown Action */}
        <div className="relative" ref={importMenuRef}>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsImportMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            title="เพิ่มฟุตเทจเข้าคลัง (คลิกเพื่อเลือกหั่นคลิปยาว หรือเพิ่มฟุตเดี่ยว)"
          >
            <Plus className="w-4 h-4 text-white shrink-0" />
            <span className="tracking-tight">นำเข้าฟุตเทจ</span>
            <ChevronDown
              className={`w-4 h-4 text-indigo-100 transition-transform duration-200 ${
                isImportMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </motion.button>

          {/* Dropdown Menu Modal */}
          <AnimatePresence>
            {isImportMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 overflow-hidden"
              >
                <div className="px-4 py-1.5 text-xs font-bold text-slate-400">
                  เลือกรูปแบบการนำเข้า
                </div>

                {/* Option 1: Live Splitter 1:N */}
                <button
                  type="button"
                  onClick={() => {
                    setIsImportMenuOpen(false);
                    openSourceSplitterFor(null);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        หั่นจากไลฟ์ / คลิปยาว
                      </span>
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                        1:N
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      นำเข้าคลิปยาว คัดช่วงเวลา และแตกเป็นฟุตเทจย่อยหลายชิ้น
                    </p>
                  </div>
                </button>

                <div className="h-px bg-slate-100 my-1 mx-3" />

                {/* Option 2: Direct Footage 1:1 */}
                <button
                  type="button"
                  onClick={() => {
                    setIsImportMenuOpen(false);
                    setIsDirectFootageModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        เพิ่มฟุตเดี่ยวพร้อมใช้
                      </span>
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                        1:1
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      บันทึกฟุตเทจเดี่ยว 1 ชิ้นพร้อมลิงก์ Google Drive เข้าคลังทันที
                    </p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
