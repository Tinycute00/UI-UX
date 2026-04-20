import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export default async function AppShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 嘗試載入使用者資料（未設定 Supabase 時不阻塞）
  let userName: string | undefined;
  let userRole: UserRole | undefined;
  let projectName: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .maybeSingle();
      userName =
        (profile?.name as string | undefined) ?? user.email ?? "使用者";
      userRole = (profile?.role as UserRole | undefined) ?? undefined;

      const { data: proj } = await supabase
        .from("projects")
        .select("name")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      projectName = proj?.name ?? undefined;
    }
  } catch {
    /* dev mode: supabase 未設定，畫面仍可運作 */
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        userName={userName}
        userRole={userRole}
        projectName={projectName}
      />
      <OfflineBanner />
      <div className="flex flex-1">
        <Sidebar userRole={userRole} />
        <main className="flex-1 pb-28 lg:pb-10">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
