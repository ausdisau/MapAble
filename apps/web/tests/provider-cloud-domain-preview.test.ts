import { describe, expect, it } from "vitest";

import {
  buildSyntheticDomainPreview,
  canPreviewOrganisationDomain,
  isDomainPreviewEnabled,
  normaliseSyntheticHostname,
} from "@/lib/provider-cloud/domains/preview";

describe("ProviderCloud synthetic domain preview", () => {
  it("is off by default and forbidden in production regardless of flag", () => {
    expect(isDomainPreviewEnabled({ NODE_ENV: "test" })).toBe(false);
    expect(isDomainPreviewEnabled({ MAPABLE_PROVIDER_DOMAIN_PREVIEW_ENABLED: "true", NODE_ENV: "production" })).toBe(false);
    expect(isDomainPreviewEnabled({ MAPABLE_PROVIDER_DOMAIN_PREVIEW_ENABLED: "true", VERCEL_ENV: "production" })).toBe(false);
    expect(isDomainPreviewEnabled({ MAPABLE_PROVIDER_DOMAIN_PREVIEW_ENABLED: "true", NODE_ENV: "test" })).toBe(true);
  });

  it("requires provider_admin plus exact server-read organisation membership", () => {
    expect(canPreviewOrganisationDomain({
      actorRoles: ["provider_admin"], organisationId: "org-a", memberOrganisationIds: ["org-a"],
    })).toBe(true);
    expect(canPreviewOrganisationDomain({
      actorRoles: ["provider_admin"], organisationId: "org-b", memberOrganisationIds: ["org-a"],
    })).toBe(false);
    expect(canPreviewOrganisationDomain({
      actorRoles: ["support_worker"], organisationId: "org-a", memberOrganisationIds: ["org-a"],
    })).toBe(false);
    expect(canPreviewOrganisationDomain({
      actorRoles: ["platform_admin"], organisationId: "org-a", memberOrganisationIds: ["org-a"],
    })).toBe(false);
  });

  it("normalises case and trailing dot for reserved synthetic domains", () => {
    expect(normaliseSyntheticHostname("WWW.EXAMPLE.ORG.")).toBe("www.example.org");
  });

  it.each([
    "real-provider.com.au", "https://example.org", "example.org:443",
    "bad..example.org", "-invalid.example.org", "xn--.example.org",
    "a_b.example.test", "example.org/path", "127.0.0.1",
  ])("rejects invalid or non-synthetic hostname %s", (hostname) => {
    expect(() => normaliseSyntheticHostname(hostname)).toThrow();
  });

  it("does not claim registration, ownership, DNS, TLS or publication", () => {
    const result = buildSyntheticDomainPreview({
      organisationId: "org-a",
      hostname: "provider.sites.example.test",
      mode: "platform_subdomain",
    });
    expect(result).toMatchObject({
      synthetic: true, state: "draft_only", registrarStatus: "not_requested",
      ownershipStatus: "not_verified", dnsStatus: "not_checked",
      tlsStatus: "not_checked", publicationStatus: "blocked",
    });
  });

  it("requires a reserved platform subdomain", () => {
    expect(() => buildSyntheticDomainPreview({
      organisationId: "org-a",
      hostname: "www.example.org",
      mode: "platform_subdomain",
    })).toThrow();
  });
});
