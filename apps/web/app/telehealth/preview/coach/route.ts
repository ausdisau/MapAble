import { readBoundedRequestBody } from "@/lib/security/read-bounded-body";
import {
  getHealthcareCoachKeys,
  selectHealthcareCoachReply,
} from "@/lib/telehealth/healthcare-coach-providers";
import {
  isPracticeCoachProvider,
  isPracticeScenario,
  practiceScenarios,
  type PracticeCoachProvider,
  type PracticeScenario,
} from "@/packages/contracts/src/healthcare-practice-coach";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };

const replies = new Map<
  `${PracticeCoachProvider}:${PracticeScenario}`,
  ReturnType<typeof selectHealthcareCoachReply>
>();

function unavailable() {
  return Response.json(
    { error: "Practice coach unavailable." },
    { status: 404, headers },
  );
}

function invalidPhrase() {
  return Response.json(
    { error: "Choose a practice phrase and provider." },
    { status: 400, headers },
  );
}

export async function POST(request: Request) {
  const keys = getHealthcareCoachKeys(request.headers);
  if (!keys.size) return unavailable();

  if (request.headers.get("content-type") !== "application/json")
    return invalidPhrase();

  const body = await readBoundedRequestBody(request, { maxBytes: 80 });
  if (!body.ok) return invalidPhrase();

  let payload: unknown;
  try {
    payload = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(body.bytes),
    );
  } catch {
    return invalidPhrase();
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("scenario" in payload) ||
    !isPracticeScenario(payload.scenario)
  ) {
    return invalidPhrase();
  }

  const hasProvider = "provider" in payload;
  const provider = "provider" in payload ? payload.provider : "muse";
  if (
    !isPracticeCoachProvider(provider) ||
    Object.keys(payload).length !== (hasProvider ? 2 : 1)
  ) {
    return invalidPhrase();
  }

  const apiKey = keys.get(provider);
  if (!apiKey) return unavailable();

  const { scenario } = payload;
  const cacheKey = `${provider}:${scenario}` as const;
  let reply = replies.get(cacheKey);
  if (!reply) {
    reply = selectHealthcareCoachReply(provider, scenario, apiKey).catch(
      () => undefined,
    );
    replies.set(cacheKey, reply);
  }

  const selected = await reply;
  if (!selected && replies.get(cacheKey) === reply) replies.delete(cacheKey);

  return Response.json(
    {
      source: selected ? provider : "sample",
      text: selected ?? practiceScenarios[scenario].replies[0].text,
    },
    { headers },
  );
}
