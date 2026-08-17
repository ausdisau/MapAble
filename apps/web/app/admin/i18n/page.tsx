import { requireAdmin } from "@/lib/auth/guards";
import { listSupportedLocales } from "@/lib/internationalisation/i18n-service";
import { prisma } from "@/lib/prisma";

export default async function I18nAdminPage() {
  await requireAdmin();
  const locales = await listSupportedLocales();
  const count = await prisma.localeTranslation.count();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Internationalisation</h1>
      <p className="text-sm">
        Locales: {locales.join(", ")} — {count} strings
      </p>
      <p className="text-muted-foreground">
        Public: GET /api/i18n/[locale]?namespace=common
      </p>
    </div>
  );
}
