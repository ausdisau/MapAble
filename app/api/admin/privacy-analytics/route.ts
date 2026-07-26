import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { y4CivicPlatformConfig } from "@/lib/config/y4-civic-platform";
import {
  listAnalyticsRuns,
  runPrivacyAnalyticsPilot,
} from "@/lib/privacy/preserving-analytics/analytics-pilot-service";
import { runPrivacyPreservingAnalytics } from "@/lib/privacy/preserving-analytics/analytics-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ runs: await listAnalyticsRuns() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const runLabel = body.runLabel ?? `run-${Date.now()}`;

  try {
    const run = y4CivicPlatformConfig.privacyPreservingAnalyticsPilotEnabled
      ? await runPrivacyAnalyticsPilot(runLabel)
      : await runPrivacyPreservingAnalytics(runLabel);
    return jsonOk({ run }, 201);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "PRIVACY_ANALYTICS_FAILED",
      400
    );
  }
}
