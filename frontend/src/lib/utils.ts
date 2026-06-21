import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSvgPlaceholder(width: number, height: number, ratioLabel: string): string {
  const minDim = Math.min(width, height);
  const padding = minDim * 0.05;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  
  const centerX = width / 2;
  const centerY = height / 2;
  
  const titleSize = Math.max(10, Math.floor(minDim * 0.045));
  const descSize = Math.max(8, Math.floor(minDim * 0.028));
  const badgeTextSize = Math.max(9, Math.floor(minDim * 0.03));
  
  const iconSize = Math.max(20, Math.floor(minDim * 0.08));
  
  const iconY = centerY - minDim * 0.12;
  const titleY = centerY + minDim * 0.08;
  const descY = titleY + minDim * 0.06;
  const badgeY = descY + minDim * 0.12;
  
  const badgeWidth = Math.max(140, Math.min(width - padding * 2, minDim * 0.6));
  const badgeHeight = Math.max(22, Math.min(height * 0.08, 38));
  
  const cropLen = Math.max(12, minDim * 0.06);

  const gridLines: string[] = [];
  const divisions = 4;
  for (let i = 1; i < divisions; i++) {
    const x = (width / divisions) * i;
    const y = (height / divisions) * i;
    gridLines.push(`M ${x} 0 L ${x} ${height}`);
    gridLines.push(`M 0 ${y} L ${width} ${y}`);
  }
  const gridPath = gridLines.join(" ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bgGrad-${width}-${height}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#1e2640" />
    </linearGradient>
    <filter id="glow-${width}-${height}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGrad-${width}-${height})" />
  <path d="${gridPath}" stroke="#1e293b" stroke-width="0.75" stroke-dasharray="3 3" opacity="0.3" />
  <rect x="${padding}" y="${padding}" width="${innerW}" height="${innerH}" rx="12" fill="none" stroke="#232d4b" stroke-width="1.5" stroke-dasharray="4 4" />
  <path d="M ${padding + cropLen} ${padding} L ${padding} ${padding} L ${padding} ${padding + cropLen}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
  <path d="M ${width - padding - cropLen} ${padding} L ${width - padding} ${padding} L ${width - padding} ${padding + cropLen}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
  <path d="M ${padding + cropLen} ${height - padding} L ${padding} ${height - padding} L ${padding} ${height - padding - cropLen}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
  <path d="M ${width - padding - cropLen} ${height - padding} L ${width - padding} ${height - padding} L ${width - padding} ${height - padding - cropLen}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
  <g transform="translate(${centerX}, ${iconY})" filter="url(#glow-${width}-${height})">
    <circle cx="0" cy="0" r="${iconSize}" fill="#020617" stroke="#38bdf8" stroke-width="1.5" />
    <path d="M -9 -7 C -9 -7.5 -8.5 -8 -8 -8 L -4 -8 C -3.5 -8 -3 -7.5 -3 -7 L -2 -4 L 2 -4 L 3 -7 C 3 -7.5 3.5 -8 4 -8 L 8 -8 C 8.5 -8 9 -7.5 9 -7 L 11 -2 C 11.5 -1 11 1 10 2 C 9 3 7 3.5 7 3.5 L -7 3.5 C -7 3.5 -9 3 -10 2 C -11 1 -11.5 -1 -11 -2 Z" fill="none" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round" transform="scale(1.2)" />
    <circle cx="0" cy="1" r="4" fill="none" stroke="#38bdf8" stroke-width="1.5" />
  </g>
  <text x="50%" y="${titleY}" font-family="'Outfit', 'Inter', system-ui, -apple-system, sans-serif" font-size="${titleSize}" fill="#ffffff" font-weight="800" letter-spacing="1.5" text-anchor="middle" dominant-baseline="middle">PHOTO REQUIRED</text>
  <text x="50%" y="${descY}" font-family="'Inter', system-ui, -apple-system, sans-serif" font-size="${descSize}" fill="#6b7280" font-weight="600" text-anchor="middle" dominant-baseline="middle">Vendor Guide: Ratio ${ratioLabel}</text>
  <g transform="translate(${centerX}, ${badgeY})">
    <rect x="-${badgeWidth / 2}" y="-${badgeHeight / 2}" width="${badgeWidth}" height="${badgeHeight}" rx="${badgeHeight / 2}" fill="#020617" stroke="#38bdf8" stroke-width="1.5" />
    <text x="0" y="0" font-family="'Outfit', 'Inter', system-ui, -apple-system, sans-serif" font-size="${badgeTextSize}" fill="#38bdf8" font-weight="800" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.5">${width} × ${height} px</text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Trusted image hosts — allow any HTTPS image from reputable CDNs */
const TRUSTED_HOSTS = [
  "res.cloudinary.com",
  "cloudinary.com",
  "images.unsplash.com",
  "plus.unsplash.com",
  "lh3.googleusercontent.com",
  "storage.googleapis.com",
  "cdn.pixabay.com",
  "images.pexels.com",
];

/** Junk/placeholder domains to always reject */
const BLOCKED_HOSTS = [
  "example.com",
  "placeholder.com",
  "via.placeholder.com",
  "dummyimage.com",
  "skyscnr.com",         // scraped third-party, not licensed
  "unsplash.com",        // unsplash.com photo pages (not CDN) — block page URLs, allow CDN above
];

export function validateImageUrl(
  url: string | null | undefined,
  width: number = 800,
  height: number = 600,
  ratioLabel: string = "4:3"
): string {
  const fallback = generateSvgPlaceholder(width, height, ratioLabel);
  if (!url || url.trim() === "") return fallback;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("/")) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // Always block known junk domains
    if (BLOCKED_HOSTS.some(b => host === b || host.endsWith(`.${b}`))) return fallback;

    // Allow localhost / local dev
    if (host === "localhost" || host === "127.0.0.1") return url;

    // Allow explicitly trusted CDN hosts
    if (TRUSTED_HOSTS.some(t => host === t || host.endsWith(`.${t}`))) return url;

    // Allow any Cloudinary subdomain (e.g. res.cloudinary.com)
    if (host.includes("cloudinary.com")) return url;

    // Block non-HTTPS in production
    if (parsed.protocol !== "https:") return fallback;

    // Allow any remaining HTTPS image URL (vendor may use their own CDN)
    return url;
  } catch {
    return fallback;
  }
}

export function getHotelImageUrl(
  url: string | null | undefined,
  width: number = 800,
  height: number = 600,
  ratioLabel: string = "4:3"
): string {
  return validateImageUrl(url, width, height, ratioLabel);
}

export function getYouTubeId(url: string | null | undefined) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
