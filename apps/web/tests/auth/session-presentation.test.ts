import { describe, expect, it } from "vitest";

import {
  asUserRole,
  initialsFromDisplayName,
  resolveAccountSessionPresentation,
} from "@/lib/auth/session-presentation";

describe("session presentation", () => {
  it("treats authenticated NextAuth status as signed in", () => {
    expect(
      resolveAccountSessionPresentation({
        status: "authenticated",
        hasSessionUser: true,
      }),
    ).toBe("signed_in");
  });

  it("keeps a loading state while session resolves without a server hint", () => {
    expect(
      resolveAccountSessionPresentation({
        status: "loading",
        hasSessionUser: false,
      }),
    ).toBe("loading");
  });

  it("avoids a signed-out flash when the dashboard already proved auth", () => {
    expect(
      resolveAccountSessionPresentation({
        status: "loading",
        hasSessionUser: false,
        serverHintName: "Alex Participant",
      }),
    ).toBe("signed_in");
  });

  it("does not present a session probe failure as a confirmed sign-out", () => {
    expect(
      resolveAccountSessionPresentation({
        status: "unauthenticated",
        hasSessionUser: false,
        sessionProbeFailed: true,
      }),
    ).toBe("unavailable");
  });

  it("returns signed_out only after a successful unauthenticated resolution", () => {
    expect(
      resolveAccountSessionPresentation({
        status: "unauthenticated",
        hasSessionUser: false,
        sessionProbeFailed: false,
      }),
    ).toBe("signed_out");
  });

  it("maps known roles and initials helpers", () => {
    expect(asUserRole("participant")).toBe("participant");
    expect(asUserRole("not-a-role")).toBeUndefined();
    expect(initialsFromDisplayName("Jane Citizen")).toBe("JC");
    expect(initialsFromDisplayName("Jordan")).toBe("JO");
  });
});
