import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerRight?: React.ReactNode;
  headerContent?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  heightClass?: string;
  fullScreen?: boolean;
  bodyClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  children: React.ReactNode;
}

let activeOpenModalsCount = 0;

const syncGlobalScrollLock = () => {
  if (typeof document === 'undefined') return;
  const mainEl = document.querySelector('main');
  if (activeOpenModalsCount > 0) {
    document.body.style.overflow = 'hidden';
    if (mainEl) {
      mainEl.style.overflow = 'hidden';
    }
  } else {
    document.body.style.overflow = '';
    if (mainEl) {
      mainEl.style.overflow = '';
    }
  }
};

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  headerRight,
  headerContent,
  footer,
  maxWidthClass = 'max-w-4xl',
  heightClass = 'max-h-[90dvh] sm:max-h-[85dvh]',
  fullScreen = false,
  bodyClassName = 'p-3.5 sm:p-5 bg-[#FAF8F5]',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  children,
}) => {
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 639px)');
    const handleChange = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    setIsMobileViewport(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  // 1. Scroll lock effect — depends ONLY on `isOpen`
  useEffect(() => {
    if (!isOpen) {
      syncGlobalScrollLock();
      return;
    }

    activeOpenModalsCount += 1;
    syncGlobalScrollLock();

    return () => {
      activeOpenModalsCount = Math.max(0, activeOpenModalsCount - 1);
      syncGlobalScrollLock();
    };
  }, [isOpen]);

  // 2. Escape key listener effect
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEsc]);

  if (typeof document === 'undefined') return null;

  const isBottomSheet = isMobileViewport && !fullScreen;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex overscroll-contain ${
            fullScreen
              ? 'items-center justify-center p-0'
              : 'items-end sm:items-center justify-center p-0 sm:p-4'
          }`}
          role="dialog"
          aria-modal="true"
        >
          {/* Motion Backdrop Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-[#3A3026]/40 backdrop-blur-xs"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* Motion Dialog Surface: Slide-Up Bottom Sheet on Mobile (<640px), Centered Fade on Desktop (>=640px) */}
          <motion.div
            initial={
              isBottomSheet
                ? { y: '100%' }
                : { opacity: 0, scale: fullScreen ? 1 : 0.98 }
            }
            animate={
              isBottomSheet
                ? { y: 0 }
                : { opacity: 1, scale: 1 }
            }
            exit={
              isBottomSheet
                ? { y: '100%' }
                : { opacity: 0, scale: fullScreen ? 1 : 0.98 }
            }
            transition={
              isBottomSheet
                ? { type: 'spring', stiffness: 420, damping: 36 }
                : { duration: 0.16, ease: [0.16, 1, 0.3, 1] }
            }
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 flex flex-col overflow-hidden bg-[#FFFFFF] border border-[#E8DFD3] shadow-xl ${
              fullScreen
                ? 'w-screen h-dvh rounded-none'
                : `w-full ${maxWidthClass} ${heightClass} rounded-t-2xl sm:rounded-2xl`
            }`}
          >
            {/* Mobile Bottom Sheet Top Drag Pill Indicator */}
            {isBottomSheet && (
              <div className="pt-1.5 pb-0.5 flex justify-center bg-[#FDFBF7] shrink-0 sm:hidden">
                <div className="w-9 h-1 rounded-full bg-[#D8CCBC]" />
              </div>
            )}

            {/* Slim Compact Header Section (Pinned shrink-0) */}
            {(title || headerContent || headerRight) && (
              <header className="bg-[#FDFBF7] border-b border-[#E8DFD3] shrink-0">
                <div className="px-3.5 sm:px-4 py-2 flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {icon && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EEF5EE] border border-[#BAD8BF] flex items-center justify-center text-[#3B6845] shrink-0">
                        {icon}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {typeof title === 'string' ? (
                          <h2 className="text-sm sm:text-base font-extrabold text-[#3D332A] truncate">
                            {title}
                          </h2>
                        ) : (
                          title
                        )}
                        {badge && <div className="shrink-0 flex items-center">{badge}</div>}
                      </div>
                      {subtitle && (
                        <div className="text-[11px] text-[#7D6E61] truncate leading-tight mt-0.5">
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {headerRight}
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#7D6E61] hover:text-[#3D332A] border border-[#E2D5C4] flex items-center justify-center cursor-pointer shrink-0"
                      aria-label="ปิดหน้าต่าง"
                      title="ปิดหน้าต่าง (Esc)"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {headerContent && (
                  <div className="px-3.5 sm:px-4 pb-2 pt-0">{headerContent}</div>
                )}
              </header>
            )}

            {/* Scrollable Body Content with Ultra-Slim Scrollbar */}
            <div
              className={`flex-1 min-h-0 ${
                bodyClassName.includes('overflow-')
                  ? ''
                  : 'overflow-y-auto overflow-x-hidden scrollbar-thin'
              } overscroll-contain ${bodyClassName}`}
            >
              {children}
            </div>

            {/* Slim Single-Row Pinned Footer */}
            {footer && (
              <footer className="px-3.5 sm:px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-[#FDFBF7] border-t border-[#E8DFD3] shrink-0">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
