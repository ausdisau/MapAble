import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { Permission } from "@/lib/auth/permissions";

import { adminListQuerySchema } from "./adminSchemas";
import {
  getCommandCentre,
  listAgentRuns,
  listBillingExceptions,
  listBookings,
  listComplianceTasks,
  listParticipants,
  listSafeguarding,
  listWorkers,
} from "./adminService";

function parseListQuery(req: Request) {
  const url = new URL(req.url);
  return adminListQuerySchema.parse({
    q: url.searchParams.get("q") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
    atRiskOnly: url.searchParams.get("atRiskOnly") ?? undefined,
  });
}

function withScope(
  permission: Permission,
  handler: (req: Request, user: CurrentUser) => Promise<Response>
) {
  return async function route(req: Request) {
    const user = await requireApiAdminScope(permission);
    if (user instanceof Response) return user;
    return handler(req, user);
  };
}

export const getCommandCentreHandler = withScope(
  "admin:command-centre:read",
  async (_req, user) => {
    const data = await getCommandCentre(user);
    return jsonOk(data);
  }
);

export const getParticipantsHandler = withScope(
  "admin:participants:read",
  async (req, user) => {
    const query = parseListQuery(req);
    const data = await listParticipants(user, query);
    return jsonOk(data);
  }
);

export const getWorkersHandler = withScope(
  "admin:workers:read",
  async (req, user) => {
    const query = parseListQuery(req);
    const data = await listWorkers(user, query);
    return jsonOk(data);
  }
);

export const getBookingsHandler = withScope(
  "admin:bookings:read",
  async (req, user) => {
    const query = parseListQuery(req);
    const data = await listBookings(user, query);
    return jsonOk(data);
  }
);

export const getSafeguardingHandler = withScope(
  "admin:safeguarding:read",
  async (req, user) => {
    const query = parseListQuery(req);
    const data = await listSafeguarding(user, query);
    return jsonOk(data);
  }
);

export const getBillingHandler = withScope(
  "admin:billing:read",
  async (req, user) => {
    const query = parseListQuery(req);
    const data = await listBillingExceptions(user, query);
    return jsonOk(data);
  }
);

export const getComplianceHandler = withScope(
  "admin:compliance:read",
  async (req, user) => {
    const query = parseListQuery(req);
    const data = await listComplianceTasks(user, query);
    return jsonOk(data);
  }
);

export const getAgentRunsHandler = withScope(
  "admin:agent-runs:read",
  async (req, user) => {
    const query = parseListQuery(req);
    const data = await listAgentRuns(user, query);
    return jsonOk(data);
  }
);
