import { postJson, type ServiceContext, type ServiceResult } from "./types";

export interface Attestation {
  id: string;
  subject: string;
  claim: string;
  issuedAt: string;
  verified: boolean;
}

export function createAttestationsService(ctx: ServiceContext) {
  return {
    issue(payload: { subject: string; claim: string }): Promise<ServiceResult<Attestation>> {
      return postJson<Attestation>(`${ctx.endpoint}/issue`, payload);
    },
    verify(payload: { attestationId: string }): Promise<ServiceResult<Attestation>> {
      return postJson<Attestation>(`${ctx.endpoint}/verify`, payload);
    },
  };
}
