import { jsonOk } from "@/lib/api/response";
import {
  buildCareRequestHref,
  resolvePlatformOrganisation,
} from "@/lib/provider/platform-org-resolver";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const abn = url.searchParams.get("abn");
  const slug = url.searchParams.get("slug");
  const outletKey = url.searchParams.get("outletKey");
  const providerName = url.searchParams.get("providerName");

  const link = await resolvePlatformOrganisation({
    abn,
    slug,
    outletKey,
  });

  if (!link) {
    return jsonOk({ link: null });
  }

  return jsonOk({
    link: {
      ...link,
      careRequestHref: buildCareRequestHref({
        organisationId: link.organisationId,
        providerName: providerName ?? link.organisationName,
        preferredOrganisationName: link.organisationName,
      }),
    },
  });
}
