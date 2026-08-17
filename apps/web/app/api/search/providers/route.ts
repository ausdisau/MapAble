import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { searchCareProviders } from "@/lib/search/provider-search-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("search:providers");
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const results = await searchCareProviders({
    serviceRegion: searchParams.get("region") ?? undefined,
    verificationStatus: searchParams.get("verification") ?? undefined,
  });
  return jsonOk({ results });
}
