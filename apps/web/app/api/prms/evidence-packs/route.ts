import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { apiForbidden } from "@/lib/auth/guards";
import type { EvidencePackType } from "@/lib/prms/types";

const CHECKLIST_ITEMS = [
  "service_agreement",
  "service_event",
  "support_log",
  "participant_confirmation",
  "ndis_support_item",
  "invoice_line_item",
  "audit_ledger_proof",
] as const;

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await request.json();
    const packType = (body.packType ?? "invoice_review") as EvidencePackType;
    const serviceEventId =
      typeof body.serviceEventId === "string" ? body.serviceEventId : null;
    const invoiceId =
      typeof body.invoiceId === "string" ? body.invoiceId : null;
    const participantId =
      typeof body.participantId === "string" ? body.participantId : user.id;

    if (participantId !== user.id && user.primaryRole !== "mapable_admin") {
      return apiForbidden("Evidence packs are scoped to the signed-in participant.");
    }

    const checklist = CHECKLIST_ITEMS.map((item) => {
      const present =
        item === "service_event" && serviceEventId
          ? true
          : item === "invoice_line_item" && invoiceId
            ? true
            : item === "audit_ledger_proof"
              ? false
              : false;
      return { item, present, label: formatLabel(item) };
    });

    const complete = checklist.every((c) => c.present);
    const missing = checklist.filter((c) => !c.present).map((c) => c.label);

    return NextResponse.json({
      packType,
      participantId,
      status: complete ? "complete" : "incomplete",
      checklist,
      missing,
      exportAllowed: complete,
      message: complete
        ? "Evidence pack is complete. Export may proceed with participant approval."
        : "Evidence pack is incomplete. Export is blocked until missing items are added.",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not build evidence pack." },
      { status: 500 }
    );
  }
}

function formatLabel(item: string): string {
  return item.replace(/_/g, " ");
}
