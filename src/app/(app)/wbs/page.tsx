import { BackButton } from "@/components/layout/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SCurve, type SCurvePoint } from "@/components/charts/SCurve";
import { createClient } from "@/lib/supabase/server";
import { WbsTree, type WbsNode } from "./WbsTree";

export const metadata = { title: "工項 / S-Curve" };
export const dynamic = "force-dynamic";

type WbsRow = {
  id: string;
  parent_id: string | null;
  code: string;
  name: string;
  weight: number;
  status: string;
  actual_progress: number;
  planned_start: string | null;
  planned_end: string | null;
};

type ScurveRow = { date: string; planned: number | null; actual: number | null };

function buildTree(rows: WbsRow[]): WbsNode[] {
  const map = new Map<string, WbsNode>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: WbsNode[] = [];
  rows.forEach((r) => {
    const node = map.get(r.id)!;
    if (r.parent_id && map.has(r.parent_id)) {
      map.get(r.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sort = (arr: WbsNode[]) => {
    arr.sort((a, b) => a.code.localeCompare(b.code));
    arr.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

export default async function WbsPage() {
  let projectId: string | null = null;
  let projectName: string | null = null;
  let tree: WbsNode[] = [];
  let curve: SCurvePoint[] = [];
  let totalWeight = 0;
  let overallProgress = 0;
  let error: string | null = null;

  try {
    const supabase = await createClient();
    const { data: proj } = await supabase
      .from("projects")
      .select("id, name")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    projectId = (proj?.id as string) ?? null;
    projectName = (proj?.name as string) ?? null;

    if (projectId) {
      const { data: rows, error: err } = await supabase
        .from("wbs")
        .select(
          "id, parent_id, code, name, weight, status, actual_progress, planned_start, planned_end",
        )
        .eq("project_id", projectId)
        .order("code");
      if (err) throw err;

      const list = (rows ?? []) as WbsRow[];
      tree = buildTree(list);

      const roots = list.filter((r) => !r.parent_id);
      totalWeight = roots.reduce((s, r) => s + Number(r.weight || 0), 0);
      overallProgress =
        roots.reduce(
          (s, r) => s + Number(r.weight || 0) * Number(r.actual_progress || 0),
          0,
        ) / Math.max(totalWeight, 1);

      const { data: curveData } = await supabase.rpc("scurve_series", {
        p_project: projectId,
      });
      curve = ((curveData ?? []) as ScurveRow[])
        .map((r) => ({
          date: r.date,
          planned: Number(r.planned ?? 0),
          actual: Number(r.actual ?? 0),
        }))
        // 取 30 天等距抽樣避免 X 軸過密
        .filter((_, i, arr) => arr.length <= 60 || i % Math.ceil(arr.length / 60) === 0);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "讀取失敗";
  }

  const fallbackCurve: SCurvePoint[] = [
    { date: "1月", planned: 8, actual: 7 },
    { date: "2月", planned: 20, actual: 18 },
    { date: "3月", planned: 38, actual: 32 },
    { date: "4月", planned: 58, actual: 48 },
    { date: "5月", planned: 75, actual: 68 },
    { date: "6月", planned: 90, actual: 82 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <h1 className="text-2xl font-bold text-ink lg:text-3xl">工項 / S-Curve</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>整體進度</CardTitle>
            <CardDescription>根 WBS 加權平均</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-brand-700">
              {overallProgress.toFixed(1)}%
            </div>
            <p className="mt-2 text-base text-ink-muted">
              {projectName ? `專案：${projectName}` : "尚未設定專案"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>根工項數</CardTitle>
            <CardDescription>總權重 {totalWeight.toFixed(1)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-ink">
              {tree.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>狀態提示</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {error ? (
              <Badge tone="warn">無法載入：{error}</Badge>
            ) : projectId ? (
              <Badge tone="success">已連線</Badge>
            ) : (
              <Badge tone="warn">未設定專案（顯示示範資料）</Badge>
            )}
            <p className="text-base text-ink-muted">
              所有進度 100% 自動來自日誌/檢驗/驗收表單，不允許手動填報百分比
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>S-Curve（計畫 vs 實際）</CardTitle>
          <CardDescription>
            {curve.length > 0
              ? "資料來源：Supabase RPC `scurve_series`"
              : "示範資料（尚未建立工項或尚未有日誌提交）"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SCurve data={curve.length > 0 ? curve : fallbackCurve} height={360} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>工項樹狀</CardTitle>
          <CardDescription>點擊展開 / 收合子工項</CardDescription>
        </CardHeader>
        <CardContent>
          {tree.length === 0 ? (
            <p className="rounded-xl bg-surface-muted p-6 text-center text-lg text-ink-muted">
              尚無工項。請於 Supabase Dashboard 或 CLI 建立 WBS 資料。
            </p>
          ) : (
            <WbsTree nodes={tree} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
