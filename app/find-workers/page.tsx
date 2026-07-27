import { FindVerifiedWorkersLanding } from "@/components/find-workers/FindVerifiedWorkersLanding";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import { listPublicVerifiedWorkers } from "@/lib/workers/find-verified-workers";

export const metadata = {
  title: "Find verified support workers | MapAble",
  description:
    "Find NDIS Worker Screening verified transport support workers on MapAble.",
  alternates: canonicalAlternate("/find-workers"),
};

export default async function FindWorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const workers = await listPublicVerifiedWorkers({ suburbQuery: q });

  return (
    <FindVerifiedWorkersLanding initialWorkers={workers} initialQuery={q} />
  );
}
