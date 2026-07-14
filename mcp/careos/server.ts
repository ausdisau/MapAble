#!/usr/bin/env npx tsx
/**
 * MapAble CareOS MCP server.
 *
 * Exposes CareOS network contracts, mission validation, continuity simulation and
 * simulation-only robotics task preparation to Cursor and other MCP hosts.
 * It never connects model output directly to bookings, payments, clinical actions
 * or physical actuators.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { selectCareOSAgentNetwork } from "../../intelligence/network/agent-registry";
import { analyseCareOSContinuity } from "../../intelligence/network/continuity-radar";
import { buildCareOSMissionGraph } from "../../intelligence/network/mission-graph";
import { careOSNetworkRequestSchema } from "../../intelligence/network/types";
import { mapAbleModuleSchema } from "../../intelligence/types";

const server = new McpServer({
  name: "mapable-careos",
  version: "0.1.0",
});

const DEFAULT_MODULE_FLAGS = {
  core: true,
  care: true,
  transport: true,
  jobs: true,
  access: true,
  moves: false,
  foods: false,
  payments: false,
} as const;

server.tool(
  "careos_get_framework",
  "Returns the bounded CareOS agent network, authority ceilings and safety boundaries.",
  {
    modules: z.array(mapAbleModuleSchema).optional(),
    includeContinuityAnalysis: z.boolean().optional(),
  },
  async ({ modules, includeContinuityAnalysis }) => {
    const selectedModules = modules ?? ["core", "care", "transport", "access"];
    const agents = selectCareOSAgentNetwork({
      modules: selectedModules,
      enabledModules: DEFAULT_MODULE_FLAGS,
      includeContinuityAnalysis: includeContinuityAnalysis ?? true,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              operatingRule:
                "Agents interpret, retrieve, compare, draft and recommend. Participants decide. Existing MapAble services execute.",
              maximumDefaultAuthority: "L2_RECOMMEND",
              prohibited: [
                "autonomous booking",
                "autonomous payment or claim",
                "clinical diagnosis or prescribing",
                "eligibility or funding denial",
                "emotion or deception recognition",
                "disability severity scoring",
                "autonomous safeguarding conclusions",
                "direct robotics actuation",
              ],
              agents,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "careos_validate_mission_request",
  "Validates a CareOS mission request without reading participant records or executing an action.",
  {
    goal: z.string(),
    modules: z.array(mapAbleModuleSchema),
    includeAccessibilityProfile: z.boolean().optional(),
    includeContinuityAnalysis: z.boolean().optional(),
    plainLanguage: z.boolean().optional(),
  },
  async (input) => {
    const parsed = careOSNetworkRequestSchema.safeParse(input);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            parsed.success
              ? {
                  valid: true,
                  request: parsed.data,
                  notice: "Validation only. No participant data was read and no action was executed.",
                }
              : {
                  valid: false,
                  issues: parsed.error.flatten(),
                },
            null,
            2
          ),
        },
      ],
      isError: !parsed.success,
    };
  }
);

server.tool(
  "careos_simulate_continuity",
  "Builds a synthetic CareOS mission graph and returns continuity gaps. Does not access production participant data.",
  {
    goal: z.string().min(3),
    appointmentAvailable: z.boolean(),
    careAvailable: z.boolean(),
    transportAvailable: z.boolean(),
    accessEvidenceAvailable: z.boolean(),
    linkedTransportRequired: z.boolean().optional(),
  },
  async (input) => {
    const results = [
      {
        module: "core" as const,
        status: input.appointmentAvailable ? ("available" as const) : ("empty" as const),
        items: input.appointmentAvailable
          ? [{ id: "synthetic-appointment", title: "Synthetic appointment", startAt: new Date().toISOString() }]
          : [],
      },
      {
        module: "care" as const,
        status: input.careAvailable ? ("available" as const) : ("empty" as const),
        items: input.careAvailable
          ? [
              {
                id: "synthetic-care",
                title: "Synthetic care request",
                status: "open",
                linkedTransportRequired: input.linkedTransportRequired ?? false,
              },
            ]
          : [],
      },
      {
        module: "transport" as const,
        status: input.transportAvailable ? ("available" as const) : ("empty" as const),
        items: input.transportAvailable
          ? [{ id: "synthetic-trip", status: "requested", scheduledStart: new Date().toISOString() }]
          : [],
      },
      {
        module: "access" as const,
        status: input.accessEvidenceAvailable ? ("available" as const) : ("empty" as const),
        items: input.accessEvidenceAvailable
          ? [{ id: "synthetic-access", name: "Synthetic destination", confidence: 0.8 }]
          : [],
      },
    ];

    const mission = buildCareOSMissionGraph({ goal: input.goal, results });
    const alerts = analyseCareOSContinuity(mission);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              synthetic: true,
              mission,
              continuityAlerts: alerts,
              notice: "Simulation only. No production participant data was accessed.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "careos_prepare_robotics_task",
  "Prepares a simulation-only robotics task contract. Physical actuation is always refused by this MCP server.",
  {
    deviceId: z.string().min(1),
    taskType: z.enum([
      "read_device_status",
      "return_to_dock",
      "deliver_light_object",
      "telepresence_move",
      "adjust_environment",
    ]),
    destination: z.string().optional(),
    simulateOnly: z.boolean().default(true),
  },
  async (input) => {
    if (!input.simulateOnly) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                accepted: false,
                code: "PHYSICAL_ACTUATION_PROHIBITED",
                message:
                  "CareOS MCP may prepare or simulate a task, but physical execution requires a separate device-specific trust gateway, participant approval and independent safety controller.",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              accepted: true,
              proposal: {
                deviceId: input.deviceId,
                taskType: input.taskType,
                destination: input.destination ?? null,
                mode: "simulation_only",
                authorityLevel: "L1_DRAFT",
                requiresParticipantApprovalForFutureExecution: true,
                requiresIndependentSafetyController: true,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              },
              notice: "No command was sent to a robot or assistive device.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "careos_mapable_api_reference",
  "Lists the CareOS HTTP API surfaces available in the MapAble application.",
  {},
  async () => ({
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            baseUrl:
              process.env.MAPABLE_BASE_URL ??
              process.env.NEXT_PUBLIC_APP_URL ??
              "(set MAPABLE_BASE_URL or NEXT_PUBLIC_APP_URL)",
            endpoints: [
              {
                method: "POST",
                path: "/api/intelligence/careos-network",
                effect: "read-only mission graph and continuity analysis",
              },
              {
                method: "POST",
                path: "/api/intelligence/platform-brief",
                effect: "read-only cross-platform brief",
              },
              {
                method: "POST",
                path: "/api/intelligence/journey",
                effect: "prepare an accessible journey proposal",
              },
              {
                method: "POST",
                path: "/api/intelligence/approvals/transport",
                effect: "explicitly confirmed transport request through the existing service",
              },
            ],
            authNote:
              "Use host-managed session credentials. Never place participant data or secrets in MCP prompts.",
          },
          null,
          2
        ),
      },
    ],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("mapable-careos MCP server failed:", error);
  process.exit(1);
});
