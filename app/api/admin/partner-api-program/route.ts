import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  approvePartnerEnrollment,
  enrollPartnerApiProgram,
  listPartnerEnrollments,
} from "@/lib/partner/api-program/enrollment-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ enrollments: await listPartnerEnrollments() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.enrollmentId) {
    const enrollment = await approvePartnerEnrollment(
      body.enrollmentId,
      user.id
    );
    return jsonOk({ enrollment });
  }
  const enrollment = await enrollPartnerApiProgram(
    body.organisationId,
    body.programTier
  );
  return jsonOk({ enrollment }, 201);
}
