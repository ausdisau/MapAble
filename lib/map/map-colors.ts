import type { CircleLayerSpecification } from "maplibre-gl";

/** Map paint colors derived from CSS tokens in app/index.css. */

const FALLBACK = {
  primary: "hsl(197 100% 25%)",
  secondary: "hsl(160 100% 33%)",
  destructive: "hsl(0 84% 60%)",
  white: "#ffffff",
} as const;

export function readCssHslVariable(
  variable: "--primary" | "--secondary" | "--destructive",
  fallback: string,
): string {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return raw ? `hsl(${raw})` : fallback;
}

export function getMapMarkerColors() {
  return {
    primary: readCssHslVariable("--primary", FALLBACK.primary),
    secondary: readCssHslVariable("--secondary", FALLBACK.secondary),
    destructive: readCssHslVariable("--destructive", FALLBACK.destructive),
    white: FALLBACK.white,
  };
}

export function getProviderCirclePaint(): CircleLayerSpecification["paint"] {
  const colors = getMapMarkerColors();
  return {
    "circle-radius": 8,
    "circle-color": colors.primary,
    "circle-stroke-width": 2,
    "circle-stroke-color": colors.white,
  };
}

export function getInfrastructureCirclePaint(): CircleLayerSpecification["paint"] {
  const colors = getMapMarkerColors();
  return {
    "circle-radius": 7,
    "circle-color": colors.secondary,
    "circle-stroke-width": 2,
    "circle-stroke-color": colors.white,
  };
}

export function getTripPointCirclePaint(): CircleLayerSpecification["paint"] {
  const colors = getMapMarkerColors();
  return {
    "circle-radius": 9,
    "circle-color": colors.destructive,
    "circle-stroke-width": 2,
    "circle-stroke-color": colors.white,
  };
}
