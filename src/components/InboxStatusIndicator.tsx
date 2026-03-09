"use client";

import { useState, useEffect } from "react";

interface InboxStatus {
  filesWaiting: number;
  lastProcessedFile: string | null;
  lastProcessedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function InboxStatusIndicator() {
  const [status, setStatus] = useState<InboxStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      try {
        const res = await fetch("/api/inbox-status");
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setStatus(null);
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-4 text-xs text-ink-muted">
      <span title="Files waiting in MEMORY_INBOX">
        Inbox: {status.filesWaiting} waiting
      </span>
      {status.lastProcessedFile && (
        <span title={`Last: ${status.lastProcessedFile}`}>
          Last: {status.lastProcessedFile} · {formatWhen(status.lastProcessedAt)}
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
