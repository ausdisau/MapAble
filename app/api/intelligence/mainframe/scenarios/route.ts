import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { SyntheticMainframeError } from "@/lib/intelligence/mainframe/config/synthetic-guard";
import { syntheticScenarios } from "@/lib/intelligence/mainframe/fixtures/care-transport-scenarios";
import { runSyntheticMainframe } from "@/lib/intelligence/mainframe/orchestrator/mainframe-orchestrator";

export async function GET() {
  const user = await requireApiPermission("admin:agent-runs:read");
  if (user instanceof Response) return user;
  return jsonOk({
    scenarios: Object.values(syntheticScenarios).map(({ id, goal }) => ({ id, goal })),
  });
}

export async function POST(request: Request) {
  const user = await requireApiPermission("admin:agent-runs:read");
  if (user instanceof Response) return user;
  const id = (await request.json().catch(() => ({}))).id;
  const scenario = Object.values(syntheticScenarios).find((item) => item.id === id);
  if (!scenario) return jsonError("SYNTHETIC_SCENARIO_NOT_FOUND", 404);
  try {
    return jsonOk({ scenario: scenario.id, outcome: runSyntheticMainframe(scenario) });
  } catch (error) {
    if (error instanceof SyntheticMainframeError) return jsonError(error.code, 503);
    return jsonError("SYNTHETIC_MAINFRAME_FAILED", 400);
  }
}
