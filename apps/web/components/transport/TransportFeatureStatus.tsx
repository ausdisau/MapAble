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
  { rule: string; badge: string }
> = {
  available_now: {
    rule: "border-[#005B7F]",
    badge: "bg-[#005B7F] text-white",
  },
  pilot_sandbox: {
    rule: "border-amber-600",
    badge: "bg-amber-700 text-white",
  },
  coming_next: {
    rule: "border-slate-400",
    badge: "bg-slate-600 text-white",
  },
  requires_partner: {
    rule: "border-[#00A979]",
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
      className="transport-public-section border-b border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="mb-10 max-w-2xl">
          <h2
            id="transport-feature-status-heading"
            className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-4xl"
          >
            {heading}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const list = grouped[status];
            const tone = TONE[status];
            return (
              <div key={status} className={`border-t-4 pt-5 ${tone.rule}`}>
                <h3 className="text-base font-black text-[#0C1833]">
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${tone.badge}`}
                  >
                    {TRANSPORT_FEATURE_STATUS_LABELS[status]}
                  </span>
                </h3>
                {list.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-600" role="status">
                    None listed for this label.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-5">
                    {list.map((item) => (
                      <li key={item.id} className="text-sm leading-6 text-slate-700">
                        <p className="font-bold text-[#0C1833]">{item.title}</p>
                        <p className="mt-1">{item.summary}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
