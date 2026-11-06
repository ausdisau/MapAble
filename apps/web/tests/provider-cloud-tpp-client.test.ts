import { describe, expect, it, vi } from "vitest";

import {
  TppWholesaleClient,
  TppWholesaleError,
  normaliseTppDomain,
} from "@/lib/provider-cloud/tpp-wholesale/client";
import { isTppWholesaleReadOnlyEnabled } from "@/lib/provider-cloud/tpp-wholesale/config";

const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature";
const validResponse = {
  domain: "my-provider.com.au", available: true, premium: false,
  prices: [{ years: 1, price: 11.95 }, { years: 2, price: 23.9 }],
};

function createMockTransport(availability = validResponse) {
  return vi.fn<typeof fetch>(async (input, init) => {
    const url = String(input);
    if (url.endsWith("/jwt/auth/token/")) {
      return new Response(jwt, { status: 200 });
    }
    if (url.includes("check-availability")) {
      return new Response(JSON.stringify(availability), { status: 200 });
    }
    throw new Error("unexpected outbound call");
  });
}

describe("TPP Wholesale REST integration", () => {
  it("is off by default, off in production and gated on fixed outbound IP", () => {
    expect(isTppWholesaleReadOnlyEnabled({ NODE_ENV: "test" })).toBe(false);
    expect(isTppWholesaleReadOnlyEnabled({
      NODE_ENV: "development", MAPABLE_PROVIDER_CLOUD_ENABLED: "true",
      MAPABLE_TPP_WHOLESALE_READONLY_ENABLED: "true",
    })).toBe(false);
    expect(isTppWholesaleReadOnlyEnabled({
      NODE_ENV: "development", MAPABLE_PROVIDER_CLOUD_ENABLED: "true",
      MAPABLE_TPP_WHOLESALE_READONLY_ENABLED: "true",
      MAPABLE_TPP_WHOLESALE_FIXED_EGRESS_VERIFIED: "true",
    })).toBe(true);
    expect(isTppWholesaleReadOnlyEnabled({
      NODE_ENV: "production", VERCEL_ENV: "production",
      MAPABLE_PROVIDER_CLOUD_ENABLED: "true",
      MAPABLE_TPP_WHOLESALE_READONLY_ENABLED: "true",
      MAPABLE_TPP_WHOLESALE_FIXED_EGRESS_VERIFIED: "true",
    })).toBe(false);
  });

  it.each([
    "https://evil.example.com", "localhost", "example.com", "sample.test",
    "a..com.au", "127.0.0.1", "test.com.au:8080", "@evil.com.au",
    "x.example.org", "domain.local", "a_b.com.au", "hello.com.au/path",
  ])("rejects invalid or non-registrable input %s before networking", async (domain) => {
    const transport = createMockTransport();
    const client = new TppWholesaleClient({ apiKey: "test", secretKey: "test", transport });
    await expect(client.checkAvailability(domain)).rejects.toBeInstanceOf(TppWholesaleError);
    expect(transport).not.toHaveBeenCalled();
  });

  it("normalises case and final dot", () => {
    expect(normaliseTppDomain("My-Provider.COM.AU.")).toBe("my-provider.com.au");
  });

  it("authenticates with documented JSON then calls only the GET availability endpoint", async () => {
    const transport = createMockTransport();
    const client = new TppWholesaleClient({ apiKey: "key", secretKey: "secret", transport });
    const result = await client.checkAvailability("MY-PROVIDER.COM.AU");
    expect(result).toMatchObject({
      source: "tpp_wholesale", domain: "my-provider.com.au", available: true,
      premium: false, currency: "unconfirmed", orderStatus: "not_requested",
    });
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[0][0]).toBe("https://api.tppwholesale.com.au/jwt/auth/token/");
    expect(transport.mock.calls[0][1]?.method).toBe("POST");
    expect(transport.mock.calls[0][1]?.body).toBe(JSON.stringify({ apiKey: "key", secretKey: "secret" }));
    expect(transport.mock.calls[1][0]).toBe(
      "https://api.tppwholesale.com.au/domains/my-provider.com.au/check-availability",
    );
    expect(transport.mock.calls[1][1]?.method).toBe("GET");
    expect(transport.mock.calls[1][1]?.headers).toMatchObject({ Authorization: "Bearer " + jwt });
  });

  it("reuses an IP-bound JWT until its early expiry", async () => {
    const transport = createMockTransport();
    const client = new TppWholesaleClient({ apiKey: "key", secretKey: "secret", transport });
    await client.checkAvailability("my-provider.com.au");
    await client.checkAvailability("my-provider.com.au");
    expect(transport).toHaveBeenCalledTimes(3);
  });

  it("reauthenticates exactly once after HTTP 401", async () => {
    let firstLookup = true;
    const transport = vi.fn<typeof fetch>(async (input) => {
      if (String(input).includes("auth/token")) return new Response(jwt, { status: 200 });
      if (firstLookup) { firstLookup = false; return new Response("", { status: 401 }); }
      return new Response(JSON.stringify(validResponse), { status: 200 });
    });
    const client = new TppWholesaleClient({ apiKey: "key", secretKey: "secret", transport });
    expect((await client.checkAvailability("my-provider.com.au")).available).toBe(true);
    expect(transport).toHaveBeenCalledTimes(4);
  });

  it("rejects a mismatched vendor domain", async () => {
    const transport = createMockTransport({ ...validResponse, domain: "another-provider.com.au" });
    const client = new TppWholesaleClient({ apiKey: "key", secretKey: "secret", transport });
    await expect(client.checkAvailability("my-provider.com.au")).rejects.toMatchObject({
      code: "TPP_INVALID_RESPONSE",
    });
  });

  it("requires server-only credentials", () => {
    expect(() => new TppWholesaleClient({ apiKey: "", secretKey: "" }))
      .toThrow("TPP_CONFIGURATION_MISSING");
  });
});
