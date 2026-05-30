import type { NextConfig } from "next";

// Derive backend origin from NEXT_PUBLIC_API_URL (e.g. "https://xxx.onrender.com/api" → "https://xxx.onrender.com")
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const BACKEND_URL = process.env.BACKEND_URL || apiUrl.replace(/\/api\/?$/, "") || "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests directly to the Express backend
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "*.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
