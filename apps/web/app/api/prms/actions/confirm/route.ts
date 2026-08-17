import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { apiForbidden } from "@/lib/auth/guards";
import { createLedgerEvent } from "@/lib/ledger/createLedgerEvent";
import { confirmDraft, getDraft } from "@/lib/prms/draftStore";
import {
  assertCanAccessParticipantData,
  ParticipantAccessError,
} from "@/lib/prms/participant-access";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await request.json();
    const draftId = typeof body.draftId === "string" ? body.draftId : "";

    if (!draftId) {
      return NextResponse.json(
        { error: "Draft id is required to confirm." },
        { status: 400 }
      );
    }

    const existing = getDraft(draftId);
    if (!existing) {
      return NextResponse.json(
        { error: "Draft not found or already confirmed." },
        { status: 404 }
      );
    }

    try {
      await assertCanAccessParticipantData(user, existing.participantId);
    } catch (e) {
      if (e instanceof ParticipantAccessError) {
        return apiForbidden(e.message);
      }
      throw e;
    }

    const confirmedBy = user.id === existing.participantId ? "participant" : "system";

    const official = confirmDraft(draftId, confirmedBy);
    if (!official) {
      return NextResponse.json(
        { error: "Could not confirm draft." },
        { status: 500 }
      );
    }

    const ledgerEvent = createLedgerEvent({
      type:
        official.type === "SERVICE_EVENT"
          ? "service_event_confirmed"
          : "copilot_action_confirmed",
      subjectType:
        official.type === "SERVICE_EVENT" ? "service_event" : "draft_record",
      subjectRef: official.id,
      participantRef: official.participantId,
      actorRole: confirmedBy === "participant" ? "participant" : "system",
      payload: {
        recordType: official.type,
        confirmedAt: official.confirmedAt,
      },
    });

    return NextResponse.json({
      record: official,
      ledgerEventId: ledgerEvent.id,
      message: "Record confirmed in PRMS.",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not confirm record. Please try again." },
      { status: 500 }
    );
  }
}
