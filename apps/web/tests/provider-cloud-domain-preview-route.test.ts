import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/auth-handler", () => ({ requireApiSession: vi.fn() }));
vi.mock("@/lib/api/organisation-scope", () => ({ getUserOrganisationIds: vi.fn() }));

import { requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { POST } from "@/app/api/providercloud/domains/preview/route";

function request(overrides: Record<string, unknown> = {}) {
  return new Request("https://providercloud.example.test/api/providercloud/domains/preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "untrusted.example.org",
      "x-mapable-tenant-id": "other-tenant",
    },
    body: JSON.stringify({
      organisationId: "org-a", hostname: "www.example.org",
      mode: "existing_domain", ...overrides,
    }),
  });
}

describe("POST ProviderCloud domain preview API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MAPABLE_PROVIDER_DOMAIN_PREVIEW_ENABLED", "true");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.mocked(requireApiSession).mockResolvedValue({
      id: "actor-a", roles: ["provider_admin"], primaryRole: "provider_admin",
    } as never);
    vi.mocked(getUserOrganisationIds).mockResolvedValue(["org-a"]);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns 404 while disabled without membership queries", async () => {
    vi.stubEnv("MAPABLE_PROVIDER_DOMAIN_PREVIEW_ENABLED", "false");
    expect((await POST(request())).status).toBe(404);
    expect(getUserOrganisationIds).not.toHaveBeenCalled();
  });

  it("denies unauthenticated access", async () => {
    vi.mocked(requireApiSession).mockResolvedValue(
      new Response("Unauthorized", { status: 401 }),
    );
    expect((await POST(request())).status).toBe(401);
  });

  it("denies wrong organisations despite forged Host and tenant header", async () => {
    expect((await POST(request({ organisationId: "org-b" }))).status).toBe(403);
  });

  it("returns a blocked non-persistent preview for a valid organisation", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      synthetic: true, publicationStatus: "blocked", organisationId: "org-a",
    });
  });

  it("rejects any real hostname", async () => {
    expect((await POST(request({ hostname: "real-provider.com.au" }))).status).toBe(400);
  });
});
