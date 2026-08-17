import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

export type AccessibleDataTableColumn<T> = {
  id: string;
  header: string;
  /** Cell content for a row. */
  cell: (row: T) => ReactNode;
  /** Optional numeric alignment hint for screen readers / styling. */
  align?: "left" | "right";
};

export function AccessibleDataTable<T extends { id: string }>({
  caption,
  columns,
  rows,
  emptyMessage = "No records to display.",
  className,
}: {
  caption: string;
  columns: AccessibleDataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-slate-500 md:hidden">
        On narrow screens this table scrolls horizontally. A card-style list
        view may be added later for touch-friendly browsing.
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <caption className="border-b border-slate-200 bg-[#F6FBFC] px-4 py-3 text-left text-sm font-semibold text-[#0C1833]">
            {caption}
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    "px-4 py-3 font-black text-[#005B7F]",
                    col.align === "right" && "text-right"
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        "px-4 py-3 text-slate-800",
                        col.align === "right" && "text-right tabular-nums"
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
