"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/navigation";
import { NavIcon, IconClose, IconLogout } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { AccessibilityBar } from "./AccessibilityBar";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/supabase/types";

const ROLE_LABEL: Record<UserRole, string> = {
  office_chief: "工務所主任",
  engineer: "工程師",
  qc_inspector: "品管人員",
  safety_officer: "職安人員",
  admin_staff: "行政人員",
};

export function MobileDrawer({
  open,
  onClose,
  userName,
  userRole,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: UserRole;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const visible = NAV.filter(
    (n) => !n.allowedRoles || (userRole && n.allowedRoles.includes(userRole)),
  );

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          "lg:hidden fixed inset-0 z-50 bg-ink/50 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="主選單"
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 flex w-[84vw] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b-2 border-surface-border p-4">
          <div className="min-w-0">
            <div className="text-xl font-bold text-ink">{userName ?? "訪客"}</div>
            {userRole ? (
              <div className="text-base text-ink-muted">
                {ROLE_LABEL[userRole]}
              </div>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="關閉選單"
            onClick={onClose}
          >
            <IconClose />
          </Button>
        </div>

        <div className="border-b-2 border-surface-border p-4">
          <AccessibilityBar />
        </div>

        <nav className="flex-1 p-3">
          <ul className="flex flex-col gap-1">
            {visible.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-4 text-lg font-semibold min-h-touch",
                      active
                        ? "bg-brand-600 text-white"
                        : "text-ink hover:bg-surface-muted",
                    )}
                  >
                    <NavIcon iconKey={item.iconKey} size={28} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t-2 border-surface-border p-4">
          <Button
            variant="secondary"
            size="lg"
            block
            onClick={onLogout}
            className="gap-2"
          >
            <IconLogout />
            <span>登出</span>
          </Button>
        </div>
      </div>
    </>
  );
}
