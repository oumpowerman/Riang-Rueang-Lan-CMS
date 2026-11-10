import React, { useEffect } from 'react';
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
  heightClass = 'max-h-[92vh]',
  fullScreen = false,
  bodyClassName = 'p-5 sm:p-6 bg-[#FAF8F5]',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  children,
}) => {
  // 1. Scroll lock effect — depends ONLY on `isOpen` so re-renders with inline `onClose` never corrupt scroll state
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center overscroll-contain ${
            fullScreen ? 'p-0' : 'p-3 sm:p-5'
          }`}
          role="dialog"
          aria-modal="true"
        >
          {/* Motion Backdrop Layer (Separated from Layout Container) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-[#3A3026]/35 backdrop-blur-xs"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* Motion Dialog Surface */}
          <motion.div
            initial={{ opacity: 0, scale: fullScreen ? 0.99 : 0.96, y: fullScreen ? 0 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: fullScreen ? 0.99 : 0.96, y: fullScreen ? 0 : 10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 flex flex-col overflow-hidden bg-[#FFFFFF] border border-[#E8DFD3] shadow-xl ${
              fullScreen
                ? 'w-screen h-screen rounded-none'
                : `w-full ${maxWidthClass} ${heightClass} rounded-3xl`
            }`}
          >
            {/* Header Section (Light Pastel Earth-Tone) */}
            {(title || headerContent || headerRight) && (
              <header className="bg-[#FDFBF7] border-b border-[#E8DFD3] shrink-0">
                <div className="px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {icon && (
                      <div className="w-10 h-10 rounded-2xl bg-[#EEF5EE] border border-[#BAD8BF] flex items-center justify-center text-[#3B6845] shrink-0">
                        {icon}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {typeof title === 'string' ? (
                          <h2 className="text-base sm:text-lg font-extrabold text-[#3D332A] truncate">
                            {title}
                          </h2>
                        ) : (
                          title
                        )}
                        {badge}
                      </div>
                      {subtitle && (
                        <div className="text-xs text-[#7D6E61] mt-0.5 leading-relaxed">
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {headerRight}
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-8 h-8 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#7D6E61] hover:text-[#3D332A] border border-[#E2D5C4] flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="ปิดหน้าต่าง"
                      title="ปิดหน้าต่าง (Esc)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {headerContent && (
                  <div className="px-5 sm:px-6 pb-3 pt-0">{headerContent}</div>
                )}
              </header>
            )}

            {/* Body Content with Slim Scrollbar */}
            <div
              className={`flex-1 min-h-0 ${
                bodyClassName.includes('overflow-')
                  ? ''
                  : 'overflow-y-auto scrollbar-thin'
              } overscroll-contain ${bodyClassName}`}
            >
              {children}
            </div>

            {/* Optional Footer */}
            {footer && (
              <footer className="px-5 sm:px-6 py-3.5 bg-[#FDFBF7] border-t border-[#E8DFD3] shrink-0">
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
