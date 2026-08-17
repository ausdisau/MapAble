import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { searchWorkersPublic } from "@/lib/search/provider-search-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const results = await searchWorkersPublic({
    serviceType: searchParams.get("serviceType") ?? undefined,
    language: searchParams.get("language") ?? undefined,
  });
  return jsonOk({ results });
}
