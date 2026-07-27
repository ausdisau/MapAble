import { NextResponse } from "next/server";

import { listCareOSActionReceipts } from "@/intelligence/actions/action-receipt-service";
import { requireApiSession } from "@/lib/api/auth-handler";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const receipts = await listCareOSActionReceipts(user.id);
    return NextResponse.json({ receipts });
  } catch (error) {
    console.error("[careos-action-receipts]", error);
    return NextResponse.json(
      { error: "CareOS action receipts could not be loaded." },
      { status: 500 },
    );
  }
}
