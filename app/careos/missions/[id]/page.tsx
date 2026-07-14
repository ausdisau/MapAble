import { CareOSMissionDetail } from "@/components/intelligence/CareOSMissionDetail";

export default async function CareOSMissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <CareOSMissionDetail missionId={id} />
    </main>
  );
}
