import { CategoryTag } from '../../../types/tag.types';

export type DriveCategoryStrategy = 'SUBFOLDER_TO_CATEGORY' | 'ALL_TO_STAGING';

export type DriveImportMode = 'RECURSIVE' | 'PASTE';

export type DriveClipIdPrefix = 'CLP' | 'FT';

export interface ParsedPastedItem {
  id: string;
  title: string;
  driveFileUrl: string;
  cleanFileName: string;
}

export interface DriveImportSuccessSummary {
  totalImported: number;
  stagedCount: number;
  categorizedCount: number;
  newTagsCreated: number;
  createdTagNames: string[];
}

export interface SelectedRoutingSummary {
  toStaging: number;
  toCategory: number;
}

export interface ReconciledFolderSummary {
  activeNewTagsToCreate: CategoryTag[];
}
