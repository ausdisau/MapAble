import { postJson, type ServiceContext, type ServiceResult } from "./types";

export interface NlpIntent {
  intent: string;
  entities: Record<string, string>;
  confidence: number;
}

export interface NlpAnalyzeRequest {
  text: string;
  locale?: string;
}

export function createNlpService(ctx: ServiceContext) {
  return {
    analyze(req: NlpAnalyzeRequest): Promise<ServiceResult<NlpIntent>> {
      return postJson<NlpIntent>(`${ctx.endpoint}/analyze`, req);
    },
  };
}
