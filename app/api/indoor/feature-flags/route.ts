import { getIndoorFeatureFlags } from "@/lib/indoor-accessibility/feature-flags";

export async function GET() {
  return Response.json({ flags: getIndoorFeatureFlags() });
}
