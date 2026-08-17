import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createFundingSource,
  listFundingSources,
} from "@/lib/billing/core/funding-source-service";
import { createFundingSourceSchema } from "@/lib/billing/core/schemas";

export async function GET() {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const sources = await listFundingSources(user.id);
  return jsonOk({ fundingSources: sources });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const body = await req.json();
  const parsed = createFundingSourceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const source = await createFundingSource(user.id, parsed.data);
  return jsonOk({ fundingSource: source }, 201);
}
