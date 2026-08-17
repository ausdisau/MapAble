import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

/** Prisma-backed pages; avoid static prerender at build when DATABASE_URL is unset on Vercel. */
export const dynamic = "force-dynamic";

export default function AccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapAbleCareMarketingShell>{children}</MapAbleCareMarketingShell>;
}
