import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  FolderDown,
  FolderOpen,
  FolderTree,
  Inbox,
  Key,
  Layers,
  Link2,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { useAuth } from '../../context/AuthContext';
import {
  scanGoogleDriveFolderRecursive,
  extractGoogleDriveFolderId,
  DiscoveredDriveVideo,
  ScanProgressUpdate,
  RecursiveScanResult,
} from '../../services/driveScannerService';
import {
  reconcileSubfolder,
  ReconciledCategoryResult,
  cleanSubfolderCategoryName,
} from '../../utils/tagReconciler';
import { STAGING_TAG_ID } from '../../services/seedData';
import { cleanFootageTitle } from '../../utils/fileNameGenerator';
import { CategoryTag } from '../../types/tag.types';

interface ParsedPastedItem {
  id: string;
  title: string;
  driveFileUrl: string;
  cleanFileName: string;
}

export const GoogleDriveBatchImportModal: React.FC = () => {
  const {
    isGoogleDriveBatchModalOpen,
    setIsGoogleDriveBatchModalOpen,
    batchAddDirectFootage,
    batchAddTags,
    tags,
    categoryGroups,
    computedFootage,
    setActiveTab,
    setSelectedTagFilter,
    settings,
  } = useCMS();

  const {
    currentUser,
    signInWithGoogle,
    driveAccessToken,
    isGoogleDriveConnected,
    logout,
  } = useAuth();

  // Mode: RECURSIVE (Enterprise Scan) vs PASTE (Manual Text)
  const [activeImportMode, setActiveImportMode] = useState<'RECURSIVE' | 'PASTE'>('RECURSIVE');
  const [folderUrl, setFolderUrl] = useState(settings.driveRootFolderUrl || '');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('DRIVE_API_KEY') || '');
  const [isApiKeyExpanded, setIsApiKeyExpanded] = useState(false);
  const [maxDepth, setMaxDepth] = useState<number>(10);
  const [idPrefix, setIdPrefix] = useState<'CLP' | 'FT'>('CLP');

  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgressUpdate | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<RecursiveScanResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Selection & Filtering State
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('ALL');
  const [previewSearch, setPreviewSearch] = useState('');

  // Pasted mode fallback state
  const [pastedText, setPastedText] = useState('');

  // Execution & Progress State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccessData, setImportSuccessData] = useState<{
    totalImported: number;
    newTagsCreated: number;
    createdTagNames: string[];
  } | null>(null);

  // Handle Save API Key
  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    if (val.trim()) {
      localStorage.setItem('DRIVE_API_KEY', val.trim());
    } else {
      localStorage.removeItem('DRIVE_API_KEY');
    }
  };

  // 1. Reconcile Categories for Discovered Videos
  const { folderCategoryMap, newTagsToCreate } = useMemo(() => {
    if (!scanResult || scanResult.videos.length === 0) {
      return { folderCategoryMap: new Map<string, ReconciledCategoryResult>(), newTagsToCreate: [] };
    }

    const map = new Map<string, ReconciledCategoryResult>();
    const inMemoryNewTags: CategoryTag[] = [];

    // Group distinct immediate parent folders
    const distinctFolderNames = Array.from(
      new Set(scanResult.videos.map((v) => v.parentFolderName || scanResult.rootFolderName))
    );

    distinctFolderNames.forEach((folderName) => {
      const reconciled = reconcileSubfolder(
        folderName,
        tags,
        categoryGroups,
        inMemoryNewTags
      );
      map.set(folderName, reconciled);
      if (reconciled.isNew) {
        inMemoryNewTags.push(reconciled.tag);
      }
    });

    return { folderCategoryMap: map, newTagsToCreate: inMemoryNewTags };
  }, [scanResult, tags, categoryGroups]);

  // 2. Start Recursive Scan
  const handleStartScan = async () => {
    const extractedId = extractGoogleDriveFolderId(folderUrl);
    if (!extractedId) {
      setScanError('กรุณาระบุลิงก์โฟลเดอร์ Google Drive หรือ Folder ID ที่ถูกต้อง');
      return;
    }

    if (!driveAccessToken && !apiKey.trim()) {
      setScanError('กรุณาเข้าสู่ระบบด้วย Google หรือกรอก Google Drive API Key สำรองก่อนเริ่มสแกน');
      return;
    }

    setScanError(null);
    setIsScanning(true);
    setScanResult(null);
    setScanProgress({
      foldersScanned: 0,
      foldersPending: 1,
      videosFound: 0,
      currentFolder: 'กำลังเตรียมการเชื่อมต่อ...',
      currentDepth: 0,
    });

    abortControllerRef.current = new AbortController();

    try {
      const result = await scanGoogleDriveFolderRecursive({
        folderUrlOrId: extractedId,
        accessToken: driveAccessToken,
        apiKey: apiKey.trim() || undefined,
        maxDepth,
        onProgress: (prog) => {
          setScanProgress(prog);
        },
        signal: abortControllerRef.current.signal,
      });

      setScanResult(result);
      // Select all discovered videos by default
      setSelectedVideoIds(new Set(result.videos.map((v) => v.id)));
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Scan error:', err);
        setScanError(err.message || 'เกิดข้อผิดพลาดในการสแกน Google Drive');
      }
    } finally {
      setIsScanning(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsScanning(false);
  };

  // 3. Selection Handlers
  const handleToggleSelectAll = (filteredVideos: DiscoveredDriveVideo[]) => {
    const isAllSelected = filteredVideos.every((v) => selectedVideoIds.has(v.id));
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (isAllSelected) {
        filteredVideos.forEach((v) => next.delete(v.id));
      } else {
        filteredVideos.forEach((v) => next.add(v.id));
      }
      return next;
    });
  };

  const handleToggleOne = (id: string) => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered Discovered Videos in Preview
  const displayedVideos = useMemo(() => {
    if (!scanResult) return [];
    let list = scanResult.videos;

    if (selectedFolderFilter !== 'ALL') {
      list = list.filter((v) => v.parentFolderName === selectedFolderFilter);
    }

    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.cleanTitle.toLowerCase().includes(q) ||
          v.parentFolderName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [scanResult, selectedFolderFilter, previewSearch]);

  // 4. Pasted fallback parsing
  const parsedPastedItems: ParsedPastedItem[] = useMemo(() => {
    if (activeImportMode !== 'PASTE') return [];
    const lines = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line, idx) => {
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
      let driveUrl = urlMatch ? urlMatch[1] : '';
      let remainingText = line.replace(driveUrl, '').trim();

      if (!remainingText && driveUrl) {
        remainingText = `คลิปจากไดรฟ์_ลำดับ_${idx + 1}`;
      } else if (!remainingText) {
        remainingText = line;
      }

      const cleanTitle = cleanFootageTitle(remainingText);
      return {
        id: `paste-item-${idx}`,
        title: cleanTitle,
        driveFileUrl: driveUrl || `https://drive.google.com/file/d/paste-${idx + 1}/view`,
        cleanFileName: `${cleanTitle}.mp4`,
      };
    });
  }, [activeImportMode, pastedText]);

  // 5. Execute Batch Import
  const handleExecuteImport = async () => {
    setIsImporting(true);
    setImportProgress(10);

    try {
      if (activeImportMode === 'RECURSIVE') {
        if (!scanResult) return;
        const targetVideos = scanResult.videos.filter((v) => selectedVideoIds.has(v.id));
        if (targetVideos.length === 0) return;

        // Step A: Create any new CategoryTags that don't exist yet
        if (newTagsToCreate.length > 0) {
          batchAddTags(newTagsToCreate);
        }
        setImportProgress(35);

        // Step B: Build Footage Payload with Pre-assigned Tags based on Subfolder
        const payloadItems = targetVideos.map((item) => {
          const folderName = item.parentFolderName || scanResult.rootFolderName;
          const reconciled = folderCategoryMap.get(folderName);
          const assignedTagId = reconciled ? reconciled.tagId : STAGING_TAG_ID;

          return {
            title: item.cleanTitle,
            driveFileUrl: item.webViewLink,
            originalUrl: item.webViewLink,
            tags: [assignedTagId],
            mascotNotes: `นำเข้าจากโฟลเดอร์ "${folderName}"`,
            durationSec: item.durationSec || 25,
          };
        });

        setImportProgress(65);
        const added = batchAddDirectFootage(payloadItems, idPrefix);
        setImportProgress(100);

        setImportSuccessData({
          totalImported: added.length,
          newTagsCreated: newTagsToCreate.length,
          createdTagNames: newTagsToCreate.map((t) => t.name),
        });
      } else {
        // Mode PASTE
        if (parsedPastedItems.length === 0) return;
        const payload = parsedPastedItems.map((item) => ({
          title: item.title,
          driveFileUrl: item.driveFileUrl,
          originalUrl: item.driveFileUrl,
          tags: [STAGING_TAG_ID],
          mascotNotes: 'นำเข้าแบบข้อความ (รอจัดหมวดหมู่)',
          durationSec: 25,
        }));

        const added = batchAddDirectFootage(payload, idPrefix);
        setImportProgress(100);
        setImportSuccessData({
          totalImported: added.length,
          newTagsCreated: 0,
          createdTagNames: [],
        });
      }
    } catch (err) {
      console.error('Execute import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (isScanning && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGoogleDriveBatchModalOpen(false);
    setImportSuccessData(null);
    setScanResult(null);
  };

  const handleGoToLibrary = () => {
    handleClose();
    setActiveTab('FOOTAGE_LIBRARY');
  };

  if (!isGoogleDriveBatchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>นำเข้าฟุตเทจจำนวนมากจาก Google Drive</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-bold">
                  Enterprise Recursive Scanner
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                สแกนโฟลเดอร์ย่อยอัตโนมัติ คัดกรองเฉพาะไฟล์วิดีโอ และแปลงชื่อ Subfolder เป็นหมวดหมู่ทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {importSuccessData ? (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl my-3"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-emerald-950">
                  นำเข้าสำเร็จ {importSuccessData.totalImported} วิดีโอเข้าสู่คลังเรียบร้อยแล้ว!
                </h4>
                {importSuccessData.newTagsCreated > 0 ? (
                  <div className="text-xs text-emerald-800 mt-2 max-w-lg mx-auto">
                    <p className="font-semibold mb-1">
                      ระบบได้สร้างหมวดหมู่ใหม่ {importSuccessData.newTagsCreated} หมวดจากชื่อ Subfolder ให้อัตโนมัติ:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      {importSuccessData.createdTagNames.map((name, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 font-bold text-emerald-900 text-[11px]"
                        >
                          #{name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                    ไฟล์ทั้งหมดถูกจับคู่เข้ากับหมวดหมู่ที่มีอยู่เดิม และพร้อมให้นำไปจัด 5 อันดับได้ทันที
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleGoToLibrary}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>ไปยังคลังฟุตเทจเพื่อตรวจสอบ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* 1. Google Workspace Connection Card */}
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isGoogleDriveConnected
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {isGoogleDriveConnected ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {isGoogleDriveConnected
                          ? `เชื่อมต่อบัญชี Google: ${currentUser?.displayName || currentUser?.email}`
                          : 'การเชื่อมต่อ Google Workspace / Drive API'}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                          isGoogleDriveConnected
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isGoogleDriveConnected ? 'OAuth พร้อมใช้งาน' : 'ต้องยืนยันสิทธิ์'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {isGoogleDriveConnected
                        ? 'พร้อมสแกนโฟลเดอร์ส่วนตัวของทีม และ Shared Drives ได้อย่างปลอดภัย'
                        : 'เข้าสู่ระบบด้วย Google เพื่อให้แอปสามารถเข้าถึงและจัดระเบียบไฟล์ตามที่ได้รับอนุญาต'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {isGoogleDriveConnected ? (
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      สลับบัญชี Google
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsApiKeyExpanded((prev) => !prev)}
                    className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
                    title="ตั้งค่า Google Drive API Key สำรอง"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible API Key setting */}
              <AnimatePresence>
                {isApiKeyExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 overflow-hidden text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Google Drive API Key สำรอง (สำหรับโฟลเดอร์สาธารณะโดยไม่ต้องล็อกอิน)</span>
                      </span>
                      {apiKey && (
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">
                          ✓ บันทึกไว้แล้ว
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mode Switcher */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveImportMode('RECURSIVE')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeImportMode === 'RECURSIVE'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                    <span>สแกนโฟลเดอร์อัตโนมัติ (Recursive)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImportMode('PASTE')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeImportMode === 'PASTE'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>วางข้อความรายชื่อ (Manual Paste)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <span>รหัสคลิป:</span>
                    <select
                      value={idPrefix}
                      onChange={(e) => setIdPrefix(e.target.value as 'CLP' | 'FT')}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-900 cursor-pointer focus:outline-none"
                    >
                      <option value="CLP">CLP-xxx (แนะนำ)</option>
                      <option value="FT">FT-xxxx</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mode 1: RECURSIVE SCANNER */}
              {activeImportMode === 'RECURSIVE' && (
                <div className="space-y-4">
                  <div className="space-y-3 bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        ลิงก์โฟลเดอร์ Google Drive หรือ Folder ID:
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1">
                          <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={folderUrl}
                            onChange={(e) => setFolderUrl(e.target.value)}
                            placeholder="วางลิงก์ เช่น https://drive.google.com/drive/folders/1aBcDeFgHiJk..."
                            className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleStartScan}
                          disabled={isScanning || !folderUrl.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                        >
                          {isScanning ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>กำลังสแกนโฟลเดอร์...</span>
                            </>
                          ) : (
                            <>
                              <FolderTree className="w-4 h-4" />
                              <span>เริ่มสแกนลึกทุกโฟลเดอร์ย่อย</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>
                          สแกนลึกทุก Subfolder, กรองเฉพาะวิดีโอ (MP4, MOV, MKV) และแปลงชื่อ Subfolder เป็นแท็กหมวดหมู่อัตโนมัติ
                        </span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span>ความลึกสูงสุด:</span>
                        <select
                          value={maxDepth}
                          onChange={(e) => setMaxDepth(Number(e.target.value))}
                          className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono"
                        >
                          <option value="5">5 ชั้น</option>
                          <option value="10">10 ชั้น (แนะนำ)</option>
                          <option value="20">20 ชั้น</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Scan Error Message */}
                  {scanError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">ไม่สามารถสแกนโฟลเดอร์ได้</div>
                        <div className="mt-0.5 text-rose-700">{scanError}</div>
                      </div>
                    </div>
                  )}

                  {/* Live Scan Progress Indicator */}
                  {isScanning && scanProgress && (
                    <div className="p-4 bg-indigo-50/70 border border-indigo-200/90 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                          <span className="text-xs font-bold text-indigo-950">
                            กำลังสำรวจโครงสร้างไดรฟ์แบบ Recursive...
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCancelScan}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          ยกเลิกการสแกน
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                          <div className="text-[10px] text-slate-500">สแกนแล้ว</div>
                          <div className="text-base font-bold font-mono text-slate-900">
                            {scanProgress.foldersScanned} โฟลเดอร์
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                          <div className="text-[10px] text-slate-500">ในคิวรอสแกน</div>
                          <div className="text-base font-bold font-mono text-slate-900">
                            {scanProgress.foldersPending} โฟลเดอร์
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                          <div className="text-[10px] text-slate-500">วิดีโอที่ตรวจพบ</div>
                          <div className="text-base font-bold font-mono text-emerald-600">
                            {scanProgress.videosFound} ไฟล์
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-indigo-100 truncate">
                          <div className="text-[10px] text-slate-500 truncate">โฟลเดอร์ปัจจุบัน</div>
                          <div className="text-xs font-bold text-indigo-900 truncate">
                            {scanProgress.currentFolder}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Discovered Results Table & Subfolder Mapping */}
                  {scanResult && (
                    <div className="space-y-3 pt-1">
                      {/* Subfolder Category Auto-Mapping Summary */}
                      <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-900">
                              การจับคู่หมวดหมู่อัตโนมัติจาก Subfolder ({folderCategoryMap.size} หมวด)
                            </span>
                          </div>
                          {newTagsToCreate.length > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              จะสร้างหมวดใหม่ให้อัตโนมัติ {newTagsToCreate.length} หมวด
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {Array.from(folderCategoryMap.values()).map((reconciled, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border ${
                                reconciled.isNew
                                  ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-bold'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              <FolderOpen className="w-3 h-3 text-slate-400" />
                              <span className="font-mono text-[11px] text-slate-500">{reconciled.folderName}</span>
                              <span className="text-slate-300">➔</span>
                              <Tag className="w-3 h-3 text-indigo-500" />
                              <span>{reconciled.cleanedCategoryName}</span>
                              {reconciled.isNew && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-200/70 text-emerald-800">
                                  หมวดใหม่
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Video Table Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectAll(displayedVideos)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {displayedVideos.every((v) => selectedVideoIds.has(v.id))
                                ? 'ยกเลิกเลือกทั้งหมด'
                                : 'เลือกทั้งหมดในมุมมองนี้'}
                            </span>
                          </button>

                          <span className="text-xs text-slate-500 font-mono">
                            เลือกอยู่ {selectedVideoIds.size} / {scanResult.totalVideosDiscovered} ไฟล์
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Subfolder Filter Dropdown */}
                          <select
                            value={selectedFolderFilter}
                            onChange={(e) => setSelectedFolderFilter(e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="ALL">ทุกโฟลเดอร์ย่อย ({scanResult.videos.length})</option>
                            {Array.from(folderCategoryMap.keys()).map((fname, i) => (
                              <option key={i} value={fname}>
                                📁 {fname}
                              </option>
                            ))}
                          </select>

                          {/* Search Filter */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={previewSearch}
                              onChange={(e) => setPreviewSearch(e.target.value)}
                              placeholder="ค้นหาชื่อไฟล์..."
                              className="pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 outline-none w-36"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Video List Table */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto bg-white shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold z-10">
                            <tr>
                              <th className="py-2 px-3 w-10 text-center">เลือก</th>
                              <th className="py-2 px-3 w-28 font-mono">รหัสใหม่</th>
                              <th className="py-2 px-3">ชื่อคลิปวิดีโอ</th>
                              <th className="py-2 px-3 w-36">โฟลเดอร์ต้นทาง</th>
                              <th className="py-2 px-3 w-32">หมวดหมู่ที่จะได้รับ</th>
                              <th className="py-2 px-3 w-20 text-right">ความยาว</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {displayedVideos.slice(0, 150).map((video, idx) => {
                              const isSelected = selectedVideoIds.has(video.id);
                              const previewId = `${idPrefix}-${String(
                                computedFootage.length + idx + 1
                              ).padStart(idPrefix === 'CLP' ? 3 : 4, '0')}`;
                              const reconciled = folderCategoryMap.get(
                                video.parentFolderName || scanResult.rootFolderName
                              );

                              return (
                                <tr
                                  key={video.id}
                                  onClick={() => handleToggleOne(video.id)}
                                  className={`hover:bg-slate-50 cursor-pointer ${
                                    isSelected ? 'bg-indigo-50/40' : ''
                                  }`}
                                >
                                  <td className="py-1.5 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleOne(video.id)}
                                      className="rounded text-indigo-600 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-1.5 px-3 font-bold text-indigo-700">
                                    {previewId}
                                  </td>
                                  <td className="py-1.5 px-3 font-sans font-bold text-slate-900 truncate max-w-xs">
                                    {video.cleanTitle}
                                  </td>
                                  <td className="py-1.5 px-3 font-sans text-slate-600 truncate max-w-[130px]">
                                    📁 {video.parentFolderName}
                                  </td>
                                  <td className="py-1.5 px-3 font-sans">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                        reconciled?.isNew
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-indigo-100 text-indigo-800'
                                      }`}
                                    >
                                      #{reconciled?.cleanedCategoryName || 'ทั่วไป'}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-3 text-right text-slate-500 font-mono">
                                    {video.durationSec}s
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {displayedVideos.length > 150 && (
                        <p className="text-[11px] text-slate-400 text-right">
                          * แสดง 150 รายการแรกจากทั้งหมด {displayedVideos.length} ไฟล์
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: MANUAL PASTE FALLBACK */}
              {activeImportMode === 'PASTE' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800">
                      วางรายชื่อไฟล์ และ/หรือ ลิงก์ Google Drive (1 บรรทัดต่อ 1 ไฟล์):
                    </label>
                    <span className="font-mono text-slate-500 font-semibold">
                      {parsedPastedItems.length} บรรทัดที่ตรวจพบ
                    </span>
                  </div>
                  <textarea
                    rows={7}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`https://drive.google.com/file/d/1ABC.../view แมวส้มกระโดดพลาดตกโต๊ะ.mp4
https://drive.google.com/file/d/2XYZ.../view น้องหมาโกลเด้นร้องเพลง.mov
พี่แจ๊สตบมุกฮากลางรายการ.mp4`}
                    className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {importSuccessData === null && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {activeImportMode === 'RECURSIVE' && scanResult
                  ? `พร้อมนำเข้า ${selectedVideoIds.size} วิดีโอ และสร้าง ${newTagsToCreate.length} หมวดหมู่อัตโนมัติ`
                  : 'นำเข้าสู่พื้นที่คลังฟุตเทจโดยอัตโนมัติ'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={
                  isImporting ||
                  (activeImportMode === 'RECURSIVE' && selectedVideoIds.size === 0) ||
                  (activeImportMode === 'PASTE' && parsedPastedItems.length === 0)
                }
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>กำลังนำเข้า {importProgress}%...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {activeImportMode === 'RECURSIVE' && scanResult
                        ? `นำเข้า ${selectedVideoIds.size} คลิปพร้อมจัดหมวดหมู่อัตโนมัติ`
                        : `นำเข้า ${parsedPastedItems.length} คลิปทันที`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
