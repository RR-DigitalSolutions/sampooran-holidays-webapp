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

  useEffect(() => {
    setClickedItem(null);
  }, [pathname]);

  return (
    <>
      <style>{`
        @keyframes rgb-glow-border {
          0% {
            border-color: #ff007f;
            box-shadow: 0 0 12px rgba(255, 0, 127, 0.6);
          }
          33% {
            border-color: #00f2fe;
            box-shadow: 0 0 12px rgba(0, 242, 254, 0.6);
          }
          66% {
            border-color: #4facfe;
            box-shadow: 0 0 12px rgba(79, 172, 254, 0.6);
          }
          100% {
            border-color: #ff007f;
            box-shadow: 0 0 12px rgba(255, 0, 127, 0.6);
          }
        }
        .animate-rgb-glow {
          animation: rgb-glow-border 3s linear infinite;
        }
      `}</style>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-[100] pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
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
                  className="flex flex-col items-center justify-center -mt-8"
                >
                  {/* Central Button: Brand Blue (bg-primary), text-accent icon, and animate-rgb-glow border */}
                  <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center border-4 transition-transform active:scale-90 animate-rgb-glow">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-slate-600 uppercase tracking-tighter">
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
                <item.icon className={cn("w-5 h-5 mb-1", isActive && "stroke-[2.5px]")} />
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tighter",
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
