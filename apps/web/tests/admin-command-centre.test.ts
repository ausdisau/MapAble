import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import {
  commandCentreResponseSchema,
  participantAdminRowSchema,
} from "@/server/admin/adminSchemas";
import { resolveAdminDataScope } from "@/server/admin/adminService";

describe("resolveAdminDataScope", () => {
  it("returns full for mapable_admin", () => {
    expect(resolveAdminDataScope("mapable_admin")).toBe("full");
  });

  it("returns billing for plan_manager subset", () => {
    expect(resolveAdminDataScope("plan_manager")).toBe("billing");
    expect(hasPermission("plan_manager", "admin:billing:read")).toBe(true);
    expect(hasPermission("plan_manager", "admin:participants:read")).toBe(false);
  });

  it("returns limited for support_coordinator with participants", () => {
    expect(resolveAdminDataScope("support_coordinator")).toBe("limited");
    expect(hasPermission("support_coordinator", "admin:participants:read")).toBe(
      true
    );
  });
});

describe("participant redaction by scope", () => {
  it("omits clinical fields for billing scope rows", () => {
    const billingRow = participantAdminRowSchema.parse({
      id: "p1",
      userId: "u1",
      displayName: "Alex",
      href: "/admin/participants/u1",
    });
    expect(billingRow.participantNotes).toBeUndefined();
    expect(billingRow.accessRequirementsSummary).toBeUndefined();

    const fullRow = participantAdminRowSchema.parse({
      id: "p1",
      userId: "u1",
      displayName: "Alex",
      participantNotes: "Note",
      href: "/admin/participants/u1",
    });
    expect(fullRow.participantNotes).toBe("Note");
  });
});

describe("commandCentreResponseSchema", () => {
  it("validates a minimal command centre payload", () => {
    const payload = {
      metrics: {
        pendingParticipantConfirmations: 2,
        bookingsAtRisk: 1,
        workerCredentialExpiries: 0,
        billingExceptions: 3,
        safeguardingAlerts: 4,
        unresolvedComplaints: 1,
        guardrailBlocks: 1,
        agentRunsNeedingReview: 2,
      },
      highRiskItems: [
        {
          id: "hr-1",
          domain: "bookings" as const,
          severity: "high" as const,
          title: "Unassigned booking",
          summary: "1 booking needs a worker.",
          href: "/admin/ops/bookings",
        },
      ],
    };
    expect(commandCentreResponseSchema.safeParse(payload).success).toBe(true);
  });
});
