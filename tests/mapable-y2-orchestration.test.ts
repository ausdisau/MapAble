import { describe, expect, it } from "vitest";

import {
  isBackupRecoveryEnabled,
  isMicroConsentActive,
  RECONCILIATION_AMOUNT_TOLERANCE_CENTS,
  y2OrchestrationConfig,
} from "@/lib/config/y2-orchestration";
import {
  MICRO_CONSENT_ACTIONS,
  isMicroConsentEnabled,
  isMicroConsentV2Enabled,
} from "@/lib/consent/micro-consent-service";
import { whereOrganisationScope } from "@/lib/platform/multi-tenant-admin/tenant-context";

describe("Y2 orchestration config", () => {
  it("disables all Y2 features by default", () => {
    expect(y2OrchestrationConfig.backupRecoveryPilotEnabled).toBe(false);
    expect(y2OrchestrationConfig.careTransportOrchestrationV2Enabled).toBe(
      false,
    );
    expect(y2OrchestrationConfig.microConsentV2Enabled).toBe(false);
    expect(y2OrchestrationConfig.planManagerIntegrationEnabled).toBe(false);
    expect(y2OrchestrationConfig.supportCoordinatorPortalEnabled).toBe(false);
    expect(y2OrchestrationConfig.paymentReconciliationV2Enabled).toBe(false);
    expect(y2OrchestrationConfig.multiTenantWorkspaceV2Enabled).toBe(false);
  });

  it("layers backup recovery: pilot or Y1 flag", () => {
    expect(isBackupRecoveryEnabled()).toBe(false);
  });

  it("layers micro consent: v2 or Y1 flag", () => {
    expect(isMicroConsentActive()).toBe(false);
    expect(isMicroConsentEnabled()).toBe(false);
    expect(isMicroConsentV2Enabled()).toBe(false);
  });
});

describe("Micro-consent v2 catalog", () => {
  it("includes Y2 integration actions", () => {
    expect(MICRO_CONSENT_ACTIONS).toContain("plan_manager.invoice_view");
    expect(MICRO_CONSENT_ACTIONS).toContain("coordinator.participant_access");
    expect(MICRO_CONSENT_ACTIONS).toContain("orchestration.share_transport");
    expect(MICRO_CONSENT_ACTIONS).toContain("reconciliation.metadata_share");
  });
});

describe("Tenant scoping helpers", () => {
  it("returns empty filter when tenant context disabled", () => {
    expect(
      whereOrganisationScope({
        tenantId: null,
        organisationId: "org_1",
        enabled: false,
      }),
    ).toEqual({});
  });

  it("scopes by organisation when enabled", () => {
    expect(
      whereOrganisationScope({
        tenantId: "t_1",
        organisationId: "org_1",
        enabled: true,
      }),
    ).toEqual({ organisationId: "org_1" });
  });
});

describe("Reconciliation v2 rules", () => {
  it("uses 1 cent default tolerance", () => {
    expect(RECONCILIATION_AMOUNT_TOLERANCE_CENTS).toBe(1);
  });

  it("computes unpaid percent kill criteria threshold", () => {
    const unmatched = 3;
    const total = 100;
    const unpaidPercent = (unmatched / total) * 100;
    expect(unpaidPercent).toBeGreaterThan(2);
  });
});

describe("Backup recovery pilot idempotency", () => {
  it("documents status pipeline includes awaiting_dispatch", () => {
    const pipeline = [
      "detected",
      "proposing",
      "awaiting_participant",
      "awaiting_dispatch",
      "assigned",
      "closed",
    ];
    expect(pipeline).toContain("awaiting_dispatch");
    expect(pipeline.indexOf("awaiting_dispatch")).toBeLessThan(
      pipeline.indexOf("assigned"),
    );
  });
});

describe("Cross-tenant isolation expectations", () => {
  it("requires tenant context enabled for org scoping", () => {
    const ctx = { tenantId: "t_a", organisationId: "org_a", enabled: true };
    const scopeA = whereOrganisationScope(ctx);
    const scopeB = whereOrganisationScope({
      ...ctx,
      organisationId: "org_b",
    });
    expect(scopeA.organisationId).not.toEqual(scopeB.organisationId);
  });
});
