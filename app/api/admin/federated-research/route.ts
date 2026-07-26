import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  activateFederatedAgreement,
  approveFederatedAgreement,
  archiveFederatedAgreement,
  createFederatedAgreement,
  listFederatedAgreements,
  submitAgreementForEthicsReview,
} from "@/lib/research/federated/federation-service";

export async function GET() {
  const user = await requireApiAdminScope("federated_research:manage");
  if (user instanceof Response) return user;
  return jsonOk(await listFederatedAgreements());
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("federated_research:manage");
  if (user instanceof Response) return user;
  const body = await req.json();

  if (body.action === "ethics_review") {
    const agreement = await submitAgreementForEthicsReview(
      body.agreementId,
      body.ethicsReviewNotes
    );
    return jsonOk({ agreement });
  }

  if (body.action === "approve") {
    const agreement = await approveFederatedAgreement(
      body.agreementId,
      user.id,
      body.linkedSafeRoomProjectId
    );
    return jsonOk({ agreement });
  }

  if (body.action === "activate") {
    const agreement = await activateFederatedAgreement(body.agreementId, user.id);
    return jsonOk({ agreement });
  }

  if (body.action === "archive") {
    const agreement = await archiveFederatedAgreement(body.agreementId, user.id);
    return jsonOk({ agreement });
  }

  const agreement = await createFederatedAgreement(body);
  return jsonOk({ agreement }, 201);
}
