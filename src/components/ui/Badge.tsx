import { cn } from "@/lib/cn";

/** 狀態 badge — 用於進度、結果等 */
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "success" | "warn" | "danger";
  className?: string;
}) {
  const toneClass: Record<typeof tone, string> = {
    neutral: "bg-surface-muted text-ink border-surface-border",
    brand: "bg-brand-50 text-brand-700 border-brand-200",
    success: "bg-success-50 text-success-700 border-success-500/30",
    warn: "bg-warn-50 text-warn-600 border-warn-500/30",
    danger: "bg-danger-50 text-danger-700 border-danger-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-base font-semibold",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
