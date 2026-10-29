import React from 'react';
import { FolderOpen, Inbox, Layers, Tag } from 'lucide-react';
import { CategoryTag } from '../../../types/tag.types';
import { ReconciledCategoryResult } from '../../../utils/tagReconciler';
import { DriveCategoryStrategy } from './driveImport.types';

interface DriveSubfolderMappingPanelProps {
  categoryStrategy: DriveCategoryStrategy;
  folderCategoryMap: Map<string, ReconciledCategoryResult>;
  activeNewTagsToCreate: CategoryTag[];
  isFolderRoutedToStaging: (folderName: string) => boolean;
  onToggleSubfolderStaging: (folderName: string) => void;
  onStageOnlyUnmatchedFolders: () => void;
}

export const DriveSubfolderMappingPanel: React.FC<DriveSubfolderMappingPanelProps> = ({
  categoryStrategy,
  folderCategoryMap,
  activeNewTagsToCreate,
  isFolderRoutedToStaging,
  onToggleSubfolderStaging,
  onStageOnlyUnmatchedFolders,
}) => {
  return (
    <div
      className={`border rounded-2xl p-3.5 space-y-2.5 transition-colors ${
        categoryStrategy === 'ALL_TO_STAGING'
          ? 'bg-amber-50/70 border-amber-200/90'
          : 'bg-slate-50/90 border-slate-200/90'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {categoryStrategy === 'ALL_TO_STAGING' ? (
            <Inbox className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-900">
            {categoryStrategy === 'ALL_TO_STAGING'
              ? `ส่งทุกโฟลเดอร์ย่อย (${folderCategoryMap.size} โฟลเดอร์) เข้าพื้นที่พักรอจัดหมวดหมู่`
              : `การจับคู่หมวดหมู่จาก Subfolder (${folderCategoryMap.size} โฟลเดอร์) · คลิกที่ป้ายเพื่อสลับเข้าพื้นที่พักรายโฟลเดอร์`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categoryStrategy === 'SUBFOLDER_TO_CATEGORY' && (
            <button
              type="button"
              onClick={onStageOnlyUnmatchedFolders}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100/90 hover:bg-amber-200/80 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
              title="โฟลเดอร์ที่มีหมวดตรงอยู่แล้วให้เข้าหมวดเดิม ส่วนโฟลเดอร์ใหม่ที่ยังไม่มีหมวดให้ส่งเข้าพื้นที่พักแทนการสร้างแท็กใหม่"
            >
              ส่งเฉพาะโฟลเดอร์ที่ยังไม่มีหมวดหมู่เข้าพื้นที่พัก
            </button>
          )}

          {activeNewTagsToCreate.length > 0 ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
              จะสร้างหมวดใหม่ {activeNewTagsToCreate.length} หมวด
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
              ไม่มีการสร้างหมวดหมู่ใหม่
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-0.5">
        {Array.from(folderCategoryMap.values()).map((reconciled, i) => {
          const isStaged = isFolderRoutedToStaging(reconciled.folderName);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggleSubfolderStaging(reconciled.folderName)}
              title="คลิกเพื่อสลับโฟลเดอร์นี้ระหว่าง ใช้หมวดหมู่ตามชื่อโฟลเดอร์ กับ ส่งเข้าพื้นที่พักรอจัดหมวดหมู่"
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                isStaged
                  ? 'bg-amber-100/80 text-amber-950 border-amber-300 font-bold'
                  : reconciled.isNew
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-bold hover:bg-emerald-100/70'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <FolderOpen className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="font-mono text-[11px] text-slate-600">
                {reconciled.folderName}
              </span>
              <span className="text-slate-400">➔</span>
              {isStaged ? (
                <>
                  <Inbox className="w-3 h-3 text-amber-700 shrink-0" />
                  <span className="text-amber-900">พื้นที่พักรอจัดหมวดหมู่</span>
                </>
              ) : (
                <>
                  <Tag className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>#{reconciled.cleanedCategoryName}</span>
                  {reconciled.isNew && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-200/70 text-emerald-800">
                      หมวดใหม่
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
