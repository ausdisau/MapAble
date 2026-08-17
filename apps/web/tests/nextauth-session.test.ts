import { describe, expect, it } from "vitest";

import {
  mergeJwtTokenIntoSession,
  mergeUserIntoJwtToken,
} from "@/lib/auth/nextauth-session";

describe("nextauth-session JWT helpers", () => {
  it("merges user fields into JWT token", () => {
    const token = mergeUserIntoJwtToken({}, {
      id: "u1",
      email: "a@test.com",
      name: "Alex",
      role: "participant",
    });
    expect(token).toEqual({
      id: "u1",
      email: "a@test.com",
      name: "Alex",
      role: "participant",
    });
  });

  it("creates session.user when missing", () => {
    const session = mergeJwtTokenIntoSession(
      {},
      { id: "u2", role: "participant", email: "p@test.com", name: "Pat" }
    );
    expect(session.user).toMatchObject({
      id: "u2",
      role: "participant",
      email: "p@test.com",
      name: "Pat",
    });
  });

  it("merges JWT token into session user", () => {
    const session = mergeJwtTokenIntoSession(
      { user: { email: "old@test.com" } },
      {
        id: "u1",
        role: "mapable_admin",
        email: "admin@mapable.test",
        name: "Admin",
      }
    );
    expect(session.user).toMatchObject({
      id: "u1",
      role: "mapable_admin",
      email: "admin@mapable.test",
      name: "Admin",
    });
  });
});
