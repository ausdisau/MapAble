import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { WorkerFitDeclarationSchema } from "@/lib/support-builder/relational-fit";

export const dynamic = "force-dynamic";

function previewEnabled(): boolean {
  return (
    process.env.VERCEL_ENV !== "production" &&
    process.env.MAPABLE_SUPPORT_BUILDER_ENABLED === "true" &&
    process.env.MAPABLE_RELATIONAL_FIT_ENABLED === "true"
  );
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

async function ownedWorker(workerProfileId: string, userId: string) {
  return prisma.workerProfile.findFirst({
    where: { id: workerProfileId, userId, active: true },
    select: { id: true, organisationId: true },
  });
}

export async function GET() {
  if (!previewEnabled()) return Response.json({ error: "Not available." }, { status: 404 });
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  try {
    const profiles = await prisma.workerProfile.findMany({
      where: { userId: actor.id, active: true },
      select: {
        id: true,
        displayName: true,
        organisation: { select: { name: true } },
        relationalFitProfile: {
          select: {
            communicationModes: true,
            routineStyle: true,
            interactionStyle: true,
            initiativeStyle: true,
            continuityStyle: true,
            consentedAt: true,
          },
        },
      },
      orderBy: { displayName: "asc" },
      take: 20,
    });
    return Response.json({ profiles }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      { error: "Worker preferences are unavailable until the preview database is prepared." },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  if (!previewEnabled()) return Response.json({ error: "Not available." }, { status: 404 });
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  if (!checkIpRateLimit(getClientIp(request), { windowMs: 60_000, max: 10 })) {
    return Response.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 3000) return Response.json({ error: "Profile is too large." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = WorkerFitDeclarationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Complete the consent and supported work practices." }, { status: 400 });
  }
  const data = parsed.data;
  const profile = await ownedWorker(data.workerProfileId, actor.id);
  if (!profile) return Response.json({ error: "Worker profile not found or not yours." }, { status: 403 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.relationalFitWorkerProfile.upsert({
        where: { workerProfileId: profile.id },
        create: {
          workerProfileId: profile.id,
          communicationModes: data.communicationModes,
          routineStyle: data.routineStyle,
          interactionStyle: data.interactionStyle,
          initiativeStyle: data.initiativeStyle,
          continuityStyle: data.continuityStyle,
          consentVersion: "v1",
          consentedAt: new Date(),
        },
        update: {
          communicationModes: data.communicationModes,
          routineStyle: data.routineStyle,
          interactionStyle: data.interactionStyle,
          initiativeStyle: data.initiativeStyle,
          continuityStyle: data.continuityStyle,
          consentVersion: "v1",
          consentedAt: new Date(),
        },
      });
      await createAuditEvent({
        tx,
        actorUserId: actor.id,
        actorRole: actor.primaryRole,
        action: "relational_fit.worker_opt_in",
        entityType: "RelationalFitWorkerProfile",
        entityId: profile.id,
        organisationId: profile.organisationId,
        metadata: { consentVersion: "v1", mode: "declared_practices" },
      });
    });
    return Response.json({ saved: true, consentRecorded: true }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      { error: "The worker preference profile could not be saved. No participation has been confirmed." },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!previewEnabled()) return Response.json({ error: "Not available." }, { status: 404 });
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  const workerProfileId = z.string().min(1).max(150).safeParse(
    new URL(request.url).searchParams.get("workerProfileId"),
  );
  if (!workerProfileId.success) {
    return Response.json({ error: "A worker profile is required." }, { status: 400 });
  }
  const profile = await ownedWorker(workerProfileId.data, actor.id);
  if (!profile) return Response.json({ error: "Worker profile not found or not yours." }, { status: 403 });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.relationalFitWorkerProfile.deleteMany({
        where: { workerProfileId: profile.id },
      });
      await createAuditEvent({
        tx,
        actorUserId: actor.id,
        actorRole: actor.primaryRole,
        action: "relational_fit.worker_opt_out",
        entityType: "RelationalFitWorkerProfile",
        entityId: profile.id,
        organisationId: profile.organisationId,
        metadata: { consentVersion: "v1" },
      });
    });
    return Response.json({ withdrawn: true }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json({ error: "Withdrawal could not be completed. Request human support." }, { status: 503 });
  }
}
