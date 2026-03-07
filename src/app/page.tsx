"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ContextDashboard } from "@/components/ContextDashboard";
import { DashboardErrorBoundary } from "@/components/DashboardErrorBoundary";
import { CheckInPanel } from "@/components/CheckInPanel";
import { StatusLine } from "@/components/StatusLine";
import { AdvisorBar } from "@/components/AdvisorBar";
import { AppNav } from "@/components/AppNav";
import { parseContextMarkdown } from "@/lib/parse-context";
import { PastePanel } from "@/components/PastePanel";

export default function Home() {
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dataDirectory, setDataDirectory] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInput, setSettingsInput] = useState("");
  const [showRawMd, setShowRawMd] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showAutoInfo, setShowAutoInfo] = useState(false);
  const [shouldAutoOpenCheckIn, setShouldAutoOpenCheckIn] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch("/api/context");
      if (!res.ok) throw new Error("Failed to fetch");
      const { content: c } = await res.json();
      setContent(c ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load context");
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const { dataDirectory: dir } = await res.json();
        setDataDirectory(dir ?? "");
        setSettingsInput(dir ?? "");
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchContent();
    fetchSettings();
  }, [fetchContent, fetchSettings]);

  useEffect(() => {
    let cancelled = false;
    async function checkNudge() {
      try {
        const checkinRes = await fetch("/api/checkin");
        const checkinData = await checkinRes.json();
        const daysSince = checkinData.daysSinceCheckin ?? 999;
        const parsed = content ? parseContextMarkdown(content) : { entriesNeedingAttention: 0 };
        const needsAttention = parsed.entriesNeedingAttention > 0;
        if (!cancelled && (daysSince > 3 || needsAttention)) {
          setShouldAutoOpenCheckIn(true);
          setShowCheckIn(true);
        }
      } catch {
        // Ignore
      }
    }
    checkNudge();
    return () => { cancelled = true; };
  }, [content]);

  const handleRefreshTimestamps = async () => {
    try {
      const res = await fetch("/api/context/refresh-timestamps", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setContent(data.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh timestamps");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed");
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataDirectory: settingsInput.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setDataDirectory(settingsInput.trim());
      setShowSettings(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Status line — auto-loads when content exists, refetches when context updates */}
      <StatusLine hasContent={!!content?.trim()} contentVersion={content.length} />

      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-medium tracking-tight text-ink">
            Giles Memory Machine
          </h1>
          <AppNav />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAutoInfo(true)}
            className="text-ink-faint hover:text-ink-muted text-sm"
            title="How to auto-update"
          >
            ℹ
          </button>
          <button
            onClick={() => setShowCheckIn(!showCheckIn)}
            className={`text-sm px-3 py-1.5 rounded border transition-colors ${
              showCheckIn ? "bg-surface-muted border-ink-faint" : "border-border hover:bg-surface-muted"
            }`}
          >
            Check in
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Settings
          </button>
          <button
            onClick={handleCopy}
            className="text-sm px-3 py-1.5 rounded border border-border hover:bg-surface-muted transition-colors"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={fetchContent}
            className="text-sm px-3 py-1.5 rounded border border-border hover:bg-surface-muted transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleRefreshTimestamps}
            className="text-sm px-3 py-1.5 rounded border border-border hover:bg-surface-muted transition-colors"
            title="Update all timestamps to today (content is current, dates were old)"
          >
            Refresh dates
          </button>
        </div>
      </header>

      {/* Advisor bar — along top */}
      <AdvisorBar rawContent={content} />

      {/* Main layout */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden min-w-0">
        {/* Left panel — paste + preview + file upload */}
        <section className="lg:w-96 shrink-0 flex flex-col gap-6">
          <PastePanel
            onContentUpdated={(c) => { setContent(c); fetchContent(); }}
            onError={(msg) => setError(typeof msg === "string" || msg === null ? msg : "An error occurred")}
          />
          {dataDirectory && (
            <p className="text-xs text-ink-faint truncate" title={dataDirectory}>
              Data: {dataDirectory}
            </p>
          )}
        </section>

        {/* Right panel — dashboard or raw */}
        <section className="flex-1 flex flex-col min-h-0">
          {showRawMd ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-ink-muted">
                  AI_CONTEXT.md
                </h2>
                <button
                  onClick={() => setShowRawMd(false)}
                  className="text-xs text-ink-faint hover:text-ink-muted transition-colors"
                >
                  ← Back to dashboard
                </button>
              </div>
              <div className="flex-1 overflow-auto rounded-lg border border-border bg-surface-elevated p-6">
                <pre className="font-mono text-sm text-ink whitespace-pre-wrap break-words">
                  {content || "No content yet. Paste something to get started."}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 rounded-lg border border-border bg-surface-elevated p-6">
              <DashboardErrorBoundary
                fallback={
                  <div className="flex flex-col h-full items-center justify-center gap-3">
                    <p className="text-ink-muted text-sm">Dashboard error</p>
                    <button
                      onClick={() => setShowRawMd(true)}
                      className="text-sm text-ink-faint hover:text-ink-muted"
                    >
                      View raw instead
                    </button>
                  </div>
                }
              >
                <ContextDashboard
                  rawContent={content}
                  onViewRaw={() => setShowRawMd(true)}
                  onContentUpdated={setContent}
                  pendingReview={pendingReview}
                />
              </DashboardErrorBoundary>
            </div>
          )}
        </section>

        <CheckInPanel
          isOpen={showCheckIn}
          onClose={() => setShowCheckIn(false)}
          rawContent={content}
          onContextUpdated={fetchContent}
          onPendingReviewChange={setPendingReview}
          shouldAutoOpen={shouldAutoOpenCheckIn}
        />
      </main>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-red-950/90 text-red-200 text-sm border border-red-800">
          {typeof error === "string" ? error : "An error occurred"}
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-elevated border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Data directory</h3>
            <p className="text-sm text-ink-muted mb-3">
              Where AI_CONTEXT.md and the archive folder live. Use an absolute path.
            </p>
            <input
              type="text"
              value={settingsInput}
              onChange={(e) => setSettingsInput(e.target.value)}
              placeholder="/path/to/your/data"
              className="w-full px-4 py-2 rounded-lg bg-surface-muted border border-border text-ink placeholder-ink-faint focus:outline-none focus:ring-1 focus:ring-ink-faint"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-lg bg-ink text-surface font-medium hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automation info modal */}
      {showAutoInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-elevated border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">How to auto-update</h3>
            <ul className="text-sm text-ink-muted space-y-2 list-disc list-inside">
              <li>Drag any file onto the paste area — PDF, Excel, CSV, or text</li>
              <li>Paste any raw text, folder listing, or export directly</li>
              <li>A future Mac menubar companion app will enable background capture (coming soon)</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAutoInfo(false)}
                className="px-4 py-2 rounded-lg bg-ink text-surface font-medium hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
