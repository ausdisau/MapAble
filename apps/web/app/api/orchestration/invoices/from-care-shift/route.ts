import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createInvoiceLinesFromApprovedCareShift } from "@/lib/orchestration/invoice-orchestrator";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { shiftId } = await req.json();
  if (!shiftId) return jsonError("shiftId required", 400);
  try {
    const result = await createInvoiceLinesFromApprovedCareShift(
      shiftId,
      user.id
    );
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "SHIFT_NOT_APPROVED") {
      return jsonError("Care shift must be approved first", 400);
    }
    return jsonError("Invoice orchestration failed", 500);
  }
}
