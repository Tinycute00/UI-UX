"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_TABS } from "@/lib/navigation";
import { NavIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t-2 border-surface-border bg-white shadow-[0_-2px_8px_rgba(15,23,42,0.08)] kb-safe"
      aria-label="主要功能列"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {MOBILE_TABS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} className="contents">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-touch flex-col items-center justify-center gap-1 py-2 text-sm font-semibold",
                  active ? "text-brand-700" : "text-ink-muted",
                )}
              >
                <NavIcon iconKey={item.iconKey} size={26} />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
