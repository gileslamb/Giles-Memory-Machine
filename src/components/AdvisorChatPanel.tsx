"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AdvisorChatPanelProps {
  rawContent: string;
}

const QUICK_PROMPTS = [
  "How am I doing?",
  "What's the single next thing I should do?",
  "What should I add to my context?",
  "What's being neglected?",
  "Where am I drifting off course?",
];

export function AdvisorChatPanel({ rawContent }: AdvisorChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="flex flex-col w-80 shrink-0 rounded-lg border border-border bg-surface-muted/30 overflow-hidden min-h-0">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-ink">Advisor</h3>
        <p className="text-xs text-ink-faint mt-0.5">
          Status, direction, next steps. Paste updates in the box on the left.
        </p>
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-2 border-b border-border shrink-0">
        <p className="text-xs text-ink-muted mb-2">Quick prompts</p>
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
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 space-y-3 min-h-0"
      >
        {messages.length === 0 && !isLoading && (
          <p className="text-sm text-ink-muted">
            Ask &quot;how am I doing?&quot; for a status check, or &quot;what&apos;s the single next thing I should do?&quot; for one clear action.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
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

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask anything…"
            className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-ink placeholder-ink-faint text-sm focus:outline-none focus:ring-1 focus:ring-ink-faint"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 rounded-lg bg-ink text-surface text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
