import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  hideProvider,
  setProviderShortlist,
} from "@/lib/marketplace/participant-marketplace-service";

const schema = z.object({
  providerOrgId: z.string().min(1),
  action: z.enum(["shortlist", "remove", "hide"]),
});

export async function POST(request: Request) {
  const participant = await requireApiSession();
  if (participant instanceof Response) return participant;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const input = {
    participantId: participant.id,
    providerOrgId: parsed.data.providerOrgId,
  };
  return jsonOk({
    result:
      parsed.data.action === "hide"
        ? await hideProvider(input)
        : await setProviderShortlist({
            ...input,
            shortlisted: parsed.data.action === "shortlist",
          }),
  });
}
