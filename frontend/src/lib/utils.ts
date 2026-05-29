import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateImageUrl(url: string | null | undefined): string {
  if (!url) return "/images/placeholder-packages.jpg";
  if (url.startsWith("http")) {
    if (url.includes("unsplash.com/photos/")) return "/images/placeholder-packages.jpg";
    return url;
  }
  return url.startsWith("/") ? url : "/images/placeholder-packages.jpg";
}

export function getYouTubeId(url: string | null | undefined) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
