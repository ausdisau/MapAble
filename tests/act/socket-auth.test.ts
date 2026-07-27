import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  mintSocketAuthToken,
  resolveSocketIdentity,
  verifySignedSocketToken,
} from "../../apps/realtime-server/src/auth/socket-auth";

describe("realtime socket JWT auth", () => {
  beforeEach(() => {
    process.env.SOCKETIO_AUTH_SECRET = "test-socket-secret-32chars-min!!";
  });

  afterEach(() => {
    delete process.env.SOCKETIO_AUTH_SECRET;
  });

  it("rejects unsigned base64 identity payloads", () => {
    const spoof = Buffer.from(
      JSON.stringify({ userId: "attacker", role: "mapable_admin" }),
    ).toString("base64url");
    expect(verifySignedSocketToken(spoof)).toBeNull();
    expect(resolveSocketIdentity({ token: spoof, userId: "attacker" })).toBeNull();
  });

  it("accepts HMAC-signed tokens and ignores spoofed companion fields", () => {
    const token = mintSocketAuthToken({
      userId: "user-1",
      role: "participant",
      roomGrants: ["booking:abc"],
    });
    const identity = resolveSocketIdentity({
      token,
      userId: "attacker",
      role: "mapable_admin",
    });
    expect(identity).toEqual({
      userId: "user-1",
      role: "participant",
      roomGrants: ["booking:abc"],
    });
  });
});
