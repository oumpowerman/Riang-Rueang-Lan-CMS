import React, { useMemo, useState } from 'react';
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
  Inbox,
  Link2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { STAGING_TAG_ID } from '../../services/seedData';
import { cleanFootageTitle } from '../../utils/fileNameGenerator';

interface ParsedImportItem {
  id: string; // temporary row key
  rawLine: string;
  title: string;
  driveFileUrl: string;
  cleanFileName: string;
  isValid: boolean;
}

export const GoogleDriveBatchImportModal: React.FC = () => {
  const {
    isGoogleDriveBatchModalOpen,
    setIsGoogleDriveBatchModalOpen,
    batchAddDirectFootage,
    computedFootage,
    setActiveTab,
    setSelectedTagFilter,
    settings,
  } = useCMS();

  const [activeImportMode, setActiveImportMode] = useState<'FOLDER' | 'PASTE'>('FOLDER');
  const [folderUrl, setFolderUrl] = useState(settings.driveRootFolderUrl || '');
  const [pastedText, setPastedText] = useState('');
  const [idPrefix, setIdPrefix] = useState<'CLP' | 'FT'>('CLP');
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [previewFilter, setPreviewFilter] = useState('');

  // Sample batch generator for demonstration & instant 300+ file testing
  const generateSample300Batch = () => {
    const categoriesSeed = [
      { name: 'แมวส้มกระโดดพลาดตกโต๊ะ', ext: 'mp4' },
      { name: 'น้องหมาโกลเด้นร้องเพลงประสานเสียง', ext: 'mov' },
      { name: 'พี่แจ๊สตบมุกฮากลางรายการ', ext: 'mp4' },
      { name: 'เอก_HRK_เล่นเกมผีตกเก้าอี้', ext: 'mp4' },
      { name: 'จังหวะนรกหม้อแกงคว่ำคาครัว', ext: 'mp4' },
      { name: 'กรรชัย_ช็อตฟิลแขกรับเชิญ', ext: 'mp4' },
      { name: 'รวมช็อตฮา_สตรีมเมอร์ไทยขำค้าง', ext: 'mov' },
      { name: 'คลิปมุกตลกโบ๊ะบ๊ะสุดขีด', ext: 'mp4' },
      { name: 'น้องหมาไซบีเรียนเถียงเจ้าของคำไม่ตกฟาก', ext: 'mp4' },
      { name: 'ตำนานผีหลอกวิญญาณโผล่กลางไลฟ์', ext: 'mp4' },
      { name: 'อาหารแปลกสุดพิสดารริมทาง', ext: 'mp4' },
      { name: 'แมวสามสีสะดุ้งแตงกวาบิน', ext: 'mov' },
    ];

    const lines: string[] = [];
    for (let i = 1; i <= 315; i++) {
      const seed = categoriesSeed[(i - 1) % categoriesSeed.length];
      const paddedNum = String(i).padStart(3, '0');
      const fakeFileId = `1DriveFileId_${paddedNum}_XYZ${i * 7}`;
      lines.push(
        `https://drive.google.com/file/d/${fakeFileId}/view ${paddedNum}_${seed.name}_เทค${((i % 5) + 1)}.${seed.ext}`
      );
    }
    setPastedText(lines.join('\n'));
    setActiveImportMode('PASTE');
  };

  // Parsing pasted text or folder scan result into items
  const parsedItems: ParsedImportItem[] = useMemo(() => {
    if (activeImportMode === 'FOLDER') {
      // If folder input mode, if empty return empty
      if (!folderUrl.trim()) return [];
      // Generate a structured preview batch from the folder
      const folderIdMatch = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
      const folderId = folderIdMatch ? folderIdMatch[1] : 'sample-folder';
      
      // If user hasn't generated items via scan, return empty
      return [];
    }

    const lines = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line, idx) => {
      // Regex check for Google Drive URL in line
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
      let driveUrl = urlMatch ? urlMatch[1] : '';
      let remainingText = line.replace(driveUrl, '').trim();

      // If no remaining text, check if drive URL has filename or use fallback
      if (!remainingText && driveUrl) {
        // Try to get title from URL or generate placeholder
        remainingText = `คลิปจากไดรฟ์_ลำดับ_${idx + 1}`;
      } else if (!remainingText) {
        remainingText = line;
      }

      const cleanTitle = cleanFootageTitle(remainingText);
      const cleanFileName = `${cleanTitle}.mp4`;

      return {
        id: `item-${idx}`,
        rawLine: line,
        title: cleanTitle,
        driveFileUrl: driveUrl || `https://drive.google.com/file/d/drive-file-${idx + 1}/view`,
        cleanFileName,
        isValid: Boolean(cleanTitle),
      };
    });
  }, [activeImportMode, folderUrl, pastedText]);

  // Filtered preview
  const displayedPreviewItems = useMemo(() => {
    if (!previewFilter.trim()) return parsedItems;
    const q = previewFilter.toLowerCase();
    return parsedItems.filter(
      (it) => it.title.toLowerCase().includes(q) || it.driveFileUrl.toLowerCase().includes(q)
    );
  }, [parsedItems, previewFilter]);

  const handleSimulateScanFolder = () => {
    if (!folderUrl.trim()) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      generateSample300Batch();
    }, 800);
  };

  const handleExecuteImport = async () => {
    if (parsedItems.length === 0) return;
    setIsImporting(true);
    setImportProgress(10);

    // Prepare payload
    const payloadItems = parsedItems.map((item) => ({
      title: item.title,
      driveFileUrl: item.driveFileUrl,
      originalUrl: item.driveFileUrl,
      tags: [STAGING_TAG_ID],
      mascotNotes: '',
      durationSec: 25,
    }));

    // Simulate progressive UI feedback
    const interval = setInterval(() => {
      setImportProgress((p) => (p >= 90 ? 90 : p + 20));
    }, 150);

    try {
      const added = batchAddDirectFootage(payloadItems, idPrefix);
      clearInterval(interval);
      setImportProgress(100);
      setImportSuccessCount(added.length);
    } catch (err) {
      clearInterval(interval);
      console.error('Import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleGoToStaging = () => {
    setIsGoogleDriveBatchModalOpen(false);
    setImportSuccessCount(null);
    setPastedText('');
    // Filter to Staging tag and go to library/vault
    setSelectedTagFilter([STAGING_TAG_ID]);
    setActiveTab('FOOTAGE_LIBRARY');
  };

  const handleClose = () => {
    setIsGoogleDriveBatchModalOpen(false);
    setImportSuccessCount(null);
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>นำเข้าฟุตเทจจำนวนมากจาก Google Drive (Batch Import)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  รองรับ 300+ รายการ
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ดึงชื่อไฟล์อัตโนมัติ รันรหัส CLP-xxx และส่งเข้าพื้นที่พักรอจัดหมวดหมู่ (Staging)
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
          {importSuccessCount !== null ? (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl my-4"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-emerald-950">
                  นำเข้าฟุตเทจสำเร็จ {importSuccessCount} รายการเรียบร้อยแล้ว!
                </h4>
                <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                  ไฟล์ทั้งหมดถูกตั้งรหัสแบบลำดับต่อเนื่อง และเก็บไว้ใน{' '}
                  <strong>&ldquo;พื้นที่พักรอจัดหมวดหมู่ (Staging)&rdquo;</strong>{' '}
                  เพื่อรอให้คุณเลือกหลายคลิปแล้วจัดหมวดหมู่พร้อมกันได้ในขั้นตอนถัดไป
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleGoToStaging}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Inbox className="w-4 h-4 text-amber-400" />
                  <span>ไปยังพื้นที่พักเพื่อเริ่มเลือกจัดหมวดหมู่เป็นชุด</span>
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
              {/* Import Method Tabs */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveImportMode('FOLDER')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeImportMode === 'FOLDER'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>เชื่อมต่อโฟลเดอร์ Drive</span>
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
                    <span>วางรายชื่อ / ลิงก์แบบข้อความ</span>
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

                  <button
                    type="button"
                    onClick={generateSample300Batch}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                    title="ทดสอบดึงชุดตัวอย่าง 315 รายการเพื่อทดสอบระบบ"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>โหลดตัวอย่าง 315 ไฟล์</span>
                  </button>
                </div>
              </div>

              {/* Input Area */}
              {activeImportMode === 'FOLDER' ? (
                <div className="space-y-3 bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      ลิงก์โฟลเดอร์ Google Drive (Folder URL หรือ Folder ID):
                    </label>
                    <div className="flex items-center gap-2">
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
                        onClick={handleSimulateScanFolder}
                        disabled={isScanning || !folderUrl.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังสแกน...</span>
                          </>
                        ) : (
                          <>
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>สแกนไฟล์ในโฟลเดอร์</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                      ระบบจะสแกนหาไฟล์วิดีโอทั้งหมดในโฟลเดอร์ (MP4, MOV, MKV ฯลฯ) นำชื่อไฟล์เดิมมาตั้งเป็นชื่อคลิป และสร้างลิงก์ Google Drive เชื่อมโยงให้อัตโนมัติ
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800">
                      วางรายชื่อไฟล์ และ/หรือ ลิงก์ Google Drive (1 รายการต่อบรรทัด):
                    </label>
                    <span className="font-mono text-slate-500 font-semibold">
                      {parsedItems.length} บรรทัดที่ตรวจพบ
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`ตัวอย่างการวางเนื้อหา:
https://drive.google.com/file/d/1ABC.../view แมวส้มกระโดดพลาดตกโต๊ะ.mp4
https://drive.google.com/file/d/2XYZ.../view น้องหมาโกลเด้นร้องเพลง.mov
พี่แจ๊สตบมุกฮากลางรายการ.mp4
เอก_HRK_เล่นเกมผีตกเก้าอี้.mp4`}
                    className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      เคล็ดลับ: สามารถคัดลอกรายชื่อไฟล์จาก Google Drive หรือ Excel มาวางได้ทันที ระบบจะตัดนามสกุลไฟล์ออกให้อัตโนมัติ
                    </span>
                    {pastedText && (
                      <button
                        type="button"
                        onClick={() => setPastedText('')}
                        className="text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        ล้างข้อความ
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedItems.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>ตรวจสอบรายการพร้อมนำเข้า ({parsedItems.length} ไฟล์)</span>
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                        สถานะ: พื้นที่พักรอจัดหมวดหมู่
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={previewFilter}
                        onChange={(e) => setPreviewFilter(e.target.value)}
                        placeholder="กรองดูชื่อไฟล์..."
                        className="pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Preview Table Container */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold z-10">
                        <tr>
                          <th className="py-2 px-3 w-12 text-center font-mono">#</th>
                          <th className="py-2 px-3 w-28 font-mono">รหัสใหม่</th>
                          <th className="py-2 px-3">ชื่อคลิปฟุตเทจ</th>
                          <th className="py-2 px-3 w-40">Google Drive</th>
                          <th className="py-2 px-3 w-28 text-right">ปลายทาง</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {displayedPreviewItems.slice(0, 100).map((item, idx) => {
                          const previewId = `${idPrefix}-${String(
                            computedFootage.length + idx + 1
                          ).padStart(idPrefix === 'CLP' ? 3 : 4, '0')}`;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80">
                              <td className="py-1.5 px-3 text-center text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-1.5 px-3 font-bold text-indigo-700">
                                {previewId}
                              </td>
                              <td className="py-1.5 px-3 font-sans font-bold text-slate-900 truncate max-w-xs">
                                {item.title}
                              </td>
                              <td className="py-1.5 px-3 text-slate-500 truncate max-w-[140px]">
                                <span className="inline-flex items-center gap-1">
                                  <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.driveFileUrl}</span>
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-right">
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-sans font-semibold text-[10px]">
                                  พื้นที่พัก
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {displayedPreviewItems.length > 100 && (
                    <p className="text-[11px] text-slate-400 text-right">
                      * แสดงตัวอย่าง 100 รายการแรกจากทั้งหมด {displayedPreviewItems.length} ไฟล์
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {importSuccessCount === null && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Inbox className="w-4 h-4 text-amber-600" />
              <span>
                เมื่อนำเข้าแล้ว ทุกคลิปจะยังไม่กระทบโควตา 5:1 จนกว่าคุณจะเลือกจัดหมวดหมู่จริง
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
                disabled={isImporting || parsedItems.length === 0}
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
                    <span>นำเข้า {parsedItems.length} ไฟล์สู่พื้นที่พักทันที</span>
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
