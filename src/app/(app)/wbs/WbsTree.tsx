"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export interface WbsNode {
  id: string;
  parent_id: string | null;
  code: string;
  name: string;
  weight: number;
  status: string;
  actual_progress: number;
  planned_start: string | null;
  planned_end: string | null;
  children: WbsNode[];
}

function statusTone(status: string): "neutral" | "brand" | "success" | "warn" | "danger" {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "brand";
    case "on_hold":
      return "warn";
    default:
      return "neutral";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "完成";
    case "in_progress":
      return "進行中";
    case "on_hold":
      return "暫停";
    default:
      return "規劃中";
  }
}

function NodeRow({ node, depth }: { node: WbsNode; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const progress = Math.max(0, Math.min(100, Number(node.actual_progress || 0)));

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 border-surface-border bg-white px-4 py-3",
          depth === 0 && "border-brand-200 bg-brand-50/40",
        )}
        style={{ marginLeft: depth * 20 }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={!hasChildren}
          aria-label={hasChildren ? (open ? "收合" : "展開") : "葉節點"}
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl font-bold",
            hasChildren
              ? "bg-brand-100 text-brand-700 hover:bg-brand-200"
              : "text-ink-muted",
          )}
        >
          {hasChildren ? (open ? "−" : "+") : "·"}
        </button>

        <span className="w-24 shrink-0 font-mono text-base text-brand-700">{node.code}</span>

        <span className="flex-1 text-lg font-semibold text-ink">{node.name}</span>

        <span className="hidden w-24 text-right text-base text-ink-muted md:inline">
          權重 {Number(node.weight).toFixed(1)}
        </span>

        <div className="hidden w-40 md:block">
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={cn(
                "h-full transition-all",
                progress >= 100
                  ? "bg-success-500"
                  : progress >= 50
                    ? "bg-brand-600"
                    : "bg-warn-500",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-right text-sm font-semibold text-ink">
            {progress.toFixed(1)}%
          </div>
        </div>

        <Badge tone={statusTone(node.status)}>{statusLabel(node.status)}</Badge>
      </div>

      {hasChildren && open ? (
        <ul className="mt-2 flex flex-col gap-2">
          {node.children.map((c) => (
            <NodeRow key={c.id} node={c} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function WbsTree({ nodes }: { nodes: WbsNode[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {nodes.map((n) => (
        <NodeRow key={n.id} node={n} depth={0} />
      ))}
    </ul>
  );
}
