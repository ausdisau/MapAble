import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { availableHealthcareCoachProviders } from "@/lib/telehealth/healthcare-coach-providers";
import { practiceScenarios } from "@/packages/contracts/src/healthcare-practice-coach";

import { POST } from "../app/telehealth/preview/coach/route";

const host = "127.0.0.1:3000";
const origin = `http://${host}`;

function request(body: unknown, requestOrigin = origin) {
  return new Request(`${origin}/telehealth/preview/coach`, {
    method: "POST",
    headers: {
      host,
      origin: requestOrigin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function claudeMessage(replyId: string, stopReason = "end_turn") {
  return Response.json({
    id: "synthetic-message",
    type: "message",
    role: "assistant",
    model: "claude-haiku-5-5",
    content: [{ type: "text", text: JSON.stringify({ replyId }) }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: 34, output_tokens: 8 },
  });
}

function museCompletion(replyId: string) {
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
    usage: { prompt_tokens: 34, completion_tokens: 8, total_tokens: 42 },
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("MAPABLE_HEALTHCARE_PREVIEW_ENABLED", "true");
  vi.stubEnv("MAPABLE_HEALTHCARE_CLAUDE_ENABLED", "true");
  vi.stubEnv("ANTHROPIC_API_KEY", "synthetic-claude-test-key");
  vi.stubEnv("ANTHROPIC_AUTH_TOKEN", "synthetic-unrelated-token");
  vi.stubEnv("ANTHROPIC_BASE_URL", "https://unrelated.example");
  vi.stubEnv("MAPABLE_HEALTHCARE_MUSE_ENABLED", "false");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Claude in the healthcare practice coach", () => {
  it("requires both an opted-in provider and a local development request", async () => {
    const send = vi.fn();
    vi.stubGlobal("fetch", send);
    const body = { scenario: "moreTime", provider: "claude" };
    expect(availableHealthcareCoachProviders(host)).toEqual(["claude"]);
    expect(availableHealthcareCoachProviders("remote.example")).toEqual([]);
    expect((await POST(request(body, "https://remote.example"))).status).toBe(
      404,
    );

    vi.stubEnv("NODE_ENV", "production");
    expect(availableHealthcareCoachProviders(host)).toEqual([]);
    expect((await POST(request(body))).status).toBe(404);

    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MAPABLE_HEALTHCARE_MUSE_ENABLED", "true");
    vi.stubEnv("MODEL_API_KEY", "synthetic-muse-test-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(availableHealthcareCoachProviders(host)).toEqual(["muse"]);
    expect((await POST(request(body))).status).toBe(404);

    vi.stubEnv("MAPABLE_HEALTHCARE_CLAUDE_ENABLED", "false");
    vi.stubEnv("ANTHROPIC_API_KEY", "synthetic-claude-test-key");
    expect((await POST(request(body))).status).toBe(404);
    expect(send).not.toHaveBeenCalled();
  });

  it("validates the provider and rejects any extra fields before sending a request", async () => {
    const send = vi.fn();
    vi.stubGlobal("fetch", send);
    expect(
      (
        await POST(
          request({
            scenario: "moreTime",
            provider: "claude",
            appointmentId: "test-only",
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (await POST(request({ scenario: "moreTime", provider: "constructor" })))
        .status,
    ).toBe(400);
    expect(
      (await POST(request({ scenario: "moreTime", provider: null }))).status,
    ).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("uses the official SDK with only the authored phrase, reply options and a closed schema", async () => {
    const send = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      claudeMessage("noRush"),
    );
    vi.stubGlobal("fetch", send);

    const response = await POST(
      request({ scenario: "moreTime", provider: "claude" }),
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      source: "claude",
      text: practiceScenarios.moreTime.replies[1].text,
    });
    expect(send).toHaveBeenCalledTimes(1);

    const [url, init] = send.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://api.anthropic.com/v1/messages");
    const headers = new Headers(init?.headers);
    expect(headers.get("anthropic-version")).toBe("2026-10-21");
    expect(headers.get("authorization")).toBe(
      "Bearer synthetic-claude-test-key",
    );
    expect(headers.has("x-api-key")).toBe(false);
    expect(init?.redirect).toBe("error");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      model: "claude-haiku-5-5",
      max_tokens: 256,
      thinking: { type: "disabled" },
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              replyId: { type: "string", enum: ["pause", "noRush"] },
            },
            required: ["replyId"],
            additionalProperties: false,
          },
        },
      },
    });
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("user");
    expect(JSON.parse(body.messages[0].content)).toEqual(
      practiceScenarios.moreTime,
    );
    expect(body).not.toHaveProperty("tools");
    expect(body).not.toHaveProperty("metadata");
  });

  it("keeps successful selections separate for Claude and Muse, including legacy Muse requests", async () => {
    vi.stubEnv("MAPABLE_HEALTHCARE_MUSE_ENABLED", "true");
    vi.stubEnv("MODEL_API_KEY", "synthetic-muse-test-key");
    const send = vi.fn(async (url: RequestInfo | URL) =>
      String(url).startsWith("https://api.anthropic.com")
        ? claudeMessage("waitForText")
        : museCompletion("type"),
    );
    vi.stubGlobal("fetch", send);

    const [claude, muse] = await Promise.all([
      POST(request({ scenario: "typeResponse", provider: "claude" })),
      POST(request({ scenario: "typeResponse" })),
    ]);
    expect(await claude.json()).toEqual({
      source: "claude",
      text: practiceScenarios.typeResponse.replies[1].text,
    });
    expect(await muse.json()).toEqual({
      source: "muse",
      text: practiceScenarios.typeResponse.replies[0].text,
    });

    const cached = await POST(
      request({ scenario: "typeResponse", provider: "muse" }),
    );
    expect(await cached.json()).toMatchObject({ source: "muse" });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("falls back for invalid output, refusal and network failure, then allows an explicit retry", async () => {
    const send = vi
      .fn()
      .mockImplementationOnce(async () =>
        claudeMessage("outsideApprovedReplies"),
      )
      .mockImplementationOnce(async () => claudeMessage("writeIt", "refusal"))
      .mockRejectedValueOnce(new TypeError("synthetic network error"))
      .mockImplementationOnce(async () => claudeMessage("writeIt"));
    vi.stubGlobal("fetch", send);
    const body = { scenario: "repeat", provider: "claude" };
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await POST(request(body));
      expect(await result.json()).toEqual({
        source: "sample",
        text: practiceScenarios.repeat.replies[0].text,
      });
    }
    const result = await POST(request(body));
    expect(await result.json()).toEqual({
      source: "claude",
      text: practiceScenarios.repeat.replies[1].text,
    });
    expect(send).toHaveBeenCalledTimes(4);
  });
});
