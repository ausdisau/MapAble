import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { discoverSupportBuilderProviders } from "@/lib/support-builder/discovery";

export const dynamic = "force-dynamic";
const Params = z.object({
  locality: z.string().max(100).default(""),
  query: z.string().max(100).default(""),
});

export async function GET(request: Request) {
  if (process.env.MAPABLE_SUPPORT_BUILDER_ENABLED !== "true") {
    return Response.json({ error: "Support Builder is not available." }, { status: 404 });
  }
  if (!checkIpRateLimit(getClientIp(request), { windowMs: 60_000, max: 20 })) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  const url = new URL(request.url);
  const input = Params.safeParse({
    locality: url.searchParams.get("locality") ?? "",
    query: url.searchParams.get("query") ?? "",
  });
  if (!input.success) {
    return Response.json({ error: "Invalid search terms." }, { status: 400 });
  }

  try {
    const data = await discoverSupportBuilderProviders(input.data);
    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      { error: "The provider directory is unavailable. You can still edit your draft." },
      { status: 503 },
    );
  }
}
