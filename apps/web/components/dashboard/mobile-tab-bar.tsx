"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Package,
  Settings2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/spending", label: "Spending", icon: TrendingUp },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/shipping", label: "Shipping", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

/**
 * Fixed bottom navigation for mobile. Five tabs across, active tab gets the
 * violet color + a small dot above the icon. Includes safe-area padding so
 * it doesn't sit behind the iOS home indicator.
 */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {TABS.map((tab) => {
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-transform duration-150 ease-out active:scale-95",
              active ? "text-primary" : "text-muted-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            {active && (
              <span
                aria-hidden
                className="size-1 rounded-full bg-primary shadow-[0_0_6px_rgba(167,139,250,0.7)]"
              />
            )}
            <Icon
              className={cn("size-5", active ? "stroke-[2.4]" : "stroke-2")}
            />
            <span className="font-display text-[9px] font-semibold uppercase tracking-[0.16em]">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
