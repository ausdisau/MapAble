import { afterEach, describe, expect, it } from "vitest";

import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { selectCareOSAgentNetwork } from "@/intelligence/network/agent-registry";
import { analyseCareOSContinuity } from "@/intelligence/network/continuity-radar";
import { buildCareOSMissionGraph } from "@/intelligence/network/mission-graph";
import { careOSNetworkRequestSchema } from "@/intelligence/network/types";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("CareOS network request contract", () => {
  it("requires a meaningful participant goal", () => {
    expect(
      careOSNetworkRequestSchema.safeParse({
        goal: "",
        modules: ["core", "care"],
      }).success
    ).toBe(false);
  });

  it("keeps accessibility-profile use off by default", () => {
    const request = careOSNetworkRequestSchema.parse({
      goal: "Help me attend my appointment",
      modules: ["core", "care", "transport", "access"],
    });

    expect(request.includeAccessibilityProfile).toBe(false);
    expect(request.includeContinuityAnalysis).toBe(true);
  });
});

describe("CareOS feature controls", () => {
  it("keeps the network and continuity radar fail-closed by default", () => {
    delete process.env.MAPABLE_AI_ENABLED;
    delete process.env.MAPABLE_CAREOS_NETWORK_ENABLED;
    delete process.env.MAPABLE_CAREOS_CONTINUITY_ENABLED;
    const config = getMapAbleIntelligenceConfig();

    expect(config.enabled).toBe(false);
    expect(config.careOSNetworkEnabled).toBe(false);
    expect(config.continuityRadarEnabled).toBe(false);
    expect(config.writeActionsEnabled).toBe(false);
  });

  it("keeps robotics MCP disabled by default", () => {
    delete process.env.MAPABLE_CAREOS_ROBOTICS_MCP_ENABLED;
    expect(getMapAbleIntelligenceConfig().roboticsMcpEnabled).toBe(false);
  });

  it("disables the network when the global kill switch is off", () => {
    process.env.MAPABLE_AI_ENABLED = "false";
    const config = getMapAbleIntelligenceConfig();

    expect(config.careOSNetworkEnabled).toBe(false);
    expect(config.continuityRadarEnabled).toBe(false);
    expect(config.roboticsMcpEnabled).toBe(false);
  });
});

describe("CareOS bounded agent registry", () => {
  it("keeps the manager and participant advocate active", () => {
    const agents = selectCareOSAgentNetwork({
      modules: ["core", "care", "transport", "access"],
      enabledModules: {
        core: true,
        care: true,
        transport: true,
        jobs: true,
        access: true,
        moves: false,
        foods: false,
        payments: false,
      },
      includeContinuityAnalysis: true,
    });

    expect(agents.find((agent) => agent.id === "manager")?.status).toBe("active");
    expect(
      agents.find((agent) => agent.id === "participant_advocate")?.status
    ).toBe("active");
    expect(agents.find((agent) => agent.id === "continuity")?.status).toBe(
      "active"
    );
  });

  it("keeps safeguarding human-only and robotics research-only", () => {
    const agents = selectCareOSAgentNetwork({
      modules: ["core", "care"],
      enabledModules: {
        core: true,
        care: true,
        transport: true,
        jobs: true,
        access: true,
        moves: false,
        foods: false,
        payments: false,
      },
      includeContinuityAnalysis: true,
    });

    expect(agents.find((agent) => agent.id === "safeguarding")?.status).toBe(
      "human_only"
    );
    expect(agents.find((agent) => agent.id === "robotics")?.status).toBe(
      "research_only"
    );
    expect(
      agents.find((agent) => agent.id === "robotics")?.maximumAuthorityLevel
    ).toBe("L1_DRAFT");
  });
});

describe("CareOS mission graph and continuity", () => {
  it("links a care request to transport when linked transport is required", () => {
    const mission = buildCareOSMissionGraph({
      goal: "Attend physiotherapy",
      results: [
        {
          module: "core",
          status: "available",
          items: [
            {
              id: "appointment-1",
              title: "Physiotherapy",
              startAt: "2026-08-01T02:00:00.000Z",
            },
          ],
        },
        {
          module: "care",
          status: "available",
          items: [
            {
              id: "care-1",
              title: "Appointment support",
              status: "open",
              linkedTransportRequired: true,
            },
          ],
        },
        { module: "transport", status: "empty", items: [] },
        { module: "access", status: "empty", items: [] },
      ],
    });

    expect(
      mission.edges.some(
        (edge) =>
          edge.from === "mission-care" &&
          edge.to === "mission-transport" &&
          edge.relationship === "depends_on"
      )
    ).toBe(true);

    const alerts = analyseCareOSContinuity(mission);
    expect(alerts.some((alert) => alert.code === "LINKED_TRANSPORT_MISSING")).toBe(
      true
    );
    expect(
      alerts.find((alert) => alert.code === "LINKED_TRANSPORT_MISSING")
        ?.humanReviewRequired
    ).toBe(true);
  });

  it("does not invent missing access evidence", () => {
    const mission = buildCareOSMissionGraph({
      goal: "Attend an accessible event",
      results: [
        { module: "core", status: "empty", items: [] },
        { module: "care", status: "empty", items: [] },
        { module: "transport", status: "empty", items: [] },
        { module: "access", status: "empty", items: [] },
      ],
    });

    const accessNode = mission.nodes.find((node) => node.id === "mission-access");
    expect(accessNode?.status).toBe("missing");
    expect(accessNode?.evidence).toEqual([]);
    expect(
      analyseCareOSContinuity(mission).some(
        (alert) => alert.code === "ACCESS_EVIDENCE_MISSING"
      )
    ).toBe(true);
  });

  it("preserves not-authorised states instead of treating them as empty data", () => {
    const mission = buildCareOSMissionGraph({
      goal: "Review support",
      results: [
        { module: "core", status: "available", items: [] },
        { module: "care", status: "not_authorised", items: [] },
        { module: "transport", status: "disabled", items: [] },
        { module: "access", status: "empty", items: [] },
      ],
    });

    expect(mission.nodes.find((node) => node.id === "mission-care")?.status).toBe(
      "not_authorised"
    );
    expect(
      mission.nodes.find((node) => node.id === "mission-transport")?.status
    ).toBe("disabled");
  });
});
