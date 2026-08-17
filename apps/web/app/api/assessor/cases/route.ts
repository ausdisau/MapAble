import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  closeAssessorCase,
  createAssessorCase,
  listAssessorCasesForUser,
} from "@/lib/assessor/tools/assessor-service";

export async function GET() {
  const user = await requireApiPermission("assessor:portal");
  if (user instanceof Response) return user;
  const cases = await listAssessorCasesForUser(user.id, user.primaryRole);
  return jsonOk({ cases });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("assessor:portal");
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.caseId && body.action === "close") {
    const closed = await closeAssessorCase(body.caseId);
    return jsonOk({ case: closed });
  }
  const created = await createAssessorCase({
    assessorUserId: user.id,
    caseType: body.caseType ?? "accessibility",
    referenceCode: body.referenceCode,
    notes: body.notes,
  });
  return jsonOk({ case: created }, 201);
}
