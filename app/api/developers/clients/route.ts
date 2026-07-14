import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { developerPlatformConfig } from "@/lib/config/developer-platform";
import {
  activateApiClient,
  createApiClient,
  issueApiKey,
  listApiClients,
} from "@/lib/platform/developer-auth/api-client-service";
import { registerOAuthClient } from "@/lib/platform/developer-auth/oauth-client-service";
import { createServiceAccount } from "@/lib/platform/developer-auth/service-account-service";
import type { ApiScope } from "@prisma/client";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!developerPlatformConfig.enabled) {
    return jsonError("Developer platform disabled", 503);
  }
  const clients = await listApiClients();
  return jsonOk({ clients });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!developerPlatformConfig.enabled) {
    return jsonError("Developer platform disabled", 503);
  }

  const body = await req.json();

  if (body.action === "create_client") {
    const client = await createApiClient({
      name: body.name ?? "New API client",
      organisationId: body.organisationId,
      environment: body.environment ?? "sandbox",
      actorUserId: user.id,
    });
    return jsonOk({ client }, 201);
  }

  if (body.action === "activate_client") {
    const client = await activateApiClient(body.clientId, user.id);
    return jsonOk({ client });
  }

  if (body.action === "issue_key") {
    const result = await issueApiKey(
      body.clientId,
      (body.scopes ?? ["places_read"]) as ApiScope[],
      user.id,
    );
    return jsonOk(result, 201);
  }

  if (body.action === "register_oauth") {
    const result = await registerOAuthClient({
      apiClientId: body.clientId,
      redirectUris: body.redirectUris ?? [],
      scopes: (body.scopes ?? ["places_read"]) as ApiScope[],
      actorUserId: user.id,
    });
    return jsonOk(result, 201);
  }

  if (body.action === "create_service_account") {
    const account = await createServiceAccount({
      apiClientId: body.clientId,
      name: body.name ?? "Service account",
      scopes: (body.scopes ?? ["places_read"]) as ApiScope[],
      actorUserId: user.id,
    });
    return jsonOk({ account }, 201);
  }

  return jsonError("Unknown action", 400);
}
