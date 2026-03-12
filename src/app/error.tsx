"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  const isChunkError = error?.message?.includes("ChunkLoadError") ?? false;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d0d0d",
        color: "#e5e5e5",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#a3a3a3", marginBottom: "1.5rem" }}>
        {error instanceof Error ? error.message : String(error)}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {isChunkError && (
          <a
            href="/reset"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#4af0c8",
              color: "#0a0a0a",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Clear cache & reload
          </a>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#262626",
            color: "#e5e5e5",
            border: "1px solid #404040",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
