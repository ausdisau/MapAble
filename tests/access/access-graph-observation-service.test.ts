import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accessPlace: {
      findUnique: vi.fn(),
    },
    accessObservationRecord: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  AccessGraphError,
  createAccessObservation,
  getPlaceAccessGraph,
  listAccessObservations,
  serializeObservationRow,
} from "@/lib/access/infrastructure/observation-service";
import { prisma } from "@/lib/prisma";

describe("Access Graph observation service (E01 G3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_ACCESS_GRAPH_ENABLED = "true";
  });

  it("returns 404-style error when graph flags are off", async () => {
    process.env.MAPABLE_ACCESS_GRAPH_ENABLED = "false";
    await expect(
      createAccessObservation({
        featureKey: "entrance.step_free",
        ontologyConceptId: "physical.step_free",
        value: true,
        sourceType: "community",
      }),
    ).rejects.toMatchObject({
      name: "AccessGraphError",
      status: 404,
    });
  });

  it("creates community observation with provenance envelope", async () => {
    const now = new Date("2026-08-12T10:00:00.000Z");
    vi.mocked(prisma.accessObservationRecord.create).mockResolvedValue({
      id: "obs_1",
      featureKey: "entrance.step_free",
      ontologyConceptId: "physical.step_free",
      valueJson: true,
      unit: null,
      sourceType: "community",
      observedAt: now,
      evidenceKinds: ["photo"],
      verificationStatus: "community_reported",
      confidence: 0.7,
      reviewDue: new Date("2026-08-19T10:00:00.000Z"),
      disputed: false,
      placeId: "place_1",
      entityType: "place",
      entityId: "place_1",
      evidenceEnvelopeId: null,
      observerUserId: "user_1",
      createdAt: now,
      updatedAt: now,
    } as never);

    vi.mocked(prisma.accessPlace.findUnique).mockResolvedValue({
      id: "place_1",
    } as never);

    const result = await createAccessObservation({
      featureKey: "entrance.step_free",
      ontologyConceptId: "physical.step_free",
      value: true,
      sourceType: "community",
      evidenceKinds: ["photo"],
      confidence: 0.7,
      placeId: "place_1",
      entityType: "place",
      entityId: "place_1",
      observerUserId: "user_1",
      observedAt: now.toISOString(),
    });

    expect(result.provenance.sourceClass).toBe("community_reported");
    expect(result.provenance.unverified).toBe(true);
    expect(result.freshness.expired).toBe(false);
    expect(result.productionClaim).toBe("none");
    expect(createAuditEvent).toHaveBeenCalled();
  });

  it("rejects AI observations requesting verified status", async () => {
    await expect(
      createAccessObservation({
        featureKey: "entrance.ramp",
        ontologyConceptId: "physical.step_free",
        value: true,
        sourceType: "ai",
        verificationStatus: "verified",
      }),
    ).rejects.toBeInstanceOf(AccessGraphError);
  });

  it("stores AI observations as observed / ai_inferred", async () => {
    const now = new Date("2026-08-12T10:00:00.000Z");
    vi.mocked(prisma.accessObservationRecord.create).mockResolvedValue({
      id: "obs_ai",
      featureKey: "entrance.ramp",
      ontologyConceptId: "physical.step_free",
      valueJson: true,
      unit: null,
      sourceType: "ai",
      observedAt: now,
      evidenceKinds: ["ai_inferred"],
      verificationStatus: "observed",
      confidence: null,
      reviewDue: new Date("2026-08-19T10:00:00.000Z"),
      disputed: false,
      placeId: null,
      entityType: null,
      entityId: null,
      evidenceEnvelopeId: null,
      observerUserId: null,
      createdAt: now,
      updatedAt: now,
    } as never);

    const result = await createAccessObservation({
      featureKey: "entrance.ramp",
      ontologyConceptId: "physical.step_free",
      value: true,
      sourceType: "ai",
      observedAt: now.toISOString(),
    });

    expect(result.provenance.sourceClass).toBe("ai_inferred");
    expect(result.provenance.displayLabel).toMatch(/AI inferred/i);
    expect(result.provenance.verificationStatus).toBe("observed");
    expect(result.evidenceKinds).toContain("ai_inferred");
    expect(prisma.accessObservationRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceType: "ai",
          verificationStatus: "observed",
          evidenceKinds: expect.arrayContaining(["ai_inferred"]),
        }),
      }),
    );
  });

  it("serializes expired lift observations as outdated", () => {
    const envelope = serializeObservationRow(
      {
        id: "obs_lift",
        featureKey: "lift.operational",
        ontologyConceptId: "physical.lift_operational",
        valueJson: false,
        unit: null,
        sourceType: "sensor",
        observedAt: new Date("2026-08-01T00:00:00.000Z"),
        evidenceKinds: ["sensor"],
        verificationStatus: "observed",
        confidence: 0.9,
        reviewDue: new Date("2026-08-02T00:00:00.000Z"),
        disputed: false,
        placeId: "place_1",
        entityType: "place",
        entityId: "place_1",
        observerUserId: null,
      },
      new Date("2026-08-12T00:00:00.000Z"),
    );

    expect(envelope.freshness.expired).toBe(true);
    expect(envelope.provenance.sourceClass).toBe("expired");
    expect(envelope.provenance.verificationStatus).toBe("outdated");
  });

  it("reads place graph with counts", async () => {
    vi.mocked(prisma.accessPlace.findUnique).mockResolvedValue({
      id: "place_1",
    } as never);
    vi.mocked(prisma.accessObservationRecord.findMany).mockResolvedValue([
      {
        id: "obs_1",
        featureKey: "entrance.step_free",
        ontologyConceptId: "physical.step_free",
        valueJson: true,
        unit: null,
        sourceType: "community",
        observedAt: new Date("2026-08-12T00:00:00.000Z"),
        evidenceKinds: ["photo"],
        verificationStatus: "community_reported",
        confidence: 0.5,
        reviewDue: new Date("2026-08-19T00:00:00.000Z"),
        disputed: false,
        placeId: "place_1",
        entityType: "place",
        entityId: "place_1",
        evidenceEnvelopeId: null,
        observerUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);

    const graph = await getPlaceAccessGraph("place_1");
    expect(graph.placeId).toBe("place_1");
    expect(graph.featureCount).toBe(1);
    expect(graph.unverifiedCount).toBe(1);
    expect(graph.productionClaim).toBe("none");
  });

  it("lists observations when enabled", async () => {
    vi.mocked(prisma.accessObservationRecord.findMany).mockResolvedValue([]);
    const rows = await listAccessObservations({ placeId: "place_1" });
    expect(rows).toEqual([]);
  });
});
