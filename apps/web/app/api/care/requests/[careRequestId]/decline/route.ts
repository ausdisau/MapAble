import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { careRequestId } = await params;
  const request = await prisma.careRequest.update({
    where: { id: careRequestId },
    data: { status: "cancelled" },
  });
  return jsonOk({ request });
}
