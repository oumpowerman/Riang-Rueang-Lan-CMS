export type SourcePlatform = 'TIKTOK' | 'FACEBOOK' | 'YOUTUBE' | 'INSTAGRAM' | 'TWITCH' | 'OTHER';

export interface RawSource {
  id: string; // e.g., SRC-0001
  title: string;
  originalUrl: string;
  platform: SourcePlatform;
  channelOrCreator: string;
  totalDuration?: string;
  tags: string[]; // Array of Tag IDs
  notes: string;
  createdAt: string;
  splitFootageIds: string[]; // Array of FT-XXXX IDs cut from this source
}
