"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { AdminOpsShell } from "@/components/admin/back-of-house/AdminOpsShell";
import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

export function AdminOpsListPage<T extends { id: string }>({
  title,
  description,
  apiPath,
  breadcrumb,
  columns,
  showAtRiskFilter,
  showSearch,
  emptyLabel = "No records found.",
}: {
  title: string;
  description: string;
  apiPath: string;
  breadcrumb: { label: string; href: string }[];
  columns: Column<T>[];
  showAtRiskFilter?: boolean;
  showSearch?: boolean;
  emptyLabel?: string;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (atRiskOnly) params.set("atRiskOnly", "true");
    try {
      const res = await fetch(`${apiPath}?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? data.items?.length ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiPath, q, atRiskOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminOpsShell
      title={title}
      description={description}
      breadcrumb={breadcrumb}
      filters={
        <>
          {showSearch !== false ? (
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
              <span className="font-medium">Search</span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={formInputClass}
                placeholder="Search…"
              />
            </label>
          ) : null}
          {showAtRiskFilter ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={atRiskOnly}
                onChange={(e) => setAtRiskOnly(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              At risk only
            </label>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => void load()}
          >
            Refresh
          </Button>
        </>
      }
    >
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        {loading ? "Loading…" : `${total} record(s)`}
      </p>
      {loading ? (
        <p className="text-muted-foreground">Loading list…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} scope="col" className="px-4 py-3 font-medium">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 align-top">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminOpsShell>
  );
}

export function OpsRowLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
    </Link>
  );
}

export function OpsStatusCell({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
