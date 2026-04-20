import { StubPage } from "@/components/layout/StubPage";

export const metadata = { title: "品管檢驗" };

export default function Page() {
  return (
    <StubPage
      title="品管檢驗"
      description="品管三級檢查表、自主檢查、試驗紀錄"
      checklist={[
        "Checklist 勾選 → 自動判定 Pass/Fail",
        "不合格自動產生改善通知",
        "附照片與試驗報告 PDF",
        "主任 / 品管 / 監造三方簽核",
      ]}
    />
  );
}
