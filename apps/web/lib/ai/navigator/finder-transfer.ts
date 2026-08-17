import { touchProviderFinderSession } from "@/lib/ai/agent-sessions/provider-finder-session";
import {
  transferFiltersPayloadSchema,
  type GovernedEnvelopeAction,
} from "@/lib/ai/navigator/envelopes/schema";
import {
  buildFinderSearchParams,
  type AppliedSearchFields,
} from "@/lib/search/apply-interpretation";

export type FinderTransferResult = {
  finderPath: string;
  finderUrl: string;
  sessionId: string;
  applied: AppliedSearchFields;
};

/**
 * Materialise approved Navigator filters into Provider Finder session + URL.
 * Never books or mutates provider records — discovery handoff only.
 */
export function materialiseFinderTransfer(input: {
  payload: unknown;
  sessionId?: string;
}): FinderTransferResult {
  const payload = transferFiltersPayloadSchema.parse(input.payload);
  const applied: AppliedSearchFields = {
    query: payload.query?.trim() ?? "",
    location: payload.location?.trim() ?? "",
    providerName: payload.providerName?.trim() ?? "",
    serviceQuery: payload.serviceQuery?.trim() ?? "",
    accessQuery: payload.accessQuery?.trim() ?? "",
    supportType: null,
    accessNeedIds: [],
  };

  const sessionId =
    input.sessionId?.trim() || `navigator-transfer-${Date.now().toString(36)}`;

  touchProviderFinderSession(sessionId, {
    sessionId,
    cumulativeApplied: applied,
    turnIndex: 0,
  });

  const params = buildFinderSearchParams(applied);
  params.set("sessionId", sessionId);
  params.set("from", "navigator-pilot");
  const qs = params.toString();
  const finderPath = qs ? `/provider-finder?${qs}` : "/provider-finder";

  return {
    finderPath,
    finderUrl: finderPath,
    sessionId,
    applied,
  };
}

export function isTransferFiltersAction(
  action: string,
): action is Extract<GovernedEnvelopeAction, "transfer_filters_to_finder"> {
  return action === "transfer_filters_to_finder";
}
