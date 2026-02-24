import { db, QueuedOp } from "./db";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import { toast } from "sonner";

const SUPABASE_URL = "https://fsghqtawhtoafwdlrnwz.supabase.co";

export function isNetworkError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const msg = String((err as any).message ?? "");
  return (
    msg.includes("Failed to fetch") ||
    msg.includes("Load failed") ||
    msg.includes("Network request failed") ||
    msg.includes("NetworkError")
  );
}

// Poll Supabase every 10s when we've manually marked offline due to a fetch failure.
// The window `online` event won't fire if navigator.onLine never changed (WiFi still connected).
let reconnectInterval: ReturnType<typeof setInterval> | null = null;

function startReconnectPolling() {
  if (reconnectInterval) return;
  reconnectInterval = setInterval(async () => {
    if (onlineManager.isOnline()) {
      clearInterval(reconnectInterval!);
      reconnectInterval = null;
      return;
    }
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      // Supabase responded — connectivity restored
      onlineManager.setOnline(true);
      clearInterval(reconnectInterval!);
      reconnectInterval = null;
    } catch {
      // Still unreachable, keep polling
    }
  }, 10_000);
}

export async function enqueueOp(op: Omit<QueuedOp, "id" | "createdAt">) {
  await db.queue.add({ ...op, createdAt: Date.now() });
}

export const QUEUED_OFFLINE = { queuedOffline: true } as const;
export type QueuedOffline = typeof QUEUED_OFFLINE;

/**
 * Wraps a Supabase call with offline-first behavior:
 * - If already offline: queue immediately, return QUEUED_OFFLINE
 * - If online but call fails with network error: mark offline, start reconnect polling, queue, return QUEUED_OFFLINE
 * - Non-network errors (auth, validation): re-thrown normally
 */
export async function retryOrQueue(
  op: Omit<QueuedOp, "id" | "createdAt">,
  fn: () => Promise<void>
): Promise<QueuedOffline | undefined> {
  if (!onlineManager.isOnline()) {
    await enqueueOp(op);
    return QUEUED_OFFLINE;
  }
  try {
    await fn();
    return undefined;
  } catch (err) {
    if (isNetworkError(err)) {
      onlineManager.setOnline(false);
      startReconnectPolling();
      await enqueueOp(op);
      return QUEUED_OFFLINE;
    }
    throw err;
  }
}

let flushing = false;

export async function flushQueue(qc: QueryClient) {
  if (flushing || !onlineManager.isOnline()) return;
  flushing = true;
  try {
    const ops = await db.queue.orderBy("createdAt").toArray();
    if (ops.length === 0) return;

    for (const op of ops) {
      try {
        if (op.op === "insert") {
          const { error } = await supabase.from(op.table as any).insert(op.payload as any);
          if (error) { console.error("Sync insert error", error); continue; }
        } else if (op.op === "update") {
          let q = supabase.from(op.table as any).update(op.payload as any);
          if (op.filter) {
            for (const [k, v] of Object.entries(op.filter)) {
              q = (q as any).eq(k, v);
            }
          }
          const { error } = await q;
          if (error) { console.error("Sync update error", error); continue; }
        } else {
          let q = supabase.from(op.table as any).delete();
          if (op.filter) {
            for (const [k, v] of Object.entries(op.filter)) {
              q = (q as any).eq(k, v);
            }
          }
          const { error } = await q;
          if (error) { console.error("Sync delete error", error); continue; }
        }
        await db.queue.delete(op.id!);
      } catch {
        // Network still down — stop flushing, try again on next reconnect
        break;
      }
    }

    const remaining = await db.queue.count();
    qc.invalidateQueries();
    if (remaining === 0) toast.success("All offline changes synced");
  } finally {
    flushing = false;
  }
}
