"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";

type AIState = "claude" | "offline";

const STATE_CONFIG: Record<
  AIState,
  { emoji: string; label: string; title: string }
> = {
  claude: {
    emoji: "🔵",
    label: "Claude",
    title: "Claude API ready",
  },
  offline: {
    emoji: "🔴",
    label: "Offline",
    title: "Add ANTHROPIC_API_KEY to .env.local",
  },
};

export function AIStatusIndicator() {
  const [state, setState] = useState<AIState | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(apiUrl("/api/ai-status"), { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setState(data.state ?? "offline");
      } catch {
        if (!cancelled) setState("offline");
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    const onVisible = () => fetchStatus();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (state === null) return null;

  const config = STATE_CONFIG[state];

  return (
    <span title={config.title} className="text-base leading-none">
      {config.emoji}
    </span>
  );
}
