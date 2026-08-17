import type { TransportTripApiResponse } from "@/types/transport";

export function TransportRouteAdvisory({
  routeEstimate,
}: {
  routeEstimate: NonNullable<TransportTripApiResponse["routeEstimate"]>;
}) {
  const km = (routeEstimate.distanceMetres / 1000).toFixed(1);
  const minutes = Math.round(routeEstimate.durationSeconds / 60);

  return (
    <section
      className="rounded-xl border border-border bg-muted/40 p-4"
      aria-labelledby="route-advisory-heading"
    >
      <h2 id="route-advisory-heading" className="font-semibold">
        Route estimate (advisory)
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        About {km} km, roughly {minutes} minutes. Provider: {routeEstimate.provider}.
      </p>
      <p className="mt-2 text-sm">{routeEstimate.advisoryDisclaimer}</p>
    </section>
  );
}
