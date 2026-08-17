import { z } from "zod";

import {
  DISABILITY_AGENT_OPERATIONS,
  disabilityAgentJsonError,
  disabilityAgentJsonOk,
} from "@/lib/api/disability-agent-api-contract";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";

const OPERATION = DISABILITY_AGENT_OPERATIONS.ndisProviderSearch;

const querySchema = z.object({
  q: z.string().optional(),
  state: z.string().max(8).optional(),
  postcode: z.string().max(16).optional(),
  service: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (
    !checkIpRateLimit(`providers-ndis-search:${ip}`, {
      windowMs: 60_000,
      max: 60,
    })
  ) {
    return disabilityAgentJsonError(OPERATION, 429, {
      error: "Too many requests. Please wait a moment.",
      code: "RATE_LIMITED",
      retryable: true,
    });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    postcode: searchParams.get("postcode") ?? undefined,
    service: searchParams.get("service") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return disabilityAgentJsonError(OPERATION, 400, {
      error: "Invalid query parameters",
      code: "VALIDATION_ERROR",
      details: parsed.error.flatten(),
      retryable: false,
    });
  }

  try {
    const { q, state, postcode, service, limit } = parsed.data;
    const { providers, count } = await searchNdisProviders({
      q,
      state,
      postcode,
      service,
      limit: limit ?? 25,
    });

    const filters_applied = {
      q: q ?? null,
      state: state ?? null,
      postcode: postcode ?? null,
      service: service ?? null,
      limit: limit ?? 25,
    };

    return disabilityAgentJsonOk(OPERATION, {
      operationId: OPERATION,
      providers: providers.map((p) => ({
        source_id: p.source_id,
        provider_name: p.provider_name,
        suburb: p.suburb,
        state: p.state,
        postcode: p.postcode,
        phone: p.phone,
        email: p.email,
        website: p.website,
        services: p.services,
        registration_groups: p.registration_groups,
        latitude: p.latitude,
        longitude: p.longitude,
        updated_at: p.updated_at.toISOString(),
      })),
      count,
      filters_applied,
    });
  } catch (err) {
    console.error("[ndis-provider-search]", err);
    return disabilityAgentJsonError(OPERATION, 502, {
      error: "NDIS provider search failed.",
      code: "UPSTREAM_ERROR",
      retryable: true,
    });
  }
}
