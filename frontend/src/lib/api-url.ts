/**
 * Normalizes NEXT_PUBLIC_API_URL to always include the /api suffix.
 * Handles both "https://xxx.onrender.com" and "https://xxx.onrender.com/api" formats.
 */
export function getApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
  // Remove trailing slash
  const url = raw.replace(/\/+$/, "");
  // Add /api if missing
  return url.endsWith("/api") ? url : `${url}/api`;
}
