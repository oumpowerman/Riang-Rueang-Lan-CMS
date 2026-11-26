import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Sparkles,
} from 'lucide-react';

interface IOSShortcutGuideDrawerProps {
  defaultExpanded?: boolean;
  compact?: boolean;
}

export const IOSShortcutGuideDrawer: React.FC<IOSShortcutGuideDrawerProps> = ({
  defaultExpanded = false,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedKey, setCopiedKey] = useState<'url' | 'name' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const shareEndpointUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?share-target=1&text=`
      : '/?share-target=1&text=';

  const shortcutName = 'ส่งเข้า เรียงเรื่องลั่น';

  const handleToggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (next) {
        window.setTimeout(() => {
          containerRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }, 120);
      }
      return next;
    });
  };

  const handleCopy = async (text: string, key: 'url' | 'name') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // Fallback ignored if clipboard permission denied
    }
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border transition-colors ${
        isExpanded
          ? 'bg-indigo-50/60 border-indigo-200/90'
          : 'bg-stone-50/90 hover:bg-indigo-50/40 border-stone-200/80'
      }`}
    >
      {/* Collapsible Trigger Header */}
      <button
        type="button"
        onClick={handleToggleExpand}
        aria-expanded={isExpanded}
        className={`w-full flex items-center justify-between gap-2.5 text-left cursor-pointer ${
          compact ? 'px-3 py-2' : 'px-3.5 py-2.5'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
              <span>วิธีตั้งปุ่มแชร์ด่วนบน iPhone / iPad (iOS Shortcuts)</span>
              <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200/80">
                <Sparkles className="w-2.5 h-2.5" />
                ตั้งครั้งเดียว
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 shrink-0">
          <span>{isExpanded ? 'ซ่อนวิธีทำ' : 'ดูวิธีทำ'}</span>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="inline-flex"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.span>
        </div>
      </button>

      {/* Expandable Step-by-Step Body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-indigo-200/60 text-xs text-slate-700">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ทำให้เวลาดูคลิปใน <strong>IG, TikTok, Facebook, YouTube</strong> บน iPhone แล้วกดปุ่ม{' '}
                <strong>แชร์ (Share)</strong> จะมีปุ่ม <strong>&quot;ส่งเข้า เรียงเรื่องลั่น&quot;</strong>{' '}
                ให้กดเด้งเข้าหน้าบันทึกฟุตเทจทันที:
              </p>

              {/* Step 1: Copy URL & Open Shortcuts App */}
              <div className="p-2.5 rounded-xl bg-white border border-indigo-200/70 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between gap-2">
                  <span>1. คัดลอกลิงก์รับแชร์ด้านล่างนี้ไว้ก่อน</span>
                  <a
                    href="shortcuts://"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900"
                    title="เปิดแอปคำสั่งลัด (Shortcuts) บน iPhone/iPad"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>เปิดแอป Shortcuts</span>
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  <code className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-800 truncate">
                    {shareEndpointUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(shareEndpointUrl, 'url')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'url' ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>คัดลอกลิงก์</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2-4 Clear Visual Checklist */}
              <ol className="space-y-1.5 text-[11px] text-slate-700 list-none">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="min-w-0 flex-1">
                    เปิดแอป <strong>คำสั่งลัด (Shortcuts)</strong> บน iPhone กดปุ่ม <strong>+</strong> มุมขวาบน ตั้งชื่อว่า{' '}
                    <button
                      type="button"
                      onClick={() => handleCopy(shortcutName, 'name')}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-indigo-200 font-bold text-indigo-900 hover:bg-indigo-50 cursor-pointer"
                    >
                      <span>{shortcutName}</span>
                      {copiedKey === 'name' ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-indigo-500" />
                      )}
                    </button>
                  </div>
                </li>

                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="min-w-0 flex-1">
                    กดไอคอน <strong>(i)</strong> ด้านล่างจอ -&gt; เปิดสวิตช์{' '}
                    <strong>&quot;แสดงในแผ่นงานแชร์&quot; (Show in Share Sheet)</strong> แล้วกดเสร็จสิ้น
                  </div>
                </li>

                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div className="min-w-0 flex-1">
                    กดช่องค้นหาคำสั่งด้านล่าง พิมพ์เลือกคำสั่ง <strong>&quot;เข้ารหัส URL&quot; (URL Encode)</strong>{' '}
                    โดยให้เข้ารหัสตัวแปร <strong>ข้อมูลนำเข้าคำสั่งลัด (Shortcut Input)</strong>
                  </div>
                </li>

                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    5
                  </span>
                  <div className="min-w-0 flex-1">
                    เพิ่มคำสั่งที่สองชื่อ <strong>&quot;เปิด URL&quot; (Open URLs)</strong> -&gt; กดวางลิงก์จากข้อ 1 แล้วแตะเลือกตัวแปร{' '}
                    <strong>URL ที่เข้ารหัสแล้ว (URL Encoded Text)</strong> ต่อท้ายทันที แล้วกด <strong>เสร็จสิ้น</strong>
                  </div>
                </li>
              </ol>

              {/* Result summary pill */}
              <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-200/80 flex items-center gap-2 text-[11px] text-emerald-900 font-medium">
                <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  เสร็จแล้ว! เวลาดูคลิปใน IG / TikTok / FB / YouTube กดปุ่มแชร์ -&gt; เลือก{' '}
                  <strong>&quot;{shortcutName}&quot;</strong> ลิงก์จะเด้งเข้าหน้านี้พร้อมบันทึกทันที
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
