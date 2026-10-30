import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-3xl',
  headerContent,
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Comprehensive Scroll Lock: prevent scrolling the background page and the <main> viewport
    let originalMainOverflow = '';
    const mainEl = document.querySelector('main');
    let originalBodyOverflow = '';

    if (isOpen) {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      if (mainEl) {
        originalMainOverflow = mainEl.style.overflow;
        mainEl.style.overflow = 'hidden';
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (isOpen) {
        document.body.style.overflow = originalBodyOverflow;
        if (mainEl) {
          mainEl.style.overflow = originalMainOverflow;
        }
      }
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain"
          onClick={onClose}
          onWheel={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white border border-stone-200 rounded-2xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col overflow-hidden shadow-2xl`}
            role="dialog"
            aria-modal="true"
          >
            {/* Pinned Top Header with Optional Sub-Header Content */}
            <div className="border-b border-stone-200/80 bg-[#FAF7F2]/95 shrink-0">
              <div className="flex items-start justify-between gap-4 px-6 pt-4 pb-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900">{title}</h2>
                  {subtitle && <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{subtitle}</p>}
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08, rotate: 90 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer shrink-0"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {headerContent && (
                <div className="px-6 pb-3 pt-0">{headerContent}</div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-6">{children}</div>

            {footer && (
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
