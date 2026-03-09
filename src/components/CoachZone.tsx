"use client";

import { useState, useEffect } from "react";

const PARAGRAPH_PROMPT = `Give me a 3-4 sentence morning brief. Cover: one creative observation (what's moving, what has momentum), one admin flag (what needs attention), one personal note (energy, life, health from the Life layer), and one specific action to take today. Format as 2-3 short paragraphs separated by blank lines. Warm and direct.`;

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
    fetch("/api/advisor/entry", {
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
    fetch("/api/advisor", {
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
    fetch("/api/advisor", {
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

  if (todosContext) {
    const { openCount, overdueCount, overdueNames, firstOverdue } = todosContext;
    const overdueList = overdueNames.slice(0, 3).join(", ");
    const note =
      overdueCount > 0
        ? `You have ${openCount} open todos. ${overdueCount} are overdue by 7+ days — ${overdueList}. Start with ${firstOverdue ?? overdueNames[0]}.`
        : `You have ${openCount} open todos. None overdue.`;
    return (
      <div
        className="px-6 py-4 border-b"
        style={{
          backgroundColor: "#0f0f0f",
          borderColor: "#1e1e1e",
        }}
      >
        <p className="text-[#e8e8e8] text-sm leading-relaxed">{note}</p>
      </div>
    );
  }

  if (entryContext) {
    return (
      <div
        className="px-6 py-4 border-b"
        style={{
          backgroundColor: "#0f0f0f",
          borderColor: "#1e1e1e",
        }}
      >
        {entryCoachLoading ? (
          <span className="text-sm text-[#a3a3a3] animate-pulse">thinking…</span>
        ) : entryCoach ? (
          <p className="text-[#e8e8e8] text-sm leading-relaxed">{entryCoach}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`px-6 py-4 border-b ${compact ? "py-3" : "py-4"}`}
      style={{
        backgroundColor: "#0f0f0f",
        borderColor: "#1e1e1e",
      }}
    >
      {isLoading ? (
        <span className="text-sm text-[#a3a3a3] animate-pulse">Loading…</span>
      ) : paragraph ? (
        <>
          <div className="text-[#e8e8e8] text-sm leading-relaxed space-y-3">
            {paragraph.split(/\n\n+/).filter(Boolean).map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
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
              className="mt-4 pt-4 border-t text-sm text-[#a3a3a3] leading-relaxed space-y-3"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
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
