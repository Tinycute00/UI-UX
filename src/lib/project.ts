/**
 * 目前專案快取（MVP：取最新一個；未來可擴為專案切換器）
 */
import { createClient } from "@/lib/supabase/client";

let cached: { id: string; name: string } | null = null;

export async function getActiveProject(): Promise<{ id: string; name: string } | null> {
  if (cached) return cached;
  const supabase = createClient();
  try {
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.id) {
      cached = { id: data.id as string, name: data.name as string };
      return cached;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearActiveProjectCache() {
  cached = null;
}
