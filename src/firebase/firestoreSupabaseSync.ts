import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './config';
import {
  SupabaseConnectionConfig,
  SupabaseRowDraftOverride,
} from '../types/supabaseSync.types';
import { sanitizeForFirestore } from './firestoreBatchUtils';
import { createSafeSnapshotErrorHandler } from './firestoreErrorHandling';

export function subscribeSupabaseConfig(
  onUpdate: (config: SupabaseConnectionConfig | null) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, 'system_settings', 'supabase_config');
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate(snap.data() as SupabaseConnectionConfig);
      }
    },
    createSafeSnapshotErrorHandler('system_settings/supabase_config', onError)
  );
}

export async function saveSupabaseConfigToCloud(
  config: SupabaseConnectionConfig
): Promise<void> {
  try {
    const docRef = doc(db, 'system_settings', 'supabase_config');
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...config,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to save Supabase config to Cloud:', err);
  }
}

export function subscribeSupabaseRowDrafts(
  onUpdate: (overrides: Record<string, SupabaseRowDraftOverride> | null) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, 'system_settings', 'supabase_row_drafts');
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        const data = snap.data() as {
          overrides?: Record<string, SupabaseRowDraftOverride>;
        };
        onUpdate(data?.overrides || {});
      }
    },
    createSafeSnapshotErrorHandler('system_settings/supabase_row_drafts', onError)
  );
}

export async function saveSupabaseRowDraftsToCloud(
  overrides: Record<string, SupabaseRowDraftOverride>
): Promise<{ saved: boolean; truncated: boolean; byteSize: number }> {
  const SAFE_FIRESTORE_DRAFT_BYTES = 750 * 1024; // 750 KB safe ceiling below Firestore 1 MiB limit

  const isSubstantiveDraft = (d: SupabaseRowDraftOverride): boolean =>
    Boolean(
      (d.description && d.description.trim()) ||
        d.status !== undefined ||
        d.channelId !== undefined ||
        d.targetPlatforms !== undefined ||
        d.upsertMode !== undefined ||
        d.includeAssets !== undefined ||
        d.includePillar !== undefined ||
        d.includeCategory !== undefined
    );

  try {
    const docRef = doc(db, 'system_settings', 'supabase_row_drafts');
    let targetOverrides = sanitizeForFirestore(overrides);
    const updatedAt = new Date().toISOString();

    const measureBytes = (data: unknown): number => {
      const json = JSON.stringify(data);
      return typeof TextEncoder !== 'undefined'
        ? new TextEncoder().encode(json).length
        : json.length * 2;
    };

    let payload = { overrides: targetOverrides, updatedAt };
    let byteSize = measureBytes(payload);
    let truncated = false;

    if (byteSize > SAFE_FIRESTORE_DRAFT_BYTES) {
      truncated = true;
      const entries = Object.entries(targetOverrides);
      const substantive = entries.filter(([, v]) => isSubstantiveDraft(v));
      const selectionOnly = entries.filter(([, v]) => !isSubstantiveDraft(v));

      const compacted: Record<string, SupabaseRowDraftOverride> = {};
      let runningBytes = measureBytes({ overrides: {}, updatedAt });

      const appendWithinBudget = (list: [string, SupabaseRowDraftOverride][]) => {
        for (const [key, val] of list) {
          const entryBytes = measureBytes({ [key]: val }) + 2;
          if (runningBytes + entryBytes > SAFE_FIRESTORE_DRAFT_BYTES) {
            break;
          }
          compacted[key] = val;
          runningBytes += entryBytes;
        }
      };

      appendWithinBudget(substantive);
      appendWithinBudget(selectionOnly);

      targetOverrides = compacted;
      payload = { overrides: targetOverrides, updatedAt };
      byteSize = measureBytes(payload);
      console.warn(
        `[saveSupabaseRowDraftsToCloud] Compacted drafts (${entries.length} -> ${Object.keys(targetOverrides).length} rows, ${Math.round(byteSize / 1024)} KB) to stay within Firestore 1 MB limit.`
      );
    }

    await setDoc(docRef, payload);
    return { saved: true, truncated, byteSize };
  } catch (err) {
    console.warn('Failed to save Supabase row drafts to Cloud:', err);
    return { saved: false, truncated: false, byteSize: 0 };
  }
}
