import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import { IconEmptyBox, IconErrorCircle } from "@/components/icons";

export interface DashboardStateProps {
  /** 狀態類型：無資料或錯誤 */
  type: "empty" | "error";
  /** 錯誤訊息（僅用於 error 狀態） */
  message?: string;
  /** 錯誤代碼（僅用於 error 狀態） */
  code?: string;
  /** CTA 按鈕回呼 */
  onAction?: () => void;
  /** 自訂樣式類別 */
  className?: string;
  /** 是否處於載入中狀態（供 aria-busy 使用） */
  loading?: boolean;
}

/**
 * DashboardState — 儀表板空狀態與錯誤狀態元件
 *
 * 專為 50-70 歲使用者設計：
 * - 大字體（標題 26px、內文 20px）
 * - 大按鈕（最小 60px 觸控區）
 * - 高對比色彩（錯誤狀態使用紅色系）
 * - 清晰的視覺層級與充足留白
 */
export const DashboardState = forwardRef<HTMLDivElement, DashboardStateProps>(
  ({ type, message, code, onAction, className, loading = false }, ref) => {
    const isError = type === "error";

    return (
      <Card
        ref={ref}
        className={cn(
          "w-full",
          isError ? "border-danger-500/40 bg-danger-50" : "border-surface-border bg-surface-muted",
          className,
        )}
        aria-busy={loading}
        role="status"
        aria-live="polite"
      >
        <CardContent className="flex flex-col items-center justify-center gap-6 px-8 py-16 text-center">
          <div
            className={cn(
              "flex h-32 w-32 items-center justify-center rounded-full",
              isError ? "bg-danger-100" : "bg-surface-subtle",
            )}
            aria-hidden="true"
          >
            {isError ? (
              <IconErrorCircle size={48} className="text-danger-600" aria-hidden="true" />
            ) : (
              <IconEmptyBox size={48} className="text-ink-muted" aria-hidden="true" />
            )}
          </div>

          <h2
            className={cn(
              "text-2xl font-bold tracking-tight",
              isError ? "text-danger-700" : "text-ink",
            )}
          >
            {isError ? "發生錯誤" : "尚無資料"}
          </h2>

          <p
            className={cn(
              "max-w-md text-lg leading-relaxed",
              isError ? "text-danger-600" : "text-ink-muted",
            )}
          >
            {isError
              ? message || "載入資料時發生問題，請稍後再試。"
              : "目前沒有可顯示的資料，請稍後再試或重新載入。"}
          </p>

          {isError && code && (
            <p
              className="bg-danger-100 rounded-lg px-4 py-2 font-mono text-base text-danger-700"
              aria-label={`錯誤代碼：${code}`}
            >
              錯誤代碼: {code}
            </p>
          )}

          {onAction && (
            <Button
              variant={isError ? "danger" : "primary"}
              size="lg"
              onClick={onAction}
              disabled={loading}
              aria-label={isError ? "重試載入資料" : "重新載入資料"}
            >
              {loading ? (
                <>
                  <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  處理中...
                </>
              ) : (
                <>{isError ? "重試" : "重新載入"}</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  },
);

DashboardState.displayName = "DashboardState";

export default DashboardState;
