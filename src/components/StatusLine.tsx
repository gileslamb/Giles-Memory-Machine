"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";

interface StatusLineProps {
  hasContent: boolean;
  contentVersion?: number; // bump to refetch when context updates
}

export function StatusLine({ hasContent, contentVersion = 0 }: StatusLineProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasContent) {
      setStatus(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    let cancelled = false;
    fetch(apiUrl("/api/advisor"))
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.status) setStatus(d.status);
      })
      .catch(() => {
        if (!cancelled) setStatus("Could not load status.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [hasContent, contentVersion]);

  if (!hasContent) return null;

  return (
    <div className="px-4 py-2 bg-surface-muted/50 border-b border-border text-sm text-ink-muted">
      {isLoading ? (
        <span className="animate-pulse">Loading status…</span>
      ) : status ? (
        <span>{status}</span>
      ) : null}
    </div>
  );
}
