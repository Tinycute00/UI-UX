import { StubPage } from "@/components/layout/StubPage";
import { SCurve } from "@/components/charts/SCurve";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata = { title: "工項 / S-Curve" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <StubPage
        title="工項 / S-Curve 管理"
        description="工項樹狀 + 權重 + 進度 + S-Curve 自動計算"
        phase="MVP 2"
        checklist={[
          "工項樹狀（WBS）：父子結構 + 權重",
          "進度 100% 自動來自日誌 / 品管 / 驗收表單",
          "S-Curve：計畫 vs 實際 + 偏差警示",
          "超前 / 落後 / 延誤自動標註",
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>範例 S-Curve</CardTitle>
          <CardDescription>資料接上 Supabase 後自動替換</CardDescription>
        </CardHeader>
        <CardContent>
          <SCurve
            data={[
              { date: "Jan", planned: 8, actual: 7 },
              { date: "Feb", planned: 20, actual: 18 },
              { date: "Mar", planned: 38, actual: 32 },
              { date: "Apr", planned: 58, actual: 48 },
              { date: "May", planned: 75, actual: 68 },
              { date: "Jun", planned: 90, actual: 82 },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
