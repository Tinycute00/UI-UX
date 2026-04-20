import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/BackButton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "日誌明細" };
export const dynamic = "force-dynamic";

type DailyLogDetail = {
  id: string;
  log_date: string;
  weather: string | null;
  temperature: number | null;
  headcount: number;
  daily_wage: number | null;
  completed_wbs_ids: string[];
  work_content: string | null;
  tomorrow_plan: string | null;
  anomalies: string | null;
  status: string;
  created_at: string;
};

type PhotoRow = {
  id: string;
  url: string;
  thumb_url: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  taken_at: string | null;
};

export default async function DailyLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let log: DailyLogDetail | null = null;
  let photos: PhotoRow[] = [];
  const wbsNames: Record<string, string> = {};

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("daily_logs")
      .select(
        "id, log_date, weather, temperature, headcount, daily_wage, completed_wbs_ids, work_content, tomorrow_plan, anomalies, status, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    log = (data as DailyLogDetail) ?? null;

    if (log) {
      const { data: ph } = await supabase
        .from("photos")
        .select("id, url, thumb_url, gps_lat, gps_lng, taken_at")
        .eq("linked_type", "daily_log")
        .eq("linked_id", id);
      photos = (ph ?? []) as PhotoRow[];

      if (log.completed_wbs_ids && log.completed_wbs_ids.length > 0) {
        const { data: wbs } = await supabase
          .from("wbs")
          .select("id, code, name")
          .in("id", log.completed_wbs_ids);
        for (const w of (wbs ?? []) as { id: string; code: string; name: string }[]) {
          wbsNames[w.id] = `${w.code} ${w.name}`;
        }
      }
    }
  } catch {
    /* graceful */
  }

  if (!log) return notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton fallbackHref="/daily-log" />
        <Badge tone={log.status === "approved" ? "success" : "brand"}>
          {log.status === "approved" ? "已核准" : log.status === "submitted" ? "已提交" : "草稿"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{log.log_date} 施工日誌</CardTitle>
          <CardDescription>建立於 {new Date(log.created_at).toLocaleString("zh-TW")}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-lg md:grid-cols-4">
          <div>
            <div className="text-base text-ink-muted">天氣</div>
            <div className="font-bold">{log.weather || "—"}</div>
          </div>
          <div>
            <div className="text-base text-ink-muted">溫度</div>
            <div className="font-bold">{log.temperature ?? "—"} °C</div>
          </div>
          <div>
            <div className="text-base text-ink-muted">出工</div>
            <div className="font-bold">{log.headcount} 人</div>
          </div>
          <div>
            <div className="text-base text-ink-muted">工資率</div>
            <div className="font-bold">
              {log.daily_wage ? `${log.daily_wage.toLocaleString()} 元` : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>完成工項</CardTitle>
        </CardHeader>
        <CardContent>
          {log.completed_wbs_ids && log.completed_wbs_ids.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {log.completed_wbs_ids.map((wid) => (
                <li
                  key={wid}
                  className="rounded-xl border-2 border-surface-border bg-white px-4 py-3 text-lg"
                >
                  {wbsNames[wid] ?? wid}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-ink-muted">（無勾選工項）</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>工作內容</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-lg leading-relaxed">
          <section>
            <h3 className="mb-1 font-bold">今日施作</h3>
            <p className="whitespace-pre-wrap">{log.work_content || "—"}</p>
          </section>
          {log.tomorrow_plan ? (
            <section>
              <h3 className="mb-1 font-bold">明日計畫</h3>
              <p className="whitespace-pre-wrap">{log.tomorrow_plan}</p>
            </section>
          ) : null}
          {log.anomalies ? (
            <section>
              <h3 className="mb-1 font-bold text-warn-700">異常狀況</h3>
              <p className="whitespace-pre-wrap">{log.anomalies}</p>
            </section>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>現場照片 ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-base text-ink-muted">（尚無照片）</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((p) => (
                <li key={p.id} className="overflow-hidden rounded-xl border-2 border-surface-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumb_url || p.url}
                    alt="site"
                    className="block aspect-square w-full object-cover"
                  />
                  {p.gps_lat && p.gps_lng ? (
                    <a
                      href={`https://www.google.com/maps?q=${p.gps_lat},${p.gps_lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate px-2 py-1 text-sm text-brand-700 underline"
                    >
                      {p.gps_lat.toFixed(5)}, {p.gps_lng.toFixed(5)}
                    </a>
                  ) : (
                    <p className="truncate px-2 py-1 text-sm text-ink-muted">
                      {p.taken_at ? new Date(p.taken_at).toLocaleString("zh-TW") : "無 GPS"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button asChild variant="secondary" size="lg">
          <Link href="/daily-log">返回列表</Link>
        </Button>
      </div>
    </div>
  );
}
