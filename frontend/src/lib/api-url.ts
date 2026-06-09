/**
 * Returns the absolute base URL of the backend (e.g. http://localhost:8080 or https://xyz.onrender.com).
 * Always returns absolute URL. Useful for WebSockets and server-side fetches.
 */
export function getApiBaseAbsolute(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
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
