import { cn } from "@/lib/cn";

interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      aria-busy="true"
      aria-label="資料載入中"
    >
      <div className="rounded-2xl border border-surface-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex flex-col gap-2">
            <div className="h-5 w-12 rounded bg-surface-muted animate-pulse" />
            <div className="h-9 w-64 rounded bg-surface-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-brand-50 px-5 py-3">
            <div className="h-8 w-8 rounded-full bg-brand-200 animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="h-5 w-20 rounded bg-brand-200 animate-pulse" />
              <div className="h-7 w-16 rounded bg-brand-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface shadow-card">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-surface-muted animate-pulse" />
            <div className="h-8 w-24 rounded bg-surface-muted animate-pulse" />
          </div>
          <div className="mt-2 h-6 w-48 rounded bg-surface-muted animate-pulse" />
        </div>
        <div className="p-6 pt-0">
          <ul className="flex flex-col gap-2">
            <li>
              <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-surface-border bg-white px-4 py-4">
                <span className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded bg-danger-200 animate-pulse" />
                  <div className="h-6 w-56 rounded bg-surface-muted animate-pulse" />
                </span>
                <div className="h-8 w-20 rounded-full bg-danger-200 animate-pulse" />
              </div>
            </li>
            <li>
              <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-surface-border bg-white px-4 py-4">
                <span className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded bg-warn-200 animate-pulse" />
                  <div className="h-6 w-64 rounded bg-surface-muted animate-pulse" />
                </span>
                <div className="h-8 w-20 rounded-full bg-warn-200 animate-pulse" />
              </div>
            </li>
            <li>
              <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-surface-border bg-white px-4 py-4">
                <span className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded bg-brand-200 animate-pulse" />
                  <div className="h-6 w-52 rounded bg-surface-muted animate-pulse" />
                </span>
                <div className="h-8 w-20 rounded-full bg-brand-200 animate-pulse" />
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface shadow-card">
        <div className="p-6 pb-4">
          <div className="h-8 w-24 rounded bg-surface-muted animate-pulse" />
          <div className="mt-2 h-6 w-80 rounded bg-surface-muted animate-pulse" />
        </div>
        <div className="p-6 pt-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex h-auto flex-col items-center gap-2 rounded-xl border-2 border-surface-border bg-white py-6"
              >
                <div className="h-9 w-9 rounded bg-surface-muted animate-pulse" />
                <div className="h-6 w-20 rounded bg-surface-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface shadow-card">
        <div className="p-6 pb-4">
          <div className="h-8 w-40 rounded bg-surface-muted animate-pulse" />
          <div className="mt-2 h-6 w-96 rounded bg-surface-muted animate-pulse" />
        </div>
        <div className="p-6 pt-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="h-6 w-20 rounded bg-surface-muted animate-pulse" />
            <div className="h-6 w-16 rounded bg-surface-muted animate-pulse" />
          </div>
          <div className="w-full">
            <div className="aspect-[16/9] w-full rounded-xl bg-surface-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
