import { BillingModule } from "./modules/billing";
import { RoutingModule } from "./modules/routing";
import { VenuesModule } from "./modules/venues";
import type { MapAbleConfig } from "./types";

const DEFAULT_BASE_URL = "https://api.mapable.com.au";

/** Narrow request surface shared with child modules. */
export interface MapAbleRequestClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

/**
 * Official MapAble platform SDK client.
 * Authenticates with a Bearer API key and exposes domain modules
 * (routing, venues, billing).
 */
export class MapAble implements MapAbleRequestClient {
  readonly routing: RoutingModule;
  readonly venues: VenuesModule;
  readonly billing: BillingModule;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: MapAbleConfig) {
    if (!config.apiKey) {
      throw new Error("MapAbleConfig.apiKey is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.routing = new RoutingModule(this);
    this.venues = new VenuesModule(this);
    this.billing = new BillingModule(this);
  }

  /**
   * Internal HTTP helper wrapping isomorphic `globalThis.fetch`.
   * Injects `Authorization: Bearer [apiKey]` on every request.
   */
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = new Headers(init.headers);

    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    if (init.body != null && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await globalThis.fetch(url, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `MapAble API request failed (${response.status} ${response.statusText})${
          body ? `: ${body}` : ""
        }`
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
