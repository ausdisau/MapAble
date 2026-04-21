import { postJson, type ServiceContext, type ServiceResult } from "./types";

export interface ContractDraft {
  id: string;
  title: string;
  parties: string[];
  status: "draft" | "pending" | "signed";
}

export function createContractsService(ctx: ServiceContext) {
  return {
    create(payload: { templateId: string; parties: string[] }): Promise<ServiceResult<ContractDraft>> {
      return postJson<ContractDraft>(`${ctx.endpoint}/create`, payload);
    },
    sign(payload: { contractId: string; signature: string }): Promise<ServiceResult<ContractDraft>> {
      return postJson<ContractDraft>(`${ctx.endpoint}/sign`, payload);
    },
  };
}
