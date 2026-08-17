import type { NdisClaimingAdapter } from "@/lib/ndis/claiming/types";

const NOT_CONFIGURED = "NDIA API access not configured";

/**
 * Future approved NDIA API adapter — stub only; no live credentials or scraping.
 */
export class NdiaApiAdapterStub implements NdisClaimingAdapter {
  async submitClaimBatch(_batchId: string): Promise<{ externalReference?: string }> {
    throw new Error(NOT_CONFIGURED);
  }

  async getClaimStatus(_externalReference: string): Promise<{ status: string }> {
    throw new Error(NOT_CONFIGURED);
  }

  async getParticipantBudget(_participantNumber: string): Promise<unknown> {
    throw new Error(NOT_CONFIGURED);
  }

  async getProviderRelationshipStatus(
    _participantNumber: string,
    _providerRegistrationNumber: string
  ): Promise<{ status: string }> {
    throw new Error(NOT_CONFIGURED);
  }
}

export const ndiaApiAdapterStub = new NdiaApiAdapterStub();
