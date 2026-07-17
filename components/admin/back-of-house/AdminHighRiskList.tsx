"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { HighRiskItem } from "@/server/admin/adminSchemas";

const SEVERITY_LABEL: Record<HighRiskItem["severity"], string> = {
  low: "Low priority",
  medium: "Medium priority",
  high: "High priority",
  critical: "Critical priority",
};

export function AdminHighRiskList({
  items,
  emptyMessage = "No high-risk items in this view.",
}: {
  items: HighRiskItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="High-risk queue">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-border bg-card p-4 focus-within:ring-2 focus-within:ring-ring"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                aria-hidden
              />
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                <span className="sr-only">{SEVERITY_LABEL[item.severity]}</span>
                {item.aiGenerated ? (
                  <span className="mt-2 inline-block rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900 dark:bg-violet-950 dark:text-violet-100">
                    AI-generated signal
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={item.severity} />
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Open
                </Link>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
