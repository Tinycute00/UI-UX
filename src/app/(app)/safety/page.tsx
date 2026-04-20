import { StubPage } from "@/components/layout/StubPage";

export const metadata = { title: "職安巡檢" };

export default function Page() {
  return (
    <StubPage
      title="職安巡檢"
      description="每日職安自動檢查表、缺失追蹤、改善驗證"
      checklist={[
        "每日巡檢 Checklist",
        "發現缺失 → 拍照 + 指派改善",
        "改善截止日自動提醒",
        "月報自動彙整",
      ]}
    />
  );
}
