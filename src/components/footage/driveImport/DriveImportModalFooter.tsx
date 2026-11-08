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
  importStatusLabel?: string;
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
  importStatusLabel,
  onClose,
  onExecuteImport,
}) => {
  const isDisabled =
    isImporting ||
    (activeImportMode === 'RECURSIVE' && selectedCount === 0) ||
    (activeImportMode === 'PASTE' && parsedPastedCount === 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      <div className="flex items-center gap-2 text-xs text-[#6E5F52]">
        {isImporting && importStatusLabel ? (
          <div className="flex items-center gap-2 text-[#1C4824] font-semibold">
            <RefreshCw className="w-4 h-4 animate-spin text-[#2E7D32] shrink-0" />
            <span>{importStatusLabel}</span>
            <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
              ห้ามรีเฟรชหน้าเว็บจนกว่าจะครบ 100%
            </span>
          </div>
        ) : activeImportMode === 'RECURSIVE' && scanResult ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              {selectedRoutingSummary.toStaging > 0 &&
              selectedRoutingSummary.toCategory === 0 ? (
                <>
                  <Inbox className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    พร้อมนำเข้า{' '}
                    <strong className="font-mono tabular-nums text-[#2D241E]">
                      {selectedCount.toLocaleString()}
                    </strong>{' '}
                    คลิปเข้าสู่{' '}
                    <strong className="text-amber-800">
                      พื้นที่พักรอจัดหมวดหมู่ (Staging Area)
                    </strong>
                  </span>
                </>
              ) : selectedRoutingSummary.toStaging > 0 ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#2E7D32] shrink-0" />
                  <span>
                    พร้อมนำเข้า{' '}
                    <strong className="font-mono tabular-nums text-[#2D241E]">
                      {selectedCount.toLocaleString()}
                    </strong>{' '}
                    คลิป (เข้าหมวดหมู่{' '}
                    <strong className="font-mono tabular-nums text-[#1C4824]">
                      {selectedRoutingSummary.toCategory.toLocaleString()}
                    </strong>{' '}
                    · พื้นที่พัก{' '}
                    <strong className="font-mono tabular-nums text-amber-800">
                      {selectedRoutingSummary.toStaging.toLocaleString()}
                    </strong>
                    )
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#2E7D32] shrink-0" />
                  <span>
                    พร้อมนำเข้า{' '}
                    <strong className="font-mono tabular-nums text-[#2D241E]">
                      {selectedCount.toLocaleString()}
                    </strong>{' '}
                    วิดีโอ และสร้าง{' '}
                    <strong className="font-mono tabular-nums text-emerald-700">
                      {activeNewTagsCount.toLocaleString()}
                    </strong>{' '}
                    หมวดหมู่ใหม่อัตโนมัติ
                  </span>
                </>
              )}
            </div>
            {scanResult.totalDuplicates > 0 && (
              <div className="text-[11px] text-[#8E8174] pl-5">
                * ข้ามคลิปที่มีในระบบแล้ว{' '}
                <span className="font-mono tabular-nums">
                  {scanResult.totalDuplicates.toLocaleString()}
                </span>{' '}
                รายการโดยอัตโนมัติ
              </div>
            )}
          </div>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-[#3B6845] shrink-0" />
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
          disabled={isImporting}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            isImporting
              ? 'bg-[#EFECE6] text-[#A39688] border-[#E2D5C4] cursor-not-allowed opacity-60'
              : 'text-[#6E5F52] hover:bg-[#FAF7F2] border-[#E2D5C4] bg-white cursor-pointer'
          }`}
        >
          ยกเลิก
        </button>

        <button
          type="button"
          onClick={onExecuteImport}
          disabled={isDisabled}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            !isDisabled
              ? 'bg-[#3B6845] hover:bg-[#2D5236] text-white shadow-xs hover:shadow-md'
              : 'bg-[#E5DED4] text-[#8E8174] border border-[#D8CFC3] cursor-not-allowed opacity-70'
          }`}
        >
          {isImporting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span className="font-mono tabular-nums">
                {importStatusLabel || `กำลังนำเข้า ${importProgress}%...`}
              </span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>
                {activeImportMode === 'RECURSIVE' && scanResult
                  ? scanResult.totalDuplicates > 0 &&
                    selectedCount === scanResult.totalNewVideos
                    ? `นำเข้าเฉพาะคลิปใหม่ (${selectedCount.toLocaleString()} คลิป)`
                    : selectedRoutingSummary.toStaging === selectedCount &&
                      selectedCount > 0
                    ? `นำเข้า ${selectedCount.toLocaleString()} คลิปเข้าพื้นที่พัก (Staging)`
                    : `นำเข้า ${selectedCount.toLocaleString()} คลิปตามหมวดหมู่ที่เลือก`
                  : `นำเข้า ${parsedPastedCount.toLocaleString()} คลิปทันที`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
