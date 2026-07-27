import { postJson, type ServiceContext, type ServiceResult } from "./types";

export interface MatchCandidate {
  id: string;
  name: string;
  score: number;
  reasons: string[];
}

export interface MatchRequest {
  participantId?: string;
  serviceType: string;
  filters?: Record<string, string | number | boolean>;
}

export function createMatchingService(ctx: ServiceContext) {
  return {
    findMatches(req: MatchRequest): Promise<ServiceResult<MatchCandidate[]>> {
      return postJson<MatchCandidate[]>(`${ctx.endpoint}/find`, req);
    },
  };
}
