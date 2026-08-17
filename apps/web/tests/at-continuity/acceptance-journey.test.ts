import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { auditMock } = vi.hoisted(() => ({
  auditMock: vi.fn(async (_input: Record<string, unknown>) => ({
    id: "audit_1",
  })),
}));

const assetRow = {
  id: "asset_1",
  participantUserId: "participant_1",
  displayName: "Power wheelchair",
  category: "mobility",
  mobilityAidHint: "power_wheelchair",
  marketplaceCategoryHint: null,
  externalAssessmentRef: null,
  notes: null,
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    atEquipmentAsset: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        ...assetRow,
        ...data,
        id: "asset_1",
      })),
      findFirst: vi.fn(async () => assetRow),
    },
    atEquipmentOutage: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "outage_1",
        ...data,
      })),
    },
    atBackupPlan: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "plan_1",
        ...data,
      })),
    },
    atRepairPartnerRef: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "repair_1",
        ...data,
      })),
    },
    atDependencyLink: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "dep_1",
        ...data,
      })),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: auditMock,
}));

import {
  AtContinuityInvariantError,
  linkOperationalDependency,
  linkRepairPartner,
  recordEquipmentOutage,
  registerEquipmentAsset,
  requestHumanApprovedNotification,
  upsertBackupPlan,
} from "@/lib/platform/at-continuity";

describe("AT Continuity acceptance journey", () => {
  const flag = "MAPABLE_AT_CONTINUITY_ENABLED";
  let previous: string | undefined;

  beforeEach(() => {
    previous = process.env[flag];
    process.env[flag] = "true";
    auditMock.mockClear();
  });

  afterEach(() => {
    if (previous === undefined) {
      delete process.env[flag];
    } else {
      process.env[flag] = previous;
    }
  });

  it("runs equipment → outage → backup → repair → dependencies → human-approved notification → audit", async () => {
    const actorUserId = "worker_1";
    const participantUserId = "participant_1";

    const asset = await registerEquipmentAsset(
      {
        participantUserId,
        displayName: "Power wheelchair",
        category: "mobility",
        mobilityAidHint: "power_wheelchair",
      },
      actorUserId,
    );
    expect(asset.id).toBe("asset_1");

    const outage = await recordEquipmentOutage(
      {
        assetId: asset.id,
        participantUserId,
        summary: "Battery not holding charge",
        status: "reported",
      },
      actorUserId,
    );
    expect(outage.id).toBe("outage_1");

    const plan = await upsertBackupPlan(
      {
        assetId: asset.id,
        participantUserId,
        title: "Manual wheelchair backup",
        instructions: "Use spare manual chair until repair completes",
      },
      actorUserId,
    );
    expect(plan.id).toBe("plan_1");

    const repair = await linkRepairPartner(
      {
        assetId: asset.id,
        participantUserId,
        organisationId: "org_repair_1",
        externalPartnerRef: "partner-ref-9",
      },
      actorUserId,
    );
    expect(repair.id).toBe("repair_1");

    const careDep = await linkOperationalDependency(
      {
        assetId: asset.id,
        participantUserId,
        targetType: "care_request",
        targetEntityId: "care_req_1",
      },
      actorUserId,
    );
    const transportDep = await linkOperationalDependency(
      {
        assetId: asset.id,
        participantUserId,
        targetType: "transport_trip",
        targetEntityId: "trip_1",
      },
      actorUserId,
    );
    const workDep = await linkOperationalDependency(
      {
        assetId: asset.id,
        participantUserId,
        targetType: "job_application",
        targetEntityId: "job_app_1",
      },
      actorUserId,
    );
    expect(careDep.targetType).toBe("care_request");
    expect(transportDep.targetType).toBe("transport_trip");
    expect(workDep.targetType).toBe("job_application");

    await expect(
      requestHumanApprovedNotification(
        {
          participantUserId,
          assetId: asset.id,
          channel: "in_app",
          templateKey: "at_outage_backup_ready",
          humanApproved: false,
          approvedByUserId: actorUserId,
        },
        actorUserId,
      ),
    ).rejects.toBeInstanceOf(AtContinuityInvariantError);

    const notification = await requestHumanApprovedNotification(
      {
        participantUserId,
        assetId: asset.id,
        channel: "in_app",
        templateKey: "at_outage_backup_ready",
        humanApproved: true,
        approvedByUserId: actorUserId,
      },
      actorUserId,
    );
    expect(notification.status).toBe("approved_pending_delivery");

    type AuditPayload = {
      action: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
    };
    const payloads = auditMock.mock.calls.map((call) => {
      const arg = call[0] as unknown;
      expect(arg).toBeTruthy();
      return arg as AuditPayload;
    });
    expect(payloads.map((p) => p.action)).toEqual(
      expect.arrayContaining([
        "at_continuity.asset_registered",
        "at_continuity.outage_recorded",
        "at_continuity.backup_plan_saved",
        "at_continuity.repair_partner_linked",
        "at_continuity.dependency_linked",
        "at_continuity.notification_approved",
      ]),
    );

    for (const payload of payloads) {
      expect(payload.entityId).toBeTruthy();
      const metaJson = JSON.stringify(payload.metadata ?? {});
      expect(metaJson).not.toMatch(/clinically suitable|emergency dispatch/i);
      expect(payload.metadata).not.toHaveProperty("instructions");
      expect(payload.metadata).not.toHaveProperty("notes");
      expect(payload.metadata).not.toHaveProperty("summary");
    }
  });

  it("fails closed on cross-participant asset access and approver mismatch", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.atEquipmentAsset.findFirst).mockResolvedValueOnce(null);

    await expect(
      recordEquipmentOutage(
        {
          assetId: "asset_1",
          participantUserId: "other_participant",
          summary: "Cross-participant attempt",
          status: "reported",
        },
        "worker_1",
      ),
    ).rejects.toThrow(/not found for participant/i);

    await expect(
      requestHumanApprovedNotification(
        {
          participantUserId: "participant_1",
          assetId: "asset_1",
          channel: "in_app",
          templateKey: "at_outage_backup_ready",
          humanApproved: true,
          approvedByUserId: "someone_else",
        },
        "worker_1",
      ),
    ).rejects.toThrow(/approver must match the acting user/i);
  });
});
