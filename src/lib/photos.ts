/**
 * 照片處理工具
 * - 壓縮（browser-image-compression）
 * - EXIF GPS / 拍攝時間擷取（exifr）
 * - 產生縮圖
 */
import imageCompression from "browser-image-compression";
import exifr from "exifr";

export interface ExtractedExif {
  gps_lat: number | null;
  gps_lng: number | null;
  taken_at: string | null; // ISO 8601
}

export async function extractExif(file: File): Promise<ExtractedExif> {
  try {
    const parsed = (await exifr.parse(file, {
      gps: true,
      pick: ["GPSLatitude", "GPSLongitude", "DateTimeOriginal", "latitude", "longitude"],
    })) as {
      latitude?: number;
      longitude?: number;
      DateTimeOriginal?: Date | string;
    } | null;

    if (!parsed) return { gps_lat: null, gps_lng: null, taken_at: null };

    const takenAt =
      parsed.DateTimeOriginal instanceof Date
        ? parsed.DateTimeOriginal.toISOString()
        : typeof parsed.DateTimeOriginal === "string"
          ? new Date(parsed.DateTimeOriginal).toISOString()
          : null;

    return {
      gps_lat: typeof parsed.latitude === "number" ? parsed.latitude : null,
      gps_lng: typeof parsed.longitude === "number" ? parsed.longitude : null,
      taken_at: takenAt,
    };
  } catch {
    return { gps_lat: null, gps_lng: null, taken_at: null };
  }
}

export interface CompressOptions {
  /** 最大邊長 (px) — 預設 1920 */
  maxWidthOrHeight?: number;
  /** 最大檔案大小 (MB) — 預設 1.5 */
  maxSizeMB?: number;
}

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: opts.maxWidthOrHeight ?? 1920,
      maxSizeMB: opts.maxSizeMB ?? 1.5,
      useWebWorker: true,
      initialQuality: 0.85,
      fileType: file.type,
      preserveExif: true, // 保留 EXIF 用於 GPS
    });
    return new File([compressed], file.name, {
      type: compressed.type || file.type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

/** 產生縮圖（用於列表預覽） */
export async function createThumbnail(file: File, maxSize = 320): Promise<File> {
  try {
    const thumb = await imageCompression(file, {
      maxWidthOrHeight: maxSize,
      maxSizeMB: 0.15,
      useWebWorker: true,
      initialQuality: 0.75,
    });
    return new File([thumb], `thumb_${file.name}`, {
      type: thumb.type || file.type,
    });
  } catch {
    return file;
  }
}

/** Data URL → File（供簽名 canvas 輸出使用） */
export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  try {
    const [header, data] = dataUrl.split(",");
    const mimeMatch = /data:(.*?);base64/.exec(header ?? "");
    const mime = mimeMatch?.[1] ?? "image/png";
    const bin = atob(data ?? "");
    const len = bin.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], filename, { type: mime });
  } catch {
    return null;
  }
}
