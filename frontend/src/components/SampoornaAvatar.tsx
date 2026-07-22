import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface SampoornaAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
}

export default function SampoornaAvatar({ className, size = "md", online = true }: SampoornaAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  return (
    <div className={cn("relative shrink-0 select-none", sizeClasses[size], className)}>
      <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-[#1B3A6B] p-[2px] shadow-md transition-all hover:scale-105 overflow-hidden">
        <div className="w-full h-full rounded-full bg-[#102447] overflow-hidden flex items-center justify-center relative">
          {!imgError ? (
            <img
              src="/Sampoorna-Image.webp"
              alt="Sampoorna Concierge"
              className="w-full h-full object-cover rounded-full"
              onError={() => setImgError(true)}
            />
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="50" fill="#1E3A8A" />
              <ellipse cx="50" cy="52" rx="22" ry="24" fill="#FCE7F3" />
              <ellipse cx="39" cy="50" rx="3.5" ry="4" fill="#1E293B" />
              <ellipse cx="61" cy="50" rx="3.5" ry="4" fill="#1E293B" />
              <path d="M 42 61 Q 50 67 58 61" fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
      )}
    </div>
  );
}
