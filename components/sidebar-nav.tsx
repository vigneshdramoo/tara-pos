"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KeyRound,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import type { StaffRole } from "@/lib/staff";
import { cn } from "@/lib/utils";

const baseNavItems: Array<{
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: ShoppingBag },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ScrollText },
  { href: "/assistant", label: "AI Brief", icon: Sparkles },
  { href: "/account", label: "Account", icon: KeyRound },
];

const managerNavItem = { href: "/staff", label: "Staff", icon: ShieldCheck } satisfies {
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
};

function isActivePath(pathname: string, href: Route) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  mobile = false,
  role = null,
}: {
  mobile?: boolean;
  role?: StaffRole | null;
}) {
  const pathname = usePathname();
  const navItems = role === "MANAGER" ? [...baseNavItems, managerNavItem] : baseNavItems;

  return (
    <nav
      className={cn(
        mobile
          ? "tara-surface scrollbar-hidden flex items-center gap-2 overflow-x-auto p-2 lg:hidden"
          : "hidden flex-col gap-2 lg:flex",
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "touch-target flex items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-all duration-150",
              active
                ? "tara-panel-dark shadow-lg"
                : "text-[var(--muted)] hover:bg-white/70 hover:text-[var(--brand-midnight)]",
              mobile && "min-w-fit whitespace-nowrap",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
