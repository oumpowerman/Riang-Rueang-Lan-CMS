import { Episode } from '../types/episode.types';
import {
  CooldownStatus,
  ComputedFootage,
  Footage,
  FootageUsageRecord,
} from '../types/footage.types';
import { SystemSettings } from '../types/tag.types';

/**
 * Reference date used for deterministic calculation across multi-year seed data and live usage.
 */
export function getReferenceTodayDate(): string {
  return '2026-10-27';
}

export function calculateDaysDiff(fromDateStr: string, toDateStr: string): number {
  const fromMs = new Date(`${fromDateStr}T00:00:00Z`).getTime();
  const toMs = new Date(`${toDateStr}T00:00:00Z`).getTime();
  const diffDays = Math.floor((toMs - fromMs) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Evaluates the 4-color CooldownStatus (🔵 NEW_UNTOUCHED, 🟢 READY_FRESH, 🟡 HIGH_VELOCITY_WARNING, 🔴 RECENT_COOLDOWN)
 * based on customizable Rest Days and Usage Count thresholds in SystemSettings.
 */
export function evaluateFootageStatus(
  params: {
    totalUsageCount: number;
    usageLast90Days: number;
    daysSinceLastUsed: number | null;
    averageDaysBetweenUses: number | null;
  },
  settings: SystemSettings
): CooldownStatus {
  const { totalUsageCount, usageLast90Days, daysSinceLastUsed } = params;

  const redCooldownDays = Math.max(1, Number(settings.cooldownDays) || 14);
  const greenReadyDays = Math.max(
    redCooldownDays,
    Number(settings.greenReadyDays) || redCooldownDays
  );
  const redMaxTotalUsage = Math.max(2, Number(settings.maxTotalUsageCount) || 8);
  const yellowUsage90d = Math.max(1, Number(settings.maxUsagePer90Days) || 3);
  const yellowTotalUsage = Math.max(1, Number(settings.yellowTotalUsageCount) || 4);

  // 1. 🔵 สีฟ้า (NEW_UNTOUCHED): ยังไม่เคยถูกหยิบไปใช้เลย (0 ครั้ง)
  if (totalUsageCount === 0) {
    return 'NEW_UNTOUCHED';
  }

  // 2. 🔴 สีแดง (RECENT_COOLDOWN): เพิ่งใช้ยังไม่พ้นวันพักขั้นต่ำ หรือ ใช้ซ้ำสะสมถึงเพดานสูงสุดแล้ว
  if (
    (daysSinceLastUsed !== null && daysSinceLastUsed < redCooldownDays) ||
    totalUsageCount >= redMaxTotalUsage
  ) {
    return 'RECENT_COOLDOWN';
  }

  // 3. 🟡 สีเหลือง (HIGH_VELOCITY_WARNING): พ้นสีแดงแล้วแต่ยังพักไม่ถึงวันสีเขียว หรือ ใช้ถี่ใน 90 วัน หรือ ใช้สะสมถึงเกณฑ์เตือน
  if (
    (daysSinceLastUsed !== null && daysSinceLastUsed < greenReadyDays) ||
    usageLast90Days >= yellowUsage90d ||
    totalUsageCount >= yellowTotalUsage
  ) {
    return 'HIGH_VELOCITY_WARNING';
  }

  // 4. 🟢 สีเขียว (READY_FRESH): พักครบเกณฑ์สีเขียว และจำนวนครั้งที่ใช้ยังไม่เกินเกณฑ์เตือน
  return 'READY_FRESH';
}

/**
 * Fast live simulator to preview how many footages fall into 🔵 🟢 🟡 🔴 when adjusting numbers in the settings modal.
 */
export function simulateStatusDistribution(
  computedFootage: ComputedFootage[],
  draftSettings: SystemSettings
): {
  blueNew: number;
  greenReady: number;
  yellowWarning: number;
  redCooldown: number;
  totalUsable: number;
} {
  let blueNew = 0;
  let greenReady = 0;
  let yellowWarning = 0;
  let redCooldown = 0;

  for (const ft of computedFootage) {
    const status = evaluateFootageStatus(
      {
        totalUsageCount: ft.totalUsageCount,
        usageLast90Days: ft.usageLast90Days,
        daysSinceLastUsed: ft.daysSinceLastUsed,
        averageDaysBetweenUses: ft.averageDaysBetweenUses,
      },
      draftSettings
    );

    if (status === 'NEW_UNTOUCHED') blueNew += 1;
    else if (status === 'READY_FRESH') greenReady += 1;
    else if (status === 'HIGH_VELOCITY_WARNING') yellowWarning += 1;
    else redCooldown += 1;
  }

  return {
    blueNew,
    greenReady,
    yellowWarning,
    redCooldown,
    totalUsable: blueNew + greenReady,
  };
}

export function computeFootageAnalytics(
  footageList: Footage[],
  episodes: Episode[],
  settings: SystemSettings
): ComputedFootage[] {
  const todayStr = getReferenceTodayDate();

  // Sort episodes chronologically descending by publishDate and slot
  const sortedEpisodes = [...episodes].sort((a, b) => {
    if (a.publishDate !== b.publishDate) {
      return b.publishDate.localeCompare(a.publishDate);
    }
    return b.publishSlot.localeCompare(a.publishSlot);
  });

  return footageList.map((ft) => {
    const usageHistory: FootageUsageRecord[] = [];
    const coUsedWithMap: Record<string, number> = {};

    for (const ep of sortedEpisodes) {
      const slotMatch = ep.rankings.find((r) => r.footageId === ft.id);
      if (slotMatch) {
        const otherFootageIds = ep.rankings
          .map((r) => r.footageId)
          .filter((fid): fid is string => Boolean(fid && fid !== ft.id));

        const daysAgo = calculateDaysDiff(ep.publishDate, todayStr);

        usageHistory.push({
          episodeId: ep.id,
          episodeTitle: ep.title,
          rank: slotMatch.rank,
          publishDate: ep.publishDate,
          publishSlot: ep.publishSlot,
          workflowStage: ep.workflowStage,
          coUsedFootageIds: otherFootageIds,
          daysAgo,
        });

        for (const otherId of otherFootageIds) {
          coUsedWithMap[otherId] = (coUsedWithMap[otherId] || 0) + 1;
        }
      }
    }

    const totalUsageCount = usageHistory.length;
    const usageLast30Days = usageHistory.filter((u) => u.daysAgo <= 30).length;
    const usageLast90Days = usageHistory.filter((u) => u.daysAgo <= 90).length;
    const lastUsedDate = usageHistory.length > 0 ? usageHistory[0].publishDate : null;
    const daysSinceLastUsed =
      usageHistory.length > 0 ? usageHistory[0].daysAgo : null;

    const daysSinceCreated = Math.max(1, calculateDaysDiff(ft.createdAt, todayStr));
    const averageDaysBetweenUses =
      totalUsageCount > 0 ? Math.max(1, Math.round(daysSinceCreated / totalUsageCount)) : null;

    const cooldownStatus = evaluateFootageStatus(
      {
        totalUsageCount,
        usageLast90Days,
        daysSinceLastUsed,
        averageDaysBetweenUses,
      },
      settings
    );

    const velocitySummaryText =
      totalUsageCount === 0
        ? `ใช้ทั้งหมด 0 ครั้ง (ฟุตใหม่แกะกล่อง | อยู่ในคลังมาแล้ว ${daysSinceCreated} วัน)`
        : `ใช้สะสม ${totalUsageCount} ครั้ง (ในรอบ 90 วันใช้ไป ${usageLast90Days} ครั้ง | พักมาแล้ว ${daysSinceLastUsed} วัน)`;

    return {
      ...ft,
      totalUsageCount,
      usageCount: totalUsageCount,
      usageLast30Days,
      usageLast90Days,
      daysSinceLastUsed,
      daysSinceLastUse: daysSinceLastUsed,
      daysSinceCreated,
      averageDaysBetweenUses,
      lastUsedDate,
      usageHistory,
      coUsedWithMap,
      cooldownStatus,
      velocitySummaryText,
    };
  });
}
