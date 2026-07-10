"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getApiUrl } from "@/lib/api-url";

// ─── OTA Partner shape ────────────────────────────────────────────────────────
export interface OtaPartner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  category: "B2C_OTA" | "B2B_WHOLESALER" | "META_SEARCH" | "OFFLINE_AGENCY";
  isActive: boolean;
}

// ─── Association badge shape ───────────────────────────────────────────────────
export interface Association {
  id: string;
  name: string;
  url?: string;
  isActive: boolean;
}

// ─── About-page content shape ─────────────────────────────────────────────────
export interface AboutContent {
  foundingYear: string;
  founderName: string;
  missionStatement: string;
  story: string;
  whyChooseUs: { title: string; description: string }[];
}

// ─── Main Settings shape ─────────────────────────────────────────────────────
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
  // New dynamic fields
  ota_partners: OtaPartner[];
  associations: Association[];
  about_content: AboutContent;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
export const DEFAULT_OTA_PARTNERS: OtaPartner[] = [
  { id: "mmt", name: "MakeMyTrip", logoUrl: "", websiteUrl: "https://makemytrip.com", category: "B2C_OTA", isActive: true },
  { id: "goibibo", name: "Goibibo", logoUrl: "", websiteUrl: "https://goibibo.com", category: "B2C_OTA", isActive: true },
  { id: "booking", name: "Booking.com", logoUrl: "", websiteUrl: "https://booking.com", category: "B2C_OTA", isActive: true },
  { id: "agoda", name: "Agoda", logoUrl: "", websiteUrl: "https://agoda.com", category: "META_SEARCH", isActive: true },
  { id: "cleartrip", name: "Cleartrip", logoUrl: "", websiteUrl: "https://cleartrip.com", category: "B2C_OTA", isActive: true },
  { id: "easemytrip", name: "EaseMyTrip", logoUrl: "", websiteUrl: "https://easemytrip.com", category: "B2C_OTA", isActive: true },
  { id: "thomascook", name: "Thomas Cook", logoUrl: "", websiteUrl: "https://thomascook.in", category: "OFFLINE_AGENCY", isActive: true },
  { id: "sotc", name: "SOTC", logoUrl: "", websiteUrl: "https://sotc.in", category: "OFFLINE_AGENCY", isActive: true },
];

export const DEFAULT_ASSOCIATIONS: Association[] = [
  { id: "iata", name: "IATA", url: "", isActive: true },
  { id: "tafi", name: "TAFI", url: "", isActive: true },
  { id: "otoai", name: "OTOAI", url: "", isActive: true },
  { id: "adtoi", name: "ADTOI", url: "", isActive: true },
];

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  foundingYear: "2014",
  founderName: "",
  missionStatement: "To share the authentic beauty of the Himalayas with the world through genuine, personalised travel experiences.",
  story: "Founded in 2014 in Himachal Pradesh, Sampooran Holidays began with a simple mission: to share the authentic beauty of the Himalayas with the world. Over the years, we have grown into a premier travel company offering customized B2B and B2C holiday packages, but our core philosophy remains unchanged — travel is not just about visiting places, but about creating memories that last a lifetime.",
  whyChooseUs: [
    { title: "Local Expertise", description: "Being based in Himachal, we know the mountains better than anyone else." },
    { title: "Customized Itineraries", description: "We tailor every trip to suit your preferences and budget." },
    { title: "Reliable Transport", description: "Our fleet of well-maintained taxis, tempo travellers, and buses ensures a comfortable journey." },
    { title: "24/7 Support", description: "Our dedicated team is always available to assist you during your trip." },
  ],
};

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
  ota_partners: DEFAULT_OTA_PARTNERS,
  associations: DEFAULT_ASSOCIATIONS,
  about_content: DEFAULT_ABOUT_CONTENT,
};

// ─── Context ──────────────────────────────────────────────────────────────────
interface SiteSettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  isLoading: true,
});

// ─── Safe JSON parse helper ───────────────────────────────────────────────────
function safeJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw || raw.trim() === "") return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
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

        // Scalar fields
        const merged: SiteSettings = { ...DEFAULT_SETTINGS };
        const scalarKeys: (keyof SiteSettings)[] = [
          "siteName", "tagline", "logoUrl", "phone", "phone2", "email",
          "whatsapp", "address", "supportHours", "gstNumber", "cinNumber",
          "mapEmbedUrl", "social_facebook", "social_instagram", "social_youtube",
          "social_linkedin", "social_twitter", "social_whatsapp_channel", "og_banner",
        ];
        scalarKeys.forEach((k) => {
          if (raw[k] && raw[k].trim() !== "") {
            (merged as any)[k] = raw[k];
          }
        });

        // JSON fields
        merged.ota_partners = safeJson<OtaPartner[]>(raw["ota_partners"], DEFAULT_OTA_PARTNERS);
        merged.associations = safeJson<Association[]>(raw["associations"], DEFAULT_ASSOCIATIONS);
        merged.about_content = safeJson<AboutContent>(raw["about_content"], DEFAULT_ABOUT_CONTENT);

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

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useSiteSettings(): SiteSettings {
  const { settings } = useContext(SiteSettingsContext);
  return settings;
}

export function useSiteSettingsLoading(): boolean {
  const { isLoading } = useContext(SiteSettingsContext);
  return isLoading;
}