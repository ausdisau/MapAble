import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createAppStoreSubmission,
  getAppStoreReleaseDashboard,
} from "@/lib/platform/app-store-release/release-process-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ submissions: await getAppStoreReleaseDashboard() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const submission = await createAppStoreSubmission(
    body.platform ?? "ios",
    body.version ?? "1.0.0"
  );
  return jsonOk({ submission }, 201);
}
