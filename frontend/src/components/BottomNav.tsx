"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Sparkles, Phone, User, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Packages", icon: Compass, href: "/packages" },
  { label: "Plan Trip", icon: Sparkles, href: "/customized-holidays", primary: true },
  { label: "Call", icon: Phone, href: "tel:+918595513009" },
  { label: "Profile", icon: User, href: "/login" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-[100] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          
          if (item.primary) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-8"
              >
                <div className="w-14 h-14 bg-accent text-accent-foreground rounded-full flex items-center justify-center shadow-lg shadow-accent/40 border-4 border-white transition-transform active:scale-90">
                  <item.icon className="w-6 h-6" />
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
  );
}
