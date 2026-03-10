/**
 * API fetch helper - uses full URL to avoid routing/404 issues in Next.js 15
 */
export function apiUrl(path: string): string {
  if (typeof window !== "undefined") {
    const base = window.location.origin;
    return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return path;
}
