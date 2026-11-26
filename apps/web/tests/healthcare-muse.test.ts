import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../app/telehealth/preview/coach/route";
import { practiceScenarios } from "../packages/contracts/src/healthcare-practice-coach";

const host = "127.0.0.1:3000";
const origin = `http://${host}`;
const mime = "application/json";

function coachRequest(body: unknown, requestOrigin = origin) {
  return new Request(`${origin}/telehealth/preview/coach`, {
    method: "POST",
    headers: { host, origin: requestOrigin, "Content-Type": mime },
    body: JSON.stringify(body),
  });
}

function completion(replyId: string) {
  return Response.json({
    id: "synthetic-completion",
    object: "chat.completion",
    model: "muse-spark-1.3",
    created: 0,
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: { role: "assistant", content: JSON.stringify({ replyId }) },
      },
    ],
    usage: { prompt_tokens: 30, completion_tokens: 6, total_tokens: 36 },
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("MAPABLE_HEALTHCARE_PREVIEW_ENABLED", "true");
  vi.stubEnv("MAPABLE_HEALTHCARE_MUSE_ENABLED", "true");
  vi.stubEnv("MODEL_API_KEY", "synthetic-test-credential");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("MapAble Healthcare Muse Spark practice coach", () => {
  it("keeps the adapter unavailable without an explicit local development configuration", async () => {
    const network = vi.fn();
    vi.stubGlobal("fetch", network);

    vi.stubEnv("MAPABLE_HEALTHCARE_MUSE_ENABLED", "false");
    expect((await POST(coachRequest({ scenario: "moreTime" }))).status).toBe(
      404,
    );

    vi.stubEnv("MAPABLE_HEALTHCARE_MUSE_ENABLED", "true");
    expect(
      (
        await POST(
          coachRequest({ scenario: "moreTime" }, "https://another.example"),
        )
      ).status,
    ).toBe(404);

    vi.stubEnv("NODE_ENV", "production");
    expect((await POST(coachRequest({ scenario: "moreTime" }))).status).toBe(
      404,
    );
    expect(network).not.toHaveBeenCalled();
  });

  it("rejects extra information and unknown practice identifiers before using the SDK", async () => {
    const network = vi.fn();
    vi.stubGlobal("fetch", network);

    expect(
      (
        await POST(
          coachRequest({ scenario: "moreTime", message: "extra text" }),
        )
      ).status,
    ).toBe(400);
    expect((await POST(coachRequest({ scenario: "constructor" }))).status).toBe(
      400,
    );
    expect(
      (await POST(coachRequest({ scenario: "x".repeat(140) }))).status,
    ).toBe(400);
    expect(network).not.toHaveBeenCalled();
  });

  it("sends the documented Muse request and renders only an approved reply", async () => {
    const network = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        completion("waitForText"),
    );
    vi.stubGlobal("fetch", network);

    const request = { scenario: "typeResponse" };
    const reply = await POST(coachRequest(request));
    expect(reply.headers.get("cache-control")).toBe("no-store");
    expect(await reply.json()).toEqual({
      source: "muse",
      text: practiceScenarios.typeResponse.replies[1].text,
    });

    const repeat = await POST(coachRequest(request));
    expect(await repeat.json()).toMatchObject({ source: "muse" });
    expect(network).toHaveBeenCalledTimes(1);
    const [url, init] = network.mock.calls[0] ?? [];
    expect(url).toBe("https://api.meta.ai/v1/chat/completions");
    expect(new Headers(init?.headers).get("authorization")).toBe(
      "Bearer synthetic-test-credential",
    );
    expect(init?.redirect).toBe("error");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      model: "muse-spark-1.3",
      max_completion_tokens: 256,
      reasoning_effort: "minimal",
      response_format: { type: "json_schema" },
    });
    expect(JSON.parse(body.messages[1].content)).toEqual(
      practiceScenarios.typeResponse,
    );
  });

  it("uses a local sample when the model selects an unknown reply and allows a retry", async () => {
    const network = vi
      .fn()
      .mockImplementationOnce(async () => completion("outsideOptions"))
      .mockImplementationOnce(async () => completion("writeIt"));
    vi.stubGlobal("fetch", network);

    const initial = await POST(coachRequest({ scenario: "repeat" }));
    expect(await initial.json()).toEqual({
      source: "sample",
      text: practiceScenarios.repeat.replies[0].text,
    });
    const next = await POST(coachRequest({ scenario: "repeat" }));
    expect(await next.json()).toEqual({
      source: "muse",
      text: practiceScenarios.repeat.replies[1].text,
    });
    expect(network).toHaveBeenCalledTimes(2);
  });
});
