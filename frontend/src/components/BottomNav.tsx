"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Compass, User, Hotel } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Packages", icon: Compass, href: "/packages" },
  { label: "Plan Trip", icon: Compass, href: "/customized-holidays", primary: true },
  { label: "Hotels", icon: Hotel, href: "/hotels" },
  { label: "Profile", icon: User, href: "/login" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const [scrollRotation, setScrollRotation] = useState(0);

  useEffect(() => {
    setClickedItem(null);
  }, [pathname]);

  // Rotate Compass clockwise according to page scroll
  useEffect(() => {
    const handleScroll = () => {
      const rotation = window.scrollY / 2; // Smooth 1 deg per 2px scroll
      setScrollRotation(rotation);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @keyframes conic-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-conic-spin {
          animation: conic-rotate 4s linear infinite;
        }
      `}</style>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-[100] pb-safe">
        {/* Precise 5-column grid layout for mathematically perfect spacing */}
        <div className="grid grid-cols-5 h-16 items-center justify-items-center px-1">
          {NAV_ITEMS.map((item) => {
            const isActive = clickedItem ? clickedItem === item.href : pathname === item.href;
            
            const prefetchRoute = () => {
              if (item.href.startsWith("/")) {
                router.prefetch(item.href);
              }
            };

            const handleNavClick = () => {
              if (item.href.startsWith("/")) {
                setClickedItem(item.href);
              }
            };

            if (item.primary) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleNavClick}
                  onTouchStart={prefetchRoute}
                  onMouseEnter={prefetchRoute}
                  className="flex flex-col items-center justify-center -mt-7 z-10"
                >
                  {/* Conic RGB outer ring with smooth slow 360 degree rotation */}
                  <div className="relative w-13 h-13 rounded-full overflow-hidden flex items-center justify-center shadow-md shadow-accent/20">
                    <div className="absolute inset-0 w-[150%] h-[150%] -left-[25%] -top-[25%] bg-[conic-gradient(from_0deg,#ff007f,#00f2fe,#4facfe,#ff007f)] animate-conic-spin" />
                    
                    {/* Inner navy blue container — inset reduced to 1.5px for thin border */}
                    <div className="absolute inset-[1.5px] rounded-full bg-primary flex items-center justify-center z-10">
                      <item.icon 
                        className="w-6 h-6 text-accent transition-transform duration-100 ease-out" 
                        style={{ transform: `rotate(${scrollRotation}deg)` }}
                      />
                    </div>
                  </div>
                  <span className="text-[8.5px] font-black mt-0.5 text-slate-600 uppercase tracking-tighter">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleNavClick}
                onTouchStart={prefetchRoute}
                onMouseEnter={prefetchRoute}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full transition-all active:scale-95",
                  isActive ? "text-primary" : "text-slate-400"
                )}
              >
                <item.icon className={cn("w-6 h-6 mb-0.5", isActive && "stroke-[2.5px]")} />
                <span className={cn(
                  "text-[8.5px] font-black uppercase tracking-tighter",
                  isActive ? "text-primary" : "text-slate-500"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
