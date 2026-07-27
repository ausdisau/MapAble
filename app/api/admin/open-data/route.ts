import { requireApiAdmin } from "@/lib/api/auth-handler";
import { generateOpenDataExport } from "@/lib/api/open-data/open-data-service";
import { jsonOk } from "@/lib/api/response";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const result = await generateOpenDataExport(
    body.datasetKey ?? "accessibility_places",
    user.id
  );
  return jsonOk(result);
}
