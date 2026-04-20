import { StubPage } from "@/components/layout/StubPage";

export const metadata = { title: "現場資料上傳" };

export default function Page() {
  return (
    <StubPage
      title="現場資料上傳"
      description="一鍵上傳現場照片、影音、語音紀錄"
      checklist={[
        "拍照 / 選檔 / 錄音快捷入口",
        "EXIF 保留 + GPS 位置標記",
        "離線佇列 + 連線後自動同步",
        "分類標籤：工項 / 品管 / 職安 / 材料",
      ]}
    />
  );
}
