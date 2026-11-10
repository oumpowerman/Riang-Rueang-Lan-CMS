import React from 'react';
import {
  Search,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  SupabaseConnectionConfig,
  SUPABASE_CONTENT_STATUSES,
  SUPABASE_TARGET_PLATFORMS,
} from '../../types/supabaseSync.types';

interface SupabaseSyncToolbarProps {
  activeTab: 'ALL' | 'NEW' | 'DUPLICATE';
  onTabChange: (tab: 'ALL' | 'NEW' | 'DUPLICATE') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  stats: {
    total: number;
    newCount: number;
    duplicateCount: number;
    selectedCount: number;
    selectedNewCount: number;
    selectedDupUpdateCount: number;
  };
  config: SupabaseConnectionConfig;
  savedDraftOverridesCount: number;
  onSelectAllNew: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onResetAllRowDrafts: () => void;
  onBatchSetStatus: (status: string) => void;
  onBatchSetChannel: (channelId: string) => void;
  onBatchTogglePlatform: (platformId: string) => void;
  onBatchToggleAssets: (include: boolean) => void;
  onBatchSetPillar: (include: boolean) => void;
  onBatchSetCategory: (include: boolean) => void;
}

export const SupabaseSyncToolbar: React.FC<SupabaseSyncToolbarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  stats,
  config,
  savedDraftOverridesCount,
  onSelectAllNew,
  onSelectAll,
  onDeselectAll,
  onResetAllRowDrafts,
  onBatchSetStatus,
  onBatchSetChannel,
  onBatchTogglePlatform,
  onBatchToggleAssets,
  onBatchSetPillar,
  onBatchSetCategory,
}) => {
  return (
    <div className="p-3 bg-white border-b border-[#E8DFD3] shrink-0 space-y-2.5">
      {/* Row 1: Filter Tabs + Search Box */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DFD3]">
          <button
            type="button"
            onClick={() => onTabChange('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-white text-[#2D241E] shadow-xs'
                : 'text-[#6E5F52] hover:text-[#2D241E]'
            }`}
          >
            ทั้งหมด (
            <span className="font-mono tabular-nums">
              {stats.total.toLocaleString()}
            </span>
            )
          </button>
          <button
            type="button"
            onClick={() => onTabChange('NEW')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'NEW'
                ? 'bg-[#EEF5EE] text-[#1C4824] shadow-xs'
                : 'text-[#6E5F52] hover:text-[#1C4824]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#2E7D32]" />
            <span>
              คลิปใหม่ (
              <span className="font-mono tabular-nums">
                {stats.newCount.toLocaleString()}
              </span>
              )
            </span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('DUPLICATE')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'DUPLICATE'
                ? 'bg-[#FEF3C7] text-[#92400E] shadow-xs'
                : 'text-[#6E5F52] hover:text-[#92400E]'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-[#B45309]" />
            <span>
              ซ้ำในระบบ (
              <span className="font-mono tabular-nums">
                {stats.duplicateCount.toLocaleString()}
              </span>
              )
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] sm:min-w-[280px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อคลิป, หมวดหมู่, แท็ก..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E3D8CB] bg-[#FAF8F5] text-xs focus:outline-none focus:ring-1 focus:ring-[#8FA892]"
          />
        </div>
      </div>

      {/* Row 2: Bulk Action Buttons & Global Overrides for Selected Rows */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        {/* Selection Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onSelectAllNew}
            className="px-2.5 py-1 rounded-lg font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] hover:bg-[#E2EFE2] transition-colors cursor-pointer whitespace-nowrap"
          >
            เลือกเฉพาะคลิปใหม่ทั้งหมด ({stats.newCount.toLocaleString()})
          </button>
          <button
            type="button"
            onClick={onSelectAll}
            className="px-2.5 py-1 rounded-lg font-semibold bg-[#FAF7F2] text-[#524538] border border-[#E2D5C4] hover:bg-[#F2EBE0] transition-colors cursor-pointer whitespace-nowrap"
          >
            เลือกทั้งหมดทุกหน้า
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            ล้างการเลือก
          </button>

          {savedDraftOverridesCount > 0 && (
            <button
              type="button"
              onClick={onResetAllRowDrafts}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer whitespace-nowrap"
              title="ล้างค่าที่เคยปรับแต่งค้างไว้รายแถวบน Cloud เพื่อรีเซ็ตกลับเป็นค่าเริ่มต้น"
            >
              <RotateCcw className="w-3 h-3" />
              <span>รีเซ็ตค่าที่ปรับค้างไว้ ({savedDraftOverridesCount})</span>
            </button>
          )}
        </div>

        {/* Bulk Field Modifiers for Selected */}
        {stats.selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#524538]">
            <span className="font-semibold text-slate-400">
              ปรับค่าที่เลือก (
              <span className="font-mono tabular-nums">
                {stats.selectedCount.toLocaleString()}
              </span>
              ):
            </span>

            {/* Change Status */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBatchSetStatus(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="px-2 py-1 rounded border border-[#E3D8CB] bg-white text-xs font-semibold"
            >
              <option value="" disabled>
                เปลี่ยน Status ที่เลือก...
              </option>
              {SUPABASE_CONTENT_STATUSES.map((statusVal) => (
                <option key={statusVal} value={statusVal}>
                  {statusVal}
                </option>
              ))}
            </select>

            {/* Change Channel */}
            {config.channels.length > 1 && (
              <select
                onChange={(e) => {
                  onBatchSetChannel(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
                className="px-2 py-1 rounded border border-[#E3D8CB] bg-white text-xs"
              >
                <option value="" disabled>
                  เปลี่ยนช่องที่เลือก...
                </option>
                {config.channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            )}

            {/* Toggle Target Platform */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBatchTogglePlatform(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="px-2 py-1 rounded border border-[#E3D8CB] bg-white text-xs font-semibold text-[#1C4824]"
            >
              <option value="" disabled>
                เปิด/ปิด แพลตฟอร์มที่เลือก...
              </option>
              {SUPABASE_TARGET_PLATFORMS.map((plat) => (
                <option key={plat.id} value={plat.id}>
                  สลับ: {plat.label}
                </option>
              ))}
            </select>

            {/* Toggle Assets */}
            <button
              type="button"
              onClick={() => onBatchToggleAssets(true)}
              className="px-2 py-1 rounded border border-[#E3D8CB] bg-white hover:bg-slate-50 text-[10px] font-bold cursor-pointer whitespace-nowrap"
              title="แนบฟุตเทจ 5 คลิปใน assets สำหรับแถวที่เลือก"
            >
              + แนบ Assets ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => onBatchToggleAssets(false)}
              className="px-2 py-1 rounded border border-[#E3D8CB] bg-white hover:bg-slate-50 text-[10px] text-slate-500 cursor-pointer whitespace-nowrap"
              title="เว้นว่าง assets [] สำหรับแถวที่เลือก"
            >
              เว้นว่าง Assets
            </button>

            {/* Batch Pillar Toggle */}
            <div className="flex items-center gap-0.5 border border-[#E3D8CB] rounded bg-white p-0.5 text-[10px]">
              <span className="px-1 text-[#6E5F52] font-semibold">Pillar:</span>
              <button
                type="button"
                onClick={() => onBatchSetPillar(true)}
                className="px-1.5 py-0.5 rounded text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold cursor-pointer"
                title="เปิดใส่ค่าชื่อหมวดหมู่ใน Pillar สำหรับแถวที่เลือก"
              >
                เปิด
              </button>
              <button
                type="button"
                onClick={() => onBatchSetPillar(false)}
                className="px-1.5 py-0.5 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                title="ปิด (เว้นว่าง null) Pillar สำหรับแถวที่เลือก"
              >
                ปิด (null)
              </button>
            </div>

            {/* Batch Category Toggle */}
            <div className="flex items-center gap-0.5 border border-[#E3D8CB] rounded bg-white p-0.5 text-[10px]">
              <span className="px-1 text-[#6E5F52] font-semibold">Category:</span>
              <button
                type="button"
                onClick={() => onBatchSetCategory(true)}
                className="px-1.5 py-0.5 rounded text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold cursor-pointer"
                title="เปิดใส่ค่าชื่อหมวดหมู่ใน Category สำหรับแถวที่เลือก"
              >
                เปิด
              </button>
              <button
                type="button"
                onClick={() => onBatchSetCategory(false)}
                className="px-1.5 py-0.5 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                title="ปิด (เว้นว่าง null) Category สำหรับแถวที่เลือก"
              >
                ปิด (null)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
