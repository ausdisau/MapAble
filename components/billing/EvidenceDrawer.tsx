import { cn } from "@/app/lib/utils";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export type EvidenceItem = {
  id: string;
  label: string;
  status: string;
  detail?: string;
  href?: string;
};

export function EvidenceDrawer({
  title = "Evidence",
  items,
  open = true,
  className,
}: {
  title?: string;
  items: EvidenceItem[];
  open?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="evidence-drawer-heading"
      className={cn(mapableSectionCardClass, "p-5", className)}
    >
      <h2
        id="evidence-drawer-heading"
        className="text-lg font-black text-[#0C1833]"
      >
        {title}
      </h2>
      {!open ? (
        <p className="mt-2 text-sm text-slate-600">Evidence panel is closed.</p>
      ) : items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No evidence attached yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-[#0C1833]">
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-[#005B7F] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
                    >
                      {item.label}
                    </a>
                  ) : (
                    item.label
                  )}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Status: {item.status.replace(/_/g, " ")}
                </span>
              </div>
              {item.detail ? (
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
