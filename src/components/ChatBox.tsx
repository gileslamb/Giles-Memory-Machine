"use client";

import { useState, useRef, useEffect } from "react";
import { parseFileToText } from "@/lib/parse-files";

interface ChatBoxProps {
  rawContent: string;
  onContentUpdated?: (content: string) => void;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  return (
    t.endsWith("?") ||
    /^(how|what|when|where|why|who|which|can|could|would|should|is|are|do|does|did)\b/i.test(t)
  );
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 3) + "…" : s;
}

export function ChatBox({ rawContent, onContentUpdated }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dropActive, setDropActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const handleFileUpload = async (file: File) => {
    if (isLoading) return;
    setFileError(null);
    setIsLoading(true);
    addMessage("user", `Uploaded: ${file.name}`);
    addMessage("assistant", "…");
    try {
      const text = await parseFileToText(file);
      const res = await fetch("/api/simple-merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: data.reply };
          return next;
        });
        [5000, 15000, 45000, 90000].forEach((ms) => {
          setTimeout(async () => {
            try {
              const r = await fetch("/api/context", { cache: "no-store" });
              const d = await r.json();
              onContentUpdated?.(d.content ?? "");
            } catch {}
          }, ms);
        });
      } else {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: `Sorry — ${data.error ?? "Failed"}` };
          return next;
        });
      }
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "Sorry — upload failed." };
        return next;
      });
      setFileError("Upload failed");
      setTimeout(() => setFileError(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setIsLoading(true);
    addMessage("user", truncate(text, 200));
    addMessage("assistant", "…");

    try {
      if (looksLikeQuestion(text)) {
        const res = await fetch("/api/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
          cache: "no-store",
        });
        const data = await res.json();
        const reply = data.reply ? truncate(data.reply, 500) : "I couldn't generate a reply.";
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: reply };
          return next;
        });
      } else {
        const res = await fetch("/api/simple-merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && data.reply) {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: data.reply };
            return next;
          });
          [5000, 15000, 45000, 90000].forEach((ms) => {
            setTimeout(async () => {
              try {
                const r = await fetch("/api/context", { cache: "no-store" });
                const d = await r.json();
                onContentUpdated?.(d.content ?? "");
              } catch {}
            }, ms);
          });
        } else {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: `Sorry — ${data.error ?? "Failed"}` };
            return next;
          });
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "Sorry — something went wrong." };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full flex flex-col border-b"
      style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#0a0a0a" }}
    >
      <div className="flex-1 min-h-[120px] max-h-[280px] overflow-y-auto px-6 py-4 flex flex-col gap-3" style={{ backgroundColor: "#0a0a0a" }}>
        {messages.length === 0 && (
          <p className="text-sm text-[#525252] py-4">
            Dump text or drop a file — I&apos;ll integrate it with your context. Ask questions about your projects, priorities, next steps.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "text-[#e8e8e8] bg-[#262626]"
                  : "text-[#a3a3a3] bg-[#1a1a1a] border border-[#262626]"
              }`}
            >
              {m.content === "…" ? (
                <span className="italic text-[#737373]">Thinking…</span>
              ) : (
                m.content
              )}
            </p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="shrink-0 px-6 py-4">
        <div className={`flex gap-2 items-center ${isLoading ? "animate-pulse" : ""}`}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
            placeholder="Paste updates, drop files, or ask a question…"
            className="flex-1 min-w-0 px-4 py-3 rounded-lg bg-[#111111] border text-[#e8e8e8] placeholder-[#525252] focus:outline-none focus:ring-1 focus:ring-[#525252] text-base"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="shrink-0 px-5 py-3 rounded-lg font-medium disabled:opacity-50"
            style={{ backgroundColor: "#262626", color: "#e8e8e8" }}
          >
            {isLoading ? "…" : "Send"}
          </button>
        </div>
        <div
          className={`mt-2 flex items-center gap-2 py-1.5 px-2 -mx-2 rounded text-xs text-[#737373] transition-colors cursor-pointer ${dropActive ? "bg-[#1a1a1a] text-[#a3a3a3] ring-1 ring-[#404040]" : "hover:bg-[#141414] hover:text-[#a3a3a3]"}`}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDropActive(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setDropActive(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFileUpload(f);
          }}
          onClick={() => !isLoading && fileInputRef.current?.click()}
        >
          <span>or</span>
          <span className="underline">drop Excel, PDF, or text</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.xlsx,.xls,.txt,.md,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
              e.target.value = "";
            }}
          />
          {fileError && <span className="text-red-400 ml-auto">{fileError}</span>}
        </div>
      </div>
    </div>
  );
}
