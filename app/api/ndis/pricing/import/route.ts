import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createImportJob } from "@/lib/ndis/pricing/catalogue-import-service";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (!Array.isArray(body.rows)) {
    return jsonError("rows array required", 400);
  }
  const result = await createImportJob(body.rows, user.id, body.fileName);
  return jsonOk(result, 201);
}
