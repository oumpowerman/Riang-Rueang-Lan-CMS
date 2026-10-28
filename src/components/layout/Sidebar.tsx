import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Archive,
  ChevronRight,
  Cloud,
  Film,
  FolderTree,
  LayoutDashboard,
  ListOrdered,
  Lock,
  Palette,
  RefreshCw,
  Scissors,
  Settings2,
  ShieldCheck,
  Trash2,
  Tv,
} from 'lucide-react';
import { ActiveNavTab, useCMS } from '../../context/CMSContext';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR_SPRING = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 30,
  mass: 0.8,
};

const TEXT_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    computedFootage,
    sources,
    episodes,
    tags,
    settings,
    setIsTagManagerOpen,
    setIsThreeTierManagerOpen,
    setIsStatusRuleModalOpen,
    setIsClearClipsModalOpen,
    isCloudConnected,
    isSeedingToCloud,
    seedToCloud,
  } = useCMS();

  const { role, setIsAuthModalOpen } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const navItems: {
    id: ActiveNavTab;
    label: string;
    sublabel: string;
    count?: number;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'DASHBOARD',
      label: 'ภาพรวมช่อง',
      sublabel: 'Matrix & สต็อกฟุต',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'FOOTAGE_LIBRARY',
      label: 'คลังฟุตเทจ',
      sublabel: '1:1 & 1:N Vault',
      count: computedFootage.length,
      icon: <Film className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'SOURCE_SPLITTER',
      label: 'หั่นคลิปยาว',
      sublabel: '1:N Splitter',
      count: sources.length,
      icon: <Scissors className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'EPISODE_BUILDER',
      label: 'จัด 5 อันดับ',
      sublabel: 'Smart Mix 5→1',
      icon: <ListOrdered className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'MASTER_ARCHIVE',
      label: 'คลังคลิปหลัก',
      sublabel: 'สัดส่วนหมวด & ความคุ้มค่า',
      count: episodes.length,
      icon: <Archive className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{ width: isHovered ? 268 : 74 }}
      transition={SIDEBAR_SPRING}
      className="hidden md:flex h-screen sticky top-0 z-30 bg-white text-slate-700 flex-col justify-between shrink-0 border-r border-slate-200/90 shadow-xs select-none overflow-hidden"
    >
      <div className="p-3 space-y-4 overflow-y-auto no-scrollbar">
        {/* Studio Brand Identity (Fixed Height so items below never shift) */}
        <div className="h-13 flex items-center gap-3 px-1.5 border-b border-slate-100">
          <motion.div
            whileHover={{ rotate: -4, scale: 1.03 }}
            onClick={() => setActiveTab('DASHBOARD')}
            className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs cursor-pointer"
            title="กลับหน้าภาพรวม"
          >
            <Tv className="w-5 h-5" />
          </motion.div>

          <AnimatePresence initial={false}>
            {isHovered && (
              <motion.div
                key="brand-text"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: TEXT_EASE }}
                onClick={() => setActiveTab('DASHBOARD')}
                className="min-w-0 flex-1 overflow-hidden whitespace-nowrap cursor-pointer"
              >
                <div className="text-base font-bold text-slate-900 tracking-tight truncate">
                  เรียงเรื่องลั่น
                </div>
                <div className="text-xs text-slate-500 font-medium truncate">
                  Footage Utilization CMS
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Primary Navigation Links (Fixed row height h-[52px] to eliminate vertical jumping) */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ x: isHovered ? 2 : 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(item.id)}
                title={!isHovered ? item.label : undefined}
                className={`relative w-full h-[52px] flex items-center justify-between gap-2.5 px-2.5 rounded-xl text-left transition-colors cursor-pointer overflow-hidden ${
                  isActive
                    ? 'text-indigo-950 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layout
                    layoutId="sidebar-active-pill"
                    transition={SIDEBAR_SPRING}
                    className="absolute inset-0 bg-indigo-50/90 border border-indigo-200/80 rounded-xl"
                  />
                )}

                <div className="relative z-10 flex items-center gap-3 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'text-indigo-600 bg-indigo-100/70' : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>

                  <AnimatePresence initial={false}>
                    {isHovered && (
                      <motion.div
                        key="nav-label"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2, ease: TEXT_EASE }}
                        className="min-w-0 overflow-hidden whitespace-nowrap"
                      >
                        <div className="text-sm font-bold truncate leading-tight">
                          {item.label}
                        </div>
                        <div
                          className={`text-xs truncate leading-tight mt-0.5 ${
                            isActive ? 'text-indigo-700' : 'text-slate-500'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence initial={false}>
                  {isHovered && item.count !== undefined && (
                    <motion.span
                      key="nav-count"
                      initial={{ opacity: 0, scale: 0.8, x: 4 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 4 }}
                      transition={{ duration: 0.18, ease: TEXT_EASE }}
                      className={`relative z-10 text-xs font-mono tabular-nums px-2 py-0.5 rounded-md shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 font-semibold'
                      }`}
                    >
                      {item.count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Neutral System & Configuration Tools */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 space-y-1">
        {/* Fixed-height section header that crossfades between ChevronRight and Title */}
        <div className="h-6 flex items-center px-2.5 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {isHovered ? (
              <motion.div
                key="settings-header-expanded"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16, ease: TEXT_EASE }}
                className="text-xs font-bold text-slate-500 whitespace-nowrap"
              >
                ตั้งค่าและจัดการระบบ
              </motion.div>
            ) : (
              <motion.div
                key="settings-header-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="w-full flex justify-center text-slate-400"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 1. 3-Tier Category Manager */}
        <button
          type="button"
          onClick={() => setIsThreeTierManagerOpen(true)}
          title="จัดการหมวดหมู่ 3 ชั้น (กลุ่ม ➔ หมวดหลัก ➔ หมวดย่อย)"
          className="w-full h-9 flex items-center justify-between gap-2 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors overflow-hidden cursor-pointer"
        >
          <span className="inline-flex items-center gap-3 whitespace-nowrap min-w-0">
            <span className="w-6 flex items-center justify-center shrink-0">
              <FolderTree className="w-4 h-4 text-slate-500 shrink-0" />
            </span>
            <AnimatePresence initial={false}>
              {isHovered && (
                <motion.span
                  key="label-3tier"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18, ease: TEXT_EASE }}
                  className="truncate font-semibold"
                >
                  หมวดหมู่ 3 ชั้น
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <AnimatePresence initial={false}>
            {isHovered && (
              <motion.span
                key="badge-3tier"
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.18, ease: TEXT_EASE }}
                className="font-mono text-[10px] text-slate-400 shrink-0"
              >
                3-Tier
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* 2. Tag & Cooldown Velocity Manager */}
        <button
          type="button"
          onClick={() => setIsTagManagerOpen(true)}
          title="ตั้งค่าแท็ก & กฎพักฟุต"
          className="w-full h-9 flex items-center justify-between gap-2 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors overflow-hidden cursor-pointer"
        >
          <span className="inline-flex items-center gap-3 whitespace-nowrap min-w-0">
            <span className="w-6 flex items-center justify-center shrink-0">
              <Settings2 className="w-4 h-4 text-slate-500 shrink-0" />
            </span>
            <AnimatePresence initial={false}>
              {isHovered && (
                <motion.span
                  key="label-tags"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18, ease: TEXT_EASE }}
                  className="truncate font-semibold"
                >
                  แท็ก & กฎพักฟุต
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <AnimatePresence initial={false}>
            {isHovered && (
              <motion.span
                key="badge-tags"
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.18, ease: TEXT_EASE }}
                className="font-mono tabular-nums text-[10px] text-slate-500 font-semibold shrink-0"
              >
                {tags.length} หมวด
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* 3. Status Color Rules */}
        <button
          type="button"
          onClick={() => setIsStatusRuleModalOpen(true)}
          title="ตั้งค่าเกณฑ์สีสถานะ (จำนวนวันพัก & จำนวนครั้งที่ใช้ซ้ำ)"
          className="w-full h-9 flex items-center justify-between gap-2 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors overflow-hidden cursor-pointer"
        >
          <span className="inline-flex items-center gap-3 whitespace-nowrap min-w-0">
            <span className="w-6 flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 text-slate-500 shrink-0" />
            </span>
            <AnimatePresence initial={false}>
              {isHovered && (
                <motion.span
                  key="label-rules"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18, ease: TEXT_EASE }}
                  className="truncate font-semibold"
                >
                  เกณฑ์สีสถานะ
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <AnimatePresence initial={false}>
            {isHovered && (
              <motion.span
                key="badge-rules"
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.18, ease: TEXT_EASE }}
                className="font-mono tabular-nums text-[10px] text-slate-500 shrink-0"
              >
                ≥{settings.greenReadyDays ?? 21}ว.
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* 4. Cloud / Firestore Sync */}
        <button
          type="button"
          onClick={seedToCloud}
          disabled={isSeedingToCloud}
          title="ซิงก์ข้อมูลกับ Firestore Cloud"
          className="w-full h-9 flex items-center justify-between gap-2 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors overflow-hidden cursor-pointer disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-3 whitespace-nowrap min-w-0">
            <span className="w-6 flex items-center justify-center shrink-0">
              {isSeedingToCloud ? (
                <RefreshCw className="w-4 h-4 text-slate-500 animate-spin shrink-0" />
              ) : (
                <Cloud className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </span>
            <AnimatePresence initial={false}>
              {isHovered && (
                <motion.span
                  key="label-cloud"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18, ease: TEXT_EASE }}
                  className="truncate font-semibold"
                >
                  {isSeedingToCloud ? 'กำลังซิงก์ข้อมูล...' : 'ซิงก์ข้อมูล Cloud'}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <AnimatePresence initial={false}>
            {isHovered && (
              <motion.span
                key="badge-cloud"
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.18, ease: TEXT_EASE }}
                className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-500 shrink-0"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCloudConnected ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                {isCloudConnected ? 'Online' : 'Local'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* 5. Clear All Clips */}
        <button
          type="button"
          onClick={() => setIsClearClipsModalOpen(true)}
          title="ล้างคลังคลิปทั้งหมด (เก็บหมวดหมู่ 3 ชั้นและการตั้งค่าไว้)"
          className="w-full h-9 flex items-center justify-between gap-2 px-3 text-xs font-medium text-slate-600 hover:bg-rose-50/70 hover:text-rose-700 rounded-xl transition-colors overflow-hidden cursor-pointer group"
        >
          <span className="inline-flex items-center gap-3 whitespace-nowrap min-w-0">
            <span className="w-6 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-600 shrink-0 transition-colors" />
            </span>
            <AnimatePresence initial={false}>
              {isHovered && (
                <motion.span
                  key="label-clear"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18, ease: TEXT_EASE }}
                  className="truncate font-semibold"
                >
                  ล้างคลังคลิป
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </button>

        {/* 6. User Role & Auth Switcher */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          title="จัดการบัญชีผู้ใช้งาน และสลับสิทธิ์ Admin / Editor"
          className="w-full h-9 flex items-center justify-between gap-2 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors overflow-hidden cursor-pointer"
        >
          <span className="inline-flex items-center gap-3 whitespace-nowrap min-w-0">
            <span className="w-6 flex items-center justify-center shrink-0">
              {role === 'ADMIN' ? (
                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </span>
            <AnimatePresence initial={false}>
              {isHovered && (
                <motion.span
                  key="label-role"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18, ease: TEXT_EASE }}
                  className="truncate font-semibold"
                >
                  สิทธิ์ผู้ใช้งาน
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <AnimatePresence initial={false}>
            {isHovered && (
              <motion.span
                key="badge-role"
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.18, ease: TEXT_EASE }}
                className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-bold shrink-0"
              >
                {role === 'ADMIN' ? 'Admin' : 'Editor'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};
