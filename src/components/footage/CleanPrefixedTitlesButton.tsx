import React, { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { hasLeadingRankPrefix } from '../../utils/fileNameGenerator';

interface CleanPrefixedTitlesButtonProps {
  compact?: boolean;
}

export const CleanPrefixedTitlesButton: React.FC<CleanPrefixedTitlesButtonProps> = ({
  compact = false,
}) => {
  const { computedFootage, batchCleanExistingFootageTitles } = useCMS();
  const [isCleaning, setIsCleaning] = useState(false);
  const [lastCleanedCount, setLastCleanedCount] = useState<number | null>(null);

  const prefixedCount = useMemo(() => {
    let count = 0;
    for (const ft of computedFootage) {
      if (hasLeadingRankPrefix(ft.title)) {
        count++;
      }
    }
    return count;
  }, [computedFootage]);

  const handleClean = async () => {
    if (isCleaning || prefixedCount === 0) return;
    setIsCleaning(true);
    try {
      const cleaned = await batchCleanExistingFootageTitles();
      setLastCleanedCount(cleaned);
      setTimeout(() => {
        setLastCleanedCount(null);
      }, 4500);
    } finally {
      setIsCleaning(false);
    }
  };

  if (lastCleanedCount !== null && lastCleanedCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>ล้างเลขหน้าชื่อสำเร็จ {lastCleanedCount} คลิป</span>
      </span>
    );
  }

  if (prefixedCount === 0) {
    if (!compact) return null;
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] text-[11px] font-bold"
        title="ระบบตัดเลขลำดับต้นชื่อ (เช่น 1. 2. 1) 1-) อัตโนมัติทุกครั้งที่ดึงจาก Google Drive"
      >
        <Sparkles className="w-3 h-3 text-[#2E7D32] shrink-0" />
        <span>ตัดเลข 1. 2. หน้าชื่ออัตโนมัติ</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClean}
      disabled={isCleaning}
      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/90 text-amber-950 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-60 whitespace-nowrap"
      title={`พบฟุตเทจในคลัง ${prefixedCount} รายการที่ยังมีเลขลำดับ (เช่น 1. 2. 3.) นำหน้าชื่อ คลิกเพื่อตัดออกอัตโนมัติทั้งหมด`}
    >
      {isCleaning ? (
        <Loader2 className="w-3.5 h-3.5 text-amber-700 animate-spin shrink-0" />
      ) : (
        <Wand2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
      )}
      <span>
        {isCleaning
          ? 'กำลังล้างเลขหน้าชื่อ...'
          : compact
          ? `ล้างเลขหน้าชื่อเดิม (${prefixedCount})`
          : `ล้างเลข 1. 2. หน้าชื่อฟุตเทจเดิม (${prefixedCount})`}
      </span>
    </button>
  );
};
