import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("admin:service-ops");
  if (user instanceof Response) return user;
  const requests = await prisma.careRequest.findMany({
    where: { status: { in: ["submitted", "awaiting_admin_review"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const shifts = await prisma.careShift.findMany({
    where: { status: "scheduled", workerProfileId: null },
    take: 50,
  });
  return jsonOk({ requests, shifts });
}
