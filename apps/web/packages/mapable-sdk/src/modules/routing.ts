import type { MapAbleRequestClient } from "../client";
import type { GeoJSONFeatureCollection, RouteRequest } from "../types";

/** Indoor wayfinding / routing module. */
export class RoutingModule {
  constructor(private readonly client: MapAbleRequestClient) {}

  /**
   * Plan an indoor path between two points.
   * POSTs to `/indoor/routes/plan` and returns a GeoJSON FeatureCollection.
   */
  async getIndoorPath(params: RouteRequest): Promise<GeoJSONFeatureCollection> {
    return this.client.request<GeoJSONFeatureCollection>("/indoor/routes/plan", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }
}
