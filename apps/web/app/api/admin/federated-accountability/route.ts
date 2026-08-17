import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  linkAccountabilityPartner,
  linkPartnerToPublication,
  listAccountabilityPartners,
  publishCoordinatedReportBundle,
} from "@/lib/governance/federated-accountability/federation-partner-service";

export async function GET() {
  const user = await requireApiAdminScope("accountability:publish");
  if (user instanceof Response) return user;
  return jsonOk({ partners: await listAccountabilityPartners() });
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("accountability:publish");
  if (user instanceof Response) return user;
  const body = await req.json();

  if (body.action === "link") {
    const partner = await linkPartnerToPublication(
      body.partnerId,
      body.publicationId,
      user.id
    );
    return jsonOk({ partner });
  }

  if (body.action === "bundle") {
    const publication = await publishCoordinatedReportBundle({
      ...body,
      actorUserId: user.id,
    });
    return jsonOk({ publication }, 201);
  }

  const partner = await linkAccountabilityPartner(body);
  return jsonOk({ partner }, 201);
}
