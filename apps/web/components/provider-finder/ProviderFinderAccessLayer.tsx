"use client";

import { MapPin } from "lucide-react";

import { cn } from "@/app/lib/utils";
import type { Provider } from "@/app/provider-finder/providers";

type ProviderFinderAccessLayerProps = {
  providers: Provider[];
  selectedId?: string;
  onSelect?: (provider: Provider) => void;
  className?: string;
};

function formatDistance(provider: Provider) {
  if (provider.suburb === "Remote") return "Telehealth";
  if (provider.distanceKm > 0) return `${provider.distanceKm.toFixed(1)} km`;
  return provider.suburb;
}

export function ProviderFinderAccessLayer({
  providers,
  selectedId,
  onSelect,
  className,
}: ProviderFinderAccessLayerProps) {
  const markers = providers.slice(0, 3);

  return (
    <aside
      className={cn(
        "hidden xl:flex xl:w-72 xl:shrink-0 xl:flex-col",
        className,
      )}
      aria-label="MapAble access layer"
    >
      <div className="relative flex flex-1 flex-col rounded-2xl border border-border/60 bg-gradient-to-b from-primary/5 via-card to-secondary/5 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          MapAble access layer
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Nearby providers on your path — open the map for transport and venue notes.
        </p>

        <div className="relative mx-auto mt-6 flex min-h-[280px] flex-1 flex-col justify-between py-4">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full text-primary/25"
            viewBox="0 0 200 280"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M 100 20 Q 160 80 120 140 T 100 260"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </svg>

          {markers.map((provider, index) => {
            const positions = [
              "self-start ml-2",
              "self-center",
              "self-end mr-2",
            ] as const;
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => onSelect?.(provider)}
                className={cn(
                  "relative z-10 max-w-[200px] rounded-lg border bg-card/95 p-2.5 text-left text-xs shadow-md transition hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  positions[index],
                  selectedId === provider.id && "border-primary ring-2 ring-primary/20",
                )}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="mt-1 font-semibold leading-tight text-foreground line-clamp-2">
                  {provider.name}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  {formatDistance(provider)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Access layer
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            The map view shows nearby providers, transport options, travel buffers,
            and venue access notes so you can plan before you book.
          </p>
        </div>
      </div>
    </aside>
  );
}
