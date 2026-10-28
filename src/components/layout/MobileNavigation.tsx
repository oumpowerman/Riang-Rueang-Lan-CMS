import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Archive,
  Cloud,
  Film,
  LayoutDashboard,
  ListOrdered,
  Palette,
  RefreshCw,
  Scissors,
  Settings2,
  ShieldCheck,
  Tv,
  X,
  Zap,
  FolderTree,
  Trash2,
} from 'lucide-react';
import { ActiveNavTab, useCMS } from '../../context/CMSContext';
import { useAuth } from '../../context/AuthContext';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeTab,
    setActiveTab,
    computedFootage,
    sources,
    episodes,
    tags,
    settings,
    setIsDirectFootageModalOpen,
    openSourceSplitterFor,
    setIsTagManagerOpen,
    setIsThreeTierManagerOpen,
    setIsStatusRuleModalOpen,
    setIsClearClipsModalOpen,
    isCloudConnected,
    isSeedingToCloud,
    seedToCloud,
  } = useCMS();

  const { role, setIsAuthModalOpen } = useAuth();

  const readyTotal = computedFootage.filter(
    (f) => f.cooldownStatus === 'NEW_UNTOUCHED' || f.cooldownStatus === 'READY_FRESH'
  ).length;

  const navItems: {
    id: ActiveNavTab;
    label: string;
    shortLabel: string;
    sublabel: string;
    count?: number;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'DASHBOARD',
      label: 'ภาพรวมช่อง',
      shortLabel: 'ภาพรวม',
      sublabel: 'Matrix & สต็อกฟุต',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'FOOTAGE_LIBRARY',
      label: 'คลังฟุตเทจ',
      shortLabel: 'ฟุตเทจ',
      sublabel: '1:1 & 1:N Vault',
      count: computedFootage.length,
      icon: <Film className="w-5 h-5" />,
    },
    {
      id: 'SOURCE_SPLITTER',
      label: 'หั่นคลิปยาว',
      shortLabel: 'หั่นคลิป',
      sublabel: '1:N Splitter',
      count: sources.length,
      icon: <Scissors className="w-5 h-5" />,
    },
    {
      id: 'EPISODE_BUILDER',
      label: 'จัด 5 อันดับ',
      shortLabel: 'จัดอันดับ',
      sublabel: 'Smart Mix 5→1',
      icon: <ListOrdered className="w-5 h-5" />,
    },
    {
      id: 'MASTER_ARCHIVE',
      label: 'คลังคลิปหลัก',
      shortLabel: 'คลังหลัก',
      sublabel: 'สัดส่วนหมวด & ความคุ้มค่า',
      count: episodes.length,
      icon: <Archive className="w-5 h-5" />,
    },
  ];

  const handleSelectTab = (tabId: ActiveNavTab) => {
    setActiveTab(tabId);
    onClose();
  };

  return (
    <>
      {/* 1. Slide-Out Hamburger Drawer (Mobile Only: md:hidden) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs"
            />

            {/* Slide-Out Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="relative z-10 w-[86vw] max-w-[330px] h-full bg-white text-slate-800 shadow-2xl border-r border-slate-200 flex flex-col justify-between overflow-y-auto"
            >
              <div className="p-4 space-y-5">
                {/* Drawer Header: Brand + Ready Status + Close Button */}
                <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
                        เรียงเรื่องลั่น
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold truncate">
                        พร้อมใช้งานทันที {readyTotal} ฟุตเทจ
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="ปิดเมนูมือถือ"
                    className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Section 1: Quick Footage Import Actions */}
                <div className="space-y-2">
                  <div className="px-1 text-xs font-bold text-slate-500">
                    นำเข้าฟุตเทจเข้าคลัง
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        openSourceSplitterFor(null);
                      }}
                      className="flex flex-col items-start gap-1.5 p-3 rounded-2xl bg-indigo-50/90 hover:bg-indigo-100/80 border border-indigo-200/80 text-left transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-indigo-950">
                          หั่นคลิปยาว 1:N
                        </div>
                        <div className="text-[10px] text-indigo-700/80 leading-tight mt-0.5">
                          แตกคลิปไลฟ์เป็นฟุตย่อย
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setIsDirectFootageModalOpen(true);
                      }}
                      className="flex flex-col items-start gap-1.5 p-3 rounded-2xl bg-amber-50/90 hover:bg-amber-100/80 border border-amber-200/80 text-left transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950">
                          เพิ่มฟุตเดี่ยว 1:1
                        </div>
                        <div className="text-[10px] text-amber-800/80 leading-tight mt-0.5">
                          บันทึกฟุตพร้อมใช้ทันที
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section 2: Main Navigation Pages */}
                <div className="space-y-1.5">
                  <div className="px-1 text-xs font-bold text-slate-500">
                    เมนูหน้าหลัก (5 ส่วนงาน)
                  </div>
                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full min-h-[48px] flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-indigo-50 border border-indigo-200/90 text-indigo-950 font-bold'
                              : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                            }`} aria-hidden="true">
                              {item.icon}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">
                                {item.label}
                              </div>
                              <div
                                className={`text-[11px] truncate ${
                                  isActive ? 'text-indigo-700' : 'text-slate-400'
                                }`}
                              >
                                {item.sublabel}
                              </div>
                            </div>
                          </div>

                          {item.count !== undefined && (
                            <span
                              className={`text-xs font-mono tabular-nums px-2 py-0.5 rounded-lg shrink-0 ${
                                isActive
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Section 3: System Settings & Cloud Tools (Hidden from Mobile Top Bar) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="px-1 text-xs font-bold text-slate-500">
                    ตั้งค่าระบบและเครื่องมือจัดการ
                  </div>

                  {/* Color Threshold Rules */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsStatusRuleModalOpen(true);
                    }}
                    className="w-full min-h-[46px] flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200/80 text-sky-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Palette className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="truncate">ตั้งค่าเกณฑ์สี ฟ้า·เขียว·เหลือง·แดง</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-sky-700 shrink-0">
                      ≥{settings.greenReadyDays ?? 21}ว.
                    </span>
                  </button>

                  {/* 3-Tier Category Studio */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsThreeTierManagerOpen(true);
                    }}
                    className="w-full min-h-[46px] flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/80 text-indigo-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <FolderTree className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">จัดการหมวดหมู่ 3 ชั้น (กลุ่ม ➔ หลัก ➔ ย่อย)</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-indigo-700 shrink-0">
                      3 ชั้น
                    </span>
                  </button>

                  {/* Category & Cooldown Tag Manager */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsTagManagerOpen(true);
                    }}
                    className="w-full min-h-[46px] flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-violet-50/80 hover:bg-violet-100/80 border border-violet-200/80 text-violet-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Settings2 className="w-4 h-4 text-violet-600 shrink-0" />
                      <span className="truncate">จัดการหมวดหมู่ & กฎพักฟุต</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-violet-700 shrink-0">
                      {tags.length} หมวด
                    </span>
                  </button>

                  {/* Clear All Clips Action */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsClearClipsModalOpen(true);
                    }}
                    className="w-full min-h-[46px] flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/80 text-rose-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="truncate">ล้างคลังคลิปทั้งหมด (เก็บหมวดหมู่ไว้)</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-rose-700 shrink-0">
                      {sources.length + computedFootage.length + episodes.length} รายการ
                    </span>
                  </button>

                  {/* Cloud Sync & User Role Row */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        seedToCloud();
                      }}
                      disabled={isSeedingToCloud}
                      className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        isSeedingToCloud
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : isCloudConnected
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSeedingToCloud ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700 shrink-0" />
                          <span className="truncate">กำลังซิงก์...</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">ซิงก์ข้อมูล</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setIsAuthModalOpen(true);
                      }}
                      className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        role === 'ADMIN'
                          ? 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
                          : 'bg-sky-50 text-sky-950 border-sky-200 hover:bg-sky-100'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        สิทธิ์: {role === 'ADMIN' ? 'Admin' : 'Editor'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Fixed Bottom Navigation Bar for 5 Core Tabs (Mobile Only: md:hidden) */}
      <nav
        aria-label="แถบเมนูหลักด้านล่างสำหรับมือถือ"
        className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1.5 py-1 shadow-lg"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative min-h-[50px] flex flex-col items-center justify-center rounded-xl py-1 px-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-indigo-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-bottom-nav-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 bg-indigo-50/90 border border-indigo-200/80 rounded-xl"
                  />
                )}

                <div className="relative z-10 flex items-center justify-center">
                  <span className={`flex items-center justify-center ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.count !== undefined && (
                    <span
                      className={`ml-0.5 text-[9px] font-mono tabular-nums px-1 rounded-md ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </div>

                <span className="relative z-10 text-[10px] tracking-tight mt-1 truncate max-w-full">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
