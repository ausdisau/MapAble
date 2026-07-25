"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { CareTransportAskPanel } from "@/components/care-transport/CareTransportAskPanel";
import {
  CareTransportMapView,
  type CareTransportLayerKey,
} from "@/components/care-transport/CareTransportMapView";
import { MapProvider } from "@/components/map/MapProvider";
import { Button } from "@/components/ui/button";
import type { CareTransportMapPayload } from "@/lib/care-transport-map/map-payload";
import type { CareTransportMapAction } from "@/lib/copilot/types";
import type { MapFeatureCollection } from "@/lib/map/types";

function emptyCollection(): MapFeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

const DEFAULT_LAYERS: Record<CareTransportLayerKey, boolean> = {
  careProviders: true,
  infrastructure: true,
  trips: false,
  foundationalSupports: false,
};

type Props = {
  addInfrastructureEnabled: boolean;
  showFoundationalSupports?: boolean;
};

export function CareTransportMapShell({
  addInfrastructureEnabled,
  showFoundationalSupports = false,
}: Props) {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const [layers, setLayers] =
    useState<Record<CareTransportLayerKey, boolean>>(DEFAULT_LAYERS);
  const [payload, setPayload] = useState<CareTransportMapPayload | null>(null);
  const [foundationalSupports, setFoundationalSupports] =
    useState<MapFeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [flyTo, setFlyTo] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadMap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (isSignedIn && layers.trips) {
        params.set("includeTrips", "true");
        params.set("layers", "careProviders,infrastructure,trips");
      } else {
        params.set("layers", "careProviders,infrastructure");
      }
      const res = await fetch(`/api/care-transport/map?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load map data");
        setPayload(null);
        return;
      }
      setPayload(data as CareTransportMapPayload);
    } catch {
      setError("Could not load map data");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, layers.trips]);

  const loadFoundational = useCallback(async () => {
    if (!showFoundationalSupports || !layers.foundationalSupports) {
      setFoundationalSupports(null);
      return;
    }
    try {
      const params = new URLSearchParams({
        latitude: "-33.8688",
        longitude: "151.2093",
        radiusKm: "80",
      });
      const res = await fetch(`/api/navigator/supports?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setFoundationalSupports(emptyCollection());
        return;
      }
      setFoundationalSupports({
        type: "FeatureCollection",
        features: (data.features ?? []).map(
          (f: {
            type: "Feature";
            geometry: { type: "Point"; coordinates: [number, number] };
            properties: Record<string, unknown>;
          }) => ({
            type: "Feature" as const,
            geometry: f.geometry,
            properties: {
              kind: "foundational_support" as const,
              id: String(f.properties.id ?? ""),
              name: String(f.properties.name ?? "Foundational support"),
              subtitle: String(
                f.properties.subtitle ?? f.properties.category ?? ""
              ),
              layerId: "foundational-supports-layer",
            },
          })
        ),
      });
    } catch {
      setFoundationalSupports(emptyCollection());
    }
  }, [showFoundationalSupports, layers.foundationalSupports]);

  useEffect(() => {
    void loadMap();
  }, [loadMap]);

  useEffect(() => {
    void loadFoundational();
  }, [loadFoundational]);

  const onMapActions = useCallback((actions: CareTransportMapAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case "setLayers": {
          setLayers((prev) => {
            const next: Record<CareTransportLayerKey, boolean> = {
              careProviders: false,
              infrastructure: false,
              trips: false,
              foundationalSupports: prev.foundationalSupports,
            };
            for (const key of action.layers) {
              if (key in next) {
                next[key as CareTransportLayerKey] = true;
              }
            }
            // Keep at least discovery layers if GPT only asked for trips while signed out.
            if (!next.careProviders && !next.infrastructure && !next.trips) {
              return prev;
            }
            return next;
          });
          break;
        }
        case "flyTo":
          setFlyTo({
            lat: action.lat,
            lng: action.lng,
            zoom: action.zoom,
          });
          break;
        case "highlightIds":
          setSelectedId(action.ids[0] ?? null);
          break;
        case "suggestInfrastructure":
          break;
        default: {
          const _exhaustive: never = action;
          void _exhaustive;
        }
      }
    }
  }, []);

  const toggleLayer = (key: CareTransportLayerKey) => {
    if (key === "trips" && !isSignedIn) return;
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const layerButtons: Array<[CareTransportLayerKey, string]> = [
    ["careProviders", "Care providers"],
    ["infrastructure", "Infrastructure"],
    ["trips", "My trips"],
  ];
  if (showFoundationalSupports) {
    layerButtons.push(["foundationalSupports", "Foundational supports"]);
  }

  return (
    <MapProvider>
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            MapAble Care + Transport
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Care and Transport map
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            GPT-assisted OpenStreetMap discovery for care providers and
            moderated transport infrastructure. Trip points stay masked and
            require sign-in.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            {addInfrastructureEnabled ? (
              <Link
                href="/add-infrastructure"
                className="underline focus-visible:ring-2"
              >
                Add infrastructure
              </Link>
            ) : null}
            <Link href="/care/find" className="underline focus-visible:ring-2">
              Care find
            </Link>
            <Link href="/transport" className="underline focus-visible:ring-2">
              Transport
            </Link>
          </div>
        </header>

        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
          role="note"
        >
          Pilot map. Pins are discovery aids, not live ETA or dispatch
          confirmation. Exact trip addresses stay role-gated. Base tiles ©
          OpenStreetMap contributors.
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Map layers">
          {layerButtons.map(([key, label]) => {
            const disabled = key === "trips" && !isSignedIn;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                aria-pressed={layers[key]}
                className={`min-h-11 rounded-lg border px-3 py-2 text-sm ${
                  layers[key]
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background"
                } ${disabled ? "opacity-50" : ""}`}
                onClick={() => toggleLayer(key)}
                title={
                  disabled ? "Sign in to show your masked trip points" : undefined
                }
              >
                {label}
              </button>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => void loadMap()}
          >
            Refresh
          </Button>
        </div>

        {!isSignedIn ? (
          <p className="text-xs text-muted-foreground">
            <Link href="/login" className="underline focus-visible:ring-2">
              Sign in
            </Link>{" "}
            to show masked trip pickup and drop-off points for your journeys.
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {loading && !payload ? (
          <p className="text-sm text-muted-foreground">Loading map…</p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <CareTransportMapView
            careProviders={payload?.careProviders ?? emptyCollection()}
            infrastructure={payload?.infrastructure ?? emptyCollection()}
            trips={payload?.trips ?? null}
            foundationalSupports={foundationalSupports}
            layers={layers}
            flyTo={flyTo}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <CareTransportAskPanel onMapActions={onMapActions} />
        </div>

        {payload?.meta.honesty ? (
          <p className="text-xs text-muted-foreground">{payload.meta.honesty}</p>
        ) : null}
      </div>
    </MapProvider>
  );
}
