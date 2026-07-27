import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import {
  createPlatformRegistrationPack,
  listPlatformRegistrationPacks,
  updateChecklistItem,
} from "@/lib/careos/opportunities/platform-registration-pack";

export async function GET(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const url = new URL(request.url);
  const packs = await listPlatformRegistrationPacks({
    organisationId: url.searchParams.get("organisationId") ?? undefined,
    tenantId: url.searchParams.get("tenantId") ?? undefined,
  });
  return NextResponse.json({ packs, claimSubmissionEnabled: false });
}

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const body = (await request.json()) as {
    action?: string;
    title?: string;
    organisationId?: string;
    tenantId?: string;
    notes?: string;
    packId?: string;
    standardKey?: string;
    status?:
      | "not_started"
      | "in_progress"
      | "evidence_attached"
      | "human_confirmed";
    evidenceRefs?: string[];
  };

  if (body.action === "update_item") {
    if (!body.packId || !body.standardKey || !body.status) {
      return NextResponse.json({ error: "INVALID_ITEM_UPDATE" }, { status: 400 });
    }
    const item = await updateChecklistItem({
      packId: body.packId,
      standardKey: body.standardKey,
      status: body.status,
      evidenceRefs: body.evidenceRefs,
      notes: body.notes,
      actorUserId: user.id,
    });
    return NextResponse.json({ item });
  }

  if (!body.title) {
    return NextResponse.json({ error: "TITLE_REQUIRED" }, { status: 400 });
  }

  const pack = await createPlatformRegistrationPack({
    title: body.title,
    organisationId: body.organisationId,
    tenantId: body.tenantId,
    notes: body.notes,
    createdById: user.id,
  });
  return NextResponse.json({ pack }, { status: 201 });
}
