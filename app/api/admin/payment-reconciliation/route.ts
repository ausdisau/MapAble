import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createReconciliationBatch,
  getReconciliationDashboard,
} from "@/lib/billing/payment-reconciliation/reconciliation-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getReconciliationDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const start = body.periodStart ? new Date(body.periodStart) : new Date(Date.now() - 30 * 86400000);
  const end = body.periodEnd ? new Date(body.periodEnd) : new Date();
  const batch = await createReconciliationBatch(start, end, user.id);
  return jsonOk({ batch }, 201);
}
