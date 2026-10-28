import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  GitMerge,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EpisodeValidationReport } from '../../utils/collisionDetector';

interface CollisionWarningBannerProps {
  report: EpisodeValidationReport;
  selectedCount: number;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const CollisionWarningBanner: React.FC<CollisionWarningBannerProps> = ({
  report,
  selectedCount,
}) => {
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(true);

  const topMatch = report.topSimilarityMatch;
  const hasCriticalSimilarity = Boolean(
    topMatch && topMatch.similarityPercentage >= 60
  );

  const hasIssues =
    selectedCount > 0 &&
    (report.cooldownViolations.length > 0 ||
      report.pairwiseCollisions.length > 0 ||
      report.velocityWarnings.length > 0 ||
      hasCriticalSimilarity);

  return (
    <AnimatePresence initial={false}>
      {hasIssues && (
        <motion.div
          key="collision-warning-banner"
          initial={{ height: 0, opacity: 0, y: -6 }}
          animate={{ height: 'auto', opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: SLIDE_EASE }}
          className="overflow-hidden"
        >
          <div className="space-y-3">
      {/* 1. EPISODE SIMILARITY INDEX CARD (Highlight Box) */}
      {topMatch && topMatch.similarityPercentage >= 60 && (
        <div
          className={`rounded-2xl border p-4 shadow-sm transition-all ${
            topMatch.severity === 'EXACT_DUPLICATE_100'
              ? 'bg-rose-50/95 border-rose-300 ring-2 ring-rose-400/30'
              : topMatch.severity === 'REORDERED_DUPLICATE_100'
              ? 'bg-amber-50/95 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-amber-50/80 border-amber-300'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold ${
                  topMatch.severity === 'EXACT_DUPLICATE_100'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : topMatch.severity === 'REORDERED_DUPLICATE_100'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {topMatch.severity === 'EXACT_DUPLICATE_100' ? (
                  <AlertOctagon className="w-5 h-5 text-white" />
                ) : topMatch.severity === 'REORDERED_DUPLICATE_100' ? (
                  <AlertTriangle className="w-5 h-5 text-white" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-700" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4
                    className={`text-sm font-bold tracking-tight ${
                      topMatch.severity === 'EXACT_DUPLICATE_100'
                        ? 'text-rose-950'
                        : topMatch.severity === 'REORDERED_DUPLICATE_100'
                        ? 'text-amber-950'
                        : 'text-amber-900'
                    }`}
                  >
                    {topMatch.severity === 'EXACT_DUPLICATE_100' && (
                      <>ซ้ำ 100% เป๊ะ (Exact Duplication)</>
                    )}
                    {topMatch.severity === 'REORDERED_DUPLICATE_100' && (
                      <>ซ้ำ 100% แบบสลับอันดับ (Reordered Permutation)</>
                    )}
                    {topMatch.severity === 'HIGH_SIMILARITY' && (
                      <>ดัชนีความซ้ำสูง {topMatch.similarityPercentage}% (High Similarity)</>
                    )}
                  </h4>

                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      topMatch.severity === 'EXACT_DUPLICATE_100'
                        ? 'bg-rose-200 text-rose-900'
                        : topMatch.severity === 'REORDERED_DUPLICATE_100'
                        ? 'bg-amber-200 text-amber-950'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    ความคล้าย {topMatch.similarityPercentage}% ({topMatch.sharedCount}/5 คลิป)
                  </span>
                </div>

                <p
                  className={`text-xs mt-1 leading-relaxed ${
                    topMatch.severity === 'EXACT_DUPLICATE_100'
                      ? 'text-rose-900'
                      : topMatch.severity === 'REORDERED_DUPLICATE_100'
                      ? 'text-amber-900'
                      : 'text-amber-800'
                  }`}
                >
                  {topMatch.severity === 'EXACT_DUPLICATE_100' && (
                    <>
                      เนื้อหาและอันดับ 1–5 ตรงกับตอน{' '}
                      <span className="font-bold underline">
                        {topMatch.matchedEpisode.id}: "{topMatch.matchedEpisode.title}"
                      </span>{' '}
                      (ออกอากาศ {topMatch.matchedEpisode.publishDate}) ทุกอันดับ
                    </>
                  )}
                  {topMatch.severity === 'REORDERED_DUPLICATE_100' && (
                    <>
                      คลิปทั้ง 5 รายการเหมือนตอน{' '}
                      <span className="font-bold underline">
                        {topMatch.matchedEpisode.id}: "{topMatch.matchedEpisode.title}"
                      </span>{' '}
                      (ออกอากาศ {topMatch.matchedEpisode.publishDate}) ครบทุกชิ้น แต่สลับตำแหน่งอันดับ
                    </>
                  )}
                  {topMatch.severity === 'HIGH_SIMILARITY' && (
                    <>
                      พบฟุตเทจชุดเดิมซ้ำกับตอน{' '}
                      <span className="font-bold underline">
                        {topMatch.matchedEpisode.id}: "{topMatch.matchedEpisode.title}"
                      </span>{' '}
                      (ออกอากาศ {topMatch.matchedEpisode.publishDate}) ถึง {topMatch.sharedCount} ใน 5 คลิป
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Toggle Table Button */}
            <button
              type="button"
              onClick={() => setIsComparisonExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 transition-colors shrink-0 shadow-2xs"
            >
              <span>{isComparisonExpanded ? 'ซ่อนการเทียบอันดับ' : 'ดูการเทียบอันดับ'}</span>
              {isComparisonExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Side-by-Side Rank Comparison Table */}
          <AnimatePresence initial={false}>
            {isComparisonExpanded && (
              <motion.div
                key="comparison-table"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: SLIDE_EASE }}
                className="overflow-hidden"
              >
                <div className="mt-3.5 pt-3 border-t border-slate-200/60 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200/80 pb-1">
                    <th className="py-1 px-2 w-20">อันดับปัจจุบัน</th>
                    <th className="py-1 px-2">ชื่อฟุตเทจที่เลือก</th>
                    <th className="py-1 px-2 w-48 text-right">ตำแหน่งใน {topMatch.matchedEpisode.id} เดิม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {topMatch.rankComparisons.map((row) => (
                    <tr key={row.currentRank} className="hover:bg-black/[0.02]">
                      <td className="py-1.5 px-2 font-mono font-bold text-slate-800">
                        อันดับ {row.currentRank}
                      </td>
                      <td className="py-1.5 px-2 text-slate-800 truncate max-w-[280px]">
                        <span className="font-mono text-slate-500 mr-1.5">[{row.footageId}]</span>
                        <span className="font-medium">{row.footageTitle}</span>
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        {row.status === 'EXACT_RANK' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-md text-[11px]">
                            <span>อันดับ {row.matchedRankInOriginal} เดิม</span>
                            <span className="text-[10px] font-bold">(ตรงกันเป๊ะ)</span>
                          </span>
                        )}
                        {row.status === 'SWAPPED_RANK' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md text-[11px]">
                            <span>ย้ายจากอันดับ {row.matchedRankInOriginal} เดิม</span>
                          </span>
                        )}
                        {row.status === 'NEW_CLIP' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md text-[11px]">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>คลิปใหม่ (ไม่เคยอยู่ในตอนนี้)</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Other similar episodes hint */}
              {report.similarityMatches.length > 1 && (
                <div className="mt-2.5 text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    นอกจากนี้ยังพบความคล้ายกับตอนอื่นอีก {report.similarityMatches.length - 1} ตอน:{' '}
                    {report.similarityMatches
                      .slice(1, 4)
                      .map((m) => `${m.matchedEpisode.id} (${m.similarityPercentage}%)`)
                      .join(', ')}
                  </span>
                </div>
              )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 2. Cooldown Violations (Critical Red) */}
      {report.cooldownViolations.length > 0 && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              แจ้งเตือน RECENT_COOLDOWN Guard: พบฟุตเทจที่เพิ่งใช้ไปภายใน 14 วันล่าสุด ({report.cooldownViolations.length} รายการ)
            </span>
          </div>
          <ul className="space-y-1 text-xs text-rose-800 pl-6 list-disc">
            {report.cooldownViolations.map((v) => (
              <li key={`${v.rank}-${v.footage.id}`}>
                <span className="font-mono font-bold">
                  อันดับ {v.rank} ({v.footage.id})
                </span>{' '}
                "{v.footage.title}" — เพิ่งใช้ไปใน{' '}
                <span className="font-mono font-semibold">{v.lastEpisodeId}</span> (เมื่อ{' '}
                {v.daysSinceLastUsed} วันที่แล้ว)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Pairwise Collision Alerts */}
      {report.pairwiseCollisions.length > 0 && (!topMatch || topMatch.similarityPercentage < 100) && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <GitMerge className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              แจ้งเตือนการจับคู่ซ้ำ (Pairwise Collision Alert): พบฟุตเทจ 2 ชิ้นที่เคยอยู่ร่วม EP เดียวกันมาแล้ว ({report.pairwiseCollisions.length} คู่)
            </span>
          </div>
          <ul className="space-y-1 text-xs text-amber-900 pl-6 list-disc">
            {report.pairwiseCollisions.slice(0, 5).map((col, idx) => (
              <li key={idx}>
                <span className="font-mono font-bold">
                  อันดับ {col.rankA} ({col.footageA.id})
                </span>{' '}
                และ{' '}
                <span className="font-mono font-bold">
                  อันดับ {col.rankB} ({col.footageB.id})
                </span>{' '}
                เคยถูกผสมอยู่ด้วยกันแล้วใน{' '}
                <span className="font-mono font-semibold">
                  {col.sharedEpisodes.map((e) => `${e.episodeId} (${e.publishDate})`).join(', ')}
                </span>
              </li>
            ))}
            {report.pairwiseCollisions.length > 5 && (
              <li className="list-none text-slate-500 font-medium">
                ...และคู่อื่นอีก {report.pairwiseCollisions.length - 5} คู่
              </li>
            )}
          </ul>
        </div>
      )}

      {/* 4. High Velocity Warnings */}
      {report.velocityWarnings.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">แจ้งเตือนความถี่สูง (HIGH_VELOCITY_WARNING): </span>
            {report.velocityWarnings.map((vw, idx) => (
              <span key={vw.footage.id}>
                {idx > 0 ? ', ' : ''}
                อันดับ {vw.rank} ({vw.footage.id}) ใช้ไป {vw.usageLast90Days} ครั้งในรอบ 90 วัน (เฉลี่ยทุก{' '}
                {vw.averageDaysBetweenUses} วัน)
              </span>
            ))}
          </div>
        </div>
      )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
