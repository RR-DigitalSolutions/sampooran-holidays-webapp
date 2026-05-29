const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function customFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const stored = localStorage.getItem("sh_admin_token");
  let token = "";
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      token = parsed.token || "";
    } catch { /* ignore */ }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null as any;
  return res.json();
}
