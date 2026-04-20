"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, FormField } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message || "登入失敗，請檢查帳號密碼");
        return;
      }
      const next = search.get("next") || "/today";
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField label="帳號 / Email" required htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="例：chief@example.com"
        />
      </FormField>
      <FormField label="密碼" required htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </FormField>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border-2 border-danger-500/40 bg-danger-50 px-4 py-3 text-base font-semibold text-danger-700"
        >
          {error}
        </div>
      ) : null}
      <Button type="submit" size="lg" block disabled={loading}>
        {loading ? "登入中..." : "登入"}
      </Button>
      <p className="text-center text-base text-ink-muted">
        忘記密碼？請聯繫工務所主任或系統管理員
      </p>
    </form>
  );
}
