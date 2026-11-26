import { afterEach, describe, expect, it, vi } from "vitest";

import { isHealthcareMediaLabRequest } from "@/lib/telehealth/healthcare-media-lab";
import {
  maxMessageLength,
  quickPhrases,
  startHealthcarePreview,
  updateHealthcarePreview,
  type VisitAction,
} from "@/packages/contracts/src/healthcare-preview";

function replay(...actions: VisitAction[]) {
  return actions.reduce(updateHealthcarePreview, startHealthcarePreview());
}

const acknowledged = { type: "acknowledge", value: true } as const;
const waiting = { type: "enterWaitingRoom" } as const;
const admit = { type: "simulateAdmission" } as const;
const join = { type: "joinConsultation" } as const;

describe("the healthcare practice visit", () => {
  it("requires acknowledgement, admission and the participant’s decision to join", () => {
    expect(replay(waiting, admit, join).stage).toBe("prepare");
    expect(replay(acknowledged, waiting, join).stage).toBe("waiting");
    expect(replay(acknowledged, waiting, admit).stage).toBe("waiting");
    expect(replay(acknowledged, waiting, admit, join).stage).toBe(
      "consultation",
    );
  });

  it("can change to text without carrying a former admission forward", () => {
    const state = replay(
      acknowledged,
      waiting,
      admit,
      { type: "returnToPreparation" },
      { type: "chooseMode", mode: "text" },
      waiting,
      join,
    );
    expect(state).toMatchObject({
      stage: "prepare",
      mode: "text",
      admitted: false,
      acknowledged: false,
    });
  });

  it("keeps communication preferences local until sharing is chosen and clears it on leave", () => {
    const selections = replay({ type: "toggleAccess", option: "typing" });
    const shared = updateHealthcarePreview(selections, {
      type: "shareAccess",
      share: true,
    });
    const ended = [
      acknowledged,
      waiting,
      admit,
      join,
      { type: "leave" } as const,
    ].reduce(updateHealthcarePreview, shared);

    expect(selections).toMatchObject({
      access: ["typing"],
      shareAccess: false,
    });
    expect(shared.shareAccess).toBe(true);
    expect(ended).toMatchObject({
      stage: "complete",
      shareAccess: false,
      messages: [],
    });
  });

  it("accepts a quick AAC phrase only in the room, caps text and clears messages on exit", () => {
    const message = { type: "sendMessage", text: quickPhrases[0] } as const;
    expect(replay(message).messages).toEqual([]);
    const conversation = replay(
      acknowledged,
      waiting,
      admit,
      join,
      { type: "sendMessage", text: " ".repeat(5) },
      { type: "sendMessage", text: "a".repeat(maxMessageLength + 1) },
      message,
    );

    expect(
      conversation.messages.filter((item) => item.speaker === "You"),
    ).toEqual([expect.objectContaining({ text: quickPhrases[0] })]);
    expect(
      updateHealthcarePreview(conversation, { type: "leave" }).messages,
    ).toEqual([]);
  });
});

describe("the local media lab request boundary", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rejects production, cross-site and non-loopback token requests", () => {
    vi.stubEnv("MAPABLE_HEALTHCARE_PREVIEW_ENABLED", "true");
    vi.stubEnv("MAPABLE_HEALTHCARE_MEDIA_LAB_ENABLED", "true");
    const local = new Headers({
      host: "127.0.0.1:3000",
      origin: "http://127.0.0.1:3000",
      "sec-fetch-site": "same-origin",
    });

    vi.stubEnv("NODE_ENV", "production");
    expect(isHealthcareMediaLabRequest(local)).toBe(false);

    vi.stubEnv("NODE_ENV", "development");
    expect(isHealthcareMediaLabRequest(local)).toBe(true);

    local.set("origin", "http://attacker.example");
    expect(isHealthcareMediaLabRequest(local)).toBe(false);

    local.set("origin", "http://127.0.0.1:3000");
    local.set("sec-fetch-site", "cross-site");
    expect(isHealthcareMediaLabRequest(local)).toBe(false);

    local.set("sec-fetch-site", "same-origin");
    local.set("host", "app.example");
    local.set("origin", "http://app.example");
    expect(isHealthcareMediaLabRequest(local)).toBe(false);
  });
});
