import { WorkerInviteAcceptClient } from "@/components/worker/WorkerInviteAcceptClient";

export const metadata = { title: "Accept worker invite | MapAble" };

export default async function WorkerInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <h1 className="font-heading text-2xl font-bold">Join as a support worker</h1>
      <p className="text-muted-foreground">
        Accept your provider&apos;s invitation to join their worker roster on MapAble.
      </p>
      <WorkerInviteAcceptClient token={token} />
    </div>
  );
}
