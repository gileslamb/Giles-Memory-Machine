"use client";

import { useState, useRef, useEffect } from "react";

interface ChatBoxProps {
  rawContent: string;
  onContentUpdated?: (content: string) => void;
}

function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  return (
    t.endsWith("?") ||
    /^(how|what|when|where|why|who|which|can|could|would|should|is|are|do|does|did)\b/i.test(t)
  );
}

export function ChatBox({ rawContent, onContentUpdated }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ack, setAck] = useState<string | null>(null);
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setIsLoading(true);
    setAck(null);
    setQuickAnswer(null);

    try {
      if (looksLikeQuestion(text)) {
        const res = await fetch("/api/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: text }],
          }),
        });
        const data = await res.json();
        if (data.reply) {
          const short = data.reply.length > 120 ? data.reply.slice(0, 117) + "…" : data.reply;
          setQuickAnswer(short);
          if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
          answerTimeoutRef.current = setTimeout(() => {
            setQuickAnswer(null);
            answerTimeoutRef.current = null;
          }, 5000);
        }
        setAck("Noted.");
        setTimeout(() => setAck(null), 2000);
      } else {
        const res = await fetch("/api/context/merge-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pastedContent: text }),
        });
        const data = await res.json();
        if (res.ok && data.proposedContent) {
          const putRes = await fetch("/api/context", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: data.proposedContent }),
          });
          if (putRes.ok) {
            const putData = await putRes.json();
            onContentUpdated?.(putData.content ?? data.proposedContent);
            setAck("Added.");
            setTimeout(() => setAck(null), 2000);
          } else {
            setAck("Failed.");
            setTimeout(() => setAck(null), 2000);
          }
        } else {
          setAck("Failed.");
          setTimeout(() => setAck(null), 2000);
        }
      }
    } catch {
      setAck("Failed.");
      setTimeout(() => setAck(null), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full px-6 py-4 border-b"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      {quickAnswer && (
        <p className="mb-2 text-sm text-[#a3a3a3] line-clamp-2">{quickAnswer}</p>
      )}
      <div className={`flex gap-2 items-center ${isLoading ? "animate-pulse" : ""}`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          placeholder="Say anything, ask anything, or dump text..."
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
          {isLoading ? "…" : ack || "Send"}
        </button>
      </div>
    </div>
  );
}
