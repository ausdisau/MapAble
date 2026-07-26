import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { createTwoFactorToken } from "@/lib/auth/two-factor-token";
import type { CurrentUser } from "@/lib/auth/current-user";

const mockGetServerSession = vi.fn();
const mockGetCurrentUser = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/app/api/auth/[...nextauth]/authOptions", () => ({
  authOptions: {},
}));

vi.mock("@/lib/auth/current-user", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/current-user")>(
    "@/lib/auth/current-user",
  );
  return {
    ...actual,
    getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  };
});

vi.mock("@/lib/auth/nextauth-env", () => ({
  resolveNextAuthSecret: () => "test-nextauth-secret-for-unit-tests",
}));

import { withAuthorization } from "@/lib/auth/withAuthorization";

function adminUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "user_admin",
    email: "admin@example.com",
    name: "Admin",
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    primaryRole: "mapable_admin",
    roles: ["mapable_admin"],
    ...overrides,
  };
}

describe("withAuthorization", () => {
  const previousSecret = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-nextauth-secret-for-unit-tests";
    mockGetServerSession.mockReset();
    mockGetCurrentUser.mockReset();
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = previousSecret;
  });

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const handler = withAuthorization({ roles: ["ADMIN"] }, async () =>
      Response.json({ ok: true }),
    );
    const res = await handler(new Request("http://localhost/api/x"), { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: "Unauthorized" });
  });

  it("returns 403 when role is not allowed", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1" } });
    mockGetCurrentUser.mockResolvedValue(
      adminUser({
        id: "u1",
        primaryRole: "participant",
        roles: ["participant"],
      }),
    );
    const handler = withAuthorization({ roles: ["ADMIN"] }, async () =>
      Response.json({ ok: true }),
    );
    const res = await handler(new Request("http://localhost/api/x"), { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
  });

  it("invokes handler for ADMIN alias when user is mapable_admin", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user_admin", mfaVerified: true },
    });
    mockGetCurrentUser.mockResolvedValue(adminUser());
    const handler = withAuthorization(
      { roles: ["ADMIN"], requireMfa: true },
      async (_req, _ctx, user) => Response.json({ id: user.id }),
    );
    const res = await handler(new Request("http://localhost/api/x"), { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: "user_admin" });
  });

  it("requires MFA assertion when session is not mfaVerified", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_admin" } });
    mockGetCurrentUser.mockResolvedValue(adminUser());

    const denied = withAuthorization(
      { roles: ["ADMIN"], requireMfa: true },
      async () => Response.json({ ok: true }),
    );
    const deniedRes = await denied(new Request("http://localhost/api/x"), { params: Promise.resolve({}) });
    expect(deniedRes.status).toBe(403);

    const assertion = createTwoFactorToken({
      purpose: "step-up-mfa",
      userId: "user_admin",
    });
    const allowed = withAuthorization(
      { roles: ["ADMIN"], requireMfa: true },
      async () => Response.json({ ok: true }),
    );
    const allowedRes = await allowed(
      new Request("http://localhost/api/x", {
        headers: { "x-mfa-assertion": assertion },
      }),
      {},
    );
    expect(allowedRes.status).toBe(200);
  });
});
