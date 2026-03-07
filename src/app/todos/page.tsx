"use client";

import Link from "next/link";
import { KanbanBoard } from "@/components/KanbanBoard";
import { AppNav } from "@/components/AppNav";

export default function TodosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-medium tracking-tight text-ink">
            Giles Memory Machine
          </Link>
          <AppNav />
        </div>
        <Link
          href="/"
          className="text-sm text-ink-muted hover:text-ink transition-colors"
        >
          ← Dashboard
        </Link>
      </header>

      <main className="flex-1 flex flex-col p-6 min-h-0">
        <div className="flex-1 rounded-lg border border-border bg-surface-elevated p-6 min-h-0 flex flex-col">
          <KanbanBoard />
        </div>
      </main>
    </div>
  );
}
