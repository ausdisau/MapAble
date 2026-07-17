import {
  TRANSPORT_FEATURE_STATUS,
  TRANSPORT_FEATURE_STATUS_LABELS,
  type TransportFeatureAvailability,
  type TransportFeatureStatusItem,
} from "@/lib/transport/feature-status";

const STATUS_ORDER: TransportFeatureAvailability[] = [
  "available_now",
  "pilot_sandbox",
  "coming_next",
  "requires_partner",
];

const TONE: Record<
  TransportFeatureAvailability,
  { panel: string; badge: string }
> = {
  available_now: {
    panel: "border-[#005B7F]/15 bg-[#005B7F]/5",
    badge: "bg-[#005B7F] text-white",
  },
  pilot_sandbox: {
    panel: "border-amber-300/60 bg-amber-50",
    badge: "bg-amber-700 text-white",
  },
  coming_next: {
    panel: "border-slate-200 bg-slate-50",
    badge: "bg-slate-600 text-white",
  },
  requires_partner: {
    panel: "border-[#00A979]/25 bg-[#00A979]/5",
    badge: "bg-[#0C1833] text-white",
  },
};

function groupByStatus(
  items: TransportFeatureStatusItem[]
): Record<TransportFeatureAvailability, TransportFeatureStatusItem[]> {
  return {
    available_now: items.filter((i) => i.status === "available_now"),
    pilot_sandbox: items.filter((i) => i.status === "pilot_sandbox"),
    coming_next: items.filter((i) => i.status === "coming_next"),
    requires_partner: items.filter((i) => i.status === "requires_partner"),
  };
}

export function TransportFeatureStatus({
  items = TRANSPORT_FEATURE_STATUS,
  heading = "Capability status",
  description = "Labels reflect what this build can honestly claim. Pilot and sandbox are not live national supply.",
}: {
  items?: TransportFeatureStatusItem[];
  heading?: string;
  description?: string;
}) {
  const grouped = groupByStatus(items);

  return (
    <section
      aria-labelledby="transport-feature-status-heading"
      className="mx-auto max-w-6xl px-5 py-12 lg:px-8"
    >
      <div className="mb-8 max-w-2xl">
        <h2
          id="transport-feature-status-heading"
          className="mapable-display text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
        >
          {heading}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_ORDER.map((status) => {
          const list = grouped[status];
          const tone = TONE[status];
          return (
            <article
              key={status}
              className={`rounded-[1.5rem] border p-5 ${tone.panel}`}
            >
              <h3 className="flex flex-wrap items-center gap-2 text-lg font-black text-[#0C1833]">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${tone.badge}`}
                >
                  {TRANSPORT_FEATURE_STATUS_LABELS[status]}
                </span>
              </h3>
              {list.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600" role="status">
                  None listed for this label.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {list.map((item) => (
                    <li key={item.id} className="text-sm leading-6 text-slate-700">
                      <p className="font-bold text-[#0C1833]">{item.title}</p>
                      <p className="mt-1">{item.summary}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
