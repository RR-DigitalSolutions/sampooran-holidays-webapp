// ─── Shared helpers reused by PackageForm ─────────────────────────────────────
import { getApiUrl } from "./api-url";
const API_BASE = getApiUrl();

export async function uploadMedia(file: File, folder = "packages"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const stored = localStorage.getItem("sh_admin_token");
  const token = stored ? JSON.parse(stored).token : "";
  const res = await fetch(`${API_BASE}/media/upload?folder=${folder}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  return (await res.json()).url;
}

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];
export const MEAL_ICONS: Record<string, string> = {
  breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "☕",
};

export type DayType = "ARRIVAL" | "SIGHTSEEING" | "TRANSIT" | "LEISURE" | "DEPARTURE";

export const DAY_TYPE_CONFIG: Record<DayType, {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  headerBg: string;
  description: string;
}> = {
  ARRIVAL: {
    label: "Arrival",
    emoji: "✈️",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    headerBg: "bg-gradient-to-r from-emerald-600 to-teal-600",
    description: "First day — arrive at destination city",
  },
  SIGHTSEEING: {
    label: "Sightseeing",
    emoji: "🏔️",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    headerBg: "bg-gradient-to-r from-blue-600 to-indigo-600",
    description: "Full day exploring attractions & activities",
  },
  TRANSIT: {
    label: "Transit",
    emoji: "🚗",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    headerBg: "bg-gradient-to-r from-amber-500 to-orange-500",
    description: "Travel day between two cities",
  },
  LEISURE: {
    label: "Leisure",
    emoji: "🌸",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    headerBg: "bg-gradient-to-r from-purple-600 to-pink-600",
    description: "Free & relaxation day — optional activities",
  },
  DEPARTURE: {
    label: "Departure",
    emoji: "🏠",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    headerBg: "bg-gradient-to-r from-rose-600 to-red-600",
    description: "Last day — check-out and head home",
  },
};

export interface MealEntry {
  included: boolean;
  diningPointId?: number | null;
  venueName?: string;
  notes?: string;
}

export interface DiningStop {
  diningPointId: number;
  mealType: MealType;
  venueName?: string;
  notes?: string;
}

export interface ItineraryDay {
  day: number;
  dayType?: DayType;         // NEW — defaults to SIGHTSEEING if undefined (backward compat)
  title: string;
  description: string;
  // ── Location ──────────────────────────────────────────────────────────────
  location: string;          // SIGHTSEEING / ARRIVAL / LEISURE / DEPARTURE: single city
  fromCity?: string;         // TRANSIT: journey origin (e.g. "Delhi")
  toCity?: string;           // TRANSIT: journey destination (e.g. "Manali")
  // ── Accommodation ─────────────────────────────────────────────────────────
  accommodation: string;
  // ── Meals ─────────────────────────────────────────────────────────────────
  meals: Partial<Record<MealType, MealEntry>> | string[];
  // ── Attractions & Activities ───────────────────────────────────────────────
  attractionIds: number[];
  activities: string[];
  diningStops: DiningStop[];
  // ── Transport ─────────────────────────────────────────────────────────────
  transport?: string;
}

export interface HotelInfo {
  city: string;
  hotelName: string;
  category: string;
  nights: number;
  roomType: string;
  imageUrl?: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}
