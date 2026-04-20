import { StubPage } from "@/components/layout/StubPage";

export const metadata = { title: "路工管理" };

export default function Page() {
  return (
    <StubPage
      title="路工管理"
      description="勞工出勤、工時、薪資統計"
      checklist={[
        "每日出勤自日誌彙整",
        "工時 × 日薪自動計算",
        "月報薪資清冊匯出",
        "勞健保 / 職災通報串接",
      ]}
    />
  );
}
