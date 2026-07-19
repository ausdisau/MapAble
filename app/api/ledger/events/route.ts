import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import type { CurrentUser } from "@/lib/auth/current-user";
import { apiForbidden } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import {
  createLedgerEvent,
  listLedgerEvents,
} from "@/lib/ledger/createLedgerEvent";
import type {
  LedgerActorRole,
  LedgerEventType,
  LedgerSubjectType,
} from "@/lib/ledger/types";
import {
  assertCanAccessParticipantData,
  ParticipantAccessError,
} from "@/lib/prms/participant-access";

function ledgerActorRoleForUser(user: CurrentUser): LedgerActorRole {
  switch (user.primaryRole) {
    case "participant":
      return "participant";
    case "family_member":
      return "nominee";
    case "support_worker":
      return "worker";
    case "support_coordinator":
      return "coordinator";
    case "plan_manager":
      return "plan_manager";
    case "provider_admin":
    case "transport_operator":
      return "provider_admin";
    default:
      return "system";
  }
}

export async function GET(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(request.url);
  const participantRef = searchParams.get("participantRef") ?? undefined;

  if (!participantRef) {
    if (!isAdminRole(user.primaryRole)) {
      return apiForbidden("Admin access required to list all ledger events");
    }
    return NextResponse.json({ events: listLedgerEvents() });
  }

  try {
    await assertCanAccessParticipantData(user, participantRef);
  } catch (e) {
    if (e instanceof ParticipantAccessError) {
      return apiForbidden(e.message);
    }
    throw e;
  }

  return NextResponse.json({ events: listLedgerEvents(participantRef) });
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await request.json();

    const type = body.type as LedgerEventType;
    const subjectType = body.subjectType as LedgerSubjectType;
    const subjectRef = typeof body.subjectRef === "string" ? body.subjectRef : "";
    const participantRef =
      typeof body.participantRef === "string" ? body.participantRef : "";
    const payload =
      typeof body.payload === "object" && body.payload !== null
        ? (body.payload as Record<string, unknown>)
        : {};

    if (!type || !subjectRef || !participantRef) {
      return NextResponse.json(
        { error: "type, subjectRef, and participantRef are required." },
        { status: 400 }
      );
    }

    try {
      await assertCanAccessParticipantData(user, participantRef);
    } catch (e) {
      if (e instanceof ParticipantAccessError) {
        return apiForbidden(e.message);
      }
      throw e;
    }

    const forbiddenKeys = [
      "name",
      "ndisNumber",
      "address",
      "caseNote",
      "participantName",
    ];
    for (const key of forbiddenKeys) {
      if (key in payload) {
        return NextResponse.json(
          {
            error:
              "Ledger payload must not contain personal information. Use references and hashes only.",
          },
          { status: 400 }
        );
      }
    }

    const actorRole = ledgerActorRoleForUser(user);

    const event = createLedgerEvent({
      type,
      subjectType,
      subjectRef,
      participantRef,
      actorRole,
      payload,
    });

    return NextResponse.json({ event });
  } catch {
    return NextResponse.json(
      { error: "Could not create ledger event." },
      { status: 500 }
    );
  }
}
