import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createInvoiceLineFromTimesheet } from "@/lib/timesheets/timesheet-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ timesheetId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { timesheetId } = await params;
  const result = await createInvoiceLineFromTimesheet(timesheetId, user.id);
  return jsonOk(result);
}
