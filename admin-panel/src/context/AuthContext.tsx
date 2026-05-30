"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────
type PermissionModule =
  | "ALL" | "PACKAGES" | "DESTINATIONS" | "BLOGS" | "INQUIRIES"
  | "SUPPORT" | "FINANCE" | "BOOKINGS" | "TRANSPORT" | "SETTINGS" | "USERS";

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string; // "ADMIN" | "SUPERADMIN"
  permissions: PermissionModule[];
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (module: PermissionModule) => boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const API_BASE = (() => {
  const raw = import.meta.env.VITE_API_URL || "http://localhost:8080";
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
})();

// ─── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sh_admin_token");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.exp && Date.now() < parsed.exp) {
          setUser(parsed);
        } else {
          localStorage.removeItem("sh_admin_token");
        }
      } catch {
        localStorage.removeItem("sh_admin_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      const userData: AuthUser = {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
        permissions: data.permissions || ["ALL"],
        token: data.token,
      };

      const stored = { ...userData, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }; // 7 days
      localStorage.setItem("sh_admin_token", JSON.stringify(stored));
      setUser(userData);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("sh_admin_token");
    setUser(null);
  };

  /** Returns true if this admin has access to the given module */
  const hasPermission = (module: PermissionModule): boolean => {
    if (!user) return false;
    if (user.role === "SUPERADMIN") return true;
    return user.permissions.includes("ALL") || user.permissions.includes(module);
  };

  const isSuperAdmin = user?.role === "SUPERADMIN";

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasPermission, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
