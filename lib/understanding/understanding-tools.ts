import { tool } from "ai";
import { z } from "zod";

import { listInformalSupports } from "@/lib/understanding/informal-support-service";
import { buildParticipantKnowledgeGraph } from "@/lib/understanding/knowledge-graph-service";
import {
  computeLivingArrangementRiskSignal,
  getLivingArrangementRiskSignal,
} from "@/lib/understanding/relationship-risk-service";

export function createUnderstandingTools(participantId: string) {
  return {
    getParticipantKnowledgeGraph: tool({
      description:
        "Load the participant knowledge graph projecting goals, routines, events, contexts, and informal supports.",
      inputSchema: z.object({}),
      execute: async () => buildParticipantKnowledgeGraph(participantId),
    }),
    listInformalSupports: tool({
      description:
        "List informal support links (family/carers) and capacity/stability trends.",
      inputSchema: z.object({}),
      execute: async () => ({ supports: await listInformalSupports(participantId) }),
    }),
    getLivingArrangementRiskSignal: tool({
      description:
        "Return the living-arrangement risk *signal* for human review. Never treat as SDA/SIL eligibility.",
      inputSchema: z.object({
        recompute: z.boolean().optional(),
        livingAloneHint: z.boolean().optional(),
      }),
      execute: async ({ recompute, livingAloneHint }) => {
        if (recompute) {
          return computeLivingArrangementRiskSignal(participantId, {
            livingAloneHint,
            persist: true,
          });
        }
        const existing = await getLivingArrangementRiskSignal(participantId);
        if (existing) return existing;
        return computeLivingArrangementRiskSignal(participantId, {
          livingAloneHint,
          persist: true,
        });
      },
    }),
  };
}
