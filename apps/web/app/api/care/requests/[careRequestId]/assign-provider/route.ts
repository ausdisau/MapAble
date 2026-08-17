import { ZodError } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assignCareRequestProvider } from "@/lib/care/care-request-service";
import { ProviderNotReadyError } from "@/lib/onboarding/provider-service-ready";
import { assignCareProviderSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { careRequestId } = await params;

  try {
    const { organisationId } = assignCareProviderSchema.parse(
      await req.json()
    );
    const request = await assignCareRequestProvider(
      careRequestId,
      organisationId,
      user.id
    );
    return jsonOk({ request });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof ProviderNotReadyError) {
      return Response.json(
        {
          error: e.message,
          code: e.code,
          blockers: e.blockers,
        },
        { status: 409 }
      );
    }
    return jsonError("Assign failed", 500);
  }
}
