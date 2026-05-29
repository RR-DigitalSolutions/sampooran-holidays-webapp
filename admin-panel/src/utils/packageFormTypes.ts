// ─── Shared helpers reused by PackageForm ─────────────────────────────────────
const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:8080/api";

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
  title: string;
  description: string;
  location: string;
  accommodation: string;
  meals: Partial<Record<MealType, MealEntry>> | string[];
  attractionIds: number[];
  diningStops: DiningStop[];
  activities: string[];
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
