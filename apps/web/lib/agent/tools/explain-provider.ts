import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";

export type ExplainProviderResult = {
  found: boolean;
  summary: string;
  provider?: {
    source_id: string;
    provider_name: string;
    suburb: string | null;
    state: string | null;
    postcode: string | null;
    services: string[];
    registration_groups: string[];
    website: string | null;
    phone: string | null;
  };
};

/** Summarise an NDIS provider listing for agent tool output. */
export async function explainProvider(input: {
  providerName: string;
  sourceId?: string;
}): Promise<ExplainProviderResult> {
  const name = input.providerName.trim();
  if (!name && !input.sourceId) {
    return { found: false, summary: "No provider name or id supplied." };
  }

  const { providers } = await searchNdisProviders({
    q: name || undefined,
    limit: 5,
  });

  const match =
    (input.sourceId
      ? providers.find((p) => p.source_id === input.sourceId)
      : undefined) ?? providers[0];

  if (!match) {
    return {
      found: false,
      summary: `No NDIS directory listing found for "${name || input.sourceId}".`,
    };
  }

  const location = [match.suburb, match.state, match.postcode]
    .filter(Boolean)
    .join(", ");

  const services =
    match.services.length > 0
      ? match.services.slice(0, 5).join("; ")
      : "Services not listed in export";

  const summary = [
    `${match.provider_name} is registered in the NDIS provider directory export.`,
    location ? `Location: ${location}.` : null,
    `Services: ${services}.`,
    match.registration_groups.length > 0
      ? `Registration groups: ${match.registration_groups.slice(0, 4).join(", ")}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    found: true,
    summary,
    provider: {
      source_id: match.source_id,
      provider_name: match.provider_name,
      suburb: match.suburb,
      state: match.state,
      postcode: match.postcode,
      services: match.services,
      registration_groups: match.registration_groups,
      website: match.website,
      phone: match.phone,
    },
  };
}
