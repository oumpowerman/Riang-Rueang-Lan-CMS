import React from 'react';
import { FileText, FolderTree } from 'lucide-react';
import { DriveClipIdPrefix, DriveImportMode } from './driveImport.types';

interface DriveImportModeBarProps {
  activeImportMode: DriveImportMode;
  onModeChange: (mode: DriveImportMode) => void;
  idPrefix: DriveClipIdPrefix;
  onIdPrefixChange: (prefix: DriveClipIdPrefix) => void;
}

export const DriveImportModeBar: React.FC<DriveImportModeBarProps> = ({
  activeImportMode,
  onModeChange,
  idPrefix,
  onIdPrefixChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => onModeChange('RECURSIVE')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeImportMode === 'RECURSIVE'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
          <span>สแกนโฟลเดอร์อัตโนมัติ (Recursive)</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('PASTE')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeImportMode === 'PASTE'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-sky-600" />
          <span>วางข้อความรายชื่อ (Manual Paste)</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <span>รหัสคลิป:</span>
          <select
            value={idPrefix}
            onChange={(e) => onIdPrefixChange(e.target.value as DriveClipIdPrefix)}
            className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-900 cursor-pointer focus:outline-none"
          >
            <option value="CLP">CLP-xxx (แนะนำ)</option>
            <option value="FT">FT-xxxx</option>
          </select>
        </div>
      </div>
    </div>
  );
};
