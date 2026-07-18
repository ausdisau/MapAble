import { jsonError, jsonOk } from "@/lib/api/response";
import { missionCopilotConfig } from "@/lib/config/mission-copilot";
import {
  answerMissionQuestion,
  type MissionCopilotQuestion,
} from "@/lib/mission-copilot";
import {
  createStartingWorkJourney,
  runGoldenJourney,
  type JourneyFailureMode,
} from "@/lib/pilot/starting-work/golden-journey";

const QUESTIONS = new Set<MissionCopilotQuestion>([
  "what_happens_next",
  "what_changed",
  "what_remains_unknown",
  "is_worker_ready",
  "is_vehicle_confirmed",
  "passport_acknowledged",
  "what_is_blocked",
  "what_needs_my_decision",
  "who_is_responsible",
  "what_evidence_supports_this",
  "what_if_dependency_fails",
  "easy_read",
  "prepare_provider_questions",
]);

export async function POST(req: Request) {
  if (!missionCopilotConfig.enabled) {
    return jsonError("Mission Copilot is disabled", 404);
  }

  const body = (await req.json().catch(() => ({}))) as {
    question?: string;
    failureMode?: JourneyFailureMode;
    useInitial?: boolean;
  };

  const question = body.question as MissionCopilotQuestion | undefined;
  if (!question || !QUESTIONS.has(question)) {
    return jsonError("Invalid or missing question", 400);
  }

  const journey = body.useInitial
    ? createStartingWorkJourney()
    : runGoldenJourney({ failureMode: body.failureMode });

  const result = answerMissionQuestion({ question, journey });
  if ("disabled" in result) {
    return jsonError(result.reason, 404);
  }

  return jsonOk({
    ...result,
    notice: "No action was taken. READ_ONLY_EXPLAIN only.",
  });
}
