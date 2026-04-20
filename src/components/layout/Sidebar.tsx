"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/navigation";
import { NavIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/supabase/types";

export function Sidebar({ userRole }: { userRole?: UserRole }) {
  const pathname = usePathname();

  // 依角色過濾
  const visible = NAV.filter(
    (n) => !n.allowedRoles || (userRole && n.allowedRoles.includes(userRole)),
  );

  // 分組
  const groups = visible.reduce<Record<string, typeof visible>>((acc, n) => {
    const key = n.group ?? "其他";
    (acc[key] ||= []).push(n);
    return acc;
  }, {});

  return (
    <aside className="hidden lg:flex sticky top-20 h-[calc(100vh-5rem)] w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r-2 border-surface-border bg-white px-4 py-6">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className="flex flex-col gap-1">
          <div className="px-3 py-2 text-sm font-bold uppercase tracking-wider text-ink-muted">
            {group}
          </div>
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-lg font-semibold transition-colors min-h-touch",
                  active
                    ? "bg-brand-600 text-white shadow-card"
                    : "text-ink hover:bg-surface-muted",
                )}
              >
                <NavIcon iconKey={item.iconKey} size={28} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
