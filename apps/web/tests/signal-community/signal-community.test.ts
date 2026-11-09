import { describe, expect, it } from "vitest";

import { formHugAccessSurvey } from "@/lib/signal/community/formhug-schema";
import {
  DEMO_FORUM_TOPICS,
  SENSITIVE_CAPTURE_FIELDS,
  changeLocalTopicModeration,
  getSanitizedAnswers,
  isQuestionVisible,
  isSignalCommunityDemoEnabled,
  makeLocalReply,
  makeLocalTopic,
  summariseLocalSurvey,
  surveyAborted,
  surveyPages,
  validateFullSurvey,
  validateSurveyPage,
} from "@/lib/signal/community/engine";
import type { SurveyAnswers } from "@/lib/signal/community/types";

const good: SurveyAnswers = {
  field_3: "hjpY",  // consent to private review
  field_4: "8opO",  // a place
  field_5: "kkwD",  // own observation
  field_8: "Fictional library",
  field_9: "Example suburb",
  field_10: "eAJy", // NSW
  field_11: "O6zW", // civic facility
  field_12: "2026-11-09",
  field_16: "NRcQ", // no precise pin
  field_19: "3m4y", // entrance
  field_20: "FI6Y", // uncertain
  field_22: "JJen", // unsure about alternatives
  field_23: "ndjP", // time uncertainty
  field_24: "AzNk", // unsure hazard
  field_26: "FKV1", // method unsure
  field_31: "8WfI", // internal review only
  field_32: "eWlf", // no contact
};

describe("MapAble Signal FormHug source schema", () => {
  it("imports exactly the matching accessibility form without respondent records", () => {
    expect(formHugAccessSurvey.formToken).toBe("f50pAQ");
    expect(formHugAccessSurvey.formName).toMatch(/Community Accessibility Survey/);
    expect(formHugAccessSurvey.source).toBe("formhug_schema_only");
    expect(formHugAccessSurvey.fields).toHaveLength(34);
    expect(formHugAccessSurvey.rules).toHaveLength(4);
    expect(formHugAccessSurvey.entriesAtInspection).toBe(0);
    expect(formHugAccessSurvey.formToken).not.toBe("BRXNVn");
    expect(new Set(formHugAccessSurvey.fields.map((f) => f.apiCode)).size).toBe(34);
  });

  it("recreates four LimeSurvey-style pages with stable field codes", () => {
    const pages = surveyPages();
    expect(pages).toHaveLength(4);
    expect(pages.some((page) => page.questions.some((q) => q.apiCode === "field_3"))).toBe(true);
    expect(pages.some((page) => page.questions.some((q) => q.apiCode === "field_31"))).toBe(true);
  });

  it("blocks the survey if consent is declined", () => {
    expect(surveyAborted({ field_3: "X3ej" })).toBe(true);
    expect(validateFullSurvey({ ...good, field_3: "X3ej" })).not.toHaveLength(0);
    const question = formHugAccessSurvey.fields.find((f) => f.apiCode === "field_8");
    expect(question && isQuestionVisible(question, { field_3: "X3ej" })).toBe(false);
  });

  it("applies route, map-pin and optional email branching without leaking hidden answers", () => {
    const fields = formHugAccessSurvey.fields;
    const field = (id: string) => fields.find((f) => f.apiCode === id)!;
    expect(isQuestionVisible(field("field_14"), good)).toBe(false);
    expect(isQuestionVisible(field("field_14"), { ...good, field_4: "580J" })).toBe(true);
    expect(isQuestionVisible(field("field_17"), good)).toBe(false);
    expect(isQuestionVisible(field("field_17"), { ...good, field_16: "TYOQ" })).toBe(true);
    expect(isQuestionVisible(field("field_33"), { ...good, field_32: "oZ55" })).toBe(true);
    const clean = getSanitizedAnswers({
      ...good,
      field_14: "A private travel note",
      field_17: "private pin",
      field_28: "private image",
      field_29: "private voice",
      field_33: "private@example.org",
    });
    expect(clean.field_14).toBeUndefined();
    for (const code of SENSITIVE_CAPTURE_FIELDS) expect(clean[code]).toBeUndefined();
  });

  it("supports unknown and refuses to convert consent-to-consider into publication", () => {
    expect(validateFullSurvey(good)).toEqual([]);
    const result = summariseLocalSurvey({ ...good, field_31: "lDLp" });
    expect(result.publicConsiderationRequested).toBe(true);
    expect(result.publicRating).toBe("unknown");
    expect(result.publicationAllowed).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.submitted).toBe(false);
    expect(result.containsPersonalData).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/Fictional library|Example suburb/);
  });

  it("only allows direct measured widths from the measurement choice", () => {
    const pages = surveyPages();
    const observationPage = pages.find((page) =>
      page.questions.some((f) => f.apiCode === "field_27"))!;
    expect(validateSurveyPage(observationPage, { ...good, field_27: "900" })
      .some((e) => e.includes("Measured with a tool"))).toBe(true);
    expect(validateSurveyPage(observationPage, { ...good, field_26: "cZDm", field_27: "900" })).toEqual([]);
    expect(validateSurveyPage(observationPage, { ...good, field_26: "cZDm", field_27: "-10" }).length).toBeGreaterThan(0);
  });

  it("keeps the preview off in production even if a flag is present", () => {
    expect(isSignalCommunityDemoEnabled({})).toBe(false);
    expect(isSignalCommunityDemoEnabled({
      MAPABLE_SIGNAL_COMMUNITY_DEMO_ENABLED: "true",
      NODE_ENV: "development",
    })).toBe(true);
    expect(isSignalCommunityDemoEnabled({
      MAPABLE_SIGNAL_COMMUNITY_DEMO_ENABLED: "true",
      NODE_ENV: "production",
      VERCEL_ENV: "production",
    })).toBe(false);
    expect(isSignalCommunityDemoEnabled({
      MAPABLE_SIGNAL_COMMUNITY_DEMO_ENABLED: "true",
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
    })).toBe(true);
  });
});

describe("MapAble Signal bbPress-style local discussion rules", () => {
  it("has only synthetic, non-public fixture discussions", () => {
    expect(DEMO_FORUM_TOPICS.every((t) => t.synthetic && !t.public)).toBe(true);
    expect(DEMO_FORUM_TOPICS.every((t) => t.roomSlug === "access-and-places")).toBe(true);
  });

  it("queues local topics and replies without granting public authorisation", () => {
    const topic = makeLocalTopic({
      id: "draft-one",
      title: "Kerb ramp observations",
      body: "An example question about a fictional kerb ramp.",
      roomSlug: "access-and-places",
      createdAt: "2026-11-09T07:00:00Z",
    });
    expect(topic.moderation).toBe("pending_local_review");
    expect(topic.public).toBe(false);
    const reply = makeLocalReply("reply-one", topic.id, "A useful fictional response.");
    expect(reply.moderation).toBe("pending_local_review");
    expect(reply.public).toBe(false);
    expect(changeLocalTopicModeration(topic, "visible_in_this_tab").public).toBe(false);
    expect(changeLocalTopicModeration(topic, "rejected_in_this_tab").public).toBe(false);
  });

  it("rejects invalid and cross-room drafts rather than creating another forum authority", () => {
    expect(() => makeLocalTopic({
      id: "x", title: "x", body: "A valid example body.",
      roomSlug: "access-and-places", createdAt: "2026-11-09T07:00:00Z",
    })).toThrow(/title/);
    expect(() => makeLocalTopic({
      id: "x", title: "A valid topic", body: "A valid example body.",
      roomSlug: "care-and-support", createdAt: "2026-11-09T07:00:00Z",
    })).toThrow(/existing/);
  });
});
