import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const reviews = await prisma.accessPlaceReview.findMany({
    where: { reviewerProfileId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { place: { select: { id: true, name: true } } },
  });

  return jsonOk({ reviews });
}
