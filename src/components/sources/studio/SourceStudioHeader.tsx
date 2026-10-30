import React from 'react';
import { Sparkles } from 'lucide-react';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';

interface SourceStudioHeaderProps {
  onOpenDrive1ToN: () => void;
  onOpenSourceSplitter?: () => void;
}

export const SourceStudioHeader: React.FC<SourceStudioHeaderProps> = ({
  onOpenDrive1ToN,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/60 border border-indigo-200/70 rounded-2xl px-4 py-3 shadow-2xs">
      <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
        <span className="w-7 h-7 rounded-xl bg-indigo-100/90 text-indigo-700 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span>จัดการไลฟ์ต้นฉบับ & หั่นคลิปย่อย (1:N)</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenDrive1ToN}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-indigo-50/60 border border-indigo-200/90 rounded-xl shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
        >
          <GoogleDriveIcon className="w-4 h-4 shrink-0" />
          <span>ดึงไลฟ์จากไดร์ฟ</span>
        </button>
      </div>
    </div>
  );
};
