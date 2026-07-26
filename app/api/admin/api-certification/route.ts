import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  certifyApiApplication,
  listCertificationApplications,
  rejectApiApplication,
  startApiCertificationReview,
  submitApiCertificationApplication,
} from "@/lib/api/certification/certification-service";

export async function GET() {
  const user = await requireApiAdminScope("api_certification:manage");
  if (user instanceof Response) return user;
  return jsonOk({ applications: await listCertificationApplications() });
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("api_certification:manage");
  if (user instanceof Response) return user;
  const body = await req.json();

  if (body.action === "review") {
    const app = await startApiCertificationReview(body.applicationId, user.id);
    return jsonOk({ application: app });
  }

  if (body.action === "reject") {
    const app = await rejectApiApplication(
      body.applicationId,
      user.id,
      body.rejectionReason ?? "Rejected"
    );
    return jsonOk({ application: app });
  }

  if (body.applicationId) {
    const app = await certifyApiApplication(
      body.applicationId,
      user.id,
      body.reviewNotes,
      body.certificationTier
    );
    return jsonOk({ application: app });
  }

  const app = await submitApiCertificationApplication(body);
  return jsonOk({ application: app }, 201);
}
