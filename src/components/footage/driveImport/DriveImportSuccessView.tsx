import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, FolderOpen, Inbox, Tag } from 'lucide-react';
import { STAGING_TAG_ID } from '../../../services/seedData';
import { DriveImportSuccessSummary } from './driveImport.types';

interface DriveImportSuccessViewProps {
  importSuccessData: DriveImportSuccessSummary;
  onGoToLibrary: (filterTagId?: string) => void;
  onClose: () => void;
}

export const DriveImportSuccessView: React.FC<DriveImportSuccessViewProps> = ({
  importSuccessData,
  onGoToLibrary,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 text-center space-y-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl my-3"
    >
      <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h4 className="text-lg font-bold text-emerald-950">
          นำเข้าสำเร็จ {importSuccessData.totalImported} วิดีโอเข้าสู่คลังเรียบร้อยแล้ว!
        </h4>

        {/* Breakdown badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {importSuccessData.categorizedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-bold">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>เข้าหมวดหมู่จริง {importSuccessData.categorizedCount} คลิป</span>
            </span>
          )}
          {importSuccessData.stagedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold">
              <Inbox className="w-3.5 h-3.5 text-amber-700" />
              <span>เข้าพื้นที่พักรอจัดหมวดหมู่ (Staging) {importSuccessData.stagedCount} คลิป</span>
            </span>
          )}
        </div>

        {importSuccessData.newTagsCreated > 0 ? (
          <div className="text-xs text-emerald-800 mt-2 max-w-lg mx-auto">
            <p className="font-semibold mb-1">
              ระบบได้สร้างหมวดหมู่ใหม่ {importSuccessData.newTagsCreated} หมวดจากชื่อ Subfolder ให้อัตโนมัติ:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {importSuccessData.createdTagNames.map((name, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 font-bold text-emerald-900 text-[11px]"
                >
                  #{name}
                </span>
              ))}
            </div>
          </div>
        ) : importSuccessData.stagedCount === importSuccessData.totalImported ? (
          <p className="text-xs text-amber-900 mt-1 max-w-md mx-auto">
            คลิปทั้งหมดถูกส่งเข้าสู่ &ldquo;พื้นที่พักรอจัดหมวดหมู่&rdquo; เรียบร้อยแล้ว คุณสามารถเข้าไปคัดแยกหมวดหมู่ทีละชุดในหน้าคลังฟุตเทจได้ทันที
          </p>
        ) : (
          <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
            ไฟล์ถูกจับคู่เข้ากับหมวดหมู่ตามที่คุณเลือก และพร้อมให้นำไปจัด 5 อันดับได้ทันที
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
        {importSuccessData.stagedCount > 0 && (
          <button
            type="button"
            onClick={() => onGoToLibrary(STAGING_TAG_ID)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Inbox className="w-4 h-4 text-slate-900" />
            <span>เปิดพื้นที่พักรอจัดหมวดหมู่ ({importSuccessData.stagedCount} คลิป)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onGoToLibrary('ALL')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <FolderOpen className="w-4 h-4 text-amber-400" />
          <span>ไปยังคลังฟุตเทจทั้งหมด</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
        >
          ปิดหน้าต่าง
        </button>
      </div>
    </motion.div>
  );
};
