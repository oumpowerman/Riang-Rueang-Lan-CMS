import { EpisodeWorkflowStage } from './episode.types';

export type IngestionFlow = 'DIRECT_1_TO_1' | 'SPLIT_1_TO_N';

export type CooldownStatus =
  | 'NEW_UNTOUCHED'
  | 'READY_FRESH'
  | 'HIGH_VELOCITY_WARNING'
  | 'RECENT_COOLDOWN';

export interface FootageUsageRecord {
  episodeId: string;
  episodeTitle: string;
  rank: 1 | 2 | 3 | 4 | 5;
  publishDate: string;
  publishSlot: 'MORNING_0600' | 'EVENING_1800';
  workflowStage: EpisodeWorkflowStage;
  coUsedFootageIds: string[];
  daysAgo: number;
}

export interface Footage {
  id: string; // e.g., FT-0001
  title: string;
  ingestionFlow: IngestionFlow;
  sourceId: string | null; // null if DIRECT_1_TO_1, SRC-XXXX if SPLIT_1_TO_N
  originalUrl: string;
  timestampRange: string | null; // e.g., "12:05 - 12:45" or null for short direct clips
  durationSec?: number;
  tags: string[]; // Multi-tag IDs
  driveFileUrl: string;
  standardFileName: string; // e.g., FT-0003_ชื่อคลิป.mp4
  mascotNotes: string; // Punchline / reaction guidance for the mascot narrator
  createdAt: string; // YYYY-MM-DD
}

export interface ComputedFootage extends Footage {
  // Time-Decay & Usage Velocity Metrics
  totalUsageCount: number;
  usageCount: number; // Alias for backward compatibility (= totalUsageCount)
  usageLast30Days: number;
  usageLast90Days: number;
  daysSinceLastUsed: number | null;
  daysSinceLastUse: number | null; // Alias (= daysSinceLastUsed)
  daysSinceCreated: number;
  averageDaysBetweenUses: number | null;
  lastUsedDate: string | null;
  usageHistory: FootageUsageRecord[];
  coUsedWithMap: Record<string, number>; // Map of other FT-XXXX -> count of episodes together
  cooldownStatus: CooldownStatus;
  velocitySummaryText: string; // e.g. "ใช้ทั้งหมด 4 ครั้ง (ในรอบ 90 วันใช้ไป 0 ครั้ง | พักมาแล้ว 65 วัน)"
}
