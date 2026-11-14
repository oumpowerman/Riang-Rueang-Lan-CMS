import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  KeyRound,
  MessageSquare,
  Play,
  Send,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { STAGING_TAG_ID } from '../../../services/seedData';
import {
  generateLineAppsScriptCode,
  parseLineFootageCommand,
} from './lineAppsScriptTemplate';

interface LineOaIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickDriveLinker?: () => void;
}

interface SimChatMessage {
  id: string;
  sender: 'USER' | 'BOT';
  text: string;
  createdFootageId?: string;
  timestamp: string;
}

const TOKEN_STORAGE_KEY = 'cms_line_oa_channel_token_v1';

export const LineOaIntegrationModal: React.FC<LineOaIntegrationModalProps> = ({
  isOpen,
  onClose,
  onOpenQuickDriveLinker,
}) => {
  const { batchAddDirectFootage, missingDriveFootages } = useCMS();

  const [activeTab, setActiveTab] = useState<'SCRIPT_AND_GUIDE' | 'SIMULATOR'>(
    'SCRIPT_AND_GUIDE'
  );
  const [lineToken, setLineToken] = useState<string>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [copiedScript, setCopiedScript] = useState(false);

  // Simulator state
  const [simInput, setSimInput] = useState(
    '#ฟุต ลุงตู่พูดผิดฮาๆ https://vt.tiktok.com/ZS8example/ โน้ต: ขยี้จังหวะหันมามอง'
  );
  const [isSendingSim, setIsSendingSim] = useState(false);
  const [simMessages, setSimMessages] = useState<SimChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'BOT',
      text:
        'สวัสดีครับ! ทดสอบพิมพ์คำสั่งเหมือนส่งใน LINE OA ได้เลย:\n' +
        '• #ฟุต ชื่อคลิป https://vt.tiktok.com/xxx\n' +
        '• #ฟุต https://youtube.com/shorts/xxx\n' +
        '• #เช็คฟุต (เช็ครายการที่ยังไม่มีลิงก์ Drive)',
      timestamp: 'เมื่อสักครู่',
    },
  ]);

  const handleTokenChange = (val: string) => {
    setLineToken(val);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, val);
    } catch {
      // ignore storage errors
    }
  };

  const scriptCode = useMemo(
    () => generateLineAppsScriptCode(lineToken),
    [lineToken]
  );

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleSendSimulation = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const raw = (customText !== undefined ? customText : simInput).trim();
    if (!raw || isSendingSim) return;

    const nowTime = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: SimChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text: raw,
      timestamp: nowTime,
    };

    setSimMessages((prev) => [...prev, userMsg]);
    if (customText === undefined) {
      setSimInput('');
    }

    const parsed = parseLineFootageCommand(raw);

    if (parsed.type === 'IGNORE') {
      setSimMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'BOT',
          text: '💡 ข้อความทั่วไปที่ไม่ได้ขึ้นต้นด้วย #ฟุต หรือ #เช็คฟุต บอทจะข้ามไม่ทำงานครับ',
          timestamp: nowTime,
        },
      ]);
      return;
    }

    if (parsed.type === 'HELP') {
      setSimMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'BOT',
          text:
            '⚠️ กรุณาใส่ลิงก์คลิปด้วยครับ ตัวอย่าง:\n' +
            '#ฟุต ชื่อคลิป https://vt.tiktok.com/xxx\n' +
            'หรือพิมพ์ #เช็คฟุต เพื่อดูคลิปค้างอัปโหลด Drive',
          timestamp: nowTime,
        },
      ]);
      return;
    }

    if (parsed.type === 'CHECK_QUEUE') {
      const socialOnlyList = missingDriveFootages.filter((ft) =>
        Boolean(ft.originalUrl?.trim())
      );
      const targetList =
        socialOnlyList.length > 0 ? socialOnlyList : missingDriveFootages;

      if (targetList.length === 0) {
        setSimMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            sender: 'BOT',
            text: '🎉 คลิปทั้งหมดในคลังมีลิงก์ Google Drive ครบถ้วนแล้วครับ!',
            timestamp: nowTime,
          },
        ]);
      } else {
        const lines = targetList
          .slice(0, 6)
          .map((ft) => `• ${ft.id}: ${ft.title}`)
          .join('\n');
        const more =
          targetList.length > 6
            ? `\n...และอีก ${targetList.length - 6} รายการ`
            : '';
        setSimMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            sender: 'BOT',
            text: `⏳ มีฟุตเทจที่ยังไม่มีลิงก์ Google Drive จำนวน ${targetList.length} รายการ:\n${lines}${more}`,
            timestamp: nowTime,
          },
        ]);
      }
      return;
    }

    // ADD_FOOTAGE: Actually create the footage in Firestore & state!
    setIsSendingSim(true);
    try {
      const createdList = await batchAddDirectFootage(
        [
          {
            title: parsed.title || 'คลิปจาก LINE รอตั้งชื่อ',
            originalUrl: parsed.originalUrl || '',
            driveFileUrl: '',
            mascotNotes:
              parsed.mascotNotes ||
              'ส่งลิงก์ผ่าน LINE OA (รอโหลดไฟล์ขึ้น Google Drive)',
            tags: [STAGING_TAG_ID],
            durationSec: 25,
          },
        ],
        'CLP'
      );

      const created = createdList[0];
      if (created) {
        setSimMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            sender: 'BOT',
            createdFootageId: created.id,
            text:
              `✅ บันทึกฟุตเทจเข้าคลังเรียบร้อย!\n` +
              `🎬 รหัส: ${created.id}\n` +
              `📝 ชื่อ: ${created.title}\n` +
              `📄 ชื่อไฟล์มาตรฐาน: ${created.standardFileName}\n` +
              `⏳ สถานะ: รออัปโหลดไฟล์ลง Google Drive`,
            timestamp: nowTime,
          },
        ]);
      }
    } finally {
      setIsSendingSim(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="line-oa-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-5 bg-slate-950/60 backdrop-blur-xs"
        >
          <motion.div
            key="line-oa-modal-dialog"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl h-[94dvh] max-h-[95dvh] sm:h-[85vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50/95 px-3.5 sm:px-5 pt-3 sm:pt-4 pb-2.5 sm:pb-3 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                      เชื่อม LINE OA ส่งคลิปเข้าคลังฟุตเทจอัตโนมัติ
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                      พิมพ์ #ฟุต ตามด้วยลิงก์ใน LINE ➔ บันทึกเข้า Cloud Firestore ทันที
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer shrink-0"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Segmented Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('SCRIPT_AND_GUIDE')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'SCRIPT_AND_GUIDE'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">1. รับโค้ด Apps Script & วิธีผูก</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('SIMULATOR')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'SIMULATOR'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">2. ทดสอบจำลองส่งจาก LINE</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 bg-slate-50/50">
              {activeTab === 'SCRIPT_AND_GUIDE' ? (
                <div className="space-y-4">
                  {/* Command Cheat Sheet */}
                  <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3.5 space-y-2">
                    <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>รูปแบบคำสั่งที่พิมพ์ส่งในแชท LINE OA ได้ทันที:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div className="bg-white/90 border border-emerald-200/80 rounded-xl p-2.5">
                        <div className="font-bold text-slate-700 mb-0.5">
                          1. ส่งเฉพาะลิงก์ด่วน
                        </div>
                        <code className="text-[11px] font-mono text-emerald-800 break-all">
                          #ฟุต https://vt.tiktok.com/xxx
                        </code>
                      </div>
                      <div className="bg-white/90 border border-emerald-200/80 rounded-xl p-2.5">
                        <div className="font-bold text-slate-700 mb-0.5">
                          2. ส่งพร้อมตั้งชื่อคลิป & โน้ตพากย์
                        </div>
                        <code className="text-[11px] font-mono text-emerald-800 break-all">
                          #ฟุต ลุงตู่พูดผิด https://... โน้ต: ขยี้ตอนจบ
                        </code>
                      </div>
                      <div className="bg-white/90 border border-emerald-200/80 rounded-xl p-2.5">
                        <div className="font-bold text-slate-700 mb-0.5">
                          3. เช็คงานค้างรอโหลดลง Drive
                        </div>
                        <code className="text-[11px] font-mono text-emerald-800">
                          #เช็คฟุต
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Step-by-Step Setup Guide */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      ขั้นตอนการนำไปติดตั้ง (ใช้เวลาประมาณ 2 นาที · ฟรี 100%)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="font-bold text-slate-900">
                          ขั้นที่ 1: ใส่ LINE Channel Access Token (ถ้ามี)
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          นำ Token จากหน้า{' '}
                          <a
                            href="https://developers.line.biz/console/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>LINE Developers</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>{' '}
                          (แท็บ Messaging API) มาวางในช่องด้านล่างเพื่อให้ระบบฝังลงโค้ดให้อัตโนมัติ
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="font-bold text-slate-900">
                          ขั้นที่ 2: สร้างโปรเจกต์ Google Apps Script
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          เปิดเว็บ{' '}
                          <a
                            href="https://script.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>script.google.com</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>{' '}
                          กด <b>New project</b> ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดที่คัดลอกจากด้านล่างลงไป
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="font-bold text-slate-900">
                          ขั้นที่ 3: กด Deploy เป็น Web App
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          กดปุ่มสีน้ำเงิน <b>Deploy &gt; New deployment</b> เลือกประเภทเป็น{' '}
                          <b>Web app</b> และตั้งค่า <b>Who has access: Anyone (ทุกคน)</b> แล้วกด Deploy
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="font-bold text-slate-900">
                          ขั้นที่ 4: นำ Web App URL ไปวางใน LINE Webhook
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          คัดลอก <b>Web app URL</b> ที่ได้ ไปวางในช่อง <b>Webhook URL</b> ใน LINE Developers แล้วกดเปิดสวิตช์ <b>Use webhook</b> เป็นอันเสร็จสมบูรณ์!
                        </p>
                      </div>
                    </div>

                    {/* Optional Token Input */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          ใส่ LINE Channel Access Token (เพื่อให้ฝังลงในโค้ดด้านล่างอัตโนมัติ):
                        </span>
                      </label>
                      <input
                        type="text"
                        value={lineToken}
                        onChange={(e) => handleTokenChange(e.target.value)}
                        placeholder="วาง Channel Access Token (long-lived) ของ LINE OA ที่นี่ (หรือไปแก้ใน Apps Script ทีหลังได้)..."
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Generated Code.gs Box */}
                  <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm">
                    <div className="px-3.5 sm:px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-300 truncate">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          Code.gs (เชื่อมฐานข้อมูลโปรเจกต์นี้พร้อมใช้งาน)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                          copiedScript
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {copiedScript ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>คัดลอกโค้ดแล้ว!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>คัดลอกโค้ด Apps Script</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3.5 sm:p-4 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-80 leading-relaxed">
                      <code>{scriptCode}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                /* Tab 2: Live LINE Chat Simulator */
                <div className="space-y-3 h-full flex flex-col">
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-indigo-950 font-medium">
                      <span className="font-bold">โหมดจำลองส่งข้อความจาก LINE OA:</span>{' '}
                      เมื่อกดส่งด้วยคำสั่ง <code className="font-mono font-bold">#ฟุต</code>{' '}
                      ระบบจะสร้างฟุตเทจเข้าฐานข้อมูลจริงทันที เพื่อทดสอบการทำงานครบวงจร
                    </div>

                    {onOpenQuickDriveLinker && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenQuickDriveLinker();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
                      >
                        เปิดคิววางลิงก์ Drive ({missingDriveFootages.length})
                      </button>
                    )}
                  </div>

                  {/* Quick Preset Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">
                      กดลองส่งด่วน:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSendSimulation(
                          undefined,
                          '#ฟุต ลุงตู่พูดผิดฮาๆ https://vt.tiktok.com/ZS8example/ โน้ต: ขยี้จังหวะหันมามอง'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-[11px] font-semibold text-slate-700 shrink-0 cursor-pointer transition-colors"
                    >
                      + ส่งคลิป TikTok พร้อมชื่อ & โน้ต
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSendSimulation(
                          undefined,
                          '#ฟุต https://www.youtube.com/shorts/dQw4w9WgXcQ'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-[11px] font-semibold text-slate-700 shrink-0 cursor-pointer transition-colors"
                    >
                      + ส่งเฉพาะลิงก์ YouTube Shorts
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendSimulation(undefined, '#เช็คฟุต')}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-[11px] font-semibold text-slate-700 shrink-0 cursor-pointer transition-colors"
                    >
                      🔍 พิมพ์ #เช็คฟุต
                    </button>
                  </div>

                  {/* Chat Window */}
                  <div className="flex-1 min-h-[240px] bg-[#8CABD9]/35 border border-slate-200 rounded-2xl p-3.5 overflow-y-auto space-y-2.5">
                    {simMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === 'USER' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-2xs ${
                            msg.sender === 'USER'
                              ? 'bg-[#06C755] text-white font-semibold rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 px-1 font-mono">
                          {msg.sender === 'USER' ? 'คุณ' : 'LINE OA Bot'} · {msg.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input Bar */}
                  <form
                    onSubmit={(e) => handleSendSimulation(e)}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={simInput}
                      onChange={(e) => setSimInput(e.target.value)}
                      placeholder="พิมพ์คำสั่ง เช่น #ฟุต ชื่อคลิป https://vt.tiktok.com/xxx ..."
                      className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="submit"
                      disabled={!simInput.trim() || isSendingSim}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ส่งเข้าคลัง</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-3.5 sm:px-5 py-2.5 border-t border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0 text-xs">
              <span className="text-slate-500 text-[11px] sm:text-xs truncate">
                ข้อมูลจาก LINE จะเข้าสู่พื้นที่พัก (Staging) และแจ้งเตือนในคิวรออัปโหลด Drive อัตโนมัติ
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
