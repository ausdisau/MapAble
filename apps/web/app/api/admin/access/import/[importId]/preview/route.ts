import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ importId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { importId } = await params;

  const items = await prisma.accessImportItem.findMany({
    where: { jobId: importId },
    take: 500,
  });

  return jsonOk({
    preview: true,
    published: false,
    count: items.length,
    items,
  });
}
