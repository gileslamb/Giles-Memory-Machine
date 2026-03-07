"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AdvisorBarProps {
  rawContent: string;
}

const QUICK_PROMPTS = [
  "How am I doing?",
  "What's the single next thing I should do?",
  "What should I add to my context?",
  "What's being neglected?",
  "Where am I drifting off course?",
];

export function AdvisorBar({ rawContent }: AdvisorBarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsExpanded(true);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.error || "Something went wrong." },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Failed to send. Try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);

  return (
    <div className="border-b border-border bg-surface-muted/30">
      {/* Bar — horizontal */}
      <div className="px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-muted shrink-0">Advisor</span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-surface-muted hover:border-ink-faint text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask anything…"
            className="flex-1 min-w-0 px-3 py-1.5 rounded border border-border bg-surface text-ink placeholder-ink-faint text-sm focus:outline-none focus:ring-1 focus:ring-ink-faint"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-3 py-1.5 rounded bg-ink text-surface text-sm font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
          >
            Send
          </button>
        </div>
      </div>

      {/* Expandable response area */}
      {messages.length > 0 && (
        <div
          className={`border-t border-border overflow-hidden transition-all ${
            isExpanded ? "max-h-64" : "max-h-0"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2 flex items-center justify-between text-left text-xs text-ink-muted hover:bg-surface-muted/50"
          >
            <span>{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
            <span>{isExpanded ? "▼" : "▶"}</span>
          </button>
          {isExpanded && (
            <div
              ref={scrollRef}
              className="px-4 pb-4 pt-0 max-h-48 overflow-auto space-y-2"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user" ? "bg-ink text-surface" : "bg-surface-elevated text-ink border border-border"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-3 py-2 text-sm bg-surface-elevated text-ink-muted border border-border">
                    …
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
