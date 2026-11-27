import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudOff,
  Database,
  Download,
  Radio,
  RefreshCw,
  RotateCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import {
  APP_BUILD_LABEL,
  APP_VERSION,
  hardReloadAndPurgeBrowserCaches,
} from '../../constants/appVersion';
import { BaseModal } from '../ui/BaseModal';
import { SyncHistoryCard } from './SyncHistoryCard';

const COLLECTION_THAI_LABELS: Record<string, string> = {
  footages: 'ฟุตเทจ',
  episodes: 'ตอน 5 อันดับ',
  sources: 'คลิปต้นฉบับ',
  categories: 'หมวดหมู่/แท็ก',
  category_groups: 'กลุ่มหมวดหมู่',
  settings: 'ตั้งค่าระบบ',
};

function formatDateTimeThai(iso: string | null): string {
  if (!iso) return 'ยังไม่มีประวัติซิงก์';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'ยังไม่มีประวัติซิงก์';
  return d.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDiffLabel(diff: number | null): string {
  if (diff === null) return '-';
  if (diff === 0) return 'ตรงกัน';
  return diff > 0 ? `Cloud มากกว่า +${diff}` : `เครื่องมากกว่า +${Math.abs(diff)}`;
}

export const SyncCenterModal: React.FC = () => {
  const {
    isSyncCenterModalOpen,
    setIsSyncCenterModalOpen,
    syncHealth,
    manualDeltaRefresh,
    manualFullPullFromCloud,
    broadcastForceSyncAll,
    flushOutboxNow,
    clearOutboxNow,
    seedToCloud,
    isSeedingToCloud,
  } = useCMS();

  const [confirmFullPull, setConfirmFullPull] = useState(false);
  const [confirmClearOutbox, setConfirmClearOutbox] = useState(false);
  const [showAdvancedPush, setShowAdvancedPush] = useState(false);
  const [confirmPushSeed, setConfirmPushSeed] = useState(false);
  const [isBroadcastingForceSync, setIsBroadcastingForceSync] = useState(false);
  const [isHardReloading, setIsHardReloading] = useState(false);
  const [outboxNotice, setOutboxNotice] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isSyncCenterModalOpen) {
      setConfirmFullPull(false);
      setConfirmClearOutbox(false);
      setShowAdvancedPush(false);
      setConfirmPushSeed(false);
      setOutboxNotice(null);
    }
  }, [isSyncCenterModalOpen]);

  const {
    status,
    isOnline,
    isQuotaExhausted,
    isManualSyncing,
    lastSyncedAt,
    appVersion,
    cloudRequiredVersion,
    isOutdatedVersion,
    outbox,
    drift,
    lastReport,
  } = syncHealth;

  const isBusy =
    isManualSyncing ||
    outbox.isFlushing ||
    isSeedingToCloud ||
    isBroadcastingForceSync ||
    isHardReloading;

  const estimatedFullPullReads =
    (drift.cloudFootage ?? drift.localFootage) +
    (drift.cloudEpisodes ?? drift.localEpisodes) +
    (drift.cloudSources ?? drift.localSources) +
    (drift.cloudCategories ?? drift.localCategories) +
    20;

  const handleSmartDelta = async () => {
    setConfirmFullPull(false);
    setOutboxNotice(null);
    await manualDeltaRefresh();
  };

  const handleFullPull = async () => {
    setConfirmFullPull(false);
    setOutboxNotice(null);
    await manualFullPullFromCloud();
  };

  const handleBroadcastForceSyncAll = async () => {
    setConfirmFullPull(false);
    setOutboxNotice(null);
    setIsBroadcastingForceSync(true);
    try {
      await broadcastForceSyncAll();
    } finally {
      setIsBroadcastingForceSync(false);
    }
  };

  const handleHardReloadBrowser = async () => {
    setIsHardReloading(true);
    await hardReloadAndPurgeBrowserCaches(cloudRequiredVersion || APP_VERSION);
  };

  const handleFlushOutbox = async () => {
    setOutboxNotice(null);
    const res = await flushOutboxNow();
    if (res.error) {
      setOutboxNotice({ ok: false, text: res.error });
    } else if (res.flushedCount > 0) {
      setOutboxNotice({
        ok: true,
        text: `ส่งคิวที่ค้างขึ้น Cloud สำเร็จ ${res.flushedCount} รายการ`,
      });
    } else {
      setOutboxNotice({ ok: true, text: 'ไม่มีรายการค้างส่งในคิวแล้ว' });
    }
  };

  const handleClearOutbox = async () => {
    await clearOutboxNow();
    setConfirmClearOutbox(false);
    setOutboxNotice({
      ok: true,
      text: 'ล้างรายการที่ค้างในคิวเครื่องเรียบร้อยแล้ว',
    });
  };

  const handleConfirmPushSeed = async () => {
    setConfirmPushSeed(false);
    await seedToCloud();
  };

  const comparisonRows = [
    {
      key: 'footage',
      label: 'ฟุตเทจทั้งหมด',
      local: drift.localFootage,
      cloud: drift.cloudFootage,
      diff: drift.cloudFootage === null ? null : drift.footageDiff,
    },
    {
      key: 'episodes',
      label: 'ตอน 5 อันดับ (EP)',
      local: drift.localEpisodes,
      cloud: drift.cloudEpisodes,
      diff: drift.cloudEpisodes === null ? null : drift.episodeDiff,
    },
    {
      key: 'sources',
      label: 'คลิปต้นฉบับ (Live/Source)',
      local: drift.localSources,
      cloud: drift.cloudSources,
      diff: drift.cloudSources === null ? null : drift.sourceDiff,
    },
    {
      key: 'categories',
      label: 'หมวดหมู่ / แท็ก 3 ชั้น',
      local: drift.localCategories,
      cloud: drift.cloudCategories,
      diff: drift.cloudCategories === null ? null : drift.categoryDiff,
    },
  ];

  const statusText =
    status === 'syncing'
      ? 'กำลังซิงก์ข้อมูล'
      : !isOnline
      ? 'ออฟไลน์ (ใช้ข้อมูลในเครื่อง)'
      : isQuotaExhausted
      ? 'ติดเพดานโควตา Firestore รายวัน'
      : isOutdatedVersion
      ? `เบราว์เซอร์นี้ยังเป็นเวอร์ชันเก่า (v${appVersion} -> ล่าสุด v${cloudRequiredVersion})`
      : outbox.count > 0
      ? `มี ${outbox.count} รายการรอส่งขึ้น Cloud`
      : drift.hasDrift
      ? `พบยอดข้อมูลต่างจาก Cloud (${drift.totalAbsDiff} รายการ)`
      : 'ข้อมูลตรงกับ Cloud แล้ว';

  return (
    <BaseModal
      isOpen={isSyncCenterModalOpen}
      onClose={() => setIsSyncCenterModalOpen(false)}
      title="ศูนย์ซิงก์ข้อมูล Cloud & จัดการเวอร์ชันเบราว์เซอร์"
      subtitle="ตรวจสอบยอดเทียบในเครื่องกับ Cloud, บังคับทุกเบราว์เซอร์ (Chrome / Edge / มือถือ) ซิงก์ตรงกัน 100%"
      icon={
        !isOnline || isQuotaExhausted ? (
          <CloudOff className="w-4 h-4 text-rose-600" />
        ) : (
          <Cloud className="w-4 h-4 text-[#3B6845]" />
        )
      }
      maxWidthClass="max-w-2xl"
      bodyClassName="p-4 sm:p-5 bg-[#FAF8F5] space-y-4"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[#7D6E61] truncate font-mono tabular-nums">
            {APP_BUILD_LABEL} · ซิงก์ข้ามแท็บอัตโนมัติ (0 Read)
          </div>
          <button
            type="button"
            onClick={() => setIsSyncCenterModalOpen(false)}
            className="px-4 py-2 text-xs font-bold text-[#5C4E41] bg-[#F4EFE8] hover:bg-[#EAE1D5] border border-[#E2D5C4] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      }
    >
      {/* 1. Clean Metadata Status Line */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 px-0.5">
        <span className="font-semibold text-slate-800">{statusText}</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span className="font-mono tabular-nums text-slate-500">
          ซิงก์ล่าสุด {formatDateTimeThai(lastSyncedAt)}
        </span>
      </div>

      {/* 1.5 Browser Version & Cross-Browser Force-Sync Control Card */}
      <div
        className={`rounded-2xl border p-3.5 space-y-2.5 ${
          isOutdatedVersion
            ? 'bg-amber-50/90 border-amber-300'
            : 'bg-white border-slate-200/80'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>ควบคุมเวอร์ชัน & บังคับซิงก์ข้ามเบราว์เซอร์ (Chrome / Edge / มือถือ)</span>
          </div>
          <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-600">
            เครื่องนี้ v{appVersion}
            {cloudRequiredVersion ? ` · Cloud v${cloudRequiredVersion}` : ''}
          </span>
        </div>

        <p className="text-[11px] text-slate-600 leading-snug">
          หากเปิด Chrome กับ Edge แล้วข้อมูลหรือแท็กไม่ตรงกัน หรือเบราว์เซอร์เก่าติดแคชไม่ยอมอัปเดตเวอร์ชัน สามารถกดสั่งบังคับทุกเบราว์เซอร์ดึงข้อมูลจาก Cloud ใหม่พร้อมกัน หรือล้างแคชเบราว์เซอร์นี้ได้ทันที
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleBroadcastForceSyncAll}
            disabled={isBusy || !isOnline}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Radio
              className={`w-3.5 h-3.5 shrink-0 ${
                isBroadcastingForceSync ? 'animate-spin' : ''
              }`}
            />
            <span className="truncate">
              {isBroadcastingForceSync
                ? 'กำลังส่งสัญญาณซิงก์ทุกเครื่อง...'
                : 'สั่งทุกเบราว์เซอร์ดึง Cloud ใหม่พร้อมกัน'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleHardReloadBrowser}
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 disabled:opacity-50 text-slate-800 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 shrink-0 ${
                isHardReloading ? 'animate-spin' : ''
              }`}
            />
            <span className="truncate">
              {isHardReloading
                ? 'กำลังล้างแคชและรีโหลด...'
                : 'ล้างแคชเบราว์เซอร์นี้ & อัปเดตเวอร์ชัน'}
            </span>
          </button>
        </div>
      </div>

      {/* Offline or Quota Advisory Banner */}
      {(!isOnline || isQuotaExhausted) && (
        <div className="rounded-2xl bg-rose-50/90 border border-rose-200 px-4 py-3 flex items-start gap-3">
          <CloudOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 leading-relaxed">
            {!isOnline
              ? 'ขณะนี้อุปกรณ์กำลังออฟไลน์ คุณยังทำงานต่อได้ตามปกติ รายการที่แก้ไขจะถูกเก็บในคิว IndexedDB และส่งขึ้น Cloud ให้อัตโนมัติทันทีที่เน็ตกลับมา'
              : 'ระบบตรวจพบว่าโควตา Firestore รายวัน (Free Tier) เต็มชั่วคราว ข้อมูลในเครื่องยังใช้งานได้ครบถ้วน และคิวที่ค้างส่งจะถูกเก็บไว้รอจนกว่าโควตาจะรีเซ็ต'}
          </div>
        </div>
      )}

      {/* 2. Local vs Cloud Count Comparison Table (Single-Elevation, Tabular Numerals) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>เทียบจำนวนข้อมูลในเครื่อง กับ Cloud</span>
          </div>
          {drift.hasDrift ? (
            <span className="text-[11px] font-semibold text-amber-700">
              พบส่วนต่าง · แนะนำให้รีเฟรช
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-700">
              ยอดตรงกัน
            </span>
          )}
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="text-left font-semibold px-4 py-2">หมวดข้อมูล</th>
              <th className="text-right font-semibold px-3 py-2">ในเครื่อง</th>
              <th className="text-right font-semibold px-3 py-2">บน Cloud</th>
              <th className="text-right font-semibold px-4 py-2">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comparisonRows.map((row) => {
              const isMismatch = row.diff !== null && row.diff !== 0;
              return (
                <tr key={row.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {row.label}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {row.local.toLocaleString('th-TH')}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">
                    {row.cloud === null ? '—' : row.cloud.toLocaleString('th-TH')}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono tabular-nums font-semibold ${
                      isMismatch ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {formatDiffLabel(row.diff)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Persistent Offline Outbox Queue Panel (only shown when items exist or notice active) */}
      {(outbox.count > 0 || outboxNotice) && (
        <div className="bg-amber-50/75 border border-amber-200/90 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <UploadCloud className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-950">
                  คิวรอส่งขึ้น Cloud อัตโนมัติ ({outbox.count} รายการ)
                </div>
                <p className="text-[11px] text-amber-900/80 mt-0.5 leading-snug">
                  ระบบบันทึกคำสั่งที่ส่งไม่ผ่านไว้ในเครื่อง (IndexedDB) และจะพยายามส่งซ้ำให้อัตโนมัติเมื่อการเชื่อมต่อพร้อม
                </p>
              </div>
            </div>
          </div>

          {outbox.items.length > 0 && (
            <div className="bg-white/90 border border-amber-200/70 rounded-xl divide-y divide-amber-100/80 max-h-28 overflow-y-auto scrollbar-thin">
              {outbox.items.slice(0, 6).map((item) => (
                <div
                  key={item.opKey}
                  className="px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="text-slate-700 truncate">
                    <span className="font-semibold">
                      {item.action === 'delete' ? 'ลบ' : 'บันทึก'}
                    </span>{' '}
                    {COLLECTION_THAI_LABELS[item.collection] || item.collection} ·{' '}
                    <span className="font-mono text-slate-600">{item.entityId}</span>
                  </span>
                  <span className="font-mono tabular-nums text-[10px] text-amber-700 shrink-0">
                    ลองซ้ำ {item.retryCount}x
                  </span>
                </div>
              ))}
              {outbox.items.length > 6 && (
                <div className="px-3 py-1.5 text-[11px] text-amber-800 font-medium text-center">
                  และอีก {outbox.items.length - 6} รายการ
                </div>
              )}
            </div>
          )}

          {outbox.lastFlushError && (
            <div className="text-[11px] text-rose-700 leading-snug">
              สาเหตุล่าสุด: {outbox.lastFlushError}
            </div>
          )}

          {outboxNotice && (
            <div
              className={`text-[11px] font-semibold ${
                outboxNotice.ok ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {outboxNotice.text}
            </div>
          )}

          {outbox.count > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleFlushOutbox}
                disabled={isBusy || !isOnline}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{outbox.isFlushing ? 'กำลังส่งคิว...' : 'ส่งคิวที่ค้างตอนนี้'}</span>
              </button>

              {!confirmClearOutbox ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearOutbox(true)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ล้างคิวค้าง</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleClearOutbox}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    ยืนยันล้างคิว
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearOutbox(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-white text-slate-600 border border-slate-200 text-[11px] font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. 2-Tier Manual Refresh Actions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-bold text-slate-800">
          เลือกรูปแบบการรีเฟรชข้อมูลจาก Cloud
        </div>

        {/* Tier 1: Smart Delta Refresh (Primary) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/70">
          <div className="min-w-0">
            <div className="text-xs font-bold text-indigo-950">
              1. ดึงข้อมูลล่าสุด (Smart Delta Refresh) · แนะนำ
            </div>
            <p className="text-[11px] text-indigo-900/75 mt-0.5 leading-snug">
              ดึงเฉพาะรายการที่เพิ่ม/แก้ในช่วง 24 ชม. ล่าสุด พร้อมประยุกต์รายการลบ ประหยัดโควตาที่สุด
            </p>
          </div>
          <button
            type="button"
            onClick={handleSmartDelta}
            disabled={isBusy || !isOnline}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`}
            />
            <span>{isManualSyncing ? 'กำลังดึง...' : 'ดึงข้อมูลล่าสุด'}</span>
          </button>
        </div>

        {/* Tier 2: Full Authoritative Pull (Secondary with inline quota confirmation) */}
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800">
                2. ดึงข้อมูลใหม่ทั้งหมดจาก Cloud (Full Pull)
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                ใช้เมื่อไม่ได้เปิดเครื่องเกิน 14 วัน, ลบชุดใหญ่เกิน 400 คลิป หรือยอดในเครื่องยังไม่ตรงหลังกด Smart Delta
              </p>
            </div>
            {!confirmFullPull && (
              <button
                type="button"
                onClick={() => setConfirmFullPull(true)}
                disabled={isBusy || !isOnline}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดึงใหม่ทั้งหมด</span>
              </button>
            )}
          </div>

          {confirmFullPull && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start gap-2 text-[11px] text-amber-900 leading-snug">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  จะอ่านข้อมูลประมาณ{' '}
                  <strong className="font-mono tabular-nums">
                    ~{estimatedFullPullReads.toLocaleString('th-TH')}
                  </strong>{' '}
                  เอกสารจาก Firestore และแทนที่แคชในเครื่องนี้ด้วยข้อมูลล่าสุดจาก Cloud
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleFullPull}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  ยืนยันดึงทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmFullPull(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-white text-slate-600 border border-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Last Manual Refresh Report */}
        {lastReport && (
          <div
            className={`rounded-xl px-3.5 py-2.5 border flex items-start gap-2.5 text-xs ${
              lastReport.ok
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            {lastReport.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold leading-snug">{lastReport.message}</div>
              <div className="text-[11px] opacity-75 font-mono tabular-nums mt-0.5">
                {formatDateTimeThai(lastReport.syncedAt)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Sync History & Consistency Debugger */}
      <SyncHistoryCard
        currentLocalCounts={{
          footage: drift.localFootage,
          episodes: drift.localEpisodes,
          sources: drift.localSources,
        }}
        currentCloudCounts={{
          footage: drift.cloudFootage,
          episodes: drift.cloudEpisodes,
          sources: drift.cloudSources,
        }}
        hasActiveDrift={drift.hasDrift}
      />

      {/* 6. Collapsible Advanced Recovery (Safe Guarded Local-to-Cloud Push) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setShowAdvancedPush((prev) => !prev);
            setConfirmPushSeed(false);
          }}
          className="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <span>เครื่องมือขั้นสูง (สำรองข้อมูลจากเครื่องนี้ขึ้น Cloud)</span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
              showAdvancedPush ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showAdvancedPush && (
          <div className="px-4 pb-3.5 pt-2 border-t border-slate-100 space-y-2.5 bg-slate-50/40">
            <p className="text-[11px] text-slate-600 leading-relaxed">
              คำสั่งนี้จะยึดข้อมูลในเครื่องนี้เป็นหลัก (Master) แล้วส่งขึ้นไปทับบน Firestore ทั้งหมด พร้อมลบข้อมูลเก่าหรือส่วนเกินบน Cloud ออกให้อัตโนมัติ เพื่อให้ Cloud ตรงกับเครื่องนี้ 100% (หลังจากทำเสร็จ เครื่องเพื่อนสามารถกด &quot;2. ดึงข้อมูลใหม่ทั้งหมดจาก Cloud&quot; เพื่อรับข้อมูลชุดเดียวกันได้ทันที)
            </p>
            {!confirmPushSeed ? (
              <button
                type="button"
                onClick={() => setConfirmPushSeed(true)}
                disabled={isBusy || !isOnline}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>อัปโหลดข้อมูลจากเครื่องนี้เป็นหลักขึ้น Cloud...</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmPushSeed}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  {isSeedingToCloud
                    ? 'กำลังอัปโหลดและปรับ Cloud...'
                    : 'ยืนยันตั้งเครื่องนี้เป็นหลักขึ้น Cloud'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPushSeed(false)}
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-600 border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
};
