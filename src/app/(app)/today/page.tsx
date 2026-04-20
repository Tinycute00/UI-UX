import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SCurve, type SCurvePoint } from "@/components/charts/SCurve";
import { NavIcon, IconBell, IconSun, IconWarning } from "@/components/icons";
import { NAV } from "@/lib/navigation";

export const metadata = { title: "今日工作" };

// MOCK 資料 — 在 Supabase 接上前提供可視化。
const MOCK_SCURVE: SCurvePoint[] = [
  { date: "W1", planned: 5, actual: 4 },
  { date: "W2", planned: 12, actual: 11 },
  { date: "W3", planned: 22, actual: 18 },
  { date: "W4", planned: 35, actual: 30 },
  { date: "W5", planned: 48, actual: 40 },
  { date: "W6", planned: 60, actual: 54 },
  { date: "W7", planned: 72, actual: 65 },
  { date: "W8", planned: 82, actual: 76 },
];

const QUICK_ACTIONS = [
  { href: "/morning-meeting", label: "填寫早報", iconKey: "morning" as const, tone: "brand" },
  { href: "/daily-log", label: "填寫日誌", iconKey: "daily" as const, tone: "brand" },
  { href: "/upload", label: "上傳照片", iconKey: "upload" as const, tone: "brand" },
  { href: "/qc", label: "品管檢驗", iconKey: "qc" as const, tone: "brand" },
  { href: "/safety", label: "職安巡檢", iconKey: "safety" as const, tone: "brand" },
  { href: "/materials", label: "材料驗收", iconKey: "material" as const, tone: "brand" },
];

const REMINDERS = [
  { level: "danger", title: "今日未填寫早報會議", href: "/morning-meeting" },
  { level: "warn", title: "材料 A-001 驗收單待主任簽核", href: "/materials" },
  { level: "brand", title: "明日（4/21）排定混凝土澆置", href: "/wbs" },
];

export default function TodayPage() {
  const today = new Date();
  const dateLabel = today.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const navByKey = new Map(NAV.map((n) => [n.iconKey, n]));

  return (
    <div className="flex flex-col gap-6">
      {/* Hero：日期 + 天氣 */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <div className="text-base text-ink-muted">今日</div>
            <div className="text-2xl font-bold text-ink lg:text-3xl">{dateLabel}</div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-brand-50 px-5 py-3 text-brand-700">
            <IconSun size={32} />
            <div>
              <div className="text-base font-semibold">晴時多雲</div>
              <div className="text-2xl font-bold">28°C</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 提醒事項 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconBell />
            <CardTitle>提醒事項</CardTitle>
          </div>
          <CardDescription>今日需處理的待辦事項與異常通知</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {REMINDERS.map((r) => (
              <li key={r.title}>
                <Link
                  href={r.href}
                  className="flex items-center justify-between gap-3 rounded-xl border-2 border-surface-border bg-white px-4 py-4 text-lg font-semibold text-ink hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="flex items-center gap-3">
                    <IconWarning
                      className={
                        r.level === "danger"
                          ? "text-danger-600"
                          : r.level === "warn"
                            ? "text-warn-600"
                            : "text-brand-600"
                      }
                    />
                    <span>{r.title}</span>
                  </span>
                  <Badge tone={r.level as "danger" | "warn" | "brand"}>前往處理</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 今日快速入口 */}
      <Card>
        <CardHeader>
          <CardTitle>今日作業</CardTitle>
          <CardDescription>一鍵進入每日必填表單，自動更新 S-Curve 進度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_ACTIONS.map((a) => {
              const nav = navByKey.get(a.iconKey);
              return (
                <Button
                  key={a.href}
                  asChild
                  variant="secondary"
                  size="lg"
                  className="h-auto flex-col gap-2 py-6"
                >
                  <Link href={a.href} aria-label={nav?.label ?? a.label}>
                    <NavIcon iconKey={a.iconKey} size={36} />
                    <span className="text-lg font-semibold">{a.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* S-Curve */}
      <Card>
        <CardHeader>
          <CardTitle>專案進度 S-Curve</CardTitle>
          <CardDescription>
            所有數據均自動來自日常作業表單（工項加權平均），不允許手動填報
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SCurve data={MOCK_SCURVE} />
        </CardContent>
      </Card>
    </div>
  );
}
