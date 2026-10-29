import React from 'react';
import {
  AlertCircle,
  FolderTree,
  Inbox,
  Layers,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { ScanProgressUpdate } from '../../../services/driveScannerService';
import { CategoryGroup } from '../../../types/tag.types';
import { DriveCategoryStrategy } from './driveImport.types';

interface DriveRecursiveConfigPanelProps {
  folderUrl: string;
  onFolderUrlChange: (url: string) => void;
  isScanning: boolean;
  onStartScan: () => void;
  onCancelScan: () => void;
  maxDepth: number;
  onMaxDepthChange: (depth: number) => void;
  categoryStrategy: DriveCategoryStrategy;
  onSelectSubfolderStrategy: () => void;
  onSelectAllToStagingStrategy: () => void;
  nonStagingGroups: CategoryGroup[];
  targetGroupIdForNewTags: string;
  onTargetGroupIdChange: (groupId: string) => void;
  scanError: string | null;
  scanProgress: ScanProgressUpdate | null;
}

export const DriveRecursiveConfigPanel: React.FC<DriveRecursiveConfigPanelProps> = ({
  folderUrl,
  onFolderUrlChange,
  isScanning,
  onStartScan,
  onCancelScan,
  maxDepth,
  onMaxDepthChange,
  categoryStrategy,
  onSelectSubfolderStrategy,
  onSelectAllToStagingStrategy,
  nonStagingGroups,
  targetGroupIdForNewTags,
  onTargetGroupIdChange,
  scanError,
  scanProgress,
}) => {
  return (
    <>
      {/* Folder Input & Category Assignment Strategy Selector */}
      <div className="space-y-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            ลิงก์โฟลเดอร์ Google Drive หรือ Folder ID:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={folderUrl}
                onChange={(e) => onFolderUrlChange(e.target.value)}
                placeholder="วางลิงก์ เช่น https://drive.google.com/drive/folders/1aBcDeFgHiJk..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <button
              type="button"
              onClick={onStartScan}
              disabled={isScanning || !folderUrl.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังสแกนโฟลเดอร์...</span>
                </>
              ) : (
                <>
                  <FolderTree className="w-4 h-4" />
                  <span>เริ่มสแกนลึกทุกโฟลเดอร์ย่อย</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category Assignment Strategy Selector (Subfolder vs Staging Area) */}
        <div className="pt-2.5 border-t border-slate-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>รูปแบบการจัดหมวดหมู่เมื่อนำเข้า (เลือกเปลี่ยนได้ตลอดเวลา):</span>
            </span>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>ความลึกสูงสุด:</span>
              <select
                value={maxDepth}
                onChange={(e) => onMaxDepthChange(Number(e.target.value))}
                className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-slate-800"
              >
                <option value="5">5 ชั้น</option>
                <option value="10">10 ชั้น (แนะนำ)</option>
                <option value="20">20 ชั้น</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Strategy 1: Auto-map Subfolder to Category */}
            <button
              type="button"
              onClick={onSelectSubfolderStrategy}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                categoryStrategy === 'SUBFOLDER_TO_CATEGORY'
                  ? 'bg-indigo-50/90 border-indigo-400 ring-1 ring-indigo-300 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  categoryStrategy === 'SUBFOLDER_TO_CATEGORY'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <FolderTree className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-slate-900">
                    ใช้ชื่อ Subfolder เป็นหมวดหมู่
                  </span>
                  {categoryStrategy === 'SUBFOLDER_TO_CATEGORY' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                      เลือกอยู่
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  จับคู่หมวดหมู่เดิมอัตโนมัติ หรือสร้างหมวดใหม่จากชื่อโฟลเดอร์ย่อย (เลือกสลับบางโฟลเดอร์เข้าพื้นที่พักได้)
                </p>
              </div>
            </button>

            {/* Strategy 2: Send all to Staging Area */}
            <button
              type="button"
              onClick={onSelectAllToStagingStrategy}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                categoryStrategy === 'ALL_TO_STAGING'
                  ? 'bg-amber-50/90 border-amber-400 ring-1 ring-amber-300 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  categoryStrategy === 'ALL_TO_STAGING'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Inbox className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-slate-900">
                    ส่งเข้าพื้นที่พักรอจัดหมวดหมู่ก่อน
                  </span>
                  {categoryStrategy === 'ALL_TO_STAGING' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                      เลือกอยู่
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  พักทุกคลิปไว้ในกลุ่ม &ldquo;พื้นที่พักรอจัดหมวดหมู่ (Staging Area)&rdquo; โดยไม่สร้างแท็กใหม่ เพื่อรอคัดแยกทีหลัง
                </p>
              </div>
            </button>
          </div>

          {/* Optional Target Group Picker when creating new categories from subfolders */}
          {categoryStrategy === 'SUBFOLDER_TO_CATEGORY' && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-600">
                <span>หากต้องสร้างหมวดหมู่หลักใหม่จาก Subfolder ให้จัดเข้ากลุ่มใหญ่:</span>
                <select
                  value={targetGroupIdForNewTags}
                  onChange={(e) => onTargetGroupIdChange(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 cursor-pointer focus:outline-none focus:border-indigo-500"
                >
                  {nonStagingGroups.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scan Error Message */}
      {scanError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">ไม่สามารถสแกนโฟลเดอร์ได้</div>
            <div className="mt-0.5 text-rose-700">{scanError}</div>
          </div>
        </div>
      )}

      {/* Live Scan Progress Indicator */}
      {isScanning && scanProgress && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200/90 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="text-xs font-bold text-indigo-950">
                กำลังสำรวจโครงสร้างไดรฟ์แบบ Recursive...
              </span>
            </div>
            <button
              type="button"
              onClick={onCancelScan}
              className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิกการสแกน
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
              <div className="text-[10px] text-slate-500">สแกนแล้ว</div>
              <div className="text-base font-bold font-mono text-slate-900">
                {scanProgress.foldersScanned} โฟลเดอร์
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
              <div className="text-[10px] text-slate-500">ในคิวรอสแกน</div>
              <div className="text-base font-bold font-mono text-slate-900">
                {scanProgress.foldersPending} โฟลเดอร์
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
              <div className="text-[10px] text-slate-500">วิดีโอที่ตรวจพบ</div>
              <div className="text-base font-bold font-mono text-emerald-600">
                {scanProgress.videosFound} ไฟล์
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100 truncate">
              <div className="text-[10px] text-slate-500 truncate">โฟลเดอร์ปัจจุบัน</div>
              <div className="text-xs font-bold text-indigo-900 truncate">
                {scanProgress.currentFolder}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
