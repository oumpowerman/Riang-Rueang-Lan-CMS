import {
  createSupabaseClient,
  loadSupabaseConfig,
} from './supabaseService';

export type SupabaseLiveStatus =
  | 'ACTIVE'
  | 'SYNCING'
  | 'OFFLINE'
  | 'UNCONFIGURED';

export interface SupabaseStatusSnapshot {
  status: SupabaseLiveStatus;
  detail: string;
  lastVerifiedAt?: number;
}

type StatusListener = (snapshot: SupabaseStatusSnapshot) => void;

const listeners = new Set<StatusListener>();

let currentSnapshot: SupabaseStatusSnapshot = {
  status: 'UNCONFIGURED',
  detail: 'ยังไม่ได้ตั้งค่าเชื่อมต่อ Kontent OS',
};

let activeSyncTasks = 0;
let isInitialized = false;

function emitStatus(next: SupabaseStatusSnapshot): void {
  currentSnapshot = next;
  listeners.forEach((listener) => listener(currentSnapshot));
}

export function getSupabaseStatusSnapshot(): SupabaseStatusSnapshot {
  return currentSnapshot;
}

export function notifySupabaseSyncStart(
  label = 'กำลังซิงก์ข้อมูลกับ Kontent OS...'
): void {
  activeSyncTasks += 1;
  emitStatus({
    status: 'SYNCING',
    detail: label,
    lastVerifiedAt: currentSnapshot.lastVerifiedAt,
  });
}

export function notifySupabaseSyncEnd(
  succeeded: boolean,
  detailMessage?: string
): void {
  activeSyncTasks = Math.max(0, activeSyncTasks - 1);
  if (activeSyncTasks > 0) return;

  const cfg = loadSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) {
    emitStatus({
      status: 'UNCONFIGURED',
      detail: 'ยังไม่ได้ตั้งค่าเชื่อมต่อ Kontent OS',
    });
    return;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    emitStatus({
      status: 'OFFLINE',
      detail: 'ออฟไลน์ (ไม่มีสัญญาณอินเทอร์เน็ต)',
      lastVerifiedAt: currentSnapshot.lastVerifiedAt,
    });
    return;
  }

  if (succeeded) {
    emitStatus({
      status: 'ACTIVE',
      detail: detailMessage || 'เชื่อมต่อ Kontent OS พร้อมใช้งาน',
      lastVerifiedAt: Date.now(),
    });
  } else {
    emitStatus({
      status: 'OFFLINE',
      detail: detailMessage || 'ไม่สามารถติดต่อฐานข้อมูล Kontent OS ได้',
      lastVerifiedAt: currentSnapshot.lastVerifiedAt,
    });
  }
}

export async function verifySupabaseLiveHealth(): Promise<void> {
  const cfg = loadSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) {
    emitStatus({
      status: 'UNCONFIGURED',
      detail: 'ยังไม่ได้ตั้งค่าเชื่อมต่อ Kontent OS',
    });
    return;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    emitStatus({
      status: 'OFFLINE',
      detail: 'ออฟไลน์ (ไม่มีสัญญาณอินเทอร์เน็ต)',
      lastVerifiedAt: currentSnapshot.lastVerifiedAt,
    });
    return;
  }

  if (activeSyncTasks > 0) return;

  const client = createSupabaseClient(cfg);
  if (!client) {
    emitStatus({
      status: 'UNCONFIGURED',
      detail: 'ข้อมูลตั้งค่า Supabase ไม่ถูกต้อง',
    });
    return;
  }

  try {
    const { error } = await client.from('contents').select('id').limit(1);
    if (activeSyncTasks > 0) return;

    if (error) {
      emitStatus({
        status: 'OFFLINE',
        detail: `เชื่อมต่อขัดข้อง: ${error.message}`,
      });
    } else {
      emitStatus({
        status: 'ACTIVE',
        detail: 'เชื่อมต่อฐานข้อมูล Kontent OS ปกติ',
        lastVerifiedAt: Date.now(),
      });
    }
  } catch (err: any) {
    if (activeSyncTasks > 0) return;
    emitStatus({
      status: 'OFFLINE',
      detail: `ออฟไลน์: ${err?.message || 'ติดต่อเซิร์ฟเวอร์ไม่ได้'}`,
    });
  }
}

export function subscribeSupabaseStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  listener(currentSnapshot);

  if (!isInitialized && typeof window !== 'undefined') {
    isInitialized = true;
    window.addEventListener('online', () => {
      void verifySupabaseLiveHealth();
    });
    window.addEventListener('offline', () => {
      emitStatus({
        status: 'OFFLINE',
        detail: 'ออฟไลน์ (ไม่มีสัญญาณอินเทอร์เน็ต)',
        lastVerifiedAt: currentSnapshot.lastVerifiedAt,
      });
    });
    void verifySupabaseLiveHealth();
  }

  return () => {
    listeners.delete(listener);
  };
}
