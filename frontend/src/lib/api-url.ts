/**
 * Returns the absolute base URL of the backend.
 * Automatically falls back away from localhost if running in production (e.g. Vercel).
 */
export function getApiBaseAbsolute(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:8080/api";
  const cleaned = raw.replace(/\/+$/, "").replace(/\/api$/, "");

  // Prevent production Vercel SSR from attempting to fetch localhost:8080 (which causes ETIMEDOUT)
  if (process.env.NODE_ENV === "production" && cleaned.includes("localhost")) {
    return "https://www.sampooranholidays.com";
  }

  return cleaned;
}

/**
 * Returns the base URL WITHOUT /api suffix.
 * Client-side: returns "" (relative path) to leverage Next.js proxy rewrites and avoid CORS.
 * Server-side: returns the absolute backend base URL.
 */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return getApiBaseAbsolute();
}

/**
 * Returns the full API URL WITH /api suffix.
 * Client-side: returns "/api" (relative path).
 * Server-side: returns the absolute backend base URL with /api suffix.
 */
export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }
  return `${getApiBaseAbsolute()}/api`;
}

/**
 * Resilient fetch wrapper with built-in timeout and graceful error swallowing
 * to prevent Vercel SSR ETIMEDOUT crashes on network glitches.
 */
export async function safeFetch(url: string, init?: RequestInit, timeoutMs = 5000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      ...init,
      signal: init?.signal || controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (error: any) {
    // Gracefully handle timeout/network failure without crashing Vercel SSR
    return null;
  }
}

