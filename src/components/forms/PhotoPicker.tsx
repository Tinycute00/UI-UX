"use client";

import { useState } from "react";
import { IconCamera } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 通用照片選擇器
 * - 拍照 / 相簿多選
 * - 顯示縮圖 + 可移除
 * - 不含上傳邏輯；由呼叫方在提交時批次上傳
 */
export function PhotoPicker({
  value,
  onChange,
  max = 12,
  label = "點此拍照 / 選取照片",
  hint,
  className,
}: {
  value: PendingPhoto[];
  onChange: (next: PendingPhoto[]) => void;
  max?: number;
  label?: string;
  hint?: string;
  className?: string;
}) {
  const [overLimit, setOverLimit] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const room = Math.max(0, max - value.length);
    const added = files.slice(0, room).map<PendingPhoto>((f) => ({
      id: genId(),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setOverLimit(files.length > room);
    onChange([...value, ...added]);
    e.target.value = "";
  }

  function remove(id: string) {
    const target = value.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(value.filter((p) => p.id !== id));
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label className="flex min-h-touch cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-4 text-lg font-semibold text-brand-700 hover:bg-brand-100">
        <IconCamera />
        <span>{label}</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </label>

      {hint ? <p className="text-base text-ink-muted">{hint}</p> : null}

      {overLimit ? (
        <p className="text-base font-semibold text-warn-600">
          已達上限 {max} 張，新增照片未全部採用
        </p>
      ) : null}

      {value.length > 0 ? (
        <>
          <div className="flex items-center gap-2 text-base">
            <Badge tone="brand">
              {value.length} / {max}
            </Badge>
            <span className="text-ink-muted">已選照片</span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {value.map((p) => (
              <li
                key={p.id}
                className="relative overflow-hidden rounded-xl border-2 border-surface-border bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt={p.file.name}
                  className="block aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label={`移除 ${p.file.name}`}
                  className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-full bg-danger-600 text-white shadow-card"
                >
                  ×
                </button>
                <p className="truncate px-2 py-1 text-sm text-ink-muted">
                  {(p.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
