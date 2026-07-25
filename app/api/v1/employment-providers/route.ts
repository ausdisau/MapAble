import { jsonOk } from "@/lib/api/response";
import { EMPLOYMENT_PROVIDER_PROGRAMMES } from "@/lib/employment-providers/des-iea";

/**
 * DES / IEA partner catalogue — scaffold metadata only.
 */
export async function GET() {
  return jsonOk({
    status: "scaffold",
    programmes: EMPLOYMENT_PROVIDER_PROGRAMMES,
    notice:
      "Year-One B2B scaffold for Disability Employment Services (DES) and Inclusive Employment Australia (IEA). Live outcome payments and national feeds are not enabled.",
    endpoints: {
      activity: "/api/v1/employment-providers/activity",
      outcomes: "/api/v1/employment-providers/outcomes",
    },
  });
}
