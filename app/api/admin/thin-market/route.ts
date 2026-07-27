import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import {
  confirmThinMarketSignal,
  explainThinMarketCapacity,
  listThinMarketSignals,
  recordThinMarketSignal,
  type CapacityStatus,
} from "@/lib/careos/opportunities/thin-market-continuity";

export async function GET(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const signals = await listThinMarketSignals({
    regionKey: url.searchParams.get("regionKey") ?? undefined,
    serviceCategory: url.searchParams.get("serviceCategory") ?? undefined,
  });
  return NextResponse.json({ signals });
}

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const body = (await request.json()) as {
    action?: string;
    regionKey?: string;
    serviceCategory?: string;
    capacityStatus?: CapacityStatus;
    notes?: string;
    signalId?: string;
    tenantId?: string;
  };

  try {
    if (body.action === "confirm" && body.signalId) {
      const signal = await confirmThinMarketSignal({
        signalId: body.signalId,
        confirmedByUserId: user.id,
      });
      return NextResponse.json({ signal });
    }

    if (body.action === "explain" && body.capacityStatus) {
      return NextResponse.json(
        explainThinMarketCapacity({ capacityStatus: body.capacityStatus }),
      );
    }

    if (!body.regionKey || !body.serviceCategory || !body.capacityStatus) {
      return NextResponse.json({ error: "INVALID_SIGNAL" }, { status: 400 });
    }

    const signal = await recordThinMarketSignal({
      regionKey: body.regionKey,
      serviceCategory: body.serviceCategory,
      capacityStatus: body.capacityStatus,
      notes: body.notes,
      createdById: user.id,
      tenantId: body.tenantId,
    });
    return NextResponse.json({ signal }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "THIN_MARKET_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
