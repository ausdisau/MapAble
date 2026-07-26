import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const registerClientSource = readFileSync(
  join(process.cwd(), "app/register/RegisterClient.tsx"),
  "utf8",
);

describe("RegisterClient support-needs redirect", () => {
  it("sends participants to the support needs assessor after signup", () => {
    expect(registerClientSource).toContain('"/register/support-needs"');
    expect(registerClientSource).toContain('"/worker/onboarding"');
    // Participants should not go straight to dashboard after email register.
    expect(registerClientSource).toMatch(
      /inviteToken\s*\?\s*"\/worker\/onboarding"\s*:\s*"\/register\/support-needs"/,
    );
  });
});
