import type { ReactNode } from "react";
import { BackButton } from "@/components/layout/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/**
 * Stub 頁面共用骨架 — MVP 1 先提供可導航的骨架，細節於 Phase 2 完成。
 */
export function StubPage({
  title,
  description,
  phase = "MVP 2",
  checklist,
  children,
}: {
  title: string;
  description: string;
  phase?: string;
  checklist?: string[];
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <Badge tone="warn">規劃中 · {phase}</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {checklist && checklist.length > 0 ? (
            <div className="rounded-xl bg-surface-muted p-4">
              <h3 className="mb-2 text-lg font-bold text-ink">本模組規劃功能</h3>
              <ul className="list-disc space-y-1 pl-6 text-lg text-ink-muted">
                {checklist.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
