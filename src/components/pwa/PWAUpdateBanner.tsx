import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { isBatchWriteInProgress } from '../../firebase/firestoreBatchUtils';
import { hasPendingShareTarget } from '../../utils/platformDetector';

const RELOAD_COOLDOWN_KEY = 'rrl_pwa_sw_reloaded_at';
const RELOAD_COOLDOWN_MS = 15_000;
const PERIODIC_CHECK_MS = 5 * 60 * 1000; // Check every 5 minutes if tab stays open

function canAutoReloadNow(): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) return true;
  try {
    const raw = window.sessionStorage.getItem(RELOAD_COOLDOWN_KEY);
    if (!raw) return true;
    const lastTs = Number(raw);
    return Number.isNaN(lastTs) || Date.now() - lastTs > RELOAD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markAutoReloaded(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(RELOAD_COOLDOWN_KEY, String(Date.now()));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Monitors the PWA Service Worker for newly deployed builds on startup,
 * tab visibility return, network reconnect, and periodic intervals.
 *
 * When a new Service Worker activates (`controllerchange`) on a previously loaded client:
 * - If idle (no batch Cloud upload or active Share Target import running), reloads cleanly.
 * - Otherwise, displays a non-intrusive prompt so the user reloads when ready.
 */
export const PWAUpdateBanner: React.FC = () => {
  const [updateMode, setUpdateMode] = useState<'none' | 'reloading' | 'ready'>('none');
  const hasTriggeredReloadRef = useRef(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Track whether a Service Worker already controlled this page on initial load.
    // First-ever SW install should NEVER trigger an unnecessary page reload.
    const hadControllerOnLoad = Boolean(navigator.serviceWorker.controller);
    let registrationRef: ServiceWorkerRegistration | undefined;
    let intervalId: number | null = null;
    let reloadTimerId: number | null = null;

    const triggerUpdateCheck = () => {
      if (!registrationRef || !navigator.onLine) return;
      registrationRef.update().catch(() => {
        // Ignore transient offline check errors
      });
    };

    const shouldDeferAutoReload = () =>
      isBatchWriteInProgress() || hasPendingShareTarget() || !canAutoReloadNow();

    const handleControllerChange = () => {
      if (!hadControllerOnLoad || hasTriggeredReloadRef.current) {
        return;
      }

      if (shouldDeferAutoReload()) {
        setUpdateMode('ready');
        return;
      }

      hasTriggeredReloadRef.current = true;
      markAutoReloaded();
      setUpdateMode('reloading');
      reloadTimerId = window.setTimeout(() => {
        window.location.reload();
      }, 650);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        registrationRef = registration;
        if (registration) {
          // Immediately check for a newer deployment right after load
          triggerUpdateCheck();
          intervalId = window.setInterval(triggerUpdateCheck, PERIODIC_CHECK_MS);
        }
      },
      onNeedRefresh() {
        // Fallback for browsers that wait before activating the new SW
        if (shouldDeferAutoReload()) {
          setUpdateMode('ready');
        } else {
          setUpdateMode('reloading');
          markAutoReloaded();
          void updateSW(true);
        }
      },
      onRegisterError(err) {
        console.warn('[PWA] Service Worker registration note:', err);
      },
    });

    updateSWRef.current = updateSW;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerUpdateCheck();
      }
    };

    const handleOnline = () => {
      triggerUpdateCheck();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      if (intervalId !== null) window.clearInterval(intervalId);
      if (reloadTimerId !== null) window.clearTimeout(reloadTimerId);
    };
  }, []);

  if (updateMode === 'none') return null;

  const handleManualReload = () => {
    markAutoReloaded();
    setUpdateMode('reloading');
    if (updateSWRef.current) {
      void updateSWRef.current(true);
    }
    window.setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-indigo-50 border-b border-indigo-200/80 text-indigo-950 text-xs font-medium px-3 sm:px-6 py-2 flex items-center justify-center gap-3 shrink-0 z-50"
    >
      <RefreshCw
        className={`w-3.5 h-3.5 text-indigo-600 shrink-0 ${
          updateMode === 'reloading' ? 'animate-spin' : ''
        }`}
      />
      <span>
        {updateMode === 'reloading'
          ? 'พบเวอร์ชันใหม่ล่าสุด กำลังอัปเดตหน้าเว็บให้อัตโนมัติ...'
          : 'มีเวอร์ชันใหม่พร้อมใช้งานแล้ว'}
      </span>
      {updateMode === 'ready' && (
        <button
          type="button"
          onClick={handleManualReload}
          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          อัปเดตทันที
        </button>
      )}
    </div>
  );
};
