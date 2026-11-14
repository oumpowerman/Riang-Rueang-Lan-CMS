import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { HardDrive, Clipboard, Check, X } from 'lucide-react';

interface QuickDriveLinkPopoverProps {
  footageId: string;
  footageTitle: string;
  currentUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newUrl: string) => void;
}

export const QuickDriveLinkPopover: React.FC<QuickDriveLinkPopoverProps> = ({
  footageId,
  footageTitle,
  currentUrl = '',
  isOpen,
  onClose,
  onSave,
}) => {
  const [url, setUrl] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(currentUrl);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(url.trim());
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-2xs">
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15 }}
          className="bg-white border border-[#E8DFD3] rounded-2xl shadow-xl p-4 w-full max-w-sm space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <HardDrive className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>เพิ่มลิงก์ Drive:</span>
                <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/80">
                  {footageId}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 truncate mt-0.5" title={footageTitle}>
                {footageTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="วางลิงก์ https://drive.google.com/file/d/..."
                className="w-full pl-3 pr-16 py-2 text-xs font-mono bg-stone-50 focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 text-stone-900 placeholder:text-stone-400"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-1.5 px-2 py-1 text-[11px] font-semibold text-stone-600 hover:text-indigo-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Clipboard className="w-3 h-3" />
                <span>วาง</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกลิงก์</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
