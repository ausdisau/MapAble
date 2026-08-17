import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { apiForbidden } from "@/lib/auth/guards";
import { createLedgerEvent } from "@/lib/ledger/createLedgerEvent";
import { createDraft } from "@/lib/prms/draftStore";
import {
  assertCanAccessParticipantData,
  ParticipantAccessError,
} from "@/lib/prms/participant-access";
import type { DraftPrmsRecord, PrmsRecordType } from "@/lib/prms/types";

const VALID_TYPES: PrmsRecordType[] = [
  "SERVICE_EVENT",
  "CARE_REQUEST",
  "TRANSPORT_REQUEST",
  "EMPLOYMENT_SUPPORT_RECORD",
  "PLAN_MANAGEMENT_INVOICE",
  "INCIDENT",
  "PROGRESS_NOTE",
];

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await request.json();

    const participantId =
      typeof body.participantId === "string" ? body.participantId : "";
    const type = body.type as PrmsRecordType;
    const payload =
      typeof body.payload === "object" && body.payload !== null
        ? (body.payload as Record<string, unknown>)
        : {};

    if (!participantId) {
      return NextResponse.json(
        { error: "Sign in to create a participant record." },
        { status: 401 }
      );
    }

    try {
      await assertCanAccessParticipantData(user, participantId);
    } catch (e) {
      if (e instanceof ParticipantAccessError) {
        return apiForbidden(e.message);
      }
      throw e;
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "This record type cannot be drafted here." },
        { status: 400 }
      );
    }

    const record: Omit<DraftPrmsRecord, "id"> = {
      type,
      status: "draft",
      participantId,
      payload,
    };

    const stored = createDraft(record);

    const ledgerEvent = createLedgerEvent({
      type: "copilot_draft_created",
      subjectType: "draft_record",
      subjectRef: stored.id,
      participantRef: participantId,
      actorRole: "copilot",
      payload: {
        recordType: type,
        draftStatus: stored.status,
      },
    });

    return NextResponse.json({
      draft: stored,
      ledgerEventId: ledgerEvent.id,
      message: "Draft created. Nothing is booked or shared until you confirm.",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not save draft. Please try again." },
      { status: 500 }
    );
  }
}
