import { auspostPacGetJson } from "@/lib/integrations/auspost-pac/client";
import { normalizePostcodeSearchResponse } from "@/lib/integrations/auspost-pac/normalize";
import type { AusPostPostcodeSearchResult, AusPostState } from "@/types/auspost-pac";

export type PostcodeSearchParams = {
  q: string;
  state?: AusPostState;
  excludePostBox?: boolean;
};

export async function searchPostcodes(
  params: PostcodeSearchParams,
): Promise<AusPostPostcodeSearchResult> {
  const q = params.q.trim();
  const raw = await auspostPacGetJson<unknown>({
    path: "/postcode/search.json",
    query: {
      q,
      ...(params.state ? { state: params.state } : {}),
      ...(params.excludePostBox ? { excludePostBoxFlag: "true" } : {}),
    },
  });
  return normalizePostcodeSearchResponse(
    raw as Parameters<typeof normalizePostcodeSearchResponse>[0],
  );
}
