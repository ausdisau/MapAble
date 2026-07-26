import { commitImportJob } from "@/lib/access/import/access-import-commit-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ importId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { importId } = await params;
  const result = await commitImportJob(importId, user.id);
  return jsonOk(result);
}
