import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-br from-brand-50 to-surface-muted px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-2 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-3xl font-bold text-white">
            工
          </div>
          <CardTitle className="text-3xl">工務所管理系統</CardTitle>
          <CardDescription>公共工程甲級營造廠 · 現場作業平台</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="py-8 text-center text-base text-ink-muted">載入中...</div>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
