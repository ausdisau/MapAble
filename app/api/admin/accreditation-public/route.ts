import {
  listPublishedAccreditation,
  publishAccreditationProfile,
} from "@/lib/access/accreditation-public-program/public-accreditation-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ profiles: await listPublishedAccreditation() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const profile = await publishAccreditationProfile({
    caseId: body.caseId,
    title: body.title,
    summary: body.summary,
    approvedById: user.id,
  });
  return jsonOk({ profile }, 201);
}
