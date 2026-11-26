import { readBoundedRequestBody } from "@/lib/security/read-bounded-body";
import {
  getHealthcareMuseRequestKey,
  selectMusePracticeReply,
} from "@/lib/telehealth/healthcare-muse";
import {
  isPracticeScenario,
  practiceScenarios,
  type PracticeScenario,
} from "@/packages/contracts/src/healthcare-practice-coach";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };

const replies = new Map<
  PracticeScenario,
  ReturnType<typeof selectMusePracticeReply>
>();

export async function POST(request: Request) {
  const apiKey = getHealthcareMuseRequestKey(request.headers);
  if (!apiKey)
    return Response.json(
      { error: "Practice coach unavailable." },
      { status: 404, headers },
    );

  if (request.headers.get("content-type") !== "application/json") {
    return Response.json(
      { error: "Choose a practice phrase." },
      { status: 400, headers },
    );
  }

  const body = await readBoundedRequestBody(request, { maxBytes: 80 });
  const payload: unknown = body.ok
    ? await new Response(new TextDecoder().decode(body.bytes))
        .json()
        .catch(() => undefined)
    : undefined;

  if (
    !payload ||
    typeof payload !== "object" ||
    !("scenario" in payload) ||
    Object.keys(payload).length !== 1 ||
    !isPracticeScenario(payload.scenario)
  ) {
    return Response.json(
      { error: "Choose a practice phrase." },
      { status: 400, headers },
    );
  }

  const { scenario } = payload;
  let reply = replies.get(scenario);
  if (!reply) {
    reply = selectMusePracticeReply(scenario, apiKey).catch(() => undefined);
    replies.set(scenario, reply);
  }

  const selected = await reply;
  if (!selected && replies.get(scenario) === reply) replies.delete(scenario);

  return Response.json(
    {
      source: selected ? "muse" : "sample",
      text: selected ?? practiceScenarios[scenario].replies[0].text,
    },
    { headers },
  );
}
