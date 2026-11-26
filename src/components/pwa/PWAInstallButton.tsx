import React, { useState } from 'react';
import {
  Download,
  Share2,
  Smartphone,
  CheckCircle2,
  Plus,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { IOSShortcutGuideDrawer } from './IOSShortcutGuideDrawer';
import { Modal } from '../ui/Modal';
import { useCMS } from '../../context/CMSContext';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
}) => {
  const {
    isInstalled,
    isInstallable,
    isIOS,
    isAndroid,
    isInIframe,
    isInAppBrowser,
    installApp,
  } = usePWAInstall();
  const { setIsDirectFootageModalOpen } = useCMS();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<'app' | 'shortcut' | null>(null);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const result = await installApp();
      if (result === 'guide') {
        setIsGuideOpen(true);
      }
    } else {
      setIsGuideOpen(true);
    }
  };

  const handleCopyUrl = async (type: 'app' | 'shortcut') => {
    if (typeof window === 'undefined') return;
    const targetUrl =
      type === 'shortcut'
        ? `${window.location.origin}/?share-target=1&url=`
        : window.location.origin;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopiedType(type);
      window.setTimeout(() => {
        setCopiedType((prev) => (prev === type ? null : prev));
      }, 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={
          compact
            ? 'inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 rounded-xl transition-colors cursor-pointer whitespace-nowrap'
            : 'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 rounded-xl transition-colors cursor-pointer whitespace-nowrap'
        }
        title="ติดตั้งแอปลงเครื่องเพื่อแชร์ลิงก์จาก YouTube / IG / FB / TikTok เข้าแอปได้ทันที"
      >
        <Download className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span className={compact ? 'hidden min-[420px]:inline' : ''}>ติดตั้งแอป</span>
      </button>

      <Modal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="ติดตั้งแอป & วิธีแชร์ลิงก์จาก Social"
        subtitle="เปลี่ยนเว็บเป็นแอปเต็มจอ พร้อมรับลิงก์จาก YouTube, IG, Facebook, TikTok เข้าคลังทันที"
        maxWidthClass="max-w-lg"
      >
        <div className="space-y-4">
          {/* Warning when inside AI Studio iframe or LINE / IG / FB In-App Browser */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <ExternalLink className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {isInIframe || isInAppBrowser
                  ? 'ตอนนี้กำลังเปิดผ่านหน้าต่างย่อย (ติดตั้งแอปโดยตรงไม่ได้)'
                  : 'เคล็ดลับสำคัญก่อนติดตั้งลงมือถือ'}
              </span>
            </div>
            <p className="leading-relaxed text-amber-800">
              {isInIframe || isInAppBrowser
                ? 'ระบบติดตั้งแอปและเมนูแชร์ข้ามแอปจะทำงานได้เฉพาะเมื่อเปิดจากหน้าเว็บจริงบน Google Chrome (Android) หรือ Safari (iPhone) โดยตรง'
                : 'ให้เปิดลิงก์เว็บจริงที่ Deploy แล้วบน Google Chrome (Android) หรือ Safari (iPhone) โดยตรงเพื่อกดติดตั้งลงหน้าจอโฮม'}
            </p>
            <button
              type="button"
              onClick={() => handleCopyUrl('app')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100/60 border border-amber-300/80 text-amber-950 font-semibold text-[11px] cursor-pointer transition-colors"
            >
              {copiedType === 'app' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>คัดลอกลิงก์แล้ว — นำไปวางเปิดใน Chrome / Safari</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-700" />
                  <span>คัดลอกลิงก์เปิดใน Chrome / Safari</span>
                </>
              )}
            </button>
          </div>

          {/* Android / Chrome Web Share Target Flow */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    Android / Chrome (ขึ้นในเมนู Share อัตโนมัติ)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    รองรับ IG, Facebook, TikTok, YouTube หลังติดตั้งเป็น WebAPK
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                {isAndroid ? 'อุปกรณ์ของคุณ' : 'Web Share Target'}
              </span>
            </div>

            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside pl-1">
              <li>
                เปิดเว็บนี้ด้วย <strong>Google Chrome</strong> แล้วกดเมนูมุมขวาบน เลือก{' '}
                <strong>&quot;ติดตั้งแอป&quot; (Install app)</strong>
              </li>
              <li>
                เวลาดูคลิปในแอป <strong>YouTube, Instagram, Facebook, TikTok</strong> กดปุ่ม{' '}
                <strong>แชร์ (Share)</strong> แล้วเลือก &quot;เพิ่มเติม&quot;
              </li>
              <li>
                แตะไอคอนแอป <strong>&quot;เรียงเรื่องลั่น&quot;</strong> ระบบจะเปิดหน้าต่าง{' '}
                <strong>นำเข้าฟุตเดี่ยว</strong> พร้อมใส่ลิงก์และชื่อคลิปให้ทันที
              </li>
            </ol>
          </div>

          {/* iPhone / iOS Flow */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    iPhone / iPad (iOS Safari)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    iOS ยังไม่รองรับ PWA Share Target — ใช้คัดลอกวางหรือ Apple Shortcuts
                  </p>
                </div>
              </div>
              {isIOS && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                  อุปกรณ์ของคุณ
                </span>
              )}
            </div>

            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside pl-1">
              <li>
                เปิดเว็บนี้ใน <strong>Safari</strong> แตะปุ่ม <strong>แชร์ (Share)</strong> เลือก{' '}
                <strong>&quot;เพิ่มไปยังหน้าจอโฮม&quot;</strong>
              </li>
              <li>
                วิธีปกติ: คัดลอกลิงก์จาก IG / TT / YT แล้วเปิดแอป กดปุ่ม <strong>&quot;นำเข้า&quot; -&gt; &quot;วาง&quot;</strong>
              </li>
            </ol>

            <IOSShortcutGuideDrawer defaultExpanded={isIOS} />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setIsGuideOpen(false);
                setIsDirectFootageModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เปิดหน้าต่างนำเข้าฟุตเดี่ยว</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGuideOpen(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>เข้าใจแล้ว</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
