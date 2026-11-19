import { CLIENT_INSTANCE_ID } from '../firebase/firestoreSyncPulse';

export type MultiTabCollectionKey =
  | 'footage'
  | 'episodes'
  | 'sources'
  | 'tags'
  | 'categoryGroups'
  | 'settings';

export interface MultiTabSyncMessage {
  type: 'LOCAL_DATA_UPDATED' | 'OUTBOX_CHANGED';
  senderTabId: string;
  collections?: MultiTabCollectionKey[];
  syncTs?: string;
  timestamp: number;
}

const CHANNEL_NAME = 'rrl_cms_multitab_sync_v1';

let sharedChannel: BroadcastChannel | null = null;
const listeners = new Set<(msg: MultiTabSyncMessage) => void>();

function ensureChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(CHANNEL_NAME);
      sharedChannel.onmessage = (event: MessageEvent<MultiTabSyncMessage>) => {
        const msg = event.data;
        if (!msg || typeof msg !== 'object') return;
        // Ignore our own tab's broadcasts
        if (msg.senderTabId === CLIENT_INSTANCE_ID) return;
        listeners.forEach((fn) => {
          try {
            fn(msg);
          } catch (err) {
            console.warn('[multiTabSyncBus] Listener error:', err);
          }
        });
      };
    } catch {
      return null;
    }
  }
  return sharedChannel;
}

/**
 * Broadcasts to sibling browser tabs on the same device that local IndexedDB/localStorage
 * collections were updated — enabling instant cross-tab sync with 0 Firestore reads.
 */
export function broadcastLocalCollectionsUpdated(
  collections: MultiTabCollectionKey[],
  syncTs?: string
): void {
  if (!collections.length) return;
  const ch = ensureChannel();
  if (!ch) return;
  try {
    const message: MultiTabSyncMessage = {
      type: 'LOCAL_DATA_UPDATED',
      senderTabId: CLIENT_INSTANCE_ID,
      collections,
      syncTs,
      timestamp: Date.now(),
    };
    ch.postMessage(message);
  } catch {
    // Ignore closed channel or serialization edge cases
  }
}

/**
 * Notifies sibling tabs whenever the persistent IndexedDB Outbox queue changes
 * so their Navbar indicators stay in sync immediately.
 */
export function broadcastOutboxChanged(): void {
  const ch = ensureChannel();
  if (!ch) return;
  try {
    const message: MultiTabSyncMessage = {
      type: 'OUTBOX_CHANGED',
      senderTabId: CLIENT_INSTANCE_ID,
      timestamp: Date.now(),
    };
    ch.postMessage(message);
  } catch {
    // Ignore
  }
}

/**
 * Subscribes to same-device sibling tab sync events.
 */
export function subscribeMultiTabSync(
  handler: (msg: MultiTabSyncMessage) => void
): () => void {
  ensureChannel();
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}
