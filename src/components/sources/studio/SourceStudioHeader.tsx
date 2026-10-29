import React from 'react';
import { HardDrive, Scissors } from 'lucide-react';

interface SourceStudioHeaderProps {
  onOpenDrive1ToN: () => void;
  onOpenSourceSplitter: () => void;
}

export const SourceStudioHeader: React.FC<SourceStudioHeaderProps> = ({
  onOpenDrive1ToN,
  onOpenSourceSplitter,
}) => {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Scissors className="w-5 h-5 text-indigo-600" />
          <span>
            สตูดิโอวางแผนขุดทองจากไลฟ์สด (Flow B: 1-to-Many Source Mining Studio)
          </span>
        </h1>
        <p className="text-xs text-slate-500">
          บริหารคลิปต้นฉบับยาว (`SRC-XXXX`) วิเคราะห์ช่วงเวลาที่ยังขุดไม่ครบ ดึงโฟลเดอร์ไลฟ์จาก Google Drive แบบ 1:N และส่งช็อตเด็ดเข้าหน้าจัด 5 อันดับได้ทันที
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenDrive1ToN}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          <HardDrive className="w-4 h-4" />
          <span>+ ดึงโฟลเดอร์ไลฟ์จาก Google Drive (1:N)</span>
        </button>

        <button
          type="button"
          onClick={onOpenSourceSplitter}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          <Scissors className="w-4 h-4" />
          <span>+ ลงทะเบียนคลิปยาว & หั่นหลายฟุต (Flow 1:N)</span>
        </button>
      </div>
    </div>
  );
};
