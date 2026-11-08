import { Episode } from './episode.types';

export const SUPABASE_CONTENT_STATUSES = [
  '01_IDEA/DRAFT_💡',
  '02_SCRIPT_✍️',
  '03_SHOOTING_🎥',
  '04_EDIT_CLIP_✂️',
  '05_FEEDBACK_💬',
  '06_EDIT_DRAFT1_🛠️',
  '07_FEEDBACK_1_🎥',
  '08_EDIT_DRAFT_2_🔧',
  '09_APPROVE_👍',
  '10_DONE_✅',
] as const;

export type SupabaseContentStatus = (typeof SUPABASE_CONTENT_STATUSES)[number];

export interface SupabaseChannelPreset {
  id: string; // UUID of the channel in Supabase `channels` table
  name: string; // e.g. "เรียงเรื่องลั่น (ช่องหลัก)", "ช่องไฮไลต์", "ช่องสั้นสำรอง"
  isDefault?: boolean;
}

export interface SupabaseConnectionConfig {
  url: string; // e.g. "https://xyzcompany.supabase.co"
  anonKey: string; // anon / service role key
  targetChannelId: string; // selected channel UUID
  channels: SupabaseChannelPreset[]; // list of saved channels for quick switching
  defaultStatus: string; // e.g. "01_IDEA/DRAFT_💡", "04_EDIT_CLIP_✂️", "10_DONE_✅"
  defaultTargetPlatforms: string[]; // e.g. ["YOUTUBE_SHORTS", "TIKTOK"]
  defaultIncludeAssets: boolean; // whether to include the 5 footage clips in `assets`
  defaultDescriptionMode: 'AUTO' | 'EMPTY' | 'CUSTOM';
  customDescriptionTemplate?: string;
}

export type DeduplicationStatus = 'NEW' | 'DUPLICATE' | 'MODIFIED';

export interface SupabaseSyncRowState {
  episode: Episode;
  isSelected: boolean;
  matchStatus: DeduplicationStatus;
  existingRecordId?: string; // UUID of existing record in Supabase `contents`
  existingCreatedAt?: string;
  existingStatus?: string;
  channelId: string;
  status: string;
  includeAssets: boolean;
  description: string;
  upsertMode: 'SKIP' | 'UPDATE'; // when duplicate: skip or update
}

export interface SupabaseContentPayload {
  id?: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  pillar: string | null;
  category: string | null;
  remark: string | null;
  channel_id: string | null;
  target_platform: string[];
  is_unscheduled: boolean;
  published_links: Record<string, string>;
  assets: Array<{
    order: number;
    clip_id: string;
    title: string;
    drive_url?: string;
    duration?: number;
    tags?: string[];
  }>;
  content_formats: string[];
}

export interface SupabaseSyncProgress {
  phase: 'CONNECTING' | 'CHECKING_DUPLICATES' | 'SYNCING' | 'DONE' | 'ERROR';
  phaseLabel: string;
  completedItems: number;
  totalItems: number;
  percent: number;
  currentTitle?: string;
}

export interface SupabaseSyncReportItem {
  id?: string;
  title: string;
  action: 'INSERTED' | 'UPDATED' | 'SKIPPED' | 'FAILED';
  error?: string;
}

export interface SupabaseSyncReport {
  totalProcessed: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  items: SupabaseSyncReportItem[];
  timestamp: number;
  channelId: string;
}
