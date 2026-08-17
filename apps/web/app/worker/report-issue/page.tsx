import { IncidentConcernForm } from "@/components/care/IncidentConcernForm";

export default async function WorkerReportIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ shiftId?: string }>;
}) {
  const sp = await searchParams;
  return (
    <IncidentConcernForm
      careShiftId={sp.shiftId}
      redirectTo="/worker/today"
    />
  );
}
