import { tool } from "ai";
import { z } from "zod";

import { explainProvider } from "@/lib/agent/tools/explain-provider";
import { geocodeLocation } from "@/lib/agent/tools/geocode-location";
import {
  TOOL_EXPLAIN_PROVIDER,
  TOOL_GEOCODE_LOCATION,
  TOOL_INTERPRET_FINDER_QUERY,
  TOOL_SEARCH_NDIS_PROVIDERS,
} from "@/lib/agent/tools/index";
import { disabilityServicesAgentConfig } from "@/lib/config/disability-services-agent";
import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";
import {
  buildNdisSearchParamsFromApplied,
  ndisRowToCopilotResult,
} from "@/lib/provider-finder/ndis-search-from-applied";
import { applyInterpretationToFields } from "@/lib/search/apply-interpretation";
import { interpretSearchQuery } from "@/lib/search/interpreter";

export const disabilityServicesToolNames = {
  interpretFinderQuery: TOOL_INTERPRET_FINDER_QUERY,
  searchNdisProviders: TOOL_SEARCH_NDIS_PROVIDERS,
  geocodeLocation: TOOL_GEOCODE_LOCATION,
  explainProvider: TOOL_EXPLAIN_PROVIDER,
} as const;

export function createDisabilityServicesTools() {
  return {
    [TOOL_INTERPRET_FINDER_QUERY]: tool({
      description:
        "Parse natural-language NDIS provider search text into structured filters (location, service, access needs, provider name) and a canonical service category slug.",
      inputSchema: z.object({
        query: z.string().min(1).describe("User search or question text"),
      }),
      execute: async ({ query }) => {
        const interpretation = await interpretSearchQuery(query);
        const applied = applyInterpretationToFields(interpretation, {
          query: "",
          location: "",
          providerName: "",
          serviceQuery: "",
          accessQuery: "",
        });
        return {
          interpretation,
          applied,
        };
      },
    }),

    [TOOL_SEARCH_NDIS_PROVIDERS]: tool({
      description:
        "Search the NDIS provider directory export by keywords, suburb, state, postcode, or service type.",
      inputSchema: z.object({
        q: z.string().optional().describe("Keywords or provider name"),
        state: z.string().max(8).optional().describe("Australian state code"),
        postcode: z.string().max(16).optional(),
        service: z.string().max(200).optional(),
        limit: z.number().int().min(1).max(25).optional(),
      }),
      execute: async (input) => {
        const limit =
          input.limit ?? disabilityServicesAgentConfig.resultsLimit;
        const { providers, count } = await searchNdisProviders({
          q: input.q,
          state: input.state,
          postcode: input.postcode,
          service: input.service,
          limit,
        });
        return {
          count,
          providers: providers.map((p) => ({
            source_id: p.source_id,
            provider_name: p.provider_name,
            suburb: p.suburb,
            state: p.state,
            postcode: p.postcode,
            services: p.services,
            latitude: p.latitude,
            longitude: p.longitude,
          })),
        };
      },
    }),

    [TOOL_GEOCODE_LOCATION]: tool({
      description:
        "Geocode an Australian suburb, city, or postcode to latitude/longitude for map and proximity context.",
      inputSchema: z.object({
        location: z.string().min(1).describe("Australian location text"),
      }),
      execute: async ({ location }) => geocodeLocation(location),
    }),

    [TOOL_EXPLAIN_PROVIDER]: tool({
      description:
        "Summarise a specific NDIS provider listing (services, location, registration groups) from the directory export.",
      inputSchema: z.object({
        providerName: z.string().min(1),
        sourceId: z.string().optional(),
      }),
      execute: async (input) => explainProvider(input),
    }),
  };
}

/** Run interpret + NDIS search in one shot (used by deterministic agent fallback). */
export async function runInterpretAndSearch(query: string) {
  const interpretation = await interpretSearchQuery(query);
  const applied = applyInterpretationToFields(interpretation, {
    query: "",
    location: "",
    providerName: "",
    serviceQuery: "",
    accessQuery: "",
  });
  const params = buildNdisSearchParamsFromApplied(
    applied,
    interpretation,
    { limit: disabilityServicesAgentConfig.resultsLimit },
  );
  const { providers, count } = await searchNdisProviders(params);
  return {
    interpretation,
    applied,
    results: providers.map(ndisRowToCopilotResult),
    count,
  };
}
