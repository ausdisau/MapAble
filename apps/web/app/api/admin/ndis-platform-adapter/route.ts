import { readOfficialProviderDirectoryReadiness } from "@/lib/ndis/platform-adapter/official-provider-directory";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getNdisPlatformAdapterStatus } from "@/lib/ndis/platform-adapter/ndis-platform-adapter";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  // Only public links, enum status labels, and booleans. No credentials or PII.
  const officialProviderDirectory = await readOfficialProviderDirectoryReadiness();
  return jsonOk({
    ...getNdisPlatformAdapterStatus(),
    officialProviderDirectory,
  });
}
