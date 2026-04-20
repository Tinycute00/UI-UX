"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconBell, IconLogout, IconMenu } from "@/components/icons";
import { AccessibilityBar } from "./AccessibilityBar";
import { MobileDrawer } from "./MobileDrawer";
import type { UserRole } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  userName?: string;
  userRole?: UserRole;
  projectName?: string;
}

const ROLE_LABEL: Record<UserRole, string> = {
  office_chief: "工務所主任",
  engineer: "工程師",
  qc_inspector: "品管人員",
  safety_officer: "職安人員",
  admin_staff: "行政人員",
};

export function Header({
  userName = "訪客",
  userRole,
  projectName = "—",
}: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* noop */
    }
    router.replace("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-surface-border bg-white/95 backdrop-blur shadow-card">
        <div className="flex h-16 items-center gap-3 px-4 lg:h-20 lg:px-8">
          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="開啟選單"
            className="lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <IconMenu />
          </Button>

          {/* Logo / Title */}
          <Link
            href="/today"
            className="flex min-w-0 flex-1 items-center gap-3 text-ink hover:text-brand-700"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white font-bold">
              工
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xl font-bold lg:text-2xl">
                工務所管理系統
              </div>
              <div className="truncate text-base text-ink-muted">
                {projectName}
              </div>
            </div>
          </Link>

          <AccessibilityBar className="hidden md:flex" />

          {/* User info */}
          <div className="hidden items-center gap-3 rounded-xl bg-surface-muted px-4 py-2 lg:flex">
            <div className="text-right leading-tight">
              <div className="font-semibold text-ink">{userName}</div>
              {userRole ? (
                <div className="text-sm text-ink-muted">
                  {ROLE_LABEL[userRole]}
                </div>
              ) : null}
            </div>
          </div>

          <Button variant="ghost" size="icon" aria-label="通知">
            <IconBell />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="登出"
            onClick={handleLogout}
            className="hidden lg:inline-flex"
          >
            <IconLogout />
          </Button>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userName={userName}
        userRole={userRole}
        onLogout={handleLogout}
      />
    </>
  );
}
