import {
  AccessDataSourceMarker,
  resolveAccessDataSourceKind,
  type AccessDataSourceKind,
} from "@/components/access/AccessDataSourceMarker";
import { AccessEvidenceCard } from "@/components/access/AccessEvidenceCard";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";

export type VenueAccessDetailsProps = {
  place: DemoAccessPlace;
  sourceKind?: AccessDataSourceKind;
};

function SummaryItem({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {term}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-[#0C1833]">{detail}</dd>
    </div>
  );
}

/**
 * Structured venue accessibility audit summary for place profiles.
 * Composes evidence measurements (door width, slopes) with facility flags.
 */
export function VenueAccessDetails({
  place,
  sourceKind: sourceKindProp,
}: VenueAccessDetailsProps) {
  const sourceKind =
    sourceKindProp ??
    resolveAccessDataSourceKind({
      isDemo: place.isDemo,
      source: place.source,
      tier: place.tier,
    });

  const tactilePaving =
    place.domains.find((d) =>
      d.name.toLowerCase().includes("external path"),
    )?.summary.toLowerCase().includes("tactile") ?? false;

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="venue-access-summary-heading"
        className="rounded-2xl border border-slate-200 p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2
            id="venue-access-summary-heading"
            className="text-xl font-black text-[#0C1833]"
          >
            Venue access details
          </h2>
          <AccessDataSourceMarker kind={sourceKind} />
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <SummaryItem
            term="Best entrance"
            detail={
              place.profile.stepFreeEntry
                ? "Step-free entry reported"
                : "Confirm entrance"
            }
          />
          <SummaryItem
            term="Door width"
            detail={
              place.profile.doorWidthMm != null
                ? `${place.profile.doorWidthMm} mm`
                : "Unknown"
            }
          />
          <SummaryItem
            term="Step-free route"
            detail={
              place.profile.internalStepFree
                ? "Internal step-free noted"
                : "Needs confirmation"
            }
          />
          <SummaryItem
            term="Accessible bathroom"
            detail={
              place.profile.accessibleToilet === true
                ? "Accessible toilet reported"
                : place.profile.accessibleToilet === false
                  ? "No accessible toilet reported"
                  : "Unknown"
            }
          />
          <SummaryItem
            term="Parking / drop-off"
            detail={
              [
                place.profile.accessibleParking ? "Accessible parking" : null,
                place.profile.dropOffPoint ? "Drop-off point" : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Unknown"
            }
          />
          <SummaryItem
            term="Tactile paving"
            detail={
              tactilePaving
                ? "Mentioned in external path notes"
                : "Not confirmed in published notes"
            }
          />
          <SummaryItem
            term="Sensory notes"
            detail={place.sensoryNotes.join(" · ") || "None listed"}
          />
          <SummaryItem
            term="Hearing loop"
            detail={
              place.profile.hearingLoop === true
                ? "Hearing loop reported"
                : place.profile.hearingLoop === false
                  ? "Not reported"
                  : "Unknown"
            }
          />
        </dl>
      </section>

      <AccessEvidenceCard
        title="Physical audit measurements"
        measurements={place.measurements}
        confidence={place.confidence}
        lastChecked={place.lastChecked}
        sourceKind={sourceKind}
      />
    </div>
  );
}
