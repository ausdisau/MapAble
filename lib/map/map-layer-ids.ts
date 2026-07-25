export const MAP_SOURCE_IDS = {
  providers: "providers",
  accessPlaces: "access-places",
  userLocation: "user-location",
  pickupPoints: "pickup-points",
  reviews: "reviews",
  sponsored: "sponsored-services",
  transportTrips: "transport-trips",
  dispatchVehicles: "dispatch-vehicles",
  careProviders: "care-providers",
  infrastructure: "infrastructure",
} as const;

export const MAP_LAYER_IDS = {
  providers: "providers-layer",
  accessPlaces: "access-places-layer",
  userLocation: "user-location-layer",
  pickupPoints: "pickup-points-layer",
  reviews: "reviews-layer",
  sponsored: "sponsored-services-layer",
  transportTrips: "transport-trips-layer",
  dispatchVehicles: "dispatch-vehicles-layer",
  careProviders: "care-providers-layer",
  infrastructure: "infrastructure-layer",
} as const;

export type MapSourceId = (typeof MAP_SOURCE_IDS)[keyof typeof MAP_SOURCE_IDS];
export type MapLayerId = (typeof MAP_LAYER_IDS)[keyof typeof MAP_LAYER_IDS];
