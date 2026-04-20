import { StubPage } from "@/components/layout/StubPage";

export const metadata = { title: "施工日誌" };

export default function Page() {
  return (
    <StubPage
      title="施工日誌"
      description="每日開工狀況、人力機具、氣候、完成工項自動彙整"
      checklist={[
        "每日人力 / 機具 / 天候紀錄",
        "勾選完成工項 → 自動更新 S-Curve",
        "拍照上傳 + GPS + 自動壓縮",
        "主任線上簽核 → PDF 電子化送審",
      ]}
    />
  );
}
