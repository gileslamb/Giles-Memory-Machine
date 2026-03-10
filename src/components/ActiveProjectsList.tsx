"use client";

import { useCallback, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { apiUrl } from "@/lib/api";
import type { ParsedEntry } from "@/lib/parse-context";
import type { ParsedTodo } from "@/lib/parse-todos";

const PROJECTS_COLOR = "#4af0c8";
const PRIORITY_BADGES = ["①", "②", "③", "④", "⑤"];

interface ProjectWithReason extends ParsedEntry {
  reason?: string;
}

interface ActiveProjectsListProps {
  projects: ParsedEntry[];
  suggestedOrder: { name: string; rank: number; reason: string }[] | null;
  overrides: string[] | null;
  inactiveProjectNames: string[];
  onOverridesChange: (names: string[]) => void;
  onInactiveChange: (names: string[]) => void;
  onOverridesAndInactiveChange?: (projectNames: string[], inactiveProjectNames: string[]) => void;
  openTodos: ParsedTodo[];
}

export function ActiveProjectsList({
  projects,
  suggestedOrder,
  overrides,
  inactiveProjectNames,
  onOverridesChange,
  onInactiveChange,
  onOverridesAndInactiveChange,
}: ActiveProjectsListProps) {
  const [showInactive, setShowInactive] = useState(false);

  const fullOrder = useMemo(() => {
    const byName = new Map(projects.map((p) => [p.name, p]));
    const order: string[] = overrides && overrides.length > 0
      ? overrides.filter((n) => byName.has(n))
      : (suggestedOrder ?? []).map((s) => s.name).filter((n) => byName.has(n));
    const missing = projects.map((p) => p.name).filter((n) => !order.includes(n));
    return [...order, ...missing];
  }, [projects, suggestedOrder, overrides]);

  const activeProjects = useMemo((): ProjectWithReason[] => {
    const byName = new Map(projects.map((p) => [p.name, p]));
    const suggestedMap = new Map(
      (suggestedOrder ?? []).map((s) => [s.name, { reason: s.reason }])
    );
    const available = fullOrder.filter((n) => !inactiveProjectNames.includes(n));
    return available.slice(0, 5).map((name, i) => {
      const entry = byName.get(name)!;
      const suggested = suggestedMap.get(name);
      return { ...entry, reason: suggested?.reason };
    });
  }, [projects, suggestedOrder, fullOrder, inactiveProjectNames]);

  const inactiveProjects = useMemo((): ProjectWithReason[] => {
    const byName = new Map(projects.map((p) => [p.name, p]));
    return fullOrder
      .filter((n) => inactiveProjectNames.includes(n))
      .map((name) => byName.get(name)!)
      .filter(Boolean);
  }, [projects, fullOrder, inactiveProjectNames]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || result.destination.index === result.source.index) return;
      const reordered = Array.from(activeProjects);
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      onOverridesChange(reordered.map((p) => p.name));
    },
    [activeProjects, onOverridesChange]
  );

  const handleDeprioritise = useCallback(
    (name: string) => {
      const next = [...inactiveProjectNames, name];
      onInactiveChange(next);
    },
    [inactiveProjectNames, onInactiveChange]
  );

  const handleReactivate = useCallback(
    (name: string) => {
      const nextInactive = inactiveProjectNames.filter((n) => n !== name);
      const activeNames = activeProjects.map((p) => p.name);
      const rest = fullOrder.filter((n) => n !== name && !activeNames.includes(n));
      const newOrder = [...activeNames, name, ...rest];
      if (onOverridesAndInactiveChange) {
        onOverridesAndInactiveChange(newOrder, nextInactive);
      } else {
        onInactiveChange(nextInactive);
        onOverridesChange(newOrder);
      }
    },
    [inactiveProjectNames, activeProjects, fullOrder, onInactiveChange, onOverridesChange, onOverridesAndInactiveChange]
  );

  const handleReset = useCallback(() => {
    onOverridesChange([]);
    onInactiveChange([]);
  }, [onOverridesChange, onInactiveChange]);

  const hasOverrides = overrides != null && overrides.length > 0;
  const hasInactive = inactiveProjectNames.length > 0;

  if (projects.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="font-medium uppercase"
          style={{ color: "#666666", letterSpacing: "0.1em", fontSize: "0.75rem" }}
        >
          Active Projects
        </h3>
        {(hasOverrides || hasInactive) && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#737373] hover:text-[#a3a3a3] underline"
          >
            Reset to suggested
          </button>
        )}
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="active-projects">
          {(provided) => (
            <ul
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-col gap-3"
            >
              {activeProjects.map((e, i) => (
                <Draggable key={e.name} draggableId={e.name} index={i}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-start gap-3 rounded-md"
                      style={{
                        padding: 12,
                        border: "1px solid #1e1e1e",
                        backgroundColor: snapshot.isDragging ? "#141414" : "#0a0a0a",
                      }}
                    >
                      <span
                        className="shrink-0 font-medium"
                        style={{ color: PROJECTS_COLOR, fontSize: 14 }}
                        title={e.reason ?? undefined}
                      >
                        {PRIORITY_BADGES[i]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div style={{ color: "#ffffff", fontSize: 15, fontWeight: 600 }}>
                          {e.name}
                        </div>
                        {e.summary && (
                          <div style={{ color: "#999999", fontSize: 13, marginTop: 4 }}>
                            {e.summary.slice(0, 80)}
                            {e.summary.length > 80 ? "…" : ""}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeprioritise(e.name)}
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-[#525252] hover:text-[#737373] hover:bg-[#1a1a1a] transition-colors"
                        title="Deprioritise"
                      >
                        ×
                      </button>
                      <div
                        {...provided.dragHandleProps}
                        className="shrink-0 cursor-grab active:cursor-grabbing text-[#525252] hover:text-[#737373] select-none"
                        style={{ fontSize: 14 }}
                        title="Drag to reorder"
                      >
                        ⠿
                      </div>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

      {hasInactive && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setShowInactive(!showInactive)}
            className="text-xs text-[#737373] hover:text-[#a3a3a3] underline"
          >
            · {inactiveProjectNames.length} inactive project{inactiveProjectNames.length !== 1 ? "s" : ""} →
          </button>
          {showInactive && (
            <div className="mt-3 pl-4 border-l border-[#1e1e1e] space-y-2">
              {inactiveProjects.map((e) => (
                <button
                  key={e.name}
                  type="button"
                  onClick={() => handleReactivate(e.name)}
                  className="block w-full text-left py-3 px-3 rounded-md hover:bg-[#141414] transition-colors"
                  style={{ border: "1px solid #1e1e1e" }}
                >
                  <span style={{ color: "#e8e8e8", fontSize: 14 }}>{e.name}</span>
                  <span className="text-xs text-[#737373] ml-2">click to re-activate</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
