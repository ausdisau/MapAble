import type { MapAbleRequestClient } from "../client";
import { fetchAllCursorPages, getJson } from "../http";
import type {
  CareOsAccessPlace,
  CareOsCareShift,
  CareOsCursorPage,
  CareOsListOptions,
  CareOsParticipantSummary,
  CareOsWebhookSubscription,
} from "../types";

/**
 * CareOS Open API v1 module — mirrors docs/api/openapi-careos-v1.yaml
 * and app/api/v1/{participants,care,access,webhooks}.
 * Composes getJson / cursor helpers on the shared MapAble client.
 */
export class CareOsModule {
  constructor(private readonly client: MapAbleRequestClient) {}

  private participantHeaders(
    participantId: string
  ): Record<string, string> {
    return { "X-Participant-Id": participantId };
  }

  /** GET /api/v1/participants */
  listParticipants(
    participantId: string,
    options: CareOsListOptions = {}
  ): Promise<{
    participants: CareOsParticipantSummary[];
    page: CareOsCursorPage;
  }> {
    const params = new URLSearchParams();
    if (options.limit != null) params.set("limit", String(options.limit));
    if (options.cursor) params.set("cursor", options.cursor);
    const qs = params.toString();
    return getJson(this.client, `/api/v1/participants${qs ? `?${qs}` : ""}`, {
      headers: this.participantHeaders(participantId),
    });
  }

  /** Drain all participant authority pages. */
  async listAllParticipants(
    participantId: string,
    limit = 25
  ): Promise<CareOsParticipantSummary[]> {
    return fetchAllCursorPages(async (cursor) => {
      const res = await this.listParticipants(participantId, { limit, cursor });
      return { items: res.participants, page: res.page };
    });
  }

  /** GET /api/v1/care */
  listCare(
    participantId: string
  ): Promise<{ care?: CareOsCareShift[]; shifts?: CareOsCareShift[] }> {
    return getJson(this.client, "/api/v1/care", {
      headers: this.participantHeaders(participantId),
    });
  }

  /** GET /api/v1/access */
  listAccess(): Promise<{ places?: CareOsAccessPlace[]; access?: CareOsAccessPlace[] }> {
    return getJson(this.client, "/api/v1/access");
  }

  /** GET /api/v1/webhooks */
  listWebhooks(): Promise<{
    webhooks?: CareOsWebhookSubscription[];
    subscriptions?: CareOsWebhookSubscription[];
  }> {
    return getJson(this.client, "/api/v1/webhooks");
  }
}
