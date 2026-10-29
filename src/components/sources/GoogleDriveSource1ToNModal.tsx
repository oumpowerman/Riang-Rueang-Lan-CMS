import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FolderGit2,
  FolderTree,
  HardDrive,
  KeyRound,
  Layers,
  Loader2,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import {
  DiscoveredDriveVideo,
  extractGoogleDriveFolderId,
  scanGoogleDriveFolderRecursive,
} from '../../services/driveScannerService';
import { SourcePlatform } from '../../types/source.types';
import { CategoryTag } from '../../types/tag.types';
import { reconcileSubfolder } from '../../utils/tagReconciler';

interface GoogleDriveSource1ToNModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportStructureMode = 'SINGLE_SOURCE' | 'MULTI_SUBFOLDER';

interface SubfolderBucket {
  folderId: string;
  folderName: string;
  folderPath: string;
  files: DiscoveredDriveVideo[];
}

export const GoogleDriveSource1ToNModal: React.FC<GoogleDriveSource1ToNModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    tags,
    categoryGroups,
    batchAddTags,
    createSourceWithSplitFootage,
    batchCreateSourcesWithSplitFootage,
  } = useCMS();
  const { driveAccessToken, signInWithGoogle } = useAuth();

  const [importMode, setImportMode] = useState<ImportStructureMode>('SINGLE_SOURCE');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [fallbackApiKey, setFallbackApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const [platform, setPlatform] = useState<SourcePlatform>('YOUTUBE');
  const [channelOrCreator, setChannelOrCreator] = useState('');
  const [customSourceTitle, setCustomSourceTitle] = useState('');
  const [totalDuration, setTotalDuration] = useState('01:30:00');
  const [selectedTagId, setSelectedTagId] = useState<string>(tags[0]?.id || 'tag-streamer');

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressMsg, setScanProgressMsg] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [discoveredBuckets, setDiscoveredBuckets] = useState<SubfolderBucket[]>([]);
  const [rootFolderName, setRootFolderName] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const totalDiscoveredVideos = useMemo(
    () => discoveredBuckets.reduce((acc, b) => acc + b.files.length, 0),
    [discoveredBuckets]
  );

  if (!isOpen) return null;

  const handleScanFolder = async () => {
    setScanError(null);
    setImportSuccessMsg(null);
    const folderId = extractGoogleDriveFolderId(driveFolderUrl);
    if (!folderId) {
      setScanError('กรุณาวางลิงก์โฟลเดอร์ Google Drive หรือรหัส Folder ID ที่ถูกต้อง');
      return;
    }

    if (!driveAccessToken && !fallbackApiKey.trim()) {
      setScanError(
        'กรุณากดเชื่อมต่อ Google Drive (OAuth) หรือใส่ Google Drive API Key สำรองก่อนเริ่มสแกน'
      );
      return;
    }

    setIsScanning(true);
    setScanProgressMsg('กำลังเริ่มสแกนโฟลเดอร์ Google Drive...');
    try {
      const result = await scanGoogleDriveFolderRecursive({
        folderUrlOrId: folderId,
        accessToken: driveAccessToken,
        apiKey: fallbackApiKey.trim() || undefined,
        onProgress: (p) => {
          setScanProgressMsg(
            `สแกนแล้ว ${p.foldersScanned} โฟลเดอร์ · พบไฟล์วิดีโอ ${p.videosFound} ช็อต (${p.currentFolder})`
          );
        },
      });

      setRootFolderName(result.rootFolderName);

      // Group videos by parentFolderId
      const bucketMap = new Map<string, SubfolderBucket>();
      for (const vid of result.videos) {
        const key = vid.parentFolderId || result.rootFolderId;
        const existing = bucketMap.get(key);
        if (existing) {
          existing.files.push(vid);
        } else {
          bucketMap.set(key, {
            folderId: key,
            folderName: vid.parentFolderName || result.rootFolderName || 'Google Drive',
            folderPath: vid.folderPath.join(' / '),
            files: [vid],
          });
        }
      }

      setDiscoveredBuckets(Array.from(bucketMap.values()));
      if (!customSourceTitle.trim() && result.rootFolderName) {
        setCustomSourceTitle(result.rootFolderName);
      }
      if (result.totalVideosDiscovered === 0) {
        setScanError('ไม่พบไฟล์วิดีโอ (.mp4, .mov, .mkv) ในโฟลเดอร์นี้');
      }
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : 'เกิดข้อผิดพลาดในการสแกนโฟลเดอร์ Google Drive'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmImport = async () => {
    if (totalDiscoveredVideos === 0) return;
    setIsScanning(true);
    setScanError(null);

    try {
      if (importMode === 'SINGLE_SOURCE') {
        const allFiles = discoveredBuckets.flatMap((b) => b.files);
        const titleToUse =
          customSourceTitle.trim() ||
          rootFolderName ||
          `ไลฟ์สดนำเข้าจาก Google Drive (${allFiles.length} ช็อต)`;

        createSourceWithSplitFootage(
          {
            title: titleToUse,
            originalUrl: driveFolderUrl.trim() || 'https://drive.google.com',
            platform,
            channelOrCreator: channelOrCreator.trim() || 'Google Drive Studio',
            totalDuration: totalDuration.trim() || '01:30:00',
            tags: [selectedTagId],
            notes: `นำเข้าแบบ 1:N จากโฟลเดอร์ Google Drive (${allFiles.length} ช็อตย่อย)`,
          },
          allFiles.map((file, idx) => {
            const startMin = idx * 6 + 2;
            const endMin = startMin + 1;
            const ts = `${String(startMin).padStart(2, '0')}:10 - ${String(endMin).padStart(2, '0')}:05`;
            return {
              title: file.cleanTitle || file.name.replace(/\.(mp4|mov|mkv|webm)$/i, ''),
              timestampRange: ts,
              tags: [selectedTagId],
              mascotNotes: `หั่นจากโฟลเดอร์ ${rootFolderName || 'Drive'}`,
              driveFileUrl: file.webViewLink,
            };
          })
        );

        setImportSuccessMsg(
          `สร้างคลิปต้นฉบับ 1 ไลฟ์ พร้อมแตกฟุตย่อย ${allFiles.length} ช็อต (Flow 1:N) เรียบร้อยแล้ว!`
        );
      } else {
        // MULTI_SUBFOLDER mode: 1 Subfolder = 1 Source (SRC) + N child clips
        const newTagsToCreate: CategoryTag[] = [];
        const batchSourcesPayload = [];

        for (const bucket of discoveredBuckets) {
          const reconciled = reconcileSubfolder(
            bucket.folderName,
            tags,
            categoryGroups,
            newTagsToCreate
          );
          if (reconciled.isNew) {
            newTagsToCreate.push(reconciled.tag);
          }

          batchSourcesPayload.push({
            sourcePayload: {
              title: `${bucket.folderName} (รวมช็อตจาก Drive ${bucket.files.length} ฟุต)`,
              originalUrl: `https://drive.google.com/drive/folders/${bucket.folderId}`,
              platform,
              channelOrCreator: channelOrCreator.trim() || bucket.folderName,
              totalDuration: totalDuration.trim() || '01:20:00',
              tags: [reconciled.tagId],
              notes: `นำเข้าอัตโนมัติจากโฟลเดอร์ย่อย: ${bucket.folderPath}`,
            },
            clips: bucket.files.map((file: DiscoveredDriveVideo, idx: number) => {
              const startMin = idx * 5 + 3;
              const endMin = startMin + 1;
              return {
                title: file.cleanTitle || file.name.replace(/\.(mp4|mov|mkv|webm)$/i, ''),
                timestampRange: `${String(startMin).padStart(2, '0')}:00 - ${String(endMin).padStart(2, '0')}:00`,
                tags: [reconciled.tagId],
                mascotNotes: `ช็อตจากโฟลเดอร์ย่อย ${bucket.folderName}`,
                driveFileUrl: file.webViewLink,
              };
            }),
          });
        }

        if (newTagsToCreate.length > 0) {
          batchAddTags(newTagsToCreate);
        }
        batchCreateSourcesWithSplitFootage(batchSourcesPayload);
        setImportSuccessMsg(
          `สร้างคลิปต้นฉบับยาว ${batchSourcesPayload.length} ไลฟ์ แยกตามโฟลเดอร์ย่อย (รวม ${totalDiscoveredVideos} ช็อตย่อย) สำเร็จ!`
        );
      }

      setTimeout(() => {
        onClose();
      }, 1100);
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuickDemoImport = () => {
    if (importMode === 'SINGLE_SOURCE') {
      createSourceWithSplitFootage(
        {
          title:
            customSourceTitle.trim() ||
            'ไลฟ์สดรวมช็อตฮา โหนกระแส & สตรีมเมอร์ (Drive 1:N Pack)',
          originalUrl: 'https://drive.google.com/drive/folders/demo-source-1ton',
          platform,
          channelOrCreator: channelOrCreator.trim() || 'Drive Live Archive',
          totalDuration: '01:45:00',
          tags: [selectedTagId],
          notes: 'นำเข้าจากโฟลเดอร์ Google Drive แบบ 1 โฟลเดอร์ = 1 ไลฟ์ (5 ช็อตย่อยพร้อมลิงก์ Drive)',
        },
        [
          {
            title: 'ช็อตเปิดรายการหลุดขำกลางอากาศ',
            timestampRange: '04:15 - 05:05',
            tags: [selectedTagId],
            mascotNotes: 'เปิดหัวคลิปเรียกยอดวิวดีมาก',
            driveFileUrl: 'https://drive.google.com/file/d/1demoClipA001/view',
          },
          {
            title: 'จังหวะโต้คารมโบ๊ะบ๊ะลั่นสตู',
            timestampRange: '19:10 - 20:00',
            tags: [selectedTagId],
            mascotNotes: 'ตบมุกโบ๊ะบ๊ะ ใส่ซาวด์ตลกเพิ่มได้ทันที',
            driveFileUrl: 'https://drive.google.com/file/d/1demoClipA002/view',
          },
          {
            title: 'ช็อตพยานปากเอกพูดผิดจนพิธีกรกุมขมับ',
            timestampRange: '42:30 - 43:20',
            tags: [selectedTagId],
            mascotNotes: 'จังหวะหักมุมคนดูชอบคอมเมนต์',
            driveFileUrl: 'https://drive.google.com/file/d/1demoClipA003/view',
          },
          {
            title: 'ช็อตหลุดโฟกัสท้ายชั่วโมงแรก',
            timestampRange: '01:02:15 - 01:03:05',
            tags: [selectedTagId],
            mascotNotes: 'เหมาะจัดอยู่อันดับ 2 หรือ 3',
            driveFileUrl: 'https://drive.google.com/file/d/1demoClipA004/view',
          },
          {
            title: 'ช็อตพีคปิดท้ายไลฟ์ ฮาจนน้ำตาเล็ด',
            timestampRange: '01:28:00 - 01:28:55',
            tags: [selectedTagId],
            mascotNotes: 'ช็อตเด็ดเหมาะวางอันดับ 1',
            driveFileUrl: 'https://drive.google.com/file/d/1demoClipA005/view',
          },
        ]
      );
      setImportSuccessMsg(
        'จำลองดึงโฟลเดอร์ Google Drive แบบ 1 โฟลเดอร์ = 1 ไลฟ์ (พร้อม 5 ช็อตย่อย) สำเร็จ!'
      );
    } else {
      batchCreateSourcesWithSplitFootage([
        {
          sourcePayload: {
            title: 'ไลฟ์สดสตรีมเมอร์หัวร้อน Ep.1 (Subfolder Drive)',
            originalUrl: 'https://drive.google.com/drive/folders/demo-sub-1',
            platform: 'YOUTUBE',
            channelOrCreator: 'Streamer Highlight TH',
            totalDuration: '01:20:00',
            tags: [selectedTagId],
            notes: 'ดึงจากโฟลเดอร์ย่อยที่ 1 แบบ Multi-Subfolder 1:N',
          },
          clips: [
            {
              title: 'ช็อตกระโดดตกเหวร้องลั่นห้อง',
              timestampRange: '08:10 - 08:55',
              tags: [selectedTagId],
              mascotNotes: 'เสียงกรี๊ดพีคมาก',
              driveFileUrl: 'https://drive.google.com/file/d/1demoSub1Clip1/view',
            },
            {
              title: 'ช็อตโดนบอสตบทีเดียวเกมโอเวอร์',
              timestampRange: '34:20 - 35:10',
              tags: [selectedTagId],
              mascotNotes: 'รีแอคชั่นหน้าเหวอสุดฮา',
              driveFileUrl: 'https://drive.google.com/file/d/1demoSub1Clip2/view',
            },
          ],
        },
        {
          sourcePayload: {
            title: 'ไลฟ์สดรายการทีวีฮาๆ Ep.2 (Subfolder Drive)',
            originalUrl: 'https://drive.google.com/drive/folders/demo-sub-2',
            platform: 'FACEBOOK',
            channelOrCreator: 'Variety Show Official',
            totalDuration: '01:10:00',
            tags: [selectedTagId],
            notes: 'ดึงจากโฟลเดอร์ย่อยที่ 2 แบบ Multi-Subfolder 1:N',
          },
          clips: [
            {
              title: 'ช็อตพิธีกรอำแขกรับเชิญจนไปไม่เป็น',
              timestampRange: '12:00 - 12:50',
              tags: [selectedTagId],
              mascotNotes: 'จังหวะรับส่งมุกเนียนกริบ',
              driveFileUrl: 'https://drive.google.com/file/d/1demoSub2Clip1/view',
            },
            {
              title: 'ช็อตฉากพังกลางรายการสด',
              timestampRange: '45:10 - 46:00',
              tags: [selectedTagId],
              mascotNotes: 'ช็อตไวรัลคนแชร์เยอะ',
              driveFileUrl: 'https://drive.google.com/file/d/1demoSub2Clip2/view',
            },
            {
              title: 'ช็อตหลุดขำตอนอ่านคอมเมนต์ทางบ้าน',
              timestampRange: '58:00 - 58:45',
              tags: [selectedTagId],
              mascotNotes: 'คอมเมนต์ปั่นจัด',
              driveFileUrl: 'https://drive.google.com/file/d/1demoSub2Clip3/view',
            },
          ],
        },
      ]);
      setImportSuccessMsg(
        'จำลองดึงหลายโฟลเดอร์ย่อย (2 ไลฟ์ต้นฉบับ · รวม 5 ช็อตย่อย) สำเร็จ!'
      );
    }

    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Google Drive 1:N Source & Split Clips Importer</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              ดึงโฟลเดอร์ไลฟ์สดจาก Google Drive มาสร้างคลิปยาว & แตกช็อตย่อย (Flow 1:N)
            </h2>
            <p className="text-xs text-slate-500">
              เลือกโหมดจับคู่โครงสร้างโฟลเดอร์ได้ทั้งแบบ 1 โฟลเดอร์ต่อ 1 ไลฟ์ หรือหลายโฟลเดอร์ย่อยหลายไลฟ์ พร้อมแนบลิงก์ไฟล์ Drive ให้ทุกช็อตอัตโนมัติ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            1. เลือกรูปแบบการจับคู่โครงสร้างโฟลเดอร์ (Folder-to-Source Mapping):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setImportMode('SINGLE_SOURCE')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                importMode === 'SINGLE_SOURCE'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <FolderGit2 className="w-4 h-4 text-indigo-600" />
                <span>โหมด A: 1 โฟลเดอร์ = 1 ไลฟ์ต้นฉบับ (1:N)</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                เหมาะกับโฟลเดอร์ของไลฟ์ 1 ตอน ที่ทีมตัดต่อหั่นไฟล์คลิปย่อยใส่ไว้ข้างใน (สร้าง 1 SRC + N ฟุตย่อย)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setImportMode('MULTI_SUBFOLDER')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                importMode === 'MULTI_SUBFOLDER'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <FolderTree className="w-4 h-4 text-emerald-600" />
                <span>โหมด B: หลายโฟลเดอร์ย่อย = หลายไลฟ์ (Multi 1:N)</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                เหมาะกับโฟลเดอร์ใหญ่ที่แยกแต่ละไลฟ์เป็น Subfolder ย่อย (สร้างหลาย SRC แยกตามโฟลเดอร์ย่อยอัตโนมัติ)
              </p>
            </button>
          </div>
        </div>

        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              แพลตฟอร์มต้นทาง
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SourcePlatform)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-900"
            >
              <option value="YOUTUBE">YouTube</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="TIKTOK">TikTok</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              หมวดหมู่หลัก (กรณีโหมด A หรือค่าเริ่มต้น)
            </label>
            <select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-900"
            >
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              ความยาวไลฟ์โดยประมาณ (HH:MM:SS)
            </label>
            <input
              type="text"
              value={totalDuration}
              onChange={(e) => setTotalDuration(e.target.value)}
              placeholder="01:30:00"
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          {importMode === 'SINGLE_SOURCE' && (
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                ชื่อไลฟ์สดต้นฉบับ (เว้นว่างเพื่อใช้ชื่อโฟลเดอร์จาก Drive อัตโนมัติ)
              </label>
              <input
                type="text"
                value={customSourceTitle}
                onChange={(e) => setCustomSourceTitle(e.target.value)}
                placeholder="เช่น ไลฟ์สดพี่แจ๊ส & โหนกระแส ช็อตฮาคัดเน้นๆ"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          )}

          <div className={importMode === 'SINGLE_SOURCE' ? '' : 'sm:col-span-3'}>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              ชื่อช่อง / ครีเอเตอร์ต้นทาง
            </label>
            <input
              type="text"
              value={channelOrCreator}
              onChange={(e) => setChannelOrCreator(e.target.value)}
              placeholder="เช่น โหนกระแส Official / แป้ง zbing z."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>
        </div>

        {/* Google Drive Connection & Folder URL */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">
              2. เชื่อมต่อสิทธิ์และวางลิงก์โฟลเดอร์ Google Drive:
            </span>
            <div className="flex items-center gap-2">
              {driveAccessToken ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>เชื่อมต่อ Google Drive OAuth แล้ว</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>เชื่อมต่อ Google Drive (OAuth)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowApiKeyInput((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>API Key สำรอง</span>
              </button>
            </div>
          </div>

          {showApiKeyInput && (
            <input
              type="password"
              value={fallbackApiKey}
              onChange={(e) => setFallbackApiKey(e.target.value)}
              placeholder="วาง Google Drive API Key สำรอง (สำหรับโฟลเดอร์ที่เปิดแชร์สาธารณะ Anyone with the link)..."
              className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
            />
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={driveFolderUrl}
              onChange={(e) => setDriveFolderUrl(e.target.value)}
              placeholder="วางลิงก์ https://drive.google.com/drive/folders/... ที่เก็บไฟล์ช็อตย่อยของไลฟ์สด"
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 focus:bg-white"
            />
            <button
              type="button"
              disabled={isScanning}
              onClick={handleScanFolder}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shrink-0 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสแกน...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>สแกนโฟลเดอร์ 1:N</span>
                </>
              )}
            </button>
          </div>

          {isScanning && scanProgressMsg && (
            <div className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl px-3.5 py-2.5 font-medium">
              {scanProgressMsg}
            </div>
          )}

          {scanError && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {importSuccessMsg && (
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{importSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Discovered Preview */}
        {discoveredBuckets.length > 0 && (
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 max-h-56 overflow-y-auto bg-slate-50/60">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>
                ผลการสแกนโฟลเดอร์ "{rootFolderName}": พบ {discoveredBuckets.length} โฟลเดอร์ย่อย · รวม{' '}
                {totalDiscoveredVideos} ไฟล์วิดีโอ
              </span>
              <span className="text-indigo-700 font-mono">
                {importMode === 'SINGLE_SOURCE'
                  ? `จะสร้าง 1 ไลฟ์ (SRC) + ${totalDiscoveredVideos} ฟุตย่อย`
                  : `จะสร้าง ${discoveredBuckets.length} ไลฟ์ (SRC) + ${totalDiscoveredVideos} ฟุตย่อย`}
              </span>
            </div>
            <div className="space-y-1.5">
              {discoveredBuckets.map((b) => (
                <div
                  key={b.folderId}
                  className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-slate-200/80"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">
                      {b.folderPath}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-700 shrink-0">
                    {b.files.length} ช็อต
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleQuickDemoImport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              จำลองดึงโฟลเดอร์ Drive ({importMode === 'SINGLE_SOURCE' ? '1 ไลฟ์ 5 ช็อต' : '2 ไลฟ์ 5 ช็อต'}) ทดสอบระบบทันที
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={totalDiscoveredVideos === 0 || isScanning}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ยืนยันสร้างไลฟ์ & แตกฟุตย่อย ({totalDiscoveredVideos} ช็อต)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
