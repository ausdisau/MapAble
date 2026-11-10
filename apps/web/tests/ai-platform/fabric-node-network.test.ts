import { describe, expect, it, vi } from "vitest";

import {
  AI_FABRIC_TOPICS,
  parseFabricEvent,
  topicForFabricEvent
} from "@/lib/ai/fabric/contracts";
import {
  fabricStreamingEnabled,
  publishFabricProjection,
  shouldQuarantineFabricEvent
} from "@/lib/ai/fabric/event-projection";
import { getFabricModule, listFabricModules } from "@/lib/ai/fabric/manifest";
import {
  MAPABLE_NODES,
  routeNodeTask,
  validateNodeNetwork
} from "@/lib/ai/fabric/node-network";

const event = () => ({
  schemaVersion: 1 as const,
  eventId: "50e9b536-2b2c-4a30-911e-ef5a95fa1b9c",
  occurredAt: "2026-11-10T10:00:00.000Z",
  moduleId: "access.intelligence_next",
  kind: "access.evidence_candidate_detected" as const,
  environment: "shadow" as const,
  tenantDigest: "a".repeat(64),
  aggregateDigest: "b".repeat(64),
  evidenceRefs: ["ev:opaque"],
  outcome: "needs_human_review" as const,
  requiresHumanReview: true,
  dataClass: "operational" as const,
  autoPublished: false as const
});

describe("unified MapAble AI Fabric", () => {
  it("uses a stable manifest with candidate modules explicitly unapproved", () => {
    const modules = listFabricModules();
    expect(new Set(modules.map((m) => m.id)).size).toBe(modules.length);
    expect(getFabricModule("access.intelligence_next")?.state).toBe("in_main");
    expect(getFabricModule("core.control_plane_candidate")?.integration).toBe("review_required");
  });

  it("validates the node graph and prohibits delegated authority", () => {
    expect(validateNodeNetwork().nodes).toBe(MAPABLE_NODES.length);
    expect(MAPABLE_NODES.every((n) => !n.aiCanApprove && !n.crossTenantRead && !n.mayActForParticipant)).toBe(true);
  });

  it("blocks unverified federation even when all caller-provided checks are true", () => {
    const result = routeNodeTask({
      targetNodeId: "evidence.accessibooks",
      authenticated: true, consentVerified: true,
      permissionVerified: true, subjectMapped: true, featureEnabled: true
    });
    expect(result).toEqual({ allowed: false, reason: "integration_unverified" });
  });

  it("requires every trusted routing prerequisite", () => {
    const common = {
      targetNodeId: "evidence.access-intelligence",
      authenticated: true, consentVerified: true,
      permissionVerified: true, subjectMapped: true, featureEnabled: true
    };
    expect(routeNodeTask({ ...common, consentVerified: false }).allowed).toBe(false);
    expect(routeNodeTask({ ...common, authenticated: false }).allowed).toBe(false);
    expect(routeNodeTask({ ...common, featureEnabled: false }).allowed).toBe(false);
    expect(routeNodeTask({ ...common, permissionVerified: false }).allowed).toBe(false);
    expect(routeNodeTask({ ...common, subjectMapped: false }).allowed).toBe(false);
    expect(routeNodeTask(common).allowed).toBe(true);
  });

  it("rejects sensitive payload and auto-publication", () => {
    expect(parseFabricEvent(event()).autoPublished).toBe(false);
    expect(() => parseFabricEvent({ ...event(), diagnosis: "private" })).toThrow();
    expect(() => parseFabricEvent({ ...event(), participantId: "raw-user-id" })).toThrow();
    expect(() => parseFabricEvent({ ...event(), autoPublished: true })).toThrow();
  });

  it("keeps Kafka disabled by default", () => {
    expect(fabricStreamingEnabled({})).toBe(false);
    expect(fabricStreamingEnabled({ MAPABLE_AI_FABRIC_KAFKA_ENABLED: "true" })).toBe(false);
  });

  it("does not publish from a disabled adapter", async () => {
    const producer = { send: vi.fn() };
    expect((await publishFabricProjection(event(), producer, {})).status).toBe("disabled");
    expect(producer.send).not.toHaveBeenCalled();
  });

  it("routes approved shadow metadata to an explicit topic", async () => {
    const producer = { send: vi.fn().mockResolvedValue(undefined) };
    const parsed = parseFabricEvent(event());
    expect(topicForFabricEvent(parsed)).toBe(AI_FABRIC_TOPICS.accessEvidence);
    const result = await publishFabricProjection(parsed, producer, {
      MAPABLE_AI_FABRIC_KAFKA_ENABLED: "true",
      MAPABLE_AI_FABRIC_MODE: "shadow",
      MAPABLE_AI_FABRIC_HUMAN_REVIEW_ONLY: "true"
    });
    expect(result.status).toBe("published");
    expect(producer.send).toHaveBeenCalledOnce();
  });

  it("quarantines already-withdrawn aggregates", () => {
    expect(shouldQuarantineFabricEvent(parseFabricEvent(event()), new Set(["b".repeat(64)]))).toBe(true);
  });
});
