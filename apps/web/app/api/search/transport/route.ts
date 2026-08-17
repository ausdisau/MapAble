import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { searchTransportOperators } from "@/lib/search/provider-search-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const results = await searchTransportOperators({
    wheelchairAccessible: searchParams.get("wheelchair") === "true",
    serviceRegion: searchParams.get("region") ?? undefined,
  });
  return jsonOk({ results });
}
