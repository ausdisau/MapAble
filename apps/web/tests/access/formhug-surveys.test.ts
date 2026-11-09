import { describe, expect, it } from "vitest";
import { FORMHUG_SURVEYS, isTrustRecruitmentApproved } from "../../lib/access/formhug-surveys";

describe("community and research FormHug configuration", () => {
  it("keeps the two survey purposes and tokens distinct", () => {
    expect(FORMHUG_SURVEYS.community.url).toContain("f50pAQ");
    expect(FORMHUG_SURVEYS.trust.url).toContain("BRXNVn");
    expect(FORMHUG_SURVEYS.community.url).not.toBe(FORMHUG_SURVEYS.trust.url);
  });
  it("allows only the known external provider origin", () => {
    for (const survey of Object.values(FORMHUG_SURVEYS)) {
      expect(new URL(survey.embed).origin).toBe("https://formhug.ai");
      expect(new URL(survey.url).origin).toBe("https://formhug.ai");
      expect(survey.embed).toContain("inner_redirect=false");
    }
  });
  it("keeps NDIS research recruitment off unless explicitly approved", () => {
    expect(isTrustRecruitmentApproved(undefined)).toBe(false);
    expect(isTrustRecruitmentApproved("1")).toBe(false);
    expect(isTrustRecruitmentApproved("false")).toBe(false);
    expect(isTrustRecruitmentApproved("true")).toBe(true);
  });
});
