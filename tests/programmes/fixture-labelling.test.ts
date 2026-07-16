import { describe, expect, it } from "vitest";

import {
  FixtureHumanNavigatorAdapter,
  FixtureProgrammeSourceAdapter,
  getFixtureHumanNavigatorAdapter,
  getFixtureProgrammeSourceAdapter,
} from "@/lib/programmes";

describe("mock adapter labelling", () => {
  it("labels fixture source adapter as mock", () => {
    const adapter: FixtureProgrammeSourceAdapter =
      getFixtureProgrammeSourceAdapter();
    expect(adapter.isMock).toBe(true);
  });

  it("labels fixture navigator adapter as mock", () => {
    const adapter: FixtureHumanNavigatorAdapter =
      getFixtureHumanNavigatorAdapter();
    expect(adapter.isMock).toBe(true);
  });

  it("returns draft warning for mock draft sources", async () => {
    const adapter = getFixtureProgrammeSourceAdapter();
    const warning = await adapter.getSupersessionWarning(
      "mock-source-ndis-guide",
    );
    expect(warning.message).toContain("Draft");
  });

  it("excludes sensitive fields from navigator preview", async () => {
    const adapter = getFixtureHumanNavigatorAdapter();
    const preview = await adapter.previewAssignment({
      participantId: "p1",
      navigatorId: "mock-nav-1",
      requestedFields: ["goals", "diagnosis", "calendar.events"],
    });
    expect(preview.sharedFields).toContain("goals");
    expect(preview.sharedFields).not.toContain("diagnosis");
    expect(preview.excludedFields).toContain("diagnosis");
    expect(preview.requiresParticipantApproval).toBe(true);
  });
});
