import React, { useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  CalendarClock,
  Check,
  Clock,
  Folder,
  FolderTree,
  History,
  Inbox,
  Layers,
  Link2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { ScanProgressUpdate } from '../../../services/driveScannerService';
import {
  DriveSyncMode,
  DriveSyncRecord,
  SavedDriveFolderPreset,
} from '../../../types/driveSync.types';
import { CategoryGroup } from '../../../types/tag.types';
import { DriveCategoryStrategy } from './driveImport.types';

interface DriveRecursiveConfigPanelProps {
  folderUrl: string;
  onFolderUrlChange: (url: string) => void;
  activeFolderId: string;
  savedFolders: SavedDriveFolderPreset[];
  onSelectSavedFolder: (preset: SavedDriveFolderPreset) => void;
  onSaveCurrentFolderPreset: (customName?: string) => void;
  onRemoveSavedFolder: (folderId: string) => void;
  isScanning: boolean;
  onStartScan: () => void;
  onCancelScan: () => void;
  maxDepth: number;
  onMaxDepthChange: (depth: number) => void;
  syncMode: DriveSyncMode;
  onSyncModeChange: (mode: DriveSyncMode) => void;
  folderSyncRecord: DriveSyncRecord | null;
  isLoadingSyncRecord: boolean;
  onResetFolderSyncHistory?: () => void;
  onAdjustSyncLookbackDays?: (daysAgo: number) => void;
  onSetCustomSyncTimestamp?: (isoDateStr: string) => void;
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
  activeFolderId,
  savedFolders,
  onSelectSavedFolder,
  onSaveCurrentFolderPreset,
  onRemoveSavedFolder,
  isScanning,
  onStartScan,
  onCancelScan,
  maxDepth,
  onMaxDepthChange,
  syncMode,
  onSyncModeChange,
  folderSyncRecord,
  isLoadingSyncRecord,
  onResetFolderSyncHistory,
  onAdjustSyncLookbackDays,
  onSetCustomSyncTimestamp,
  categoryStrategy,
  onSelectSubfolderStrategy,
  onSelectAllToStagingStrategy,
  nonStagingGroups,
  targetGroupIdForNewTags,
  onTargetGroupIdChange,
  scanError,
  scanProgress,
}) => {
  const [isNamingFolder, setIsNamingFolder] = useState(false);
  const [customFolderName, setCustomFolderName] = useState('');
  const [isAdjustingSyncDate, setIsAdjustingSyncDate] = useState(false);
  const [lookbackDaysInput, setLookbackDaysInput] = useState<string>('12');
  const [customDateInput, setCustomDateInput] = useState<string>('');

  const currentSavedPreset = savedFolders.find(
    (f) => f.folderId === activeFolderId
  );

  const formatSyncDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatRelativeDaysAgo = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const target = new Date(isoString).getTime();
      if (isNaN(target)) return '';
      const diffMs = Date.now() - target;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'วันนี้';
      return `${diffDays} วันที่แล้ว`;
    } catch {
      return '';
    }
  };

  const handleOpenNameEditor = () => {
    setCustomFolderName(
      currentSavedPreset?.folderName ||
        folderSyncRecord?.folderName ||
        ''
    );
    setIsNamingFolder(true);
  };

  const handleConfirmSavePreset = () => {
    onSaveCurrentFolderPreset(customFolderName);
    setIsNamingFolder(false);
  };

  const handleApplyLookbackDays = (days: number) => {
    onAdjustSyncLookbackDays?.(days);
    setIsAdjustingSyncDate(false);
  };

  const handleApplyCustomDate = (dateVal: string) => {
    if (!dateVal) return;
    const d = new Date(`${dateVal}T00:00:00`);
    if (!isNaN(d.getTime())) {
      onSetCustomSyncTimestamp?.(d.toISOString());
      setIsAdjustingSyncDate(false);
    }
  };

  return (
    <>
      {/* Folder Input, Saved Folders Bar & Delta Sync Controls */}
      <div className="space-y-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-bold text-slate-800">
                ลิงก์โฟลเดอร์ Google Drive หรือ Folder ID:
              </label>
              {activeFolderId && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>จำลิงก์อัตโนมัติ (Local + Cloud)</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isLoadingSyncRecord && (
                <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>กำลังเช็กประวัติการซิงค์โฟลเดอร์...</span>
                </span>
              )}
              {activeFolderId && !isNamingFolder && (
                <button
                  type="button"
                  onClick={handleOpenNameEditor}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                >
                  {currentSavedPreset ? (
                    <>
                      <Pencil className="w-3 h-3" />
                      <span>ตั้งชื่อเรียกโฟลเดอร์นี้</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3 h-3" />
                      <span>+ บันทึกไว้ในโฟลเดอร์ที่ใช้บ่อย</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

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
              className={`px-4 py-2 text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap ${
                syncMode === 'DELTA' && folderSyncRecord?.lastSyncTimestamp
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-50`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังสแกนโฟลเดอร์...</span>
                </>
              ) : syncMode === 'DELTA' && folderSyncRecord?.lastSyncTimestamp ? (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>เริ่มสแกนเฉพาะไฟล์ใหม่ (Delta Sync)</span>
                </>
              ) : (
                <>
                  <FolderTree className="w-4 h-4" />
                  <span>เริ่มสแกนลึกทุกโฟลเดอร์ย่อย</span>
                </>
              )}
            </button>
          </div>

          {/* Inline Custom Name Editor for Saving Preset */}
          {isNamingFolder && (
            <div className="mt-2 p-2.5 rounded-xl bg-white border border-indigo-200 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                ชื่อเรียกโฟลเดอร์:
              </span>
              <input
                type="text"
                value={customFolderName}
                onChange={(e) => setCustomFolderName(e.target.value)}
                placeholder="เช่น คลังฟุตเทจเรียงเรื่องลั่น (หลัก), ฟุตเทจช่องสำรอง..."
                className="flex-1 min-w-[200px] px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleConfirmSavePreset}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setIsNamingFolder(false)}
                className="px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          )}

          {/* Saved & Recent Folders Quick-Switch Bar */}
          {savedFolders.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Bookmark className="w-3 h-3 text-indigo-600" />
                <span>โฟลเดอร์ที่ใช้บ่อย / ประวัติโฟลเดอร์ที่บันทึกไว้ (คลิกเพื่อสลับ):</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {savedFolders.map((preset) => {
                  const isActive = preset.folderId === activeFolderId;
                  return (
                    <div
                      key={preset.folderId}
                      className={`inline-flex items-center rounded-xl border text-xs transition-all ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectSavedFolder(preset)}
                        className="px-2.5 py-1 flex items-center gap-1.5 cursor-pointer text-left"
                        title={`สลับไปยังโฟลเดอร์: ${preset.folderName} (ID: ${preset.folderId})`}
                      >
                        <Folder
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-emerald-600' : 'text-indigo-500'
                          }`}
                        />
                        <span className="font-bold truncate max-w-[220px]">
                          {preset.folderName}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveSavedFolder(preset.folderId)}
                        className="pr-2 pl-1 py-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="ลบออกจากรายการที่ใช้บ่อย"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Delta Sync History, Lookback Adjuster & Mode Selector */}
        {folderSyncRecord?.lastSyncTimestamp ? (
          <div className="p-3 rounded-xl bg-white border border-slate-200/90 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                <History className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-900">
                  เคยซิงค์โฟลเดอร์นี้ล่าสุด:
                </span>
                <span className="font-mono tabular-nums text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                  {formatSyncDate(folderSyncRecord.lastSyncTimestamp)}
                  {formatRelativeDaysAgo(folderSyncRecord.lastSyncTimestamp)
                    ? ` (${formatRelativeDaysAgo(folderSyncRecord.lastSyncTimestamp)})`
                    : ''}
                </span>

                <button
                  type="button"
                  onClick={() => setIsAdjustingSyncDate((prev) => !prev)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                    isAdjustingSyncDate
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-slate-50 hover:bg-amber-50/70 text-slate-700 hover:text-amber-900 border-slate-200'
                  }`}
                  title="ถอยวันซิงก์ย้อนหลัง (กรณีเผลอกดซิงก์แล้วปิดทิ้ง หรือต้องการดึงไฟล์ย้อนหลังใหม่)"
                >
                  <CalendarClock className="w-3.5 h-3.5 text-amber-700" />
                  <span>ปรับวันย้อนหลัง</span>
                </button>

                {onResetFolderSyncHistory && (
                  <button
                    type="button"
                    onClick={onResetFolderSyncHistory}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-700 bg-rose-50/70 hover:bg-rose-100 border border-rose-200/80 transition-colors cursor-pointer"
                    title="ล้างประวัติเวลาซิงก์ของโฟลเดอร์นี้เพื่อเริ่มซิงก์ใหม่"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ล้างประวัติซิงก์</span>
                  </button>
                )}
              </div>

              {/* Segmented Switch: Delta Sync vs Full Rescan */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => onSyncModeChange('DELTA')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    syncMode === 'DELTA'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="ประหยัดแบนด์วิธ: ให้ Google คัดกรองและส่งมาเฉพาะไฟล์ที่เพิ่มใหม่หลังจากการซิงค์ครั้งล่าสุด"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span>สแกนเฉพาะไฟล์ใหม่ (แนะนำ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSyncModeChange('FULL')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    syncMode === 'FULL'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="สแกนตรวจเช็กทั้งโฟลเดอร์เพื่อสำรวจไฟล์ทั้งหมดใหม่ตั้งแต่ต้น"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>สแกนทั้งหมด (Full Rescan)</span>
                </button>
              </div>
            </div>

            {/* Inline Adjustable Sync Lookback Panel */}
            {isAdjustingSyncDate && (
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-amber-200/90 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-stone-800 flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>ถอยเวลาซิงก์กลับไปเมื่อ:</span>
                    </span>
                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={3650}
                        value={lookbackDaysInput}
                        onChange={(e) => setLookbackDaysInput(e.target.value)}
                        className="w-18 px-2 py-1 text-xs font-mono font-bold text-center bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 text-stone-900"
                      />
                      <span className="font-semibold text-stone-700">วันที่แล้ว</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyLookbackDays(
                            Math.max(0, parseInt(lookbackDaysInput, 10) || 0)
                          )
                        }
                        className="px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer transition-colors"
                      >
                        ยืนยันถอยวัน
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-stone-500">หรือระบุวันที่เอง:</span>
                    <input
                      type="date"
                      value={customDateInput}
                      onChange={(e) => {
                        setCustomDateInput(e.target.value);
                        handleApplyCustomDate(e.target.value);
                      }}
                      className="px-2 py-1 text-xs font-mono bg-white border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-amber-200/60">
                  <span className="text-[11px] font-semibold text-stone-600">
                    ปุ่มลัดถอยวันด่วน:
                  </span>
                  {[1, 3, 7, 12, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setLookbackDaysInput(String(d));
                        handleApplyLookbackDays(d);
                      }}
                      className="px-2.5 py-0.5 rounded-md bg-white hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      ย้อน {d} วัน
                    </button>
                  ))}
                </div>
              </div>
            )}

            {syncMode === 'DELTA' && (
              <p className="text-[11px] text-slate-600 flex items-center gap-1 leading-relaxed">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  <strong>Server-side Delta Filter เปิดใช้งาน:</strong> Google Drive
                  จะส่งมาเฉพาะไฟล์ที่มีการสร้างหรือแก้ไขหลังวันที่{' '}
                  {formatSyncDate(folderSyncRecord.lastSyncTimestamp)} เท่านั้น
                  โดยข้ามไฟล์เก่าทั้งหมดเพื่อประหยัดแบนด์วิธ
                </span>
              </p>
            )}
          </div>
        ) : folderUrl.trim() && !isLoadingSyncRecord ? (
          <div className="px-3 py-2 rounded-xl bg-indigo-50/60 border border-indigo-100/80 space-y-2 text-xs text-indigo-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  ยังไม่มีประวัติการซิงค์สำหรับโฟลเดอร์นี้ (จะทำการสแกนเต็มรูปแบบครั้งแรก)
                </span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustingSyncDate((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-pointer"
                >
                  <CalendarClock className="w-3 h-3" />
                  <span>กำหนดวันเริ่มซิงก์ย้อนหลังเอง</span>
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200/80 text-indigo-800">
                  โหมด Full Scan
                </span>
              </div>
            </div>

            {isAdjustingSyncDate && (
              <div className="p-2.5 rounded-xl bg-white border border-indigo-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-slate-700">ดึงเฉพาะไฟล์ย้อนหลัง:</span>
                  <input
                    type="number"
                    min={0}
                    max={3650}
                    value={lookbackDaysInput}
                    onChange={(e) => setLookbackDaysInput(e.target.value)}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  <span>วันที่แล้ว</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyLookbackDays(
                        Math.max(0, parseInt(lookbackDaysInput, 10) || 0)
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                  >
                    ตั้งค่า
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {[3, 7, 12, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleApplyLookbackDays(d)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 font-semibold text-[11px] cursor-pointer"
                    >
                      ย้อน {d} วัน
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

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
                  จับคู่หมวดหมู่เดิมอัตโนมัติ หรือสร้างหมวดใหม่จากชื่อโฟลเดอร์ย่อย
                  (เลือกสลับบางโฟลเดอร์เข้าพื้นที่พักได้)
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
                  พักทุกคลิปไว้ในกลุ่ม &ldquo;พื้นที่พักรอจัดหมวดหมู่ (Staging
                  Area)&rdquo; โดยไม่สร้างแท็กใหม่ เพื่อรอคัดแยกทีหลัง
                </p>
              </div>
            </button>
          </div>

          {/* Optional Target Group Picker when creating new categories from subfolders */}
          {categoryStrategy === 'SUBFOLDER_TO_CATEGORY' && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-600">
                <span>
                  หากต้องสร้างหมวดหมู่หลักใหม่จาก Subfolder ให้จัดเข้ากลุ่มใหญ่:
                </span>
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
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <span>กำลังสำรวจโครงสร้างไดรฟ์...</span>
                {scanProgress.scanMode === 'DELTA' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    ⚡ โหมด Delta Sync (กรองไฟล์ใหม่โดยตรง)
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-300">
                    🔍 โหมด Full Scan
                  </span>
                )}
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
              <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                {scanProgress.foldersScanned} โฟลเดอร์
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
              <div className="text-[10px] text-slate-500">คลิปใหม่</div>
              <div className="text-base font-bold font-mono tabular-nums text-emerald-600">
                {scanProgress.newVideosFound ?? scanProgress.videosFound} ไฟล์
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
              <div className="text-[10px] text-slate-500">มีในระบบแล้ว</div>
              <div className="text-base font-bold font-mono tabular-nums text-amber-700">
                {scanProgress.duplicatesFound ?? 0} ไฟล์
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100 truncate">
              <div className="text-[10px] text-slate-500 truncate">
                โฟลเดอร์ปัจจุบัน
              </div>
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
