import { getIndoorFeatureFlags } from "@/lib/access/indoor/feature-flags";

export async function GET() {
  return Response.json({ flags: getIndoorFeatureFlags() });
}
