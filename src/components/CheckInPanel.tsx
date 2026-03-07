"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PendingReview {
  contextUpdates?: string;
  todos?: Array<{ text: string; status: string; category: string }>;
}

interface CheckInPanelProps {
  isOpen: boolean;
  onClose: () => void;
  rawContent: string;
  onContextUpdated: () => void;
  onPendingReviewChange: (hasPending: boolean) => void;
  shouldAutoOpen: boolean;
}

const AFFIRMATIVE = /^(yes|yeah|yep|commit|looks good|looks great|perfect|correct|approved?|👍|✅|✔)\s*$/i;
const IDLE_MS = 10000;

export function CheckInPanel({
  isOpen,
  onClose,
  rawContent,
  onContextUpdated,
  onPendingReviewChange,
  shouldAutoOpen,
}: CheckInPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [greetingLoaded, setGreetingLoaded] = useState(false);
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onPendingReviewChange(!!pendingReview);
  }, [pendingReview, onPendingReviewChange]);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const fetchGreeting = useCallback(async () => {
    if (greetingLoaded || messages.length > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages([{ role: "assistant", content: data.reply }]);
        if (data.pendingReview) setPendingReview(data.pendingReview);
      }
    } catch {
      setMessages([{ role: "assistant", content: "Couldn't load check-in. Try again." }]);
    } finally {
      setIsLoading(false);
      setGreetingLoaded(true);
    }
  }, [greetingLoaded, messages.length]);

  useEffect(() => {
    if (isOpen && shouldAutoOpen && messages.length === 0) {
      fetchGreeting();
    } else if (isOpen && messages.length === 0 && !isLoading) {
      setGreetingLoaded(true);
    }
  }, [isOpen, shouldAutoOpen, messages.length, isLoading, fetchGreeting]);

  const handleCommit = useCallback(async () => {
    if (!pendingReview) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/checkin/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingReview),
      });
      if (res.ok) {
        setPendingReview(null);
        onContextUpdated();
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Done. Your context has been updated." },
        ]);
      } else {
        const data = await res.json();
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.error || "Commit failed." },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Failed to commit. Try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [pendingReview, onContextUpdated]);

  const sendToApi = useCallback(
    async (apiMessages: Message[]): Promise<{ reply?: string; pendingReview?: PendingReview }> => {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        if (data.pendingReview) setPendingReview(data.pendingReview);
        clearIdleTimer();
        if (!data.pendingReview && apiMessages.length > 0) {
          idleTimerRef.current = setTimeout(() => {
            idleTimerRef.current = null;
            const withDone = [...apiMessages, { role: "user", content: "done" }];
            setMessages((m) => [...m, { role: "user", content: "done" }]);
            fetch("/api/checkin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: withDone.map((m) => ({ role: m.role, content: m.content })),
              }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.reply) {
                  setMessages((prev) => [...prev, { role: "assistant", content: d.reply }]);
                  if (d.pendingReview) setPendingReview(d.pendingReview);
                }
              });
          }, IDLE_MS);
        }
        return data;
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.error || "Something went wrong." },
        ]);
        return {};
      }
    },
    [clearIdleTimer]
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    clearIdleTimer();

    if (pendingReview && AFFIRMATIVE.test(text)) {
      setMessages((m) => [...m, { role: "user", content: text }]);
      await handleCommit();
      return;
    }

    const apiMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(apiMessages);
    setIsLoading(true);

    try {
      await sendToApi(apiMessages);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Failed to send. Try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, pendingReview, handleCommit, sendToApi, clearIdleTimer]);

  useEffect(() => {
    return () => clearIdleTimer();
  }, [clearIdleTimer]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col w-96 shrink-0 border-l border-border bg-surface-elevated">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-ink">Check in</h3>
        <button onClick={onClose} className="text-ink-faint hover:text-ink text-sm">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && !isLoading && (
          <p className="text-sm text-ink-muted">
            Say hi to start. Claude knows your projects and will ask one question at a
            time. Say &quot;done&quot; when finished to review before committing.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-ink text-surface" : "bg-surface-muted text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {pendingReview && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <p className="text-amber-200 font-medium mb-2">Pending review</p>
            <p className="text-ink-muted text-xs">
              Type &quot;yes&quot; to commit, or correct anything first.
            </p>
          </div>
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 text-sm bg-surface-muted text-ink-muted">
              …
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              clearIdleTimer();
            }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={pendingReview ? "yes to commit, or correct…" : "Reply…"}
            className="flex-1 px-3 py-2 rounded-lg bg-surface-muted border border-border text-ink placeholder-ink-faint text-sm focus:outline-none focus:ring-1 focus:ring-ink-faint"
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
