import { cn } from "@/app/lib/utils";
import { formatAud } from "@/lib/billing/money";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export type FinanceKpiItem = {
  id: string;
  label: string;
  /** Amount in cents when kind is money; otherwise a plain number. */
  value: number;
  kind?: "money" | "number" | "bps" | "days";
  /** Text status hint — never rely on colour alone. */
  statusLabel?: string;
  hint?: string;
};

function formatKpiValue(item: FinanceKpiItem): string {
  switch (item.kind) {
    case "money":
      return formatAud(item.value);
    case "bps":
      return `${(item.value / 100).toFixed(1)}%`;
    case "days":
      return item.value == null || Number.isNaN(item.value)
        ? "—"
        : `${item.value} days`;
    case "number":
    default:
      return item.value.toLocaleString("en-AU");
  }
}

export function FinanceKpiGrid({
  items,
  title = "Finance overview",
  className,
}: {
  items: FinanceKpiItem[];
  title?: string;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="finance-kpi-heading"
      className={cn(mapableSectionCardClass, "p-5", className)}
    >
      <h2 id="finance-kpi-heading" className="text-lg font-black text-[#0C1833]">
        {title}
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <dt className="text-sm font-medium text-slate-600">{item.label}</dt>
            <dd className="mt-1">
              <span className="text-xl font-black tabular-nums text-[#005B7F]">
                {formatKpiValue(item)}
              </span>
              {item.statusLabel ? (
                <span className="mt-1 block text-xs font-semibold text-slate-700">
                  Status: {item.statusLabel}
                </span>
              ) : null}
              {item.hint ? (
                <span className="mt-1 block text-xs text-slate-500">
                  {item.hint}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
