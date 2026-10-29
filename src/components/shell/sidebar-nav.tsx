"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { useRole } from "./role-context";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2 py-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
        <HeartHandshake aria-hidden className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-ink">CampusCare</span>
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role } = useRole();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-primary-tint text-primary-strong" : "text-ink-soft hover:bg-background hover:text-ink"
            }`}
          >
            <Icon aria-hidden className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
