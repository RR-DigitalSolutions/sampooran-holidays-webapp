/**
 * Returns the base URL WITHOUT /api suffix.
 * Use this for setBaseUrl() in providers.tsx — the generated API hooks
 * already include /api in their paths (e.g. "/api/packages").
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

/**
 * Returns the full API URL WITH /api suffix.
 * Use this for direct fetch() calls in server components (page.tsx, sitemap.ts, etc.)
 * where paths do NOT include /api prefix (e.g. "/destinations/resolve-slug/...").
 */
export function getApiUrl(): string {
  return `${getApiBase()}/api`;
}
