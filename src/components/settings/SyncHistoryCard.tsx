import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Trash2,
  ShieldCheck,
  ArrowRight,
  Database,
  Cloud,
  Check,
} from 'lucide-react';
import {
  SyncConflictRecord,
  SyncHistoryEntry,
  syncHistoryService,
} from '../../services/syncHistoryService';

interface SyncHistoryCardProps {
  currentLocalCounts?: {
    footage: number;
    episodes: number;
    sources: number;
  };
  currentCloudCounts?: {
    footage: number | null;
    episodes: number | null;
    sources: number | null;
  };
  hasActiveDrift?: boolean;
}

export const SyncHistoryCard: React.FC<SyncHistoryCardProps> = ({
  currentLocalCounts,
  currentCloudCounts,
  hasActiveDrift = false,
}) => {
  const [activeTab, setActiveTab] = useState<'success' | 'conflicts'>('success');
  const [last5Syncs, setLast5Syncs] = useState<SyncHistoryEntry[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflictRecord[]>([]);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const loadData = () => {
    setLast5Syncs(syncHistoryService.getLast5SuccessfulSyncs());
    setConflicts(syncHistoryService.getConflicts());
  };

  useEffect(() => {
    loadData();
    const unsub = syncHistoryService.subscribe(loadData);
    return () => unsub();
  }, []);

  const formatDateTimeThai = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getRelativeTimeThai = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'เมื่อสักครู่';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay} วันที่แล้ว`;
    } catch {
      return '';
    }
  };

  const getTypeBadge = (type: SyncHistoryEntry['type']) => {
    switch (type) {
      case 'push_seed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
            Master Push
          </span>
        );
      case 'full':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            Full Pull
          </span>
        );
      case 'smart_sync':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            Sync Pulse
          </span>
        );
      case 'delta':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
            Delta Sync
          </span>
        );
    }
  };

  const activeConflicts = conflicts.filter((c) => !c.isResolved);
  const resolvedConflicts = conflicts.filter((c) => c.isResolved);

  const handleCopyDebugData = () => {
    const debugPayload = {
      timestamp: new Date().toISOString(),
      currentLocalCounts,
      currentCloudCounts,
      hasActiveDrift,
      last5Syncs,
      conflicts,
    };
    void navigator.clipboard.writeText(JSON.stringify(debugPayload, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClear = () => {
    if (window.confirm('คุณต้องการล้างประวัติการซิงก์และข้อขัดแย้งทั้งหมดใช่หรือไม่?')) {
      syncHistoryService.clearAll();
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                ประวัติการซิงก์ & ตรวจสอบข้อขัดแย้ง (Sync History)
              </h4>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                5 ล่าสุด
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              บันทึกเวลาที่ซิงก์สำเร็จ และสถานะความสอดคล้องระหว่าง Local Storage กับ Firestore
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyDebugData}
            title="คัดลอกข้อมูลดีบั๊กแบบ JSON"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>คัดลอกข้อมูล Debug</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleClear}
            title="ล้างประวัติบันทึก"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/40 px-4 sm:px-5">
        <button
          type="button"
          onClick={() => setActiveTab('success')}
          className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'success'
              ? 'border-indigo-500 text-indigo-700 bg-white/60'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>ซิงก์สำเร็จ 5 ครั้งล่าสุด</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            {last5Syncs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('conflicts')}
          className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'conflicts'
              ? 'border-indigo-500 text-indigo-700 bg-white/60'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle
            className={`w-3.5 h-3.5 ${
              activeConflicts.length > 0 || hasActiveDrift
                ? 'text-amber-500'
                : 'text-slate-400'
            }`}
          />
          <span>บันทึกข้อขัดแย้ง (Conflicts & Drift)</span>
          {activeConflicts.length > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold animate-pulse">
              {activeConflicts.length} ค้าง
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-medium">
              0
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Last 5 Successful Sync Timestamps */}
      {activeTab === 'success' && (
        <div className="p-4 sm:p-5">
          {last5Syncs.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              ยังไม่มีประวัติการซิงก์สำเร็จในระบบ
            </div>
          ) : (
            <div className="space-y-3">
              {last5Syncs.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 transition-colors text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-800">
                          #{idx + 1} {item.label}
                        </span>
                        {getTypeBadge(item.type)}
                        {item.durationMs && (
                          <span className="text-[10px] text-slate-600 font-mono">
                            ({item.durationMs}ms)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed truncate">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-[11px] font-semibold text-slate-700">
                      {formatDateTimeThai(item.timestamp)}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                      {getRelativeTimeThai(item.timestamp)}
                    </div>
                    {(item.upsertedCount > 0 || item.deletedCount > 0) && (
                      <div className="flex items-center justify-end gap-1.5 mt-1 font-mono text-[10px]">
                        {item.upsertedCount > 0 && (
                          <span className="text-emerald-600 font-semibold">
                            +{item.upsertedCount}
                          </span>
                        )}
                        {item.deletedCount > 0 && (
                          <span className="text-rose-600 font-semibold">
                            -{item.deletedCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Conflict & Consistency Debugging */}
      {activeTab === 'conflicts' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Active Consistency Status Banner */}
          {!hasActiveDrift && activeConflicts.length === 0 ? (
            <div className="rounded-xl p-3.5 bg-emerald-50/80 border border-emerald-200/90 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-emerald-900">
                  สถานะความสอดคล้อง: ตรงกัน 100% (No Active Conflicts)
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                  ฐานข้อมูลในเครื่อง (IndexedDB/Local Storage) มีจำนวนและเนื้อหาตรงกับ Cloud Firestore อย่างสมบูรณ์ ไม่พบข้อขัดแย้งค้างอยู่
                </p>
                {currentLocalCounts && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex flex-wrap gap-3 text-[11px] font-mono text-emerald-800">
                    <span>ฟุตเทจ: {currentLocalCounts.footage} รายการ</span>
                    <span>• ตอน (EP): {currentLocalCounts.episodes} ตอน</span>
                    <span>• แหล่งที่มา: {currentLocalCounts.sources}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-3.5 bg-amber-50/90 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-amber-900">
                  ตรวจพบความแตกต่างระหว่างเครื่องกับ Cloud (Drift Detected)
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  ยอดข้อมูลระหว่างแคชในเครื่องกับ Firestore ไม่ตรงกันชั่วคราว คุณสามารถรัน Full Pull เพื่อดึงข้อมูลสด หรือรัน Master Push เพื่อส่งเครื่องนี้เป็นหลักได้
                </p>
                {currentLocalCounts && currentCloudCounts && (
                  <div className="mt-2.5 p-2 rounded-lg bg-white/70 border border-amber-200/80 text-[11px] font-mono grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-600">Footage:</span>{' '}
                      <span className="font-bold text-slate-800">
                        {currentLocalCounts.footage} vs {currentCloudCounts.footage ?? '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Episodes:</span>{' '}
                      <span className="font-bold text-slate-800">
                        {currentLocalCounts.episodes} vs {currentCloudCounts.episodes ?? '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Sources:</span>{' '}
                      <span className="font-bold text-slate-800">
                        {currentLocalCounts.sources} vs {currentCloudCounts.sources ?? '-'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conflict History Timeline */}
          <div>
            <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              ประวัติการบันทึกข้อขัดแย้ง ({conflicts.length} รายการ)
            </h5>
            {conflicts.length === 0 ? (
              <div className="text-center py-5 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-slate-100">
                ไม่เคยมีประวัติข้อขัดแย้งในระบบ
              </div>
            ) : (
              <div className="space-y-2.5">
                {conflicts.map((conf) => (
                  <div
                    key={conf.id}
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      conf.isResolved
                        ? 'bg-slate-50/70 border-slate-200 text-slate-700'
                        : 'bg-rose-50/80 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {conf.isResolved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" /> คลี่คลายแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> กำลังเกิดข้อขัดแย้ง
                          </span>
                        )}
                        <span className="font-semibold text-[11px]">
                          {conf.diffSummary}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {formatDateTimeThai(conf.detectedAt)}
                      </span>
                    </div>

                    {/* Counts Comparison Box */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono bg-white/80 p-2 rounded-lg border border-slate-200/60">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Database className="w-3 h-3 text-indigo-500" />
                        <span>Local:</span>
                        <span className="font-bold text-slate-800">
                          {conf.localCounts.footage}ฟุต / {conf.localCounts.episodes}EP
                        </span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <div className="flex items-center gap-1 text-slate-600">
                        <Cloud className="w-3 h-3 text-sky-500" />
                        <span>Firestore:</span>
                        <span className="font-bold text-slate-800">
                          {conf.cloudCounts.footage ?? '-'}ฟุต /{' '}
                          {conf.cloudCounts.episodes ?? '-'}EP
                        </span>
                      </div>
                    </div>

                    {conf.resolutionNote && (
                      <p className="mt-1.5 text-[10px] text-emerald-700 font-medium">
                        ✓ การแก้ไข: {conf.resolutionNote}{' '}
                        {conf.resolvedAt && (
                          <span className="text-slate-600 font-mono">
                            ({formatDateTimeThai(conf.resolvedAt)})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
