import { jsonError, jsonOk } from "@/lib/api/response";
import { isSupportedLocale } from "@/lib/config/nz-schemes";
import { getTranslations } from "@/lib/internationalisation/i18n-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return jsonError(
      "Unsupported locale. Year-One foundation locales are en-AU and en-NZ.",
      400,
    );
  }
  const namespace =
    new URL(req.url).searchParams.get("namespace") ?? "common";
  return jsonOk(await getTranslations(locale, namespace));
}
