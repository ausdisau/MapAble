import { describe, expect, it } from "vitest";

import { preRegistrationSchema } from "@/lib/pre-registration/schema";

describe("preRegistrationSchema", () => {
  it("accepts a valid participant submission", () => {
    const parsed = preRegistrationSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      role: "participant",
      company: "",
      consentScopes: ["prereg_contact", "no_sensitive_upload"],
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts a provider submission with organisation", () => {
    const parsed = preRegistrationSchema.safeParse({
      name: "Jordan Lee",
      email: "jordan@provider.example",
      role: "provider",
      organisation: "Coastal Supports",
      notes: "Interested in access-ready clinic listings.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid roles", () => {
    const parsed = preRegistrationSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      role: "admin",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects filled honeypot fields", () => {
    const parsed = preRegistrationSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      role: "participant",
      company: "spam-co",
    });

    expect(parsed.success).toBe(false);
  });
});
