import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  authenticateEmploymentProvider,
  requireEmploymentConsentHeader,
  requireEmploymentScope,
} from "@/lib/employment/providers/api-auth";

const outcomeSchema = z
  .object({
    participantExternalId: z.string().min(1).max(200),
    programmeId: z.enum(["des", "iea"]),
    milestoneWeeks: z.union([z.literal(13), z.literal(26)]),
    employmentStartDate: z.string().min(4).max(40),
    milestoneReachedAt: z.string().min(4).max(40),
    employerName: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

/**
 * DES/IEA partners post 13-week and 26-week employment milestones.
 * Year-One: validates payload + consent header; does not settle outcome payments.
 */
export async function POST(req: Request) {
  const record = await authenticateEmploymentProvider(req);
  if (!record) return jsonError("Unauthorized", 401);

  const scopeDenied = requireEmploymentScope(
    record.scopes,
    "employment_outcomes_write",
  );
  if (scopeDenied) return scopeDenied;

  const consentDenied = requireEmploymentConsentHeader(req);
  if (consentDenied) return consentDenied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  try {
    const parsed = outcomeSchema.parse(body);
    return jsonOk(
      {
        accepted: false,
        status: "scaffold",
        milestone: parsed,
        notice:
          "Outcome payload accepted for schema validation only. 13/26-week outcome payments are not processed in Year-One.",
      },
      202,
    );
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    throw err;
  }
}

export async function GET(req: Request) {
  const record = await authenticateEmploymentProvider(req);
  if (!record) return jsonError("Unauthorized", 401);

  const scopeDenied = requireEmploymentScope(
    record.scopes,
    "employment_activity_read",
  );
  if (scopeDenied) return scopeDenied;

  const consentDenied = requireEmploymentConsentHeader(req);
  if (consentDenied) return consentDenied;

  return jsonOk({
    status: "scaffold",
    milestones: [],
    supportedWeeks: [13, 26],
    notice:
      "No stored DES/IEA outcome milestones yet. POST to this route to validate payload shape.",
  });
}
