import React from 'react';
import { Inbox, RefreshCw, Sparkles, Upload } from 'lucide-react';
import { RecursiveScanResult } from '../../../services/driveScannerService';
import {
  DriveCategoryStrategy,
  DriveImportMode,
  SelectedRoutingSummary,
} from './driveImport.types';

interface DriveImportModalFooterProps {
  activeImportMode: DriveImportMode;
  scanResult: RecursiveScanResult | null;
  selectedRoutingSummary: SelectedRoutingSummary;
  selectedCount: number;
  activeNewTagsCount: number;
  categoryStrategy: DriveCategoryStrategy;
  parsedPastedCount: number;
  isImporting: boolean;
  importProgress: number;
  onClose: () => void;
  onExecuteImport: () => void;
}

export const DriveImportModalFooter: React.FC<DriveImportModalFooterProps> = ({
  activeImportMode,
  scanResult,
  selectedRoutingSummary,
  selectedCount,
  activeNewTagsCount,
  categoryStrategy,
  parsedPastedCount,
  isImporting,
  importProgress,
  onClose,
  onExecuteImport,
}) => {
  return (
    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-slate-600">
        {activeImportMode === 'RECURSIVE' && scanResult ? (
          selectedRoutingSummary.toStaging > 0 && selectedRoutingSummary.toCategory === 0 ? (
            <>
              <Inbox className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                พร้อมนำเข้า <strong className="text-slate-900">{selectedCount}</strong> คลิปเข้าสู่{' '}
                <strong className="text-amber-800">พื้นที่พักรอจัดหมวดหมู่ (Staging Area)</strong>
              </span>
            </>
          ) : selectedRoutingSummary.toStaging > 0 ? (
            <>
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                พร้อมนำเข้า <strong className="text-slate-900">{selectedCount}</strong> คลิป (เข้าหมวดหมู่{' '}
                <strong className="text-indigo-700">{selectedRoutingSummary.toCategory}</strong> · พื้นที่พัก{' '}
                <strong className="text-amber-800">{selectedRoutingSummary.toStaging}</strong>)
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                พร้อมนำเข้า <strong className="text-slate-900">{selectedCount}</strong> วิดีโอ และสร้าง{' '}
                <strong className="text-emerald-700">{activeNewTagsCount}</strong> หมวดหมู่ใหม่อัตโนมัติ
              </span>
            </>
          )
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {categoryStrategy === 'ALL_TO_STAGING'
                ? 'โหมดส่งเข้าพื้นที่พักรอจัดหมวดหมู่ (Staging Area) ก่อนคัดแยกภายหลัง'
                : 'โหมดแปลงชื่อ Subfolder เป็นหมวดหมู่อัตโนมัติ'}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
        >
          ยกเลิก
        </button>

        <button
          type="button"
          onClick={onExecuteImport}
          disabled={
            isImporting ||
            (activeImportMode === 'RECURSIVE' && selectedCount === 0) ||
            (activeImportMode === 'PASTE' && parsedPastedCount === 0)
          }
          className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          {isImporting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>กำลังนำเข้า {importProgress}%...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {activeImportMode === 'RECURSIVE' && scanResult
                  ? selectedRoutingSummary.toStaging === selectedCount
                    ? `นำเข้า ${selectedCount} คลิปเข้าพื้นที่พัก (Staging)`
                    : `นำเข้า ${selectedCount} คลิปตามหมวดหมู่ที่เลือก`
                  : `นำเข้า ${parsedPastedCount} คลิปทันที`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
