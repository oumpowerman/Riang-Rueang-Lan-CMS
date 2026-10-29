/**
 * Enterprise Recursive Google Drive Scanner Service
 * Scans nested folders (Subfolders) and extracts video files with folder hierarchy.
 * Optimized for high-volume bulk imports (300–2,000+ videos) & Shared Drives on Vercel.
 */

import { authService } from '../firebase/authService';
import { defaultGoogleDriveApiKey } from '../firebase/config';
import { cleanFootageTitle } from '../utils/fileNameGenerator';

export interface DiscoveredDriveVideo {
  id: string; // Google Drive File ID
  name: string; // Original filename
  cleanTitle: string; // Cleaned Thai/English title without extension
  mimeType: string;
  webViewLink: string;
  thumbnailUrl?: string;
  sizeBytes: number;
  createdTime: string;
  durationSec?: number;
  folderPath: string[]; // Hierarchy path e.g. ["คลังหลัก", "01_ตลกหน้าตาย"]
  parentFolderName: string; // Immediate subfolder name
  parentFolderId: string;
}

export interface DriveFolderSummary {
  id: string;
  name: string;
  path: string;
  depth: number;
  videoCount: number;
}

export interface ScanProgressUpdate {
  foldersScanned: number;
  foldersPending: number;
  videosFound: number;
  currentFolder: string;
  currentDepth: number;
}

export interface RecursiveScanResult {
  rootFolderId: string;
  rootFolderName: string;
  totalFoldersScanned: number;
  totalVideosDiscovered: number;
  folders: DriveFolderSummary[];
  videos: DiscoveredDriveVideo[];
}

export interface ScanOptions {
  folderUrlOrId: string;
  accessToken?: string | null;
  apiKey?: string | null;
  maxDepth?: number;
  onProgress?: (progress: ScanProgressUpdate) => void;
  signal?: AbortSignal;
}

/**
 * Extracts clean Google Drive folder ID from various URL patterns
 */
export function extractGoogleDriveFolderId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern 1: https://drive.google.com/drive/folders/1ABC...
  const foldersMatch = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (foldersMatch && foldersMatch[1]) return foldersMatch[1];

  // Pattern 2: https://drive.google.com/open?id=1ABC... or ?id=1ABC...
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  // Pattern 3: Direct alphanumeric ID (usually 25-45 chars)
  if (/^[a-zA-Z0-9_-]{15,60}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Detects if a file is an eligible video clip
 */
export function isEligibleVideoFile(name: string, mimeType?: string): boolean {
  if (mimeType && mimeType.startsWith('video/')) return true;
  const lower = name.toLowerCase();
  const videoExtensions = [
    '.mp4',
    '.mov',
    '.mkv',
    '.webm',
    '.avi',
    '.m4v',
    '.flv',
    '.wmv',
    '.ts',
  ];
  return videoExtensions.some((ext) => lower.endsWith(ext));
}

/**
 * Clean helper to build Drive API query url with either Bearer token or API key
 */
function buildDriveApiUrl(
  endpoint: string,
  params: Record<string, string>,
  apiKey?: string | null
): string {
  const url = new URL(`https://www.googleapis.com/drive/v3/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });
  if (apiKey) {
    url.searchParams.set('key', apiKey);
  }
  return url.toString();
}

/**
 * Fetch a single page from Google Drive API with exponential backoff retry on 429/503 quota exhaustion
 */
async function driveFetchWithRetry(
  url: string,
  accessToken?: string | null,
  signal?: AbortSignal,
  retries = 4
): Promise<any> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers, signal });
      if (res.ok) {
        return await res.json();
      }

      // Check for quota or rate limit during bulk folder scans
      if (res.status === 429 || res.status === 500 || res.status === 502 || res.status === 503) {
        const backoffMs = Math.pow(2, attempt) * 900 + Math.random() * 400;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      const errorBody = await res.json().catch(() => ({}));
      const message =
        errorBody?.error?.message ||
        `Google Drive API error: ${res.status} ${res.statusText}`;

      if (res.status === 401) {
        authService.setDriveAccessToken(null);
        throw new Error(
          'โทเค็นการเข้าถึง Google Drive หมดอายุ กรุณากดปุ่ม "Sign in with Google" เพื่อเชื่อมต่อสิทธิ์ใหม่อีกครั้ง'
        );
      }
      if (res.status === 403) {
        throw new Error(
          'ไม่มีสิทธิ์เข้าถึงโฟลเดอร์นี้ กรุณาตรวจสอบว่าแชร์สิทธิ์ให้บัญชีที่ล็อกอิน หรือเปิด Anyone with the link can view แล้ว (หากใช้ API Key บน Vercel ตรวจสอบ HTTP Referrer Restriction ใน Google Cloud Console)'
        );
      }
      if (res.status === 404) {
        throw new Error(
          'ไม่พบโฟลเดอร์ใน Google Drive กรุณาตรวจสอบลิงก์โฟลเดอร์ หรือตรวจสอบว่าบัญชี Google ที่ใช้เชื่อมต่อมีสิทธิ์เข้าถึงโฟลเดอร์นี้'
        );
      }

      throw new Error(message);
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      if (attempt === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
  }
}

/**
 * Scans a Google Drive folder recursively using Breadth-First Search (BFS)
 * Supports Personal Drive & Google Workspace Shared Drives with 500-item pages for fast bulk scanning.
 */
export async function scanGoogleDriveFolderRecursive({
  folderUrlOrId,
  accessToken,
  apiKey,
  maxDepth = 10,
  onProgress,
  signal,
}: ScanOptions): Promise<RecursiveScanResult> {
  const rootFolderId = extractGoogleDriveFolderId(folderUrlOrId);
  if (!rootFolderId) {
    throw new Error('ลิงก์โฟลเดอร์ Google Drive ไม่ถูกต้อง กรุณาวางลิงก์โฟลเดอร์ให้ครบถ้วน');
  }

  const effectiveAccessToken = accessToken || authService.getDriveAccessToken();
  const effectiveApiKey = (apiKey && apiKey.trim()) || defaultGoogleDriveApiKey || null;

  if (!effectiveAccessToken && !effectiveApiKey) {
    throw new Error(
      'กรุณาเข้าสู่ระบบด้วย Google หรือระบุ Google Drive API Key เพื่อใช้สแกนไฟล์'
    );
  }

  // 1. Fetch Root Folder metadata to get its actual name (with Shared Drive support)
  let rootFolderName = 'คลังหลัก Google Drive';
  try {
    const rootMetaUrl = buildDriveApiUrl(
      `files/${rootFolderId}`,
      {
        fields: 'id,name,mimeType',
        supportsAllDrives: 'true',
      },
      effectiveAccessToken ? null : effectiveApiKey
    );
    const rootMeta = await driveFetchWithRetry(rootMetaUrl, effectiveAccessToken, signal);
    if (rootMeta?.name) {
      rootFolderName = rootMeta.name;
    }
  } catch (err) {
    console.warn('Could not fetch root folder metadata, using fallback name:', err);
  }

  const visitedFolderIds = new Set<string>();
  const seenVideoIds = new Set<string>();
  const discoveredVideos: DiscoveredDriveVideo[] = [];
  const folderSummariesMap = new Map<string, DriveFolderSummary>();

  // Queue holds folder traversal items
  interface QueueItem {
    id: string;
    name: string;
    path: string[];
    depth: number;
  }

  const queue: QueueItem[] = [
    {
      id: rootFolderId,
      name: rootFolderName,
      path: [rootFolderName],
      depth: 0,
    },
  ];

  let foldersScannedCount = 0;

  // BFS Traversal
  while (queue.length > 0) {
    if (signal?.aborted) {
      throw new Error('การสแกนถูกยกเลิก');
    }

    const current = queue.shift()!;
    if (visitedFolderIds.has(current.id)) continue;
    visitedFolderIds.add(current.id);
    foldersScannedCount++;

    const folderSummary: DriveFolderSummary = {
      id: current.id,
      name: current.name,
      path: current.path.join(' / '),
      depth: current.depth,
      videoCount: 0,
    };

    onProgress?.({
      foldersScanned: foldersScannedCount,
      foldersPending: queue.length,
      videosFound: discoveredVideos.length,
      currentFolder: current.name,
      currentDepth: current.depth,
    });

    // Fetch all children in this folder with large pagination (500 per page for fast bulk scans)
    let pageToken: string | undefined = undefined;

    do {
      if (signal?.aborted) throw new Error('การสแกนถูกยกเลิก');

      const query = `'${current.id}' in parents and trashed = false`;
      const listUrl = buildDriveApiUrl(
        'files',
        {
          q: query,
          pageSize: '500',
          supportsAllDrives: 'true',
          includeItemsFromAllDrives: 'true',
          fields:
            'nextPageToken,files(id,name,mimeType,size,createdTime,videoMediaMetadata,webViewLink,thumbnailLink,shortcutDetails)',
          ...(pageToken ? { pageToken } : {}),
        },
        effectiveAccessToken ? null : effectiveApiKey
      );

      const data = await driveFetchWithRetry(listUrl, effectiveAccessToken, signal);
      const files: any[] = data.files || [];

      for (const file of files) {
        const isFolder =
          file.mimeType === 'application/vnd.google-apps.folder' ||
          (file.mimeType === 'application/vnd.google-apps.shortcut' &&
            file.shortcutDetails?.targetMimeType === 'application/vnd.google-apps.folder');

        const targetId =
          file.mimeType === 'application/vnd.google-apps.shortcut' && file.shortcutDetails?.targetId
            ? file.shortcutDetails.targetId
            : file.id;

        if (isFolder) {
          // If within depth limit and not visited, push to queue
          if (current.depth + 1 <= maxDepth && !visitedFolderIds.has(targetId)) {
            queue.push({
              id: targetId,
              name: file.name,
              path: [...current.path, file.name],
              depth: current.depth + 1,
            });
          }
        } else if (isEligibleVideoFile(file.name, file.mimeType)) {
          if (seenVideoIds.has(targetId)) continue;
          seenVideoIds.add(targetId);

          // File is a video!
          folderSummary.videoCount++;
          const cleanTitle = cleanFootageTitle(file.name);
          const driveFileUrl =
            file.webViewLink || `https://drive.google.com/file/d/${targetId}/view`;

          let durationSec: number | undefined = undefined;
          if (file.videoMediaMetadata?.durationMillis) {
            durationSec = Math.round(Number(file.videoMediaMetadata.durationMillis) / 1000);
          }

          discoveredVideos.push({
            id: targetId,
            name: file.name,
            cleanTitle,
            mimeType: file.mimeType || 'video/mp4',
            webViewLink: driveFileUrl,
            thumbnailUrl:
              file.thumbnailLink ||
              `https://drive.google.com/thumbnail?id=${targetId}&sz=w320`,
            sizeBytes: Number(file.size || 0),
            createdTime: file.createdTime || new Date().toISOString(),
            durationSec: durationSec || 25,
            folderPath: current.path,
            parentFolderName: current.name,
            parentFolderId: current.id,
          });
        }
      }

      pageToken = data.nextPageToken;
      if (pageToken) {
        onProgress?.({
          foldersScanned: foldersScannedCount,
          foldersPending: queue.length,
          videosFound: discoveredVideos.length,
          currentFolder: current.name,
          currentDepth: current.depth,
        });
      }
    } while (pageToken);

    folderSummariesMap.set(current.id, folderSummary);
  }

  return {
    rootFolderId,
    rootFolderName,
    totalFoldersScanned: foldersScannedCount,
    totalVideosDiscovered: discoveredVideos.length,
    folders: Array.from(folderSummariesMap.values()),
    videos: discoveredVideos,
  };
}
