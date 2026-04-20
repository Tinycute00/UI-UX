/**
 * Supabase Browser Client
 * 使用於 Client Components（"use client"）
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Dev 友善：缺環境變數時不崩潰，改回傳 stub。
    // 生產環境必須設定，否則所有資料操作會失敗。
    // eslint-disable-next-line no-console
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 未設定，登入/資料功能將無法運作。",
    );
  }

  return createBrowserClient(url ?? "http://localhost:54321", key ?? "public-anon-placeholder");
}
