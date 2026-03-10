"use client";

import React, { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";

const PARAGRAPH_PROMPT = `Give me a 3-4 sentence morning brief. Format with these exact section labels on their own line:
Creative: [one observation — what's moving, what has momentum]
Admin: [one flag — what needs attention]
Today: [personal note + one specific action — energy, life, health from the Life layer]
Use 2-3 short paragraphs. Warm and direct.`;

const EXPANDED_PROMPT = `Give me the full status: full signals analysis, all open todos with staleness, detailed project status across all layers, and strategic observations. Format with clear sections or bullet points. Use short paragraphs to separate ideas.`;

interface CoachZoneProps {
  hasContent: boolean;
  contentVersion: number;
  compact?: boolean;
  /** When set, show entry-specific coach instead of main coach */
  entryContext?: { layer: string; entryName: string } | null;
  /** When set, show todo-specific coach instead of main coach */
  todosContext?: { openCount: number; overdueCount: number; overdueNames: string[]; firstOverdue: string | null } | null;
}

export function CoachZone({ hasContent, contentVersion, compact, entryContext, todosContext }: CoachZoneProps) {
  const [paragraph, setParagraph] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingExpanded, setIsLoadingExpanded] = useState(false);
  const [entryCoach, setEntryCoach] = useState<string | null>(null);
  const [entryCoachLoading, setEntryCoachLoading] = useState(false);

  useEffect(() => {
    if (!entryContext) {
      setEntryCoach(null);
      setEntryCoachLoading(false);
      return;
    }
    let cancelled = false;
    setEntryCoachLoading(true);
    setEntryCoach(null);
    fetch(apiUrl("/api/advisor/entry"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layer: entryContext.layer, entryName: entryContext.entryName }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.reply) setEntryCoach(d.reply);
      })
      .catch(() => {
        if (!cancelled) setEntryCoach(null);
      })
      .finally(() => {
        if (!cancelled) setEntryCoachLoading(false);
      });
    return () => { cancelled = true; };
  }, [entryContext?.layer, entryContext?.entryName]);

  useEffect(() => {
    if (!hasContent || entryContext || todosContext) {
      if (!entryContext && !todosContext) {
        setParagraph(null);
        setExpanded(null);
      }
      if (!entryContext && !todosContext) setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetch(apiUrl("/api/advisor"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: PARAGRAPH_PROMPT }],
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.reply) setParagraph(d.reply);
      })
      .catch(() => {
        if (!cancelled) setParagraph(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [hasContent, contentVersion, entryContext, todosContext]);

  const handleSayMore = () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    if (expanded) {
      setIsExpanded(true);
      return;
    }
    setIsLoadingExpanded(true);
    fetch(apiUrl("/api/advisor"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: EXPANDED_PROMPT }],
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.reply) {
          setExpanded(d.reply);
          setIsExpanded(true);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingExpanded(false));
  };

  if (!hasContent && !entryContext && !todosContext) return null;

  const LAYER_COLORS: Record<string, string> = {
    Creative: "#4af0c8",
    Admin: "#f0a84a",
    Today: "#f04a7a",
  };

  function renderCoachText(text: string) {
    const parts: React.ReactNode[] = [];
    const lines = text.split("\n");
    let key = 0;
    for (const line of lines) {
      const match = line.match(/^(Creative:|Admin:|Today:)\s*(.*)$/i);
      if (match) {
        const [, label, rest] = match;
        const color = LAYER_COLORS[label as keyof typeof LAYER_COLORS] ?? "#e8e8e8";
        parts.push(
          <p key={key++} className="mb-2">
            <span className="font-bold" style={{ color, fontSize: "1.05em" }}>{label} </span>
            <span>{rest}</span>
          </p>
        );
      } else if (line.trim()) {
        parts.push(<p key={key++}>{line.trim()}</p>);
      } else {
        parts.push(<div key={key++} className="h-2" />);
      }
    }
    return parts;
  }

  if (todosContext) {
    const { openCount, overdueCount, overdueNames, firstOverdue } = todosContext;
    const overdueList = overdueNames.slice(0, 3).join(", ");
    const note =
      overdueCount > 0
        ? `You have ${openCount} open todos. ${overdueCount} are overdue by 7+ days — ${overdueList}. Start with ${firstOverdue ?? overdueNames[0]}.`
        : `You have ${openCount} open todos. None overdue.`;
    return (
      <div
        className="border-b"
        style={{
          backgroundColor: "#0f0f0f",
          borderColor: "#1a1a1a",
          padding: "24px 48px",
        }}
      >
        <p style={{ color: "#f0ede8", fontSize: 16, lineHeight: 1.7 }}>{note}</p>
      </div>
    );
  }

  if (entryContext) {
    return (
      <div
        className="border-b"
        style={{
          backgroundColor: "#0f0f0f",
          borderColor: "#1a1a1a",
          padding: "24px 48px",
        }}
      >
        {entryCoachLoading ? (
          <span className="text-[#a3a3a3] animate-pulse" style={{ fontSize: 16 }}>thinking…</span>
        ) : entryCoach ? (
          <div style={{ color: "#f0ede8", fontSize: 16, lineHeight: 1.7 }}>{entryCoach}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`border-b ${compact ? "py-3" : "py-4"}`}
      style={{
        backgroundColor: "#0f0f0f",
        borderColor: "#1a1a1a",
        paddingLeft: 48,
        paddingRight: 48,
      }}
    >
      {isLoading ? (
        <span className="text-[#a3a3a3] animate-pulse" style={{ fontSize: 16 }}>Loading…</span>
      ) : paragraph ? (
        <>
          <div style={{ color: "#f0ede8", fontSize: 16, lineHeight: 1.7 }}>
            {renderCoachText(paragraph)}
          </div>
          <button
            type="button"
            onClick={handleSayMore}
            disabled={isLoadingExpanded}
            className="mt-2 text-xs text-[#a3a3a3] hover:text-[#e8e8e8] disabled:opacity-50"
          >
            {isLoadingExpanded
              ? "Loading…"
              : isExpanded
                ? "Say less ←"
                : "Say more →"}
          </button>
          {isExpanded && expanded && (
            <div
              className="mt-4 pt-4 border-t space-y-3"
              style={{ borderColor: "#1a1a1a", color: "#a3a3a3", fontSize: 16, lineHeight: 1.7 }}
            >
              {expanded.split(/\n\n+/).filter(Boolean).map((para, i) => (
                <p key={i} className="whitespace-pre-wrap">{para.trim()}</p>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
