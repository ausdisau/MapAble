import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { developerPlatformConfig } from "@/lib/config/developer-platform";
import { apiSuccessResponse } from "@/lib/platform/api/errors";
import { withV1Auth } from "@/lib/platform/api/v1-handler";
import {
  createWebhookSubscription,
  listPendingDeliveries,
  rotateWebhookSecret,
} from "@/lib/platform/webhooks/webhook-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("portal") === "true") {
    const user = await requireApiSession();
    if (user instanceof Response) return user;
    if (!developerPlatformConfig.partnerWebhooksEnabled) {
      return jsonError("Partner webhooks disabled", 503);
    }
    const clientId = url.searchParams.get("clientId");
    if (!clientId) return jsonError("clientId required", 400);
    const subs = await prisma.webhookSubscription.findMany({
      where: { apiClientId: clientId },
      select: {
        id: true,
        url: true,
        eventTypes: true,
        active: true,
        secretPrefix: true,
        signingVersion: true,
        createdAt: true,
      },
    });
    return jsonOk({ subscriptions: subs });
  }

  return withV1Auth(
    req,
    { requiredScope: "webhooks_receive" },
    async (ctx) => {
      const subs = await prisma.webhookSubscription.findMany({
        where: { apiClientId: ctx.client.id, active: true },
        select: {
          id: true,
          url: true,
          eventTypes: true,
          secretPrefix: true,
          signingVersion: true,
        },
      });
      return apiSuccessResponse({ subscriptions: subs });
    },
  );
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!developerPlatformConfig.partnerWebhooksEnabled) {
    return jsonError("Partner webhooks disabled", 503);
  }

  const body = await req.json();
  const result = await createWebhookSubscription({
    apiClientId: body.clientId,
    url: body.url,
    eventTypes: body.eventTypes ?? [],
    actorUserId: user.id,
  });

  return jsonOk(
    {
      subscription: {
        id: result.subscription.id,
        url: result.subscription.url,
        secretPrefix: result.subscription.secretPrefix,
      },
      secret: result.secret,
      message: result.message,
    },
    201,
  );
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!developerPlatformConfig.partnerWebhooksEnabled) {
    return jsonError("Partner webhooks disabled", 503);
  }

  const body = await req.json();
  if (body.action === "rotate_secret") {
    const result = await rotateWebhookSecret(body.subscriptionId, user.id);
    return jsonOk({
      secretPrefix: result.subscription.secretPrefix,
      secret: result.secret,
      previousSecretValidUntil: result.previousSecretValidUntil,
    });
  }

  if (body.action === "list_pending_deliveries") {
    const deliveries = await listPendingDeliveries(20);
    return jsonOk({ deliveries });
  }

  return jsonError("Unknown action", 400);
}
