"use client";

type MapResult = {
  id: string;
  name: string;
  subtitle?: string;
  distanceLabel?: string;
};

export function MapAccessibleResultsList({
  results,
  selectedId,
  onSelect,
  heading = "Map results list",
}: {
  results: MapResult[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  heading?: string;
}) {
  return (
    <section aria-labelledby="map-results-list-heading">
      <h2 id="map-results-list-heading" className="sr-only">
        {heading}
      </h2>
      <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
        {results.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className={`w-full rounded-md border px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                selectedId === r.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => onSelect?.(r.id)}
              aria-current={selectedId === r.id ? "true" : undefined}
              aria-label={
                r.subtitle
                  ? `Select ${r.name}, ${r.subtitle}`
                  : `Select ${r.name}`
              }
            >
              <span className="font-medium">{r.name}</span>
              {r.subtitle ? (
                <span className="block text-muted-foreground">{r.subtitle}</span>
              ) : null}
              {r.distanceLabel ? (
                <span className="block text-xs">{r.distanceLabel}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
