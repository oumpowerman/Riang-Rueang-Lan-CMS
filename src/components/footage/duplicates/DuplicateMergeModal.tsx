import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CopyCheck,
  GitMerge,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { MergeDuplicateFootagesResult } from '../../../context/cms/useCMSDuplicateMerge';
import {
  DuplicateCluster,
  DuplicateMatchReason,
  DuplicateMergePlan,
  DuplicateScanSummary,
  getDuplicateReasonLabel,
} from '../../../utils/duplicateClusterScanner';
import { BaseModal } from '../../ui/BaseModal';
import { DuplicateClusterCard } from './DuplicateClusterCard';

interface DuplicateMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateScan: DuplicateScanSummary;
}

type ReasonFilter = 'ALL' | DuplicateMatchReason;

export const DuplicateMergeModal: React.FC<DuplicateMergeModalProps> = ({
  isOpen,
  onClose,
  duplicateScan,
}) => {
  const { episodes, tagMap, mergeDuplicateFootages } = useCMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('ALL');
  const [survivorByClusterId, setSurvivorByClusterId] = useState<
    Record<string, string>
  >({});
  const [excludedByClusterId, setExcludedByClusterId] = useState<
    Record<string, string[]>
  >({});
  const [isMerging, setIsMerging] = useState(false);
  const [isConfirmingAutoMergeAll, setIsConfirmingAutoMergeAll] = useState(false);
  const [lastMergeResult, setLastMergeResult] =
    useState<MergeDuplicateFootagesResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsConfirmingAutoMergeAll(false);
      return;
    }
    setLastMergeResult(null);
    setIsConfirmingAutoMergeAll(false);
  }, [isOpen]);

  const filteredClusters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return duplicateScan.clusters.filter((cluster) => {
      if (reasonFilter !== 'ALL' && !cluster.reasons.includes(reasonFilter)) {
        return false;
      }
      if (!q) return true;
      return cluster.items.some(
        (ft) =>
          ft.id.toLowerCase().includes(q) ||
          ft.title.toLowerCase().includes(q) ||
          (ft.originalUrl || '').toLowerCase().includes(q) ||
          (ft.driveFileUrl || '').toLowerCase().includes(q)
      );
    });
  }, [duplicateScan.clusters, reasonFilter, searchQuery]);

  const getSelectedSurvivorId = (cluster: DuplicateCluster): string => {
    const chosen = survivorByClusterId[cluster.clusterId];
    if (chosen && cluster.items.some((it) => it.id === chosen)) {
      return chosen;
    }
    return cluster.recommendedSurvivorId;
  };

  const getExcludedIds = (cluster: DuplicateCluster): string[] => {
    return excludedByClusterId[cluster.clusterId] || [];
  };

  const handleSelectSurvivor = (clusterId: string, survivorId: string) => {
    setIsConfirmingAutoMergeAll(false);
    setSurvivorByClusterId((prev) => ({
      ...prev,
      [clusterId]: survivorId,
    }));
    setExcludedByClusterId((prev) => {
      const current = prev[clusterId];
      if (!current || !current.includes(survivorId)) return prev;
      return {
        ...prev,
        [clusterId]: current.filter((id) => id !== survivorId),
      };
    });
  };

  const handleToggleExcludeDuplicate = (clusterId: string, footageId: string) => {
    setIsConfirmingAutoMergeAll(false);
    setExcludedByClusterId((prev) => {
      const current = prev[clusterId] || [];
      const exists = current.includes(footageId);
      return {
        ...prev,
        [clusterId]: exists
          ? current.filter((id) => id !== footageId)
          : [...current, footageId],
      };
    });
  };

  const buildPlanForCluster = (
    cluster: DuplicateCluster
  ): DuplicateMergePlan | null => {
    const survivorId = getSelectedSurvivorId(cluster);
    const excludedSet = new Set(getExcludedIds(cluster));
    const duplicateIds = cluster.items
      .filter((ft) => ft.id !== survivorId && !excludedSet.has(ft.id))
      .map((ft) => ft.id);

    if (duplicateIds.length === 0) return null;
    return { survivorId, duplicateIds };
  };

  const allPendingPlans = useMemo(() => {
    return filteredClusters
      .map(buildPlanForCluster)
      .filter((p): p is DuplicateMergePlan => p !== null);
  }, [filteredClusters, survivorByClusterId, excludedByClusterId]);

  const totalPendingDuplicatesCount = useMemo(
    () => allPendingPlans.reduce((acc, p) => acc + p.duplicateIds.length, 0),
    [allPendingPlans]
  );

  const handleMergeSingleCluster = async (cluster: DuplicateCluster) => {
    const plan = buildPlanForCluster(cluster);
    if (!plan || isMerging) return;

    setIsMerging(true);
    setIsConfirmingAutoMergeAll(false);
    try {
      const result = await mergeDuplicateFootages([plan]);
      setLastMergeResult(result);
    } finally {
      setIsMerging(false);
    }
  };

  const handleExecuteAutoMergeAll = async () => {
    if (allPendingPlans.length === 0 || isMerging) return;
    setIsMerging(true);
    setIsConfirmingAutoMergeAll(false);
    try {
      const result = await mergeDuplicateFootages(allPendingPlans);
      setLastMergeResult(result);
    } finally {
      setIsMerging(false);
    }
  };

  const reasonTabOptions: Array<{ id: ReasonFilter; label: string; count: number }> =
    useMemo(() => {
      const counts: Record<DuplicateMatchReason, number> = {
        TITLE: 0,
        DRIVE_LINK: 0,
        ORIGINAL_LINK: 0,
      };
      duplicateScan.clusters.forEach((c) => {
        c.reasons.forEach((r) => {
          counts[r] += 1;
        });
      });

      return [
        {
          id: 'ALL',
          label: 'ทั้งหมด',
          count: duplicateScan.duplicateClusterCount,
        },
        {
          id: 'DRIVE_LINK',
          label: getDuplicateReasonLabel('DRIVE_LINK'),
          count: counts.DRIVE_LINK,
        },
        {
          id: 'ORIGINAL_LINK',
          label: getDuplicateReasonLabel('ORIGINAL_LINK'),
          count: counts.ORIGINAL_LINK,
        },
        {
          id: 'TITLE',
          label: getDuplicateReasonLabel('TITLE'),
          count: counts.TITLE,
        },
      ];
    }, [duplicateScan]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={isMerging ? () => {} : onClose}
      maxWidthClass="max-w-5xl"
      heightClass="max-h-[92dvh]"
      closeOnBackdropClick={!isMerging}
      closeOnEsc={!isMerging}
      icon={<CopyCheck className="w-4 h-4" />}
      title="สแกนและจัดการฟุตเทจซ้ำในคลัง"
      subtitle="เลือกตัวหลัก (Survivor) ที่ต้องการเก็บไว้ ระบบจะรวมแท็ก ลิงก์ คำสร้อย และย้ายประวัติ EP ทั้งหมดมาที่ตัวหลักก่อนลบตัวซ้ำอัตโนมัติ"
      badge={
        duplicateScan.duplicateClusterCount > 0 ? (
          <span className="px-2 py-0.5 rounded-lg bg-[#FEF3E6] border border-[#F2CEAE] text-[#8A4A18] font-mono tabular-nums text-[11px] font-extrabold">
            {duplicateScan.duplicateClusterCount} กลุ่ม · ซ้ำเกิน{' '}
            {duplicateScan.redundantCount} คลิป
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-lg bg-[#EDF7F1] border border-[#A8D5BA] text-[#22543D] text-[11px] font-extrabold">
            คลังสะอาด ไม่มีตัวซ้ำ
          </span>
        )
      }
      headerContent={
        duplicateScan.duplicateClusterCount > 0 ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            {/* Reason Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-0.5 sm:pb-0">
              {reasonTabOptions.map((tab) => {
                const isActive = reasonFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReasonFilter(tab.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#3D332A] text-white border-[#3D332A]'
                        : 'bg-white hover:bg-[#F5EFE6] text-[#5D4938] border-[#E4D9CB]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono tabular-nums text-[11px] ${
                        isActive ? 'text-[#F5DCC0]' : 'text-[#8C7A69]'
                      }`}
                    >
                      ({tab.count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#8A7B6E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัส FT หรือชื่อคลิป..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#E2D5C4] rounded-xl text-[#3D332A] focus:outline-none focus:border-[#C27D38]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A7B6E] hover:text-[#3D332A] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : undefined
      }
      bodyClassName="p-3.5 sm:p-5 bg-[#FAF8F5] space-y-3"
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-[11px] sm:text-xs text-[#6F6053] font-medium">
            {duplicateScan.duplicateClusterCount > 0 ? (
              <span>
                เลือกแสดง{' '}
                <strong className="font-mono tabular-nums text-[#3D332A]">
                  {allPendingPlans.length}
                </strong>{' '}
                กลุ่ม · พร้อมยุบรวมและลบตัวซ้ำ{' '}
                <strong className="font-mono tabular-nums text-[#9B2C38]">
                  {totalPendingDuplicatesCount}
                </strong>{' '}
                คลิป
              </span>
            ) : (
              <span>ไม่พบคลิปที่ชื่อซ้ำหรือลิงก์ซ้ำในคลังแล้ว</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 flex-wrap">
            {allPendingPlans.length > 0 && !isConfirmingAutoMergeAll && (
              <button
                type="button"
                disabled={isMerging}
                onClick={() => setIsConfirmingAutoMergeAll(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#E89B4C] hover:bg-[#DC8B38] disabled:opacity-50 text-[#2F1A07] font-extrabold text-xs transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  รวมทั้งหมดอัตโนมัติ ({allPendingPlans.length} กลุ่ม · ลบ{' '}
                  {totalPendingDuplicatesCount} ตัวซ้ำ)
                </span>
              </button>
            )}

            {isConfirmingAutoMergeAll && (
              <div className="flex items-center gap-1.5 bg-[#FDF1F2] border border-[#F0C8CE] px-2.5 py-1 rounded-xl">
                <span className="text-xs font-bold text-[#9B2C38]">
                  ยืนยันรวม {allPendingPlans.length} กลุ่ม (ลบ{' '}
                  {totalPendingDuplicatesCount} คลิป)?
                </span>
                <button
                  type="button"
                  disabled={isMerging}
                  onClick={handleExecuteAutoMergeAll}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#C9404F] hover:bg-[#B23240] text-white font-extrabold text-xs cursor-pointer whitespace-nowrap"
                >
                  {isMerging ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <GitMerge className="w-3.5 h-3.5" />
                  )}
                  <span>ยืนยันรวมทั้งหมด</span>
                </button>
                <button
                  type="button"
                  disabled={isMerging}
                  onClick={() => setIsConfirmingAutoMergeAll(false)}
                  className="px-2 py-1 rounded-lg bg-white border border-[#E2D5C4] text-[#5D4938] text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={isMerging}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#F3ECE2] border border-[#DFD4C7] text-[#3D332A] font-bold text-xs transition-colors cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>
      }
    >
      {/* Result Toast / Banner after Merge */}
      {lastMergeResult && lastMergeResult.deletedFootageCount > 0 && (
        <div className="rounded-2xl bg-[#EDF7F1] border border-[#A8D5BA] px-4 py-3 flex items-center justify-between gap-2 text-xs text-[#1E5631]">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D4A] shrink-0" />
            <span>
              ยุบรวมสำเร็จ {lastMergeResult.mergedGroupCount} กลุ่ม · ลบตัวซ้ำ{' '}
              {lastMergeResult.deletedFootageCount} คลิป
              {lastMergeResult.migratedEpisodeCount > 0
                ? ` · ย้ายอ้างอิงประวัติ EP แล้ว ${lastMergeResult.migratedEpisodeCount} ตอน`
                : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLastMergeResult(null)}
            className="text-[#2E7D4A] hover:text-[#1E5631] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Clusters List or Clean Empty State */}
      {filteredClusters.length === 0 ? (
        <div className="bg-white border border-[#E8DFD3] rounded-2xl p-8 text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-[#EDF7F1] border border-[#A8D5BA] text-[#2E7D4A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-[#3D332A]">
            {duplicateScan.duplicateClusterCount === 0
              ? 'คลังฟุตเทจสะอาดเรียบร้อย ไม่มีคลิปซ้ำ'
              : 'ไม่พบกลุ่มคลิปซ้ำที่ตรงกับคำค้นหา'}
          </h3>
          <p className="text-xs text-[#7D6E61] max-w-md mx-auto">
            {duplicateScan.duplicateClusterCount === 0
              ? 'ฟุตเทจทั้งหมดในคลังมีชื่อฟุต ลิงก์ Google Drive และลิงก์ต้นฉบับไม่ซ้ำซ้อนกันแล้ว'
              : 'ลองล้างคำค้นหาหรือเลือกดูตัวกรองทั้งหมดเพื่อตรวจสอบกลุ่มที่เหลือ'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClusters.map((cluster, idx) => (
            <DuplicateClusterCard
              key={cluster.clusterId}
              cluster={cluster}
              clusterIndex={idx}
              selectedSurvivorId={getSelectedSurvivorId(cluster)}
              excludedDuplicateIds={getExcludedIds(cluster)}
              episodes={episodes}
              tagMap={tagMap}
              isMerging={isMerging}
              onSelectSurvivor={handleSelectSurvivor}
              onToggleExcludeDuplicate={handleToggleExcludeDuplicate}
              onMergeCluster={handleMergeSingleCluster}
            />
          ))}
        </div>
      )}
    </BaseModal>
  );
};
