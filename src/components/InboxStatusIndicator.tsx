"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";

interface InboxStatus {
  filesWaiting: number;
  lastProcessedFile: string | null;
  lastProcessedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
}

export function InboxStatusIndicator() {
  const [status, setStatus] = useState<InboxStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(apiUrl("/api/inbox-status"), { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setStatus(null);
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    const onVisible = () => fetchStatus();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!status) return null;

  if (status.filesWaiting === 0 && !status.lastError) return null;

  return (
    <div className="flex items-center gap-4 text-xs text-ink-muted">
      {status.filesWaiting > 0 && (
        <span title="Files waiting in MEMORY_INBOX">
          Inbox: {status.filesWaiting} waiting
        </span>
      )}
      {status.lastError && (
        <span
          className="text-amber-400"
          title={status.lastError}
        >
          ⚠ {status.lastError.slice(0, 40)}
          {status.lastError.length > 40 ? "…" : ""}
        </span>
      )}
    </div>
  );
}
