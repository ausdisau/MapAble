import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listSupportedLocales,
  upsertTranslation,
} from "@/lib/internationalisation/i18n-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ locales: await listSupportedLocales() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const row = await upsertTranslation(body);
  return jsonOk({ translation: row }, 201);
}
