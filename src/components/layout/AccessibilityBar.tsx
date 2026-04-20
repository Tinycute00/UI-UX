"use client";

import { useA11y, FONT_SCALE_LABEL } from "@/components/a11y/A11yProvider";
import { Button } from "@/components/ui/Button";
import { IconText, IconSun } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * 大字 / 高對比切換 — 給 50-70 歲使用者
 */
export function AccessibilityBar({ className }: { className?: string }) {
  const { fontScale, contrast, cycleFontScale, toggleContrast } = useA11y();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="md"
        onClick={cycleFontScale}
        aria-label={`字級：${FONT_SCALE_LABEL[fontScale]}，點擊切換`}
        className="gap-2 px-4"
      >
        <IconText />
        <span className="hidden xl:inline">{FONT_SCALE_LABEL[fontScale]}</span>
      </Button>
      <Button
        variant="ghost"
        size="md"
        onClick={toggleContrast}
        aria-label={`高對比模式：${contrast === "high" ? "開" : "關"}`}
        aria-pressed={contrast === "high"}
        className={cn("gap-2 px-4", contrast === "high" && "bg-surface-muted")}
      >
        <IconSun />
        <span className="hidden xl:inline">
          {contrast === "high" ? "高對比開" : "高對比"}
        </span>
      </Button>
    </div>
  );
}
