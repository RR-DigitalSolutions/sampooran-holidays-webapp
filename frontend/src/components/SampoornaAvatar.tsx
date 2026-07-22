import React from "react";
import { cn } from "@/lib/utils";

interface SampoornaAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
}

export default function SampoornaAvatar({ className, size = "md", online = true }: SampoornaAvatarProps) {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  return (
    <div className={cn("relative shrink-0 select-none", sizeClasses[size], className)}>
      {/* Cute Concierge Girl Avatar SVG */}
      <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-[#1B3A6B] p-[2px] shadow-md transition-all hover:scale-105">
        <div className="w-full h-full rounded-full bg-[#102447] overflow-hidden flex items-center justify-center relative">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Soft Warm Background */}
            <circle cx="50" cy="50" r="50" fill="url(#bgGrad)" />
            <defs>
              <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E3A8A" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E1E24" />
                <stop offset="100%" stopColor="#2A1B12" />
              </linearGradient>
            </defs>

            {/* Hair Back */}
            <path d="M 22 45 C 18 20, 82 20, 78 45 C 80 65, 78 80, 75 90 L 25 90 C 22 80, 20 65, 22 45 Z" fill="url(#hairGrad)" />

            {/* Shoulders / Uniform */}
            <path d="M 18 92 C 18 72, 82 72, 82 92 L 82 100 L 18 100 Z" fill="#1B3A6B" />
            <path d="M 40 75 L 50 88 L 60 75 L 50 100 Z" fill="#F59E0B" /> {/* Gold Scarf */}

            {/* Face */}
            <ellipse cx="50" cy="52" rx="22" ry="24" fill="#FCE7F3" />
            <ellipse cx="50" cy="53" rx="21" ry="23" fill="#FDF2F8" />

            {/* Cute Cheeks */}
            <ellipse cx="36" cy="58" rx="4" ry="2.5" fill="#F472B6" opacity="0.5" />
            <ellipse cx="64" cy="58" rx="4" ry="2.5" fill="#F472B6" opacity="0.5" />

            {/* Sparkly Eyes */}
            <ellipse cx="39" cy="50" rx="3.5" ry="4" fill="#1E293B" />
            <ellipse cx="61" cy="50" rx="3.5" ry="4" fill="#1E293B" />
            <circle cx="40.5" cy="48.5" r="1.2" fill="#FFFFFF" />
            <circle cx="62.5" cy="48.5" r="1.2" fill="#FFFFFF" />

            {/* Friendly Smile */}
            <path d="M 42 61 Q 50 67 58 61" fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />

            {/* Hair Front / Bangs */}
            <path d="M 28 42 C 30 25, 70 25, 72 42 C 65 32, 58 35, 50 38 C 42 35, 35 32, 28 42 Z" fill="url(#hairGrad)" />

            {/* Cute Concierge Cap / Headset */}
            <path d="M 28 32 C 30 18, 70 18, 72 32 L 74 36 L 26 36 Z" fill="#1B3A6B" />
            <rect x="25" y="33" width="50" height="4" rx="2" fill="#F59E0B" />
            {/* Tiny Golden Star Badge on Cap */}
            <polygon points="50,22 52,27 57,27 53,30 55,35 50,32 45,35 47,30 43,27 48,27" fill="#FBBF24" />

            {/* Sleek Support Headset Microphone */}
            <path d="M 27 48 C 22 55, 22 68, 38 68" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <circle cx="39" cy="68" r="2.5" fill="#1E293B" />
          </svg>
        </div>
      </div>

      {/* Online Dot Badge */}
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
      )}
    </div>
  );
}
