import { describe, expect, it } from "vitest";

import {
  AuditChain,
  authoriseIntent,
} from "@mapable/intelligence-kernel";
import {
  accessPassportSchema,
  authorityGrantSchema,
  moneySchema,
} from "@mapable/contracts";

const authority = authorityGrantSchema.parse({
  schemaVersion: "1.0",
  id: "grant_1",
  actorId: "actor_1",
  principalId: "participant_1",
  tenantId: "tenant_1",
  domain: "transport",
  permittedActions: ["propose_transport"],
  autonomyCeiling: 2,
  constraints: {},
  jurisdiction: "AU",
  issuedAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2030-01-01T00:00:00.000Z",
  revokedAt: null,
});

describe("CSI contracts and intelligence kernel", () => {
  it("uses integer minor units for money", () => {
    expect(moneySchema.safeParse({ currency: "AUD", minorUnits: 1250 }).success).toBe(true);
    expect(moneySchema.safeParse({ currency: "AUD", minorUnits: 12.5 }).success).toBe(false);
  });

  it("requires participant-controlled passport provenance", () => {
    expect(
      accessPassportSchema.parse({
        schemaVersion: "1.0",
        participantId: "participant_1",
        provenance: "participant_confirmed",
        visibility: "request_scoped",
      }).visibility
    ).toBe("request_scoped");
  });

  it("denies revoked authority and requires confirmation for eligible recommendations", () => {
    const intent = {
      schemaVersion: "1.0" as const,
      id: "intent_1",
      domain: "transport" as const,
      proposedAction: "propose_transport",
      reason: "Synthetic accessible option",
      evidenceIds: [],
      uncertainty: [],
      reversibility: "reversible" as const,
      risk: "low" as const,
      requiredAuthority: authority.id,
    };
    expect(authoriseIntent({ authority, intent }).decision).toBe("require_confirmation");
    expect(
      authoriseIntent({
        authority: { ...authority, revokedAt: "2026-02-01T00:00:00.000Z" },
        intent,
      }).decision
    ).toBe("deny");
  });

  it("detects audit chain tampering", () => {
    const chain = new AuditChain();
    const first = chain.append("audit_1", { outcome: "RECOMMEND" });
    chain.append("audit_2", { outcome: "CLARIFY" });
    expect(chain.verify()).toBe(true);
    first.payload.outcome = "DENY";
    expect(chain.verify()).toBe(false);
  });
});
