import { BackButton } from "@/components/layout/BackButton";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "施工日誌" };
export const dynamic = "force-dynamic";

type DailyLogRow = {
  id: string;
  log_date: string;
  weather: string | null;
  headcount: number;
  work_content: string | null;
  status: string;
};

export default async function DailyLogIndexPage() {
  let logs: DailyLogRow[] = [];
  let error: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error: err } = await supabase
      .from("daily_logs")
      .select("id, log_date, weather, headcount, work_content, status")
      .order("log_date", { ascending: false })
      .limit(30);
    if (err) throw err;
    logs = (data ?? []) as DailyLogRow[];
  } catch (e) {
    error = e instanceof Error ? e.message : "讀取失敗";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <Button asChild size="lg">
          <Link href="/daily-log/new">＋ 新增今日日誌</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>施工日誌</CardTitle>
          <CardDescription>
            每日開工狀況、人力、天候、完成工項。勾選工項後自動彙整至 S-Curve。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error ? (
            <div className="rounded-xl border-2 border-warn-500/40 bg-warn-50 px-4 py-3 text-base font-semibold text-warn-700">
              無法載入資料：{error}
              <p className="mt-1 text-sm font-normal text-ink-muted">
                （尚未設定 Supabase 或無登入時屬正常狀況）
              </p>
            </div>
          ) : null}

          {logs.length === 0 ? (
            <div className="rounded-xl bg-surface-muted p-6 text-center text-lg text-ink-muted">
              尚無日誌。點擊右上角「新增今日日誌」開始記錄。
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {logs.map((log) => (
                <li key={log.id}>
                  <Link
                    href={`/daily-log/${log.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border-2 border-surface-border bg-white px-5 py-4 hover:border-brand-400"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xl font-bold text-ink">{log.log_date}</span>
                      <span className="text-base text-ink-muted">
                        天氣：{log.weather || "—"} · 出工：{log.headcount} 人
                      </span>
                      {log.work_content ? (
                        <span className="line-clamp-1 text-base text-ink-muted">
                          {log.work_content}
                        </span>
                      ) : null}
                    </div>
                    <Badge tone={log.status === "approved" ? "success" : "brand"}>
                      {log.status === "approved"
                        ? "已核准"
                        : log.status === "submitted"
                          ? "已提交"
                          : "草稿"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
