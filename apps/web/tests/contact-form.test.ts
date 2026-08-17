import { describe, expect, it } from "vitest";

import { contactFormSchema } from "@/lib/contact/contact-form-schema";

describe("contactFormSchema", () => {
  it("accepts a valid submission", () => {
    const parsed = contactFormSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      topic: "pilot",
      message: "I would like to learn more about the MapAble Care pilot.",
      company: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects short messages", () => {
    const parsed = contactFormSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      topic: "general",
      message: "Hi",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects filled honeypot fields", () => {
    const parsed = contactFormSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      topic: "general",
      message: "This looks like a legitimate enquiry message.",
      company: "spam-co",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts optional consentScopes for audit logging", () => {
    const parsed = contactFormSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      topic: "privacy",
      message: "Please help with a privacy request for my account.",
      consentScopes: ["contact_response", "no_sensitive_upload"],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.consentScopes).toEqual([
        "contact_response",
        "no_sensitive_upload",
      ]);
    }
  });
});
