"use client";

import { useEffect } from "react";

/**
 * Cache-bust page. Visit /reset when you see ChunkLoadError.
 * Clears caches and forces a fresh load of the app.
 */
export default function ResetPage() {
  useEffect(() => {
    const go = () => {
      const url = `/?_=${Date.now()}`;
      window.location.replace(url);
    };

    if ("caches" in window) {
      caches.keys().then((names) => {
        Promise.all(names.map((n) => caches.delete(n))).then(go);
      });
    } else {
      go();
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#0a0a0a",
        color: "#e8e8e8",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Clearing cache…</h1>
      <p style={{ color: "#737373", fontSize: 14 }}>Redirecting to fresh load.</p>
    </div>
  );
}
