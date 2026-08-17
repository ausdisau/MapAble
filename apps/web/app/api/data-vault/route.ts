import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  listVaultRequestsForUser,
  requestDataVaultExport,
} from "@/lib/personal-data-vault/vault-service";
import { dataVaultRequestSchema } from "@/lib/validation/data-vault";

export async function GET() {
  const user = await requireApiPermission("data_vault:self");
  if (user instanceof Response) return user;
  const requests = await listVaultRequestsForUser(user.id);
  return jsonOk({ requests });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("data_vault:self");
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  let parsed;
  try {
    parsed = dataVaultRequestSchema.parse(body ?? {});
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    throw err;
  }

  const result = await requestDataVaultExport(user.id, parsed.requestType);
  return jsonOk(result, 201);
}
