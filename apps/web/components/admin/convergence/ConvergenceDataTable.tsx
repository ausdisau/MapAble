import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
};

/**
 * Accessible data table for ConvergenceOS inventories.
 * Prefer this structured list over colour-only graphs.
 */
export function ConvergenceDataTable<T extends { id?: string }>({
  caption,
  columns,
  rows,
  emptyMessage = "No rows. Run a repository scan when ConvergenceOS is enabled.",
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-3 py-2 font-semibold"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id ?? String(index)}
              className="border-b border-border/70"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 align-top">
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RiskBadge({ risk }: { risk?: string | null }) {
  if (!risk) return <span>n/a</span>;
  const label =
    risk === "critical"
      ? "Critical"
      : risk === "high"
        ? "High"
        : risk === "medium"
          ? "Medium"
          : risk === "low"
            ? "Low"
            : risk;
  return (
    <span
      className="inline-flex min-h-8 items-center rounded border border-border px-2 text-xs font-medium"
      data-risk={risk}
    >
      <span className="sr-only">Collision risk: </span>
      {label}
    </span>
  );
}
