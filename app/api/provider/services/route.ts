import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createProviderServiceOffering,
  listProviderServiceOfferings,
} from "@/lib/provider/provider-service-catalogue";

const schema = z.object({
  organisationId: z.string().min(1),
  serviceType: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  serviceAreas: z.array(z.string()).default([]),
  deliveryModes: z.array(z.string()).default([]),
  accessibilityFeatures: z.array(z.string()).default([]),
  supportCapabilities: z.array(z.string()).default([]),
  communicationCapabilities: z.array(z.string()).default([]),
  highIntensitySupported: z.boolean().default(false),
  evidenceExpiresAt: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  const organisationId = new URL(request.url).searchParams.get("organisationId");
  if (!organisationId) return jsonError("organisationId is required", 400);
  try {
    return jsonOk({
      offerings: await listProviderServiceOfferings({ actor, organisationId }),
    });
  } catch {
    return jsonError("Forbidden", 403);
  }
}

export async function POST(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const offering = await createProviderServiceOffering({
      actor,
      ...parsed.data,
      evidenceExpiresAt: parsed.data.evidenceExpiresAt
        ? new Date(parsed.data.evidenceExpiresAt)
        : undefined,
    });
    return jsonOk({ offering }, 201);
  } catch {
    return jsonError("Forbidden", 403);
  }
}
