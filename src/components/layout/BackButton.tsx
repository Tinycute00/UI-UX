"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { IconBack } from "@/components/icons";

/**
 * 返回按鈕 — 每頁最上方必備（規格書 §5）
 * 手機版至少 60px 高。
 */
export function BackButton({
  label = "返回",
  fallbackHref = "/today",
}: {
  label?: string;
  fallbackHref?: string;
}) {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      size="lg"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="gap-2"
    >
      <IconBack />
      <span>{label}</span>
    </Button>
  );
}
