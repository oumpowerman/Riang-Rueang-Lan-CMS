import { ComputedFootage } from '../../../types/footage.types';
import { RawSource } from '../../../types/source.types';
import { CategoryTag, SystemSettings } from '../../../types/tag.types';

export type TraceabilityTabId =
  | 'DETAILS_AND_TAGS'
  | 'EPISODE_HISTORY'
  | 'CO_USAGE_MATRIX';

export interface CoUsedPartnerEntry {
  partner: ComputedFootage;
  partnerId: string;
  count: number;
}

export interface TraceabilityModalHeaderProps {
  footage: ComputedFootage;
  parentSource: RawSource | null;
  settings: SystemSettings;
  coUsedCount: number;
  activeTab: TraceabilityTabId;
  onChangeTab: (tab: TraceabilityTabId) => void;
  onOpenParentSource: () => void;
  onClose: () => void;
}

export interface TraceabilityDetailsTabProps {
  footage: ComputedFootage;
  copiedFileName: boolean;
  onCopyFileName: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateMascotNotes: (mascotNotes: string) => void;
  onUpdateOriginalUrl: (originalUrl: string) => void;
  onUpdateDriveFileUrl: (driveFileUrl: string) => void;
  onUpdateTags: (tags: string[]) => void;
}

export interface TraceabilityEpisodeHistoryTabProps {
  footage: ComputedFootage;
  onSelectEpisode: (episodeId: string) => void;
}

export interface TraceabilityCoUsageTabProps {
  coUsedEntries: CoUsedPartnerEntry[];
  tagMap: Record<string, CategoryTag>;
  settings: SystemSettings;
  onSelectPartnerFootage: (partnerId: string) => void;
}
