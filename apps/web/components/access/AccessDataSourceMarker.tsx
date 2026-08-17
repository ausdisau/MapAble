import { cn } from "@/app/lib/utils";

export type AccessDataSourceKind =
  | "mapable_verified"
  | "community"
  | "demo"
  | "provider"
  | "partner";

const KIND_COPY: Record<
  AccessDataSourceKind,
  { label: string; description: string; className: string }
> = {
  mapable_verified: {
    label: "MapAble Verified",
    description: "Checked by a MapAble assessor or accredited partner process.",
    className: "border-[#00A979]/40 bg-[#00A979]/10 text-[#0C1833]",
  },
  community: {
    label: "Community update",
    description: "Submitted by the community — confirm on arrival when critical.",
    className: "border-slate-300 bg-slate-50 text-slate-800",
  },
  demo: {
    label: "Demo record",
    description: "Synthetic demo data for product exploration — not a live venue claim.",
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
  provider: {
    label: "Provider reported",
    description: "Reported by the venue or provider — may not be independently checked.",
    className: "border-[#005B7F]/30 bg-[#005B7F]/10 text-[#005B7F]",
  },
  partner: {
    label: "Partner source",
    description: "Imported from a partner dataset with source attribution.",
    className: "border-[#005B7F]/30 bg-white text-[#0C1833]",
  },
};

export function resolveAccessDataSourceKind(input: {
  isDemo?: boolean;
  source?: string;
  tier?: string;
}): AccessDataSourceKind {
  if (input.isDemo) return "demo";
  const source = (input.source || "").toLowerCase();
  if (source.includes("mapable") || source.includes("assessor")) {
    return "mapable_verified";
  }
  if (source.includes("partner")) return "partner";
  if (source.includes("provider")) return "provider";
  if (input.tier && input.tier !== "Unverified") return "mapable_verified";
  return "community";
}

export function AccessDataSourceMarker({
  kind,
  className,
}: {
  kind: AccessDataSourceKind;
  className?: string;
}) {
  const copy = KIND_COPY[kind];
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-col gap-0.5 rounded-xl border px-3 py-2 text-left",
        copy.className,
        className,
      )}
      title={copy.description}
    >
      <span className="text-xs font-black uppercase tracking-[0.12em]">
        {copy.label}
      </span>
      <span className="text-xs leading-5 opacity-90">{copy.description}</span>
    </span>
  );
}
