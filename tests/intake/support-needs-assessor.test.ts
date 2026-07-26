import { describe, expect, it } from "vitest";

import {
  mapLiteAssessorToICanPayload,
  SupportNeedsAssessorBodySchema,
  SupportNeedsAssessorSubmitSchema,
} from "@/lib/intake/support-needs-assessor";
import { ICAN_V6_DOMAIN_IDS } from "@/lib/validation/i-can-v6";

describe("SupportNeedsAssessorBodySchema", () => {
  it("accepts a skip payload", () => {
    const result = SupportNeedsAssessorBodySchema.safeParse({ skipped: true });
    expect(result.success).toBe(true);
  });

  it("rejects empty selected areas", () => {
    const result = SupportNeedsAssessorSubmitSchema.safeParse({
      selectedAreas: [],
      answers: [],
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects answers that do not match selected areas", () => {
    const result = SupportNeedsAssessorSubmitSchema.safeParse({
      selectedAreas: ["mobility"],
      answers: [{ domainId: "communication", intensity: "some" }],
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects priority outside selected areas", () => {
    const result = SupportNeedsAssessorSubmitSchema.safeParse({
      selectedAreas: ["mobility"],
      answers: [{ domainId: "mobility", intensity: "a_little" }],
      priorityArea: "self_care",
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid lite submit", () => {
    const result = SupportNeedsAssessorSubmitSchema.safeParse({
      selectedAreas: ["mobility", "communication"],
      answers: [
        { domainId: "mobility", intensity: "a_lot" },
        { domainId: "communication", intensity: "some" },
      ],
      priorityArea: "mobility",
      anythingElse: "Need help with transfers",
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("mapLiteAssessorToICanPayload", () => {
  it("maps selected areas and defaults the rest to none", () => {
    const payload = mapLiteAssessorToICanPayload({
      selectedAreas: ["mobility", "self_care"],
      answers: [
        { domainId: "mobility", intensity: "all_the_time" },
        { domainId: "self_care", intensity: "a_little" },
      ],
      priorityArea: "mobility",
      anythingElse: "Wheelchair user",
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });

    expect(payload.domains.mobility.supportNeedLevel).toBe("pervasive");
    expect(payload.domains.mobility.frequency).toBe("constantly");
    expect(payload.domains.mobility.completed).toBe(true);
    expect(payload.domains.self_care.supportNeedLevel).toBe("intermittent");
    expect(payload.domains.communication.supportNeedLevel).toBe("none");
    expect(payload.domains.communication.frequency).toBe("never");
    expect(payload.domains.mobility.notes).toMatch(/Wheelchair user/);
    expect(payload.domains.mobility.notes).toMatch(/what matters most/i);

    for (const id of ICAN_V6_DOMAIN_IDS) {
      expect(payload.domains[id].completed).toBe(true);
      expect(payload.domains[id].frequency).toBeDefined();
    }
  });

  it("strips HTML from free-text notes", () => {
    const payload = mapLiteAssessorToICanPayload({
      selectedAreas: ["domestic_life"],
      answers: [{ domainId: "domestic_life", intensity: "some" }],
      anythingElse: "<script>alert(1)</script>Help with cooking",
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });

    expect(payload.domains.domestic_life.notes).not.toMatch(/script/i);
    expect(payload.domains.domestic_life.notes).toMatch(/Help with cooking/);
  });
});
