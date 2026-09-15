/**
 * Normalizes VITE_API_URL to always return the base URL WITHOUT /api suffix.
 * The admin panel convention is: API_BASE + "/api/admin/..." 
 */
export function getApiBase(): string {
  const configured = import.meta.env.VITE_API_URL;
  const raw = configured || (
    typeof window !== "undefined" && window.location.hostname === "admin.sampooranholidays.com"
      ? "https://www.sampooranholidays.com"
      : "http://localhost:8080"
  );
  // Remove trailing slash and /api suffix if present
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

/**
 * Returns the full API URL WITH /api suffix.
 * Use this in pages that build URLs like: `${API}/admin/...`
 */
export function getApiUrl(): string {
  return `${getApiBase()}/api`;
}
