"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  TrendingUp,
  Store,
  ShoppingBag,
  Package,
  Settings2,
  LogOut,
  ShoppingCart,
  Search,
  Bell,
  HelpCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";

const primaryNav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/spending", label: "Spending", icon: TrendingUp },
  { href: "/sellers", label: "Sellers", icon: Store },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/shipping", label: "Shipping", icon: Package },
];

const footerNav = [{ href: "/settings", label: "Settings", icon: Settings2 }];

interface DashboardShellProps {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onSelect,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onSelect?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={[
        "group relative flex items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors duration-150 ease-out",
        active
          ? "text-primary bg-primary/5"
          : "text-muted-foreground hover:text-foreground hover:bg-card/60",
      ].join(" ")}
    >
      {active && (
        <span
          aria-hidden
          className="absolute right-0 top-0 h-full w-0.5 bg-primary"
        />
      )}
      <Icon className="size-4 shrink-0" strokeWidth={2} />
      <span>{label}</span>
    </Link>
  );
}

function NavList({
  pathname,
  onSelect,
}: {
  pathname: string;
  onSelect?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 px-3 space-y-1">
        {primaryNav.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(pathname, item.href)}
            onSelect={onSelect}
          />
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {footerNav.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(pathname, item.href)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  );
}

function SidebarLogo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex items-center gap-2.5 px-6 py-7 border-b border-sidebar-border"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30 shrink-0">
        <ShoppingCart className="size-4 text-primary" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-bold tracking-tight text-foreground">ali-sum</span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
          Order Analytics
        </span>
      </div>
    </Link>
  );
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();

  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const firstName =
    (user.name || user.email || "User").split(/[\s@]+/)[0] || "User";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-sidebar border-r border-sidebar-border z-30">
        <SidebarLogo />

        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <NavList pathname={pathname} />
        </div>

        {/* User pill at bottom */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-card/60 transition-colors duration-150 outline-none">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">
                  {firstName}
                </p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-primary/80 truncate">
                  Pro Tier
                </p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              sideOffset={8}
              className="w-52"
            >
              <DropdownMenuItem
                className="text-xs text-muted-foreground"
                disabled
              >
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings" className="w-full">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="size-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0 md:pl-60">
        {/* Desktop topbar */}
        <header className="hidden md:flex sticky top-0 z-40 h-14 items-center gap-4 border-b border-border bg-card/80 px-6 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search orders, sellers, tracking…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary ring-2 ring-card" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              aria-label="Help"
            >
              <HelpCircle className="size-4" />
            </button>
            <div className="ml-2 hidden items-center gap-2.5 border-l border-border pl-4 lg:flex">
              <div className="text-right leading-tight">
                <p className="text-xs font-semibold text-foreground">
                  {firstName}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                  Pro Tier
                </p>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Mobile header — logo + avatar dropdown only; nav is the bottom tab bar */}
        <header className="md:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur pt-[env(safe-area-inset-top)]">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                <ShoppingCart className="size-3.5 text-primary" />
              </div>
              <span className="font-bold tracking-tight text-base text-primary">
                ali-sum
              </span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 rounded-full p-0 outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-xs text-muted-foreground"
                  disabled
                >
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="w-full">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pt-6 pb-24 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
