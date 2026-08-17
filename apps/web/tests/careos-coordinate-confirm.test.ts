import { describe, expect, it } from "vitest";

import { buildCareOSActionProposals } from "@/intelligence/network/action-proposals";
import { buildCareOSHumanReviewQueue } from "@/intelligence/network/human-review";
import {
  careOSActionProposalSchema,
  careOSHumanReviewItemSchema,
} from "@/intelligence/network/types";

const nodes = [
  {
    id: "mission-care",
    type: "care_support" as const,
    label: "Care support",
    status: "missing" as const,
    sourceModule: "care" as const,
    recordId: null,
    startsAt: null,
    details: "Care coverage is not confirmed.",
    evidence: [],
  },
  {
    id: "mission-transport",
    type: "transport" as const,
    label: "Accessible transport",
    status: "missing" as const,
    sourceModule: "transport" as const,
    recordId: null,
    startsAt: null,
    details: "Transport is not confirmed.",
    evidence: [],
  },
];

describe("CareOS action proposals", () => {
  it("creates bounded care and transport drafts with hashes and expiry", () => {
    const proposals = buildCareOSActionProposals({
      requestId: "request-1",
      participantId: "participant-1",
      request: {
        goal: "Attend physiotherapy next Tuesday",
        modules: ["core", "care", "transport", "access"],
        includeAccessibilityProfile: false,
        includeContinuityAnalysis: true,
        plainLanguage: true,
      },
      nodes,
    });

    expect(proposals).toHaveLength(2);
    for (const proposal of proposals) {
      expect(careOSActionProposalSchema.safeParse(proposal).success).toBe(true);
      expect(proposal.status).toBe("draft");
      expect(proposal.authorityLevel).toBe("L3_CONFIRMED_ACTION");
      expect(proposal.payloadHash).toMatch(/^[a-f0-9]{64}$/);
      expect(new Date(proposal.expiresAt).getTime()).toBeGreaterThan(Date.now());
    }
  });

  it("does not create a proposal for a disabled module", () => {
    const proposals = buildCareOSActionProposals({
      requestId: "request-2",
      participantId: "participant-1",
      request: {
        goal: "Attend physiotherapy",
        modules: ["care", "transport"],
        includeAccessibilityProfile: false,
        includeContinuityAnalysis: true,
        plainLanguage: true,
      },
      nodes: nodes.map((node) =>
        node.id === "mission-transport" ? { ...node, status: "disabled" as const } : node
      ),
    });

    expect(proposals.map((proposal) => proposal.actionType)).toEqual([
      "submit_care_request",
    ]);
  });
});

describe("CareOS human review queue", () => {
  it("routes urgent linked transport failure to a support coordinator", () => {
    const queue = buildCareOSHumanReviewQueue({
      requestId: "request-3",
      participantId: "participant-1",
      nodes,
      alerts: [
        {
          id: "alert-1",
          severity: "urgent",
          code: "LINKED_TRANSPORT_MISSING",
          title: "Linked transport is missing",
          explanation: "Care is linked to an appointment but transport is not confirmed.",
          affectedNodeIds: ["mission-care", "mission-transport"],
          recoveryActions: ["Ask a coordinator to secure compatible transport."],
          humanReviewRequired: true,
        },
      ],
    });

    expect(queue).toHaveLength(1);
    expect(careOSHumanReviewItemSchema.safeParse(queue[0]).success).toBe(true);
    expect(queue[0]?.category).toBe("transport_continuity");
    expect(queue[0]?.assignedRole).toBe("support_coordinator");
    expect(queue[0]?.priority).toBe("urgent");
    expect(queue[0]?.participantContactRequired).toBe(true);
  });

  it("does not create review work for advisory-only alerts", () => {
    const queue = buildCareOSHumanReviewQueue({
      requestId: "request-4",
      participantId: "participant-1",
      nodes,
      alerts: [
        {
          id: "alert-2",
          severity: "information",
          code: "ACCESS_EVIDENCE_MISSING",
          title: "Access evidence missing",
          explanation: "Access evidence is not available.",
          affectedNodeIds: [],
          recoveryActions: ["Review the venue profile."],
          humanReviewRequired: false,
        },
      ],
    });

    expect(queue).toEqual([]);
  });
});
