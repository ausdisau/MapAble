import {
  MAPABLE_ADL_KML_MAX_BYTES,
  MAPABLE_ADL_KML_MAX_ITEMS,
} from "@/lib/access-map/copy";

/** Shared limits for admin KML/GeoJSON imports. */
export const MAX_IMPORT_BYTES = 5_000_000;
export const MAX_IMPORT_ITEMS = 2_000;

/** Allowlisted MapAble ADL My Maps KML (full export). */
export const MAX_ALLOWLISTED_KML_BYTES = MAPABLE_ADL_KML_MAX_BYTES;
export const MAX_ALLOWLISTED_KML_ITEMS = MAPABLE_ADL_KML_MAX_ITEMS;
