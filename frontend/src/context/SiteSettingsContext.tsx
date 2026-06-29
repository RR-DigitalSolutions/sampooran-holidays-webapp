"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getApiUrl } from "@/lib/api-url";

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  phone2: string;
  email: string;
  whatsapp: string;
  address: string;
  supportHours: string;
  gstNumber: string;
  cinNumber: string;
  mapEmbedUrl: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  social_linkedin: string;
  social_twitter: string;
  social_whatsapp_channel: string;
  og_banner: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Sampooran Holidays",
  tagline: "Your Dream Holiday, Planned Perfectly",
  logoUrl: "/logo.png",
  phone: "+91-85955-13009",
  phone2: "",
  email: "info@sampooranholidays.com",
  whatsapp: "918595513009",
  address: "Mall Road, Manali, Himachal Pradesh 175131",
  supportHours: "Mon-Sat, 9am-7pm",
  gstNumber: "",
  cinNumber: "",
  mapEmbedUrl: "",
  social_facebook: "https://facebook.com/sampooranholidays",
  social_instagram: "https://instagram.com/sampooranholidays",
  social_youtube: "https://youtube.com/sampooranholidays",
  social_linkedin: "https://linkedin.com/company/sampooranholidays",
  social_twitter: "",
  social_whatsapp_channel: "",
  og_banner: "https://sampooranholidays.com/logo.png",
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  isLoading: true,
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const baseUrl = getApiUrl();
        const res = await fetch(`${baseUrl}/ota/home/site-settings`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw: Record<string, string> = await res.json();

        const merged: SiteSettings = { ...DEFAULT_SETTINGS };
        const keys = Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[];
        keys.forEach((k) => {
          if (raw[k] && raw[k].trim() !== "") {
            (merged as any)[k] = raw[k];
          }
        });
        setSettings(merged);
      } catch (error) {
        console.warn("[SiteSettings] Using defaults:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  const { settings } = useContext(SiteSettingsContext);
  return settings;
}