import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/auth-handler", () => ({ requireApiSession: vi.fn() }));
vi.mock("@/lib/api/organisation-scope", () => ({ getUserOrganisationIds: vi.fn() }));
vi.mock("@/lib/provider-cloud/tpp-wholesale/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/provider-cloud/tpp-wholesale/client")>();
  return { ...original, createTppWholesaleClient: vi.fn() };
});

import { requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { createTppWholesaleClient } from "@/lib/provider-cloud/tpp-wholesale/client";
import { POST } from "@/app/api/providercloud/domains/availability/route";

const lookup = vi.fn();
const base = { domain: "my-provider.com.au", organisationId: "org-1", providerNoticeAccepted: true };
function makeRequest(overrides: Record<string, unknown> = {}, origin = "https://test.example.test") {
  return new Request("https://test.example.test/api/providercloud/domains/availability", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      Host: "forged-tenant.example.net",
      "x-mapable-tenant-id": "org-2",
    },
    body: JSON.stringify({ ...base, ...overrides }),
  });
}

describe("TPP availability API authorisation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MAPABLE_PROVIDER_CLOUD_ENABLED", "true");
    vi.stubEnv("MAPABLE_TPP_WHOLESALE_READONLY_ENABLED", "true");
    vi.stubEnv("MAPABLE_TPP_WHOLESALE_FIXED_EGRESS_VERIFIED", "true");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.mocked(requireApiSession).mockResolvedValue({
      id: "provider-user", roles: ["provider_admin"], primaryRole: "provider_admin",
    } as never);
    vi.mocked(getUserOrganisationIds).mockResolvedValue(["org-1"]);
    lookup.mockResolvedValue({ domain: "my-provider.com.au", available: true, prices: [],
      premium: false, source: "tpp_wholesale", currency: "unconfirmed", orderStatus: "not_requested" });
    vi.mocked(createTppWholesaleClient).mockReturnValue({ checkAvailability: lookup } as never);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("fails closed when disabled, before authentication and vendor calls", async () => {
    vi.stubEnv("MAPABLE_TPP_WHOLESALE_READONLY_ENABLED", "false");
    const response = await POST(makeRequest());
    expect(response.status).toBe(404);
    expect(requireApiSession).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
  });

  it("denies anonymous requests", async () => {
    vi.mocked(requireApiSession).mockResolvedValue(new Response(null, { status: 401 }));
    expect((await POST(makeRequest())).status).toBe(401);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("denies cross-organisation selection despite forged Host or tenant header", async () => {
    expect((await POST(makeRequest({ organisationId: "org-2" }))).status).toBe(403);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("denies unrelated roles even if they have organisation membership", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      id: "user", roles: ["support_worker"], primaryRole: "support_worker",
    } as never);
    expect((await POST(makeRequest())).status).toBe(403);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("blocks cross-site requests", async () => {
    expect((await POST(makeRequest({}, "https://attacker.example.org"))).status).toBe(403);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("requires acknowledgement before sharing domain with registrar", async () => {
    expect((await POST(makeRequest({ providerNoticeAccepted: false }))).status).toBe(400);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("returns no-store availability and never requests an order", async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()).orderStatus).toBe("not_requested");
    expect(lookup).toHaveBeenCalledWith("my-provider.com.au");
  });
});
