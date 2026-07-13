import { recordSyntheticAudit } from "../audit/synthetic-audit-log";
import { assertSyntheticOnly } from "../config/synthetic-guard";
import { syntheticRights } from "../fixtures/care-transport-scenarios";
import { parseDeterministicDraft } from "../model/gateway";
import { composeSyntheticCareTransportMission } from "../missions/care-transport-mission";
import { evaluateMainframePolicy } from "../policy/gateway";
import { getPrompt } from "../prompts/registry";
import type { MainframeOutcome } from "../types/deliberation-draft";
import type { MainframeContextManifest } from "../types/mainframe-context";

export function runSyntheticMainframe(params: {
  goal: string;
  context: MainframeContextManifest;
}): MainframeOutcome {
  assertSyntheticOnly(params.context.dataClassification);
  const draft = parseDeterministicDraft(
    composeSyntheticCareTransportMission(params.goal, syntheticRights)
  );
  const outcome = evaluateMainframePolicy({ context: params.context, goal: params.goal, draft });
  recordSyntheticAudit({
    requestId: params.context.requestId,
    promptHash: getPrompt("supervisor").manifest.contentHash,
    outcome: outcome.outcome,
    reasonCodes: outcome.reasonCodes,
    sourceIds: outcome.draft.evidenceReferences,
    threatSignals: outcome.draft.threatSignals,
    createdAt: new Date().toISOString(),
  });
  return outcome;
}
