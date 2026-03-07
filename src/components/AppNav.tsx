"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4">
      <Link
        href="/"
        className={`text-sm transition-colors ${
          pathname === "/" ? "text-ink font-medium" : "text-ink-muted hover:text-ink"
        }`}
      >
        Dashboard
      </Link>
      <Link
        href="/todos"
        className={`text-sm transition-colors ${
          pathname === "/todos" ? "text-ink font-medium" : "text-ink-muted hover:text-ink"
        }`}
      >
        Todos
      </Link>
    </nav>
  );
}
