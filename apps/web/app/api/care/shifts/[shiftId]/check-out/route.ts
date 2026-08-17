import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { careShiftCheckOut } from "@/lib/care/care-shift-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiPermission("care:shift:work");
  if (user instanceof Response) return user;
  const { shiftId } = await params;
  const shift = await careShiftCheckOut(shiftId, user.id);
  return jsonOk({ shift });
}
