"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/layout/BackButton";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PhotoPicker, type PendingPhoto } from "@/components/forms/PhotoPicker";
import { uploadPhotos, type UploadedPhoto } from "@/lib/storage";
import { getActiveProject } from "@/lib/project";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "daily_log", label: "施工日誌" },
  { value: "morning_meeting", label: "晨會" },
  { value: "inspection", label: "品管檢驗" },
  { value: "safety_check", label: "職安巡檢" },
  { value: "material_receipt", label: "材料驗收" },
  { value: "other", label: "其他" },
];

export default function UploadPage() {
  const [project, setProject] = useState<{ id: string; name: string } | null>(null);
  const [category, setCategory] = useState("other");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [uploaded, setUploaded] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => setProject(await getActiveProject()))();
  }, []);

  async function onUpload() {
    if (photos.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      if (!project) throw new Error("尚未設定專案");
      setProgress({ done: 0, total: photos.length });
      const result = await uploadPhotos({
        files: photos.map((p) => p.file),
        projectId: project.id,
        linkedType: category,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setUploaded((prev) => [...result, ...prev]);
      setPhotos([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <h1 className="text-2xl font-bold text-ink lg:text-3xl">現場資料上傳</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>批次上傳照片</CardTitle>
          <CardDescription>
            自動壓縮 (≤1.5MB)、擷取 EXIF GPS / 拍攝時間、同時產生縮圖
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-lg font-semibold text-ink">歸類至模組</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={
                    "min-h-12 rounded-xl border-2 px-4 py-2 text-base font-semibold " +
                    (category === c.value
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-surface-border bg-white text-ink hover:border-brand-400")
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <PhotoPicker value={photos} onChange={setPhotos} max={24} />

          {error ? (
            <div
              role="alert"
              className="rounded-xl border-2 border-danger-500/40 bg-danger-50 px-4 py-3 text-base font-semibold text-danger-700"
            >
              {error}
            </div>
          ) : null}

          {progress ? (
            <div className="rounded-xl border-2 border-brand-300 bg-brand-50 px-4 py-3 text-base font-semibold text-brand-700">
              上傳中 {progress.done}/{progress.total}…
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              size="lg"
              disabled={uploading || photos.length === 0 || !project}
              onClick={onUpload}
            >
              {uploading ? "上傳中…" : `開始上傳 (${photos.length})`}
            </Button>
          </div>
          {!project ? (
            <p className="text-base text-warn-700">
              尚未偵測到專案，請先於 Supabase projects 建立資料並成為專案成員
            </p>
          ) : null}
        </CardContent>
      </Card>

      {uploaded.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>本次已上傳 ({uploaded.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {uploaded.map((u) => (
                <li
                  key={u.id}
                  className="overflow-hidden rounded-xl border-2 border-surface-border bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.thumb_url || u.url}
                    alt="uploaded"
                    className="block aspect-square w-full object-cover"
                  />
                  <div className="flex flex-col gap-1 p-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Badge tone="success">OK</Badge>
                      <span className="text-ink-muted">
                        {(u.size_bytes / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    {u.gps_lat && u.gps_lng ? (
                      <a
                        href={`https://www.google.com/maps?q=${u.gps_lat},${u.gps_lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-brand-700 underline"
                      >
                        {u.gps_lat.toFixed(5)}, {u.gps_lng.toFixed(5)}
                      </a>
                    ) : (
                      <span className="text-ink-muted">無 GPS</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
