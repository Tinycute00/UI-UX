import { StubPage } from "@/components/layout/StubPage";

export const metadata = { title: "請款管理" };

export default function Page() {
  return (
    <StubPage
      title="請款管理"
      description="估驗計價、請款單、付款追蹤"
      checklist={[
        "依工項實際進度 × 單價自動產生估驗計價",
        "請款單 PDF + 電子核章",
        "付款追蹤 + 到期提醒",
        "保固金 / 預付款 / 扣款管理",
      ]}
    />
  );
}
