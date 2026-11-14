import React, { useState } from 'react';
import { Download, Share2, Smartphone, CheckCircle2, Plus, ExternalLink } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { Modal } from '../ui/Modal';
import { useCMS } from '../../context/CMSContext';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
}) => {
  const { isInstalled, isInstallable, isIOS, installApp } = usePWAInstall();
  const { setIsDirectFootageModalOpen } = useCMS();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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
          {/* Notice if inside AI Studio preview iframe */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <ExternalLink className="w-4 h-4 text-amber-700 shrink-0" />
              <span>เคล็ดลับสำคัญก่อนติดตั้งลงมือถือ</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              ให้เปิดลิงก์แอปนี้บนเบราว์เซอร์หลักของเครื่อง (เช่น <strong>Chrome</strong> บน Android หรือ <strong>Safari</strong> บน iPhone) โดยตรงเพื่อกดติดตั้งลงหน้าจอโฮม
            </p>
          </div>

          {/* Android / Chrome Web Share Target Flow */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    สำหรับ Android / Chrome (แชร์ข้ามแอปอัตโนมัติ)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    แอปจะไปอยู่ในเมนู Share ของมือถือทันทีหลังติดตั้ง
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                Web Share Target
              </span>
            </div>

            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside pl-1">
              <li>
                เปิดเว็บนี้ด้วย <strong>Google Chrome</strong> แล้วกดเมนูมุมขวาบน เลือก{' '}
                <strong>"ติดตั้งแอป" (Install app)</strong>
              </li>
              <li>
                เวลาดูคลิปในแอป <strong>YouTube, Instagram, Facebook, TikTok</strong> กดปุ่ม{' '}
                <strong>แชร์ (Share)</strong> แล้วเลือกแชร์ไปยังแอปอื่น
              </li>
              <li>
                แตะไอคอนแอป <strong>"เรียงเรื่องลั่น"</strong> ระบบจะเปิดหน้าต่าง{' '}
                <strong>นำเข้าฟุตเดี่ยว</strong> พร้อมใส่ลิงก์ให้เสร็จ กด{' '}
                <strong>"บันทึกด่วน"</strong> เก็บเข้าคิวรอฝาก Google Drive ได้ทันที!
              </li>
            </ol>
          </div>

          {/* iPhone / iOS Flow */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    สำหรับ iPhone / iPad (iOS Safari)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    ติดตั้งเป็นแอปเต็มจอ + กดวางและบันทึกด่วนในขั้นตอนที่ 1
                  </p>
                </div>
              </div>
              {isIOS && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                  อุปกรณ์ของคุณ
                </span>
              )}
            </div>

            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside pl-1">
              <li>
                เปิดเว็บนี้ใน <strong>Safari</strong> แล้วแตะปุ่ม <strong>แชร์ (Share)</strong> ด้านล่างของจอ
              </li>
              <li>
                เลื่อนลงมาเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong>
              </li>
              <li>
                เวลาเจอคลิปใน IG / YouTube / TikTok ให้กด <strong>คัดลอกลิงก์</strong> แล้วเปิดแอป กดปุ่ม <strong>"นำเข้า" -&gt; ปุ่ม "วาง" -&gt; "บันทึกด่วน"</strong> ได้ในหน้าแรกทันที
              </li>
            </ol>
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
