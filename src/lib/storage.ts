/**
 * Supabase Storage 上傳服務
 * bucket：photos
 * path 規範：{project_id}/{uuid}-{slug}
 */
import { createClient } from "@/lib/supabase/client";
import { compressImage, createThumbnail, extractExif } from "@/lib/photos";

export interface UploadedPhoto {
  id: string;
  url: string;
  thumb_url: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  taken_at: string | null;
  size_bytes: number;
  mime_type: string;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 單張照片：壓�縮圖 → EXIF → 上傳原檔+縮圖 → 寫入 photos table
 * linkedType 例：'daily_log' | 'morning_meeting' | 'inspection' | 'safety_check' | 'material'
 */
export async function uploadPhoto(params: {
  file: File;
  projectId: string;
  linkedType?: string;
  linkedId?: string;
}): Promise<UploadedPhoto> {
  const supabase = createClient();
  const { file, projectId, linkedType, linkedId } = params;

  const [compressed, exif] = await Promise.all([
    compressImage(file),
    extractExif(file),
  ]);
  const thumb = await createThumbnail(compressed);

  const id = uuid();
  const base = `${projectId}/${id}-${slugify(file.name || "photo.jpg")}`;
  const mainPath = base;
  const thumbPath = `${projectId}/${id}-thumb-${slugify(file.name || "photo.jpg")}`;

  const { error: upErr } = await supabase.storage
    .from("photos")
    .upload(mainPath, compressed, { contentType: compressed.type, upsert: false });
  if (upErr) throw upErr;

  const { error: thErr } = await supabase.storage
    .from("photos")
    .upload(thumbPath, thumb, { contentType: thumb.type, upsert: false });
  if (thErr) throw thErr;

  // 取得已簽章 URL（bucket 非 public）
  const [mainUrl, thumbUrl] = await Promise.all([
    supabase.storage.from("photos").createSignedUrl(mainPath, 60 * 60 * 24 * 7),
    supabase.storage.from("photos").createSignedUrl(thumbPath, 60 * 60 * 24 * 7),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = {
    id,
    project_id: projectId,
    url: mainUrl.data?.signedUrl ?? mainPath,
    thumb_url: thumbUrl.data?.signedUrl ?? null,
    gps_lat: exif.gps_lat,
    gps_lng: exif.gps_lng,
    taken_at: exif.taken_at,
    size_bytes: compressed.size,
    mime_type: compressed.type,
    uploaded_by: user?.id ?? null,
    linked_type: linkedType ?? null,
    linked_id: linkedId ?? null,
  };

  const { data: inserted, error: insErr } = await supabase
    .from("photos")
    .insert(row)
    .select()
    .maybeSingle();
  if (insErr) throw insErr;

  return {
    id: (inserted?.id as string) ?? id,
    url: row.url,
    thumb_url: row.thumb_url,
    gps_lat: row.gps_lat,
    gps_lng: row.gps_lng,
    taken_at: row.taken_at,
    size_bytes: row.size_bytes,
    mime_type: row.mime_type,
  };
}

/** 批次上傳 */
export async function uploadPhotos(params: {
  files: File[];
  projectId: string;
  linkedType?: string;
  linkedId?: string;
  onProgress?: (done: number, total: number) => void;
}): Promise<UploadedPhoto[]> {
  const out: UploadedPhoto[] = [];
  const total = params.files.length;
  for (let i = 0; i < total; i++) {
    const f = params.files[i];
    if (!f) continue;
    const res = await uploadPhoto({
      file: f,
      projectId: params.projectId,
      linkedType: params.linkedType,
      linkedId: params.linkedId,
    });
    out.push(res);
    params.onProgress?.(i + 1, total);
  }
  return out;
}
