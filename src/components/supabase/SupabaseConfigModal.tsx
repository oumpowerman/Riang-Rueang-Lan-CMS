import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Tv,
  ExternalLink,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import {
  SupabaseConnectionConfig,
  SupabaseChannelPreset,
  SUPABASE_CONTENT_STATUSES,
  SUPABASE_TARGET_PLATFORMS,
} from '../../types/supabaseSync.types';
import {
  loadSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../../services/supabaseService';
import { isValidUUID } from '../../utils/supabasePayloadMapper';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: SupabaseConnectionConfig) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<SupabaseConnectionConfig>(loadSupabaseConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    detectedChannels?: Array<{ id: string; name: string }>;
  } | null>(null);

  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelId, setNewChannelId] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = loadSupabaseConfig();
      setConfig(current);
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(config);
      setTestResult(res);

      // Auto-add detected channels if available
      if (res.detectedChannels && res.detectedChannels.length > 0) {
        setConfig((prev) => {
          const existingIds = new Set(prev.channels.map((c) => c.id));
          const newChannels: SupabaseChannelPreset[] = [...prev.channels];
          res.detectedChannels?.forEach((dc) => {
            if (!existingIds.has(dc.id)) {
              newChannels.push({ id: dc.id, name: dc.name });
            }
          });
          return { ...prev, channels: newChannels };
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveSupabaseConfig(config);
    onConfigSaved?.(config);
    onClose();
  };

  const handleAddChannel = () => {
    if (!newChannelId.trim()) return;
    const item: SupabaseChannelPreset = {
      id: newChannelId.trim(),
      name: newChannelName.trim() || `ช่อง ${newChannelId.trim().slice(0, 8)}`,
    };
    setConfig((prev) => ({
      ...prev,
      channels: [...prev.channels, item],
      targetChannelId: prev.targetChannelId || item.id,
    }));
    setNewChannelName('');
    setNewChannelId('');
    setShowAddChannel(false);
  };

  const handleRemoveChannel = (channelId: string) => {
    setConfig((prev) => ({
      ...prev,
      channels: prev.channels.filter((c) => c.id !== channelId),
      targetChannelId:
        prev.targetChannelId === channelId ? '' : prev.targetChannelId,
    }));
  };

  const isChannelIdValid =
    !config.targetChannelId || isValidUUID(config.targetChannelId);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      icon={<Database className="w-5 h-5 text-[#2E7D32]" />}
      title="ตั้งค่าเชื่อมต่อฐานข้อมูล Supabase"
      badge={
        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] font-bold">
          ตาราง contents
        </span>
      }
      subtitle="เชื่อมต่อฐานข้อมูลหลักเพื่อส่งออกข้อมูล EP เข้าสู่ตาราง public.contents ร่วมกับช่องอื่นๆ"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !config.url || !config.anonKey}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`}
            />
            <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E5F52] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3B6845] hover:bg-[#2D5236] text-white shadow-xs transition-colors cursor-pointer"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-5 text-sm text-[#4A3E31]">
        {/* Test Connection Banner */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
              testResult.success
                ? 'bg-[#EEF5EE] border-[#BAD8BF] text-[#1C4824]'
                : 'bg-[#FDF2F2] border-[#F8B4B4] text-[#9B1C1C]'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32] mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C81E1E] mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-bold">{testResult.message}</div>
              {testResult.detectedChannels && (
                <div className="mt-1 text-[11px] opacity-80">
                  พบข้อมูลช่องในตาราง channels: {testResult.detectedChannels.length} ช่อง
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1. Supabase Credentials */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#3D332A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#3B6845]" />
              <span>1. Supabase API Credentials</span>
            </label>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#3B6845] hover:underline flex items-center gap-1"
            >
              <span>เปิด Supabase Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#6E5F52]">
              Project URL
            </span>
            <input
              type="text"
              value={config.url}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="https://your-project.supabase.co"
              className="w-full px-3 py-2 rounded-lg border border-[#E3D8CB] bg-white text-xs font-mono text-[#3D332A] focus:outline-none focus:ring-1.5 focus:ring-[#8FA892]"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#6E5F52]">
              API Key (Anon / Service Role)
            </span>
            <input
              type="password"
              value={config.anonKey}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, anonKey: e.target.value }))
              }
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full px-3 py-2 rounded-lg border border-[#E3D8CB] bg-white text-xs font-mono text-[#3D332A] focus:outline-none focus:ring-1.5 focus:ring-[#8FA892]"
            />
          </div>
        </div>

        {/* 2. Channel Preset & Target UUID */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#3D332A] flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-[#3B6845]" />
              <span>2. ช่องปลายทาง (Target channel_id)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAddChannel((prev) => !prev)}
              className="text-xs text-[#3B6845] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มช่องใหม่</span>
            </button>
          </div>

          {/* Quick Channel Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#6E5F52]">
              เลือกช่องที่ใช้งาน:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {config.channels.map((ch) => {
                const isSelected = config.targetChannelId === ch.id;
                return (
                  <div
                    key={ch.id || 'none'}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        targetChannelId: ch.id,
                      }))
                    }
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EEF5EE] border-[#BAD8BF] text-[#1C4824] font-bold ring-1 ring-[#BAD8BF]'
                        : 'bg-white border-[#E8DFD3] text-[#524538] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="truncate min-w-0 pr-2">
                      <div className="truncate">{ch.name}</div>
                      <div className="text-[10px] font-mono opacity-70 truncate">
                        {ch.id || '(ยังไม่ได้ระบุ UUID)'}
                      </div>
                    </div>
                    {config.channels.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveChannel(ch.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="ลบช่องนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Channel Form */}
          {showAddChannel && (
            <div className="p-3 rounded-lg bg-white border border-[#E3D8CB] space-y-2">
              <div className="text-xs font-bold text-[#3D332A]">
                เพิ่มรายการช่องใหม่:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="ชื่อช่อง (เช่น เรียงเรื่องลั่น ช็อตส์)"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E3D8CB] text-xs"
                />
                <input
                  type="text"
                  placeholder="Channel UUID (เช่น d3b07384-...)"
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E3D8CB] text-xs font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddChannel(false)}
                  className="px-2.5 py-1 rounded text-xs text-[#6E5F52]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAddChannel}
                  disabled={!newChannelId.trim()}
                  className="px-3 py-1 rounded text-xs font-bold bg-[#3B6845] text-white disabled:opacity-50"
                >
                  บันทึกช่อง
                </button>
              </div>
            </div>
          )}

          {/* Direct UUID Input */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#6E5F52]">
              Channel ID (UUID ในตาราง channels):
            </span>
            <input
              type="text"
              value={config.targetChannelId}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  targetChannelId: e.target.value,
                }))
              }
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-none ${
                isChannelIdValid
                  ? 'border-[#E3D8CB] bg-white text-[#3D332A] focus:ring-1.5 focus:ring-[#8FA892]'
                  : 'border-rose-300 bg-rose-50/40 text-rose-800'
              }`}
            />
            {!isChannelIdValid && (
              <span className="text-[10px] text-rose-600 block">
                รูปแบบไม่ใช่ UUID ที่ถูกต้อง (หากเว้นว่างไว้ จะส่งค่าเป็น null)
              </span>
            )}
          </div>
        </div>

        {/* 3. Field Defaults (Status, Assets, Description) */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] space-y-3.5">
          <label className="text-xs font-bold text-[#3D332A] flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#3B6845]" />
            <span>3. ค่าเริ่มต้นสำหรับ Record (Defaults & Toggles)</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Default Status */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#6E5F52]">
                สถานะเริ่มต้น (status)
              </span>
              <select
                value={config.defaultStatus}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    defaultStatus: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E3D8CB] bg-white text-xs font-semibold text-[#3D332A] focus:outline-none"
              >
                {SUPABASE_CONTENT_STATUSES.map((statusVal) => (
                  <option key={statusVal} value={statusVal}>
                    {statusVal}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Mode */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#6E5F52]">
                โหมดคำบรรยาย (description)
              </span>
              <select
                value={config.defaultDescriptionMode}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    defaultDescriptionMode: e.target.value as any,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E3D8CB] bg-white text-xs text-[#3D332A] focus:outline-none"
              >
                <option value="AUTO">AUTO (สรุปข้อมูลหมวดหมู่และแท็กอัตโนมัติ)</option>
                <option value="EMPTY">EMPTY (เว้นว่างไว้ null เพื่อไปเขียนในระบบหลัก)</option>
              </select>
            </div>
          </div>

          {/* Default Target Platforms Multi-Select */}
          <div className="space-y-1.5 pt-2 border-t border-[#E8DFD3]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3D332A]">
                แพลตฟอร์มปลายทางเริ่มต้น (target_platform)
              </span>
              <span className="text-[11px] text-[#6E5F52]">
                เลือกได้หลายรายการ (บันทึกเป็น Array)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUPABASE_TARGET_PLATFORMS.map((plat) => {
                const isSelected = (config.defaultTargetPlatforms || []).includes(plat.id);
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => {
                      setConfig((prev) => {
                        const currentList = prev.defaultTargetPlatforms || [];
                        const newList = isSelected
                          ? currentList.filter((p) => p !== plat.id)
                          : [...currentList, plat.id];
                        return {
                          ...prev,
                          defaultTargetPlatforms: newList.length > 0 ? newList : [plat.id],
                        };
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF] ring-1 ring-[#BAD8BF] shadow-2xs'
                        : 'bg-white text-[#6E5F52] border-[#E3D8CB] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {plat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Include Assets Toggle */}
          <div className="pt-2 border-t border-[#E8DFD3] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#3D332A]">
                แนบข้อมูลฟุตเทจ 5 คลิปในฟิลด์ assets
              </div>
              <div className="text-[11px] text-[#6E5F52]">
                บันทึกรายชื่อและสัดส่วนคลิปย่อย 5 ชิ้นลงใน JSONB เพื่อสืบย้อนรอย
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  defaultIncludeAssets: !prev.defaultIncludeAssets,
                }))
              }
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                config.defaultIncludeAssets ? 'bg-[#3B6845]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  config.defaultIncludeAssets ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Include Pillar Toggle */}
          <div className="pt-2 border-t border-[#E8DFD3] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#3D332A]">
                ส่งค่า Pillar เริ่มต้น (pillar)
              </div>
              <div className="text-[11px] text-[#6E5F52]">
                หากปิดไว้จะส่งค่าเป็น <code className="font-mono text-emerald-800 font-semibold">null</code> (ค่าเริ่มต้น) หากเปิดจะใส่ชื่อหมวดหมู่/ซีรีส์
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  defaultIncludePillar: !prev.defaultIncludePillar,
                }))
              }
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                config.defaultIncludePillar ? 'bg-[#3B6845]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  config.defaultIncludePillar ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Include Category Toggle */}
          <div className="pt-2 border-t border-[#E8DFD3] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#3D332A]">
                ส่งค่า Category เริ่มต้น (category)
              </div>
              <div className="text-[11px] text-[#6E5F52]">
                หากปิดไว้จะส่งค่าเป็น <code className="font-mono text-emerald-800 font-semibold">null</code> (ค่าเริ่มต้น) หากเปิดจะใส่ชื่อหมวดหมู่/ซีรีส์
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  defaultIncludeCategory: !prev.defaultIncludeCategory,
                }))
              }
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                config.defaultIncludeCategory ? 'bg-[#3B6845]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  config.defaultIncludeCategory ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
