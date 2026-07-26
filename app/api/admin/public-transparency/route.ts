import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  approveTransparencyPublication,
  draftTransparencyPublication,
} from "@/lib/public/transparency/transparency-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const publications = await prisma.transparencyPublication.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return jsonOk({ publications });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.publicationId) {
    const pub = await approveTransparencyPublication(
      body.publicationId,
      user.id
    );
    return jsonOk({ publication: pub });
  }
  const draft = await draftTransparencyPublication({
    title: body.title,
    body: body.body,
    actorUserId: user.id,
  });
  return jsonOk({ publication: draft }, 201);
}
