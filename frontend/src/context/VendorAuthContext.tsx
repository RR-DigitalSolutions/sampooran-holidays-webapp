"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

import { getApiUrl } from "@/lib/api-url";

const API_BASE = getApiUrl();
const STORAGE_KEY = "sh_vendor_token";

interface VendorUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
  vendorBusinessName?: string;
  vendorVerified: boolean;
  companyName?: string;
  profilePicUrl?: string;
}

interface VendorAuthCtx {
  vendor: VendorUser | null;
  token: string | null;
  isLoading: boolean;
  isVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterPayload) => Promise<void>;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  vendorBusinessName?: string;
  vendorBusinessAddress?: string;
  companyName?: string;
  gstNumber?: string;
}

const VendorAuthContext = createContext<VendorAuthCtx | null>(null);

export function VendorAuthProvider({ children }: { children: React.ReactNode }) {
  const [vendor, setVendor] = useState<VendorUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadFromStorage = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const { token: t } = JSON.parse(stored);
      if (!t) return;
      // Validate token by fetching profile
      const res = await fetch(`${API_BASE}/auth/vendor/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const user = await res.json();
        setVendor(user);
        setToken(t);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/vendor/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: data.token }));
    setToken(data.token);
    setVendor(data.user);
  };

  const register = async (payload: RegisterPayload) => {
    const res = await fetch(`${API_BASE}/auth/vendor/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: data.token }));
    setToken(data.token);
    setVendor(data.vendor);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setVendor(null);
  };

  return (
    <VendorAuthContext.Provider value={{
      vendor,
      token,
      isLoading,
      isVerified: vendor?.vendorVerified ?? false,
      login,
      logout,
      register,
    }}>
      {children}
    </VendorAuthContext.Provider>
  );
}

export function useVendorAuth() {
  const ctx = useContext(VendorAuthContext);
  if (!ctx) throw new Error("useVendorAuth must be used within VendorAuthProvider");
  return ctx;
}

export function vendorAuthHeader(token: string | null) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}
