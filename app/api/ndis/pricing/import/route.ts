import { requireApiAdmin } from "@/lib/api/auth-handler";
import {
  isResponse,
  jsonOk,
  zodErrorResponse,
} from "@/lib/api/response";
import { createImportJob } from "@/lib/ndis/pricing/catalogue-import-service";
import { importPricingRowsSchema } from "@/lib/ndis/schemas";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (isResponse(user)) return user;
  const parsed = importPricingRowsSchema.safeParse(
    await req.json().catch(() => ({}))
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const result = await createImportJob(
    parsed.data.rows,
    user.id,
    parsed.data.fileName
  );
  return jsonOk(result, 201);
}
