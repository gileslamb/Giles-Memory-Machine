"use client";

import { useState, useRef } from "react";
import { apiUrl } from "@/lib/api";
import { parseFileToText } from "@/lib/parse-files";

interface PastePanelProps {
  onContentUpdated: (content: string) => void;
  onError: (msg: string | null) => void;
}

type Step = "input" | "preview" | "editing";

export function PastePanel({ onContentUpdated, onError }: PastePanelProps) {
  const [pasteValue, setPasteValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [summary, setSummary] = useState("");
  const [proposedContent, setProposedContent] = useState("");
  const [editContent, setEditContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    try {
      const text = await parseFileToText(file);
      setPasteValue((v) => (v ? v + "\n\n" + text : text));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not read file");
    }
  };

  const handlePreview = async () => {
    if (!pasteValue.trim()) return;
    setIsLoading(true);
    onError(null);
    try {
      const res = await fetch(apiUrl("/api/context/merge-preview"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pastedContent: pasteValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed");
      setSummary(data.summary ?? "");
      setProposedContent(data.proposedContent ?? "");
      setEditContent(data.proposedContent ?? "");
      setStep("preview");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl("/api/context"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: proposedContent }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onContentUpdated(proposedContent);
      setStep("input");
      setPasteValue("");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setStep("input");
    setSummary("");
    setProposedContent("");
  };

  const handleEdit = () => {
    setEditContent(proposedContent);
    setStep("editing");
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl("/api/context"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onContentUpdated(editContent);
      setStep("input");
      setPasteValue("");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "preview") {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-ink-muted">Merge preview</h2>
        <div className="p-4 rounded-lg bg-surface-muted border border-border">
          <p className="text-sm text-ink whitespace-pre-wrap">{summary}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? "Saving…" : "Accept"}
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="px-4 py-2.5 rounded-lg border border-border hover:bg-surface-muted"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-lg border border-border hover:bg-surface-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "editing") {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-ink-muted">Edit before merge</h2>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full h-64 p-4 rounded-lg bg-surface-muted border border-border text-ink font-mono text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ink-faint"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSaveEdit()}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-lg bg-ink text-surface font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Saving…" : "Accept & merge"}
          </button>
          <button
            type="button"
            onClick={() => setStep("preview")}
            className="px-4 py-2.5 rounded-lg border border-border hover:bg-surface-muted"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-ink-muted">Paste anything</h2>
      <textarea
        value={pasteValue}
        onChange={(e) => setPasteValue(e.target.value)}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("border-ink-faint");
        }}
        onDragLeave={(e) => e.currentTarget.classList.remove("border-ink-faint")}
        onDrop={async (e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("border-ink-faint");
          const file = e.dataTransfer.files[0];
          if (file) await handleFileSelect(file);
        }}
        placeholder="Meeting notes, exports, raw text… Or drag a file — PDF, Excel, CSV, image, text."
        className="w-full h-40 p-4 rounded-lg bg-surface-muted border border-border text-ink placeholder-ink-faint resize-none focus:outline-none focus:ring-1 focus:ring-ink-faint transition-colors"
        disabled={isLoading}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.csv,.xlsx,.xls,.txt,.md,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f);
          e.target.value = "";
        }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isLoading || !pasteValue.trim()}
          className="px-4 py-2.5 rounded-lg bg-ink text-surface font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isLoading ? "Analysing…" : "Preview merge"}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 rounded-lg border border-border hover:bg-surface-muted"
        >
          Upload file
        </button>
      </div>
    </div>
  );
}
