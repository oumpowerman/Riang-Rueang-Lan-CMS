import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  MinusCircle,
} from 'lucide-react';
import { SupabaseSyncReport } from '../../types/supabaseSync.types';

interface SupabaseSyncReportViewProps {
  report: SupabaseSyncReport;
  onClose: () => void;
}

export const SupabaseSyncReportView: React.FC<SupabaseSyncReportViewProps> = ({
  report,
  onClose,
}) => {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[#EEF5EE] border border-[#BAD8BF] flex items-center justify-center mx-auto text-[#2E7D32]">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-[#2D241E]">
          ส่งข้อมูลสู่ Supabase เรียบร้อยแล้ว!
        </h3>
        <p className="text-xs text-[#6E5F52]">
          บันทึกเข้าตาราง public.contents สำเร็จตามโครงสร้างและสถานะที่ระบุ
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-white border border-[#E8DFD3] text-center">
          <div className="text-[11px] font-semibold text-[#6E5F52]">เพิ่มคลิปใหม่</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
            {report.insertedCount}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E8DFD3] text-center">
          <div className="text-[11px] font-semibold text-[#6E5F52]">อัปเดตทับ</div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-0.5">
            {report.updatedCount}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E8DFD3] text-center">
          <div className="text-[11px] font-semibold text-[#6E5F52]">ข้ามคลิปซ้ำ</div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-0.5">
            {report.skippedCount}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E8DFD3] text-center">
          <div className="text-[11px] font-semibold text-[#6E5F52]">ไม่สำเร็จ</div>
          <div
            className={`text-xl font-bold font-mono mt-0.5 ${
              report.failedCount > 0 ? 'text-rose-700' : 'text-slate-400'
            }`}
          >
            {report.failedCount}
          </div>
        </div>
      </div>

      {/* Item List Log */}
      <div className="p-3 rounded-xl bg-white border border-[#E8DFD3] space-y-2">
        <div className="text-xs font-bold text-[#3D332A] px-1">
          รายละเอียดรายการที่ดำเนินการ ({report.items.length} รายการ):
        </div>
        <div className="max-h-60 overflow-y-auto scrollbar-thin divide-y divide-slate-100 text-xs">
          {report.items.map((item, idx) => (
            <div
              key={idx}
              className="py-2 px-1 flex items-center justify-between gap-2"
            >
              <div className="truncate min-w-0">
                <span className="font-semibold text-[#2D241E]">
                  {item.title}
                </span>
                {item.error && (
                  <span className="text-[10px] text-rose-600 block truncate">
                    ข้อผิดพลาด: {item.error}
                  </span>
                )}
              </div>

              <div className="shrink-0">
                {item.action === 'INSERTED' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    เพิ่มใหม่
                  </span>
                )}
                {item.action === 'UPDATED' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    อัปเดตทับ
                  </span>
                )}
                {item.action === 'SKIPPED' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    ข้าม
                  </span>
                )}
                {item.action === 'FAILED' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    ล้มเหลว
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#3B6845] hover:bg-[#2D5236] text-white shadow-xs transition-colors cursor-pointer"
        >
          เสร็จสิ้น
        </button>
      </div>
    </div>
  );
};
