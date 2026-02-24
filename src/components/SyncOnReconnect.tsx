import { useEffect } from "react";
import { useQueryClient, onlineManager } from "@tanstack/react-query";
import { flushQueue } from "@/lib/sync-queue";

export function SyncOnReconnect() {
  const qc = useQueryClient();
  useEffect(() => {
    // Attempt flush on mount (catches case where app reloads while online with pending queue)
    flushQueue(qc);
    return onlineManager.subscribe((online) => {
      if (online) flushQueue(qc);
    });
  }, [qc]);
  return null;
}
