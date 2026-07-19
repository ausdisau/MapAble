import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ importId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { importId } = await params;

  const job = await prisma.accessImportJob.findUnique({
    where: { id: importId },
    include: {
      items: { take: 200 },
      conflicts: true,
      sources: true,
    },
  });
  if (!job) return jsonError("Not found", 404);
  return jsonOk({ job });
}
