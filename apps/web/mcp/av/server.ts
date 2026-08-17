#!/usr/bin/env npx tsx
/**
 * MapAble Autonomous Vehicle (AV) MCP server — stdio transport for Cursor and other MCP hosts.
 * Exposes governance, trip state machine, vehicle suitability, and advisory routing helpers.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  AV_CAPABILITY_MATRIX,
  AV_GOVERNANCE,
  avTripTransitionAllowed,
  AV_DRIVER_TRIP_TRANSITIONS,
  AV_TRIP_TRANSITIONS,
  checkAvVehicleSuitability,
} from "../../lib/platform/av-framework";

const server = new McpServer({
  name: "mapable-av",
  version: AV_GOVERNANCE.version,
});

server.tool(
  "av_get_framework",
  "Returns MapAble AV framework governance: human-in-the-loop rules, non-goals, SAE reference, and API entry points.",
  {},
  async () => ({
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            governance: AV_GOVERNANCE,
            capabilities: AV_CAPABILITY_MATRIX,
          },
          null,
          2
        ),
      },
    ],
  })
);

server.tool(
  "av_get_trip_status_graph",
  "Returns allowed transport trip status transitions for providers/admins and for drivers.",
  {
    driverOnly: z
      .boolean()
      .optional()
      .describe("If true, return driver-only transition map"),
  },
  async ({ driverOnly }) => {
    const graph = driverOnly ? AV_DRIVER_TRIP_TRANSITIONS : AV_TRIP_TRANSITIONS;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ driverOnly: !!driverOnly, transitions: graph }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "av_validate_trip_status_transition",
  "Checks whether a transport trip status change is allowed under MapAble rules (no autonomous bypass).",
  {
    fromStatus: z.string().describe("Current TransportTripStatus"),
    toStatus: z.string().describe("Proposed TransportTripStatus"),
    driverOnly: z
      .boolean()
      .optional()
      .describe("Use driver-only transition table"),
  },
  async ({ fromStatus, toStatus, driverOnly }) => {
    const allowed = avTripTransitionAllowed(
      fromStatus as never,
      toStatus as never,
      { driverOnly }
    );
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              fromStatus,
              toStatus,
              driverOnly: !!driverOnly,
              allowed,
              message: allowed
                ? "Transition permitted by state machine."
                : "Transition not permitted — requires different workflow or human dispatch.",
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
  "av_check_vehicle_suitability",
  "Compares participant accessibility requirements against vehicle capability flags (advisory).",
  {
    requiresWheelchairAccessible: z.boolean().optional(),
    requiresRamp: z.boolean().optional(),
    requiresLift: z.boolean().optional(),
    assistanceAnimal: z.boolean().optional(),
    wheelchairAccessible: z.boolean().optional(),
    rampAvailable: z.boolean().optional(),
    liftAvailable: z.boolean().optional(),
    assistanceAnimalFriendly: z.boolean().optional(),
  },
  async (input) => {
    const { suitable, warnings } = checkAvVehicleSuitability(
      {
        requiresWheelchairAccessible: input.requiresWheelchairAccessible,
        requiresRamp: input.requiresRamp,
        requiresLift: input.requiresLift,
        assistanceAnimal: input.assistanceAnimal,
      },
      {
        wheelchairAccessible: input.wheelchairAccessible,
        rampAvailable: input.rampAvailable,
        liftAvailable: input.liftAvailable,
        assistanceAnimalFriendly: input.assistanceAnimalFriendly,
      }
    );
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ suitable, warnings }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "av_route_estimate_advisory",
  "Fetches an advisory driving route estimate from OSRM (not a guaranteed ETA). Does not dispatch trips.",
  {
    pickupLon: z.number().describe("Pickup longitude"),
    pickupLat: z.number().describe("Pickup latitude"),
    dropoffLon: z.number().describe("Dropoff longitude"),
    dropoffLat: z.number().describe("Dropoff latitude"),
  },
  async ({ pickupLon, pickupLat, dropoffLon, dropoffLat }) => {
    const base =
      process.env.OSRM_BASE_URL?.replace(/\/$/, "") ||
      "http://router.project-osrm.org";
    const coords = `${pickupLon},${pickupLat};${dropoffLon},${dropoffLat}`;
    const url = `${base}/route/v1/driving/${coords}?overview=false`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                advisory: true,
                error: `OSRM returned ${res.status}`,
                requiresHumanReview: true,
              }),
            },
          ],
          isError: true,
        };
      }
      const data = (await res.json()) as {
        routes?: { distance: number; duration: number }[];
      };
      const route = data.routes?.[0];
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                advisory: true,
                requiresHumanReview: true,
                distanceMetres: route?.distance ?? null,
                durationSeconds: route?.duration ?? null,
                provider: "osrm",
                note: "Advisory only — human dispatch still required.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : "OSRM request failed";
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ advisory: true, error: message }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "av_mapable_transport_api_reference",
  "Lists MapAble transport HTTP API paths agents can call when MAPABLE_BASE_URL and auth are configured.",
  {},
  async () => {
    const base = process.env.MAPABLE_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              baseUrl: base ?? "(set MAPABLE_BASE_URL or NEXT_PUBLIC_APP_URL)",
              authNote:
                "Use session cookies or service credentials from the host environment; never embed secrets in prompts.",
              endpoints: [
                { method: "GET", path: "/api/transport/trips" },
                { method: "POST", path: "/api/transport/trips" },
                { method: "GET", path: "/api/transport/trips/:tripId" },
                { method: "PATCH", path: "/api/transport/trips/:tripId" },
                { method: "POST", path: "/api/transport/routing/estimate" },
                { method: "POST", path: "/api/transport/routing/optimise" },
              ],
              ui: AV_GOVERNANCE.mapableIntegration,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("mapable-av MCP server failed:", err);
  process.exit(1);
});
