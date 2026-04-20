import { StubPage } from "@/components/layout/StubPage";

export const metadata = { title: "材料驗收" };

export default function Page() {
  return (
    <StubPage
      title="材料驗收"
      description="進場材料驗收、試驗追蹤、NCR 管理"
      checklist={[
        "材料進場拍照 / 過磅 / 試驗單上傳",
        "合格標籤列印（QR Code）",
        "不合格 → 自動 NCR 單",
        "月報材料耗用統計",
      ]}
    />
  );
}
