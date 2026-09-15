import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

export async function fetchPackageRouteData<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { next: { revalidate: 120 } });
  if (!response.ok) notFound();
  return response.json();
}

export function titleCaseSlug(value: string): string {
  return value.replace(/-/g, " ").replace(/\b\w/g, character => character.toUpperCase());
}