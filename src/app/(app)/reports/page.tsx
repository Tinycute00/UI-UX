import { StubPage } from "@/components/layout/StubPage";

export const metadata = { title: "報表中心" };

export default function Page() {
  return (
    <StubPage
      title="報表中心"
      description="月報、季報、竣工報表一鍵產生"
      checklist={[
        "月報 / 季報 / 期中報告範本",
        "PDF + Excel 匯出",
        "依日誌 + 品管 + 職安 + 材料自動彙整",
        "分項預算 vs 實際支出對照表",
      ]}
    />
  );
}
