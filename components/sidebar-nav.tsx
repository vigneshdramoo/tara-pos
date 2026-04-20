"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScrollText,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: Array<{
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: ShoppingBag },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ScrollText },
  { href: "/assistant", label: "AI Brief", icon: Sparkles },
];

export function SidebarNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

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
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "touch-target flex items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-all duration-150",
              active
                ? "bg-stone-950 text-stone-50 shadow-lg"
                : "text-stone-600 hover:bg-white/70 hover:text-stone-950",
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
