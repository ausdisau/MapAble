import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type MapAbleLocale,
} from "@/lib/config/nz-schemes";
import { phase9Config } from "@/lib/config/phase9";
import { prisma } from "@/lib/prisma";

const DEFAULT_LOCALE: MapAbleLocale = "en-AU";

export async function upsertTranslation(params: {
  locale: string;
  namespace: string;
  key: string;
  value: string;
}) {
  if (!phase9Config.internationalisationEnabled) {
    throw new Error("I18N_DISABLED");
  }
  return prisma.localeTranslation.upsert({
    where: {
      locale_namespace_key: {
        locale: params.locale,
        namespace: params.namespace,
        key: params.key,
      },
    },
    create: params,
    update: { value: params.value },
  });
}

export async function getTranslations(locale: string, namespace = "common") {
  const resolved = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  if (!phase9Config.internationalisationEnabled) {
    return { locale: resolved, strings: {} as Record<string, string> };
  }
  const rows = await prisma.localeTranslation.findMany({
    where: { locale: resolved, namespace },
  });
  const strings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { locale: resolved, namespace, strings };
}

export async function listSupportedLocales() {
  const locales = await prisma.localeTranslation.findMany({
    select: { locale: true },
    distinct: ["locale"],
  });
  const fromDb = locales.map((l) => l.locale);
  const merged = new Set<string>([...SUPPORTED_LOCALES, ...fromDb]);
  return [...merged];
}

export function getFoundationLocales(): readonly MapAbleLocale[] {
  return SUPPORTED_LOCALES;
}
