import { redirect } from "next/navigation";

export default async function IncidentDetailRedirectPage({
  params,
}: {
  params: Promise<{ incidentId: string }>;
}) {
  const { incidentId } = await params;
  redirect(`/dashboard/safety/incidents/${incidentId}`);
}
