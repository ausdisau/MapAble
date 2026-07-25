import { jsonError, jsonOk } from "@/lib/api/response";
import {
  authenticateEmploymentProvider,
  requireEmploymentConsentHeader,
  requireEmploymentScope,
} from "@/lib/employment-providers/api-auth";

/**
 * Consent-gated job search activity + tenure tracking for DES/IEA partners.
 * Year-One scaffold — returns empty activity until partner data contracts land.
 */
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

  const participantId =
    new URL(req.url).searchParams.get("participantId")?.trim() ?? null;
  if (!participantId) {
    return jsonError("participantId query parameter is required", 400);
  }

  return jsonOk({
    status: "scaffold",
    participantId,
    consentRef: req.headers.get("x-mapable-consent-ref"),
    jobSearchActivity: [],
    employmentTenure: [],
    notice:
      "No live DES/IEA activity feed yet. Partners receive structure only until outcome data contracts are approved.",
  });
}
