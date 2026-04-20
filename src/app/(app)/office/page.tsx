import { StubPage } from "@/components/layout/StubPage";

export const metadata = { title: "內業管理" };

export default function Page() {
  return (
    <StubPage
      title="內業管理"
      description="公文、會議、送審、版本控管"
      checklist={[
        "公文收發 / 簽核流程",
        "會議紀錄 + 待辦追蹤",
        "送審版本 + 覆核狀態",
        "PDF 電子化送審 + 電子簽章",
      ]}
    />
  );
}
