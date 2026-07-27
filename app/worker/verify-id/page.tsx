import Link from "next/link";

import { IDVerificationFlow } from "@/components/worker/IDVerificationFlow";
import { WorkerScreeningForm } from "@/components/worker/WorkerScreeningForm";
import { requireAuth } from "@/lib/auth/guards";
import { roleLabel } from "@/lib/auth/roles";

export const metadata = { title: "ID verification | MapAble" };

export default async function WorkerVerifyIdPage() {
  const user = await requireAuth();

  if (user.primaryRole !== "support_worker") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <h1 className="font-heading text-2xl font-bold">ID verification</h1>
        <p className="text-muted-foreground">
          This page is for support workers. You are signed in as{" "}
          {roleLabel(user.primaryRole)}.
        </p>
        <Link href="/dashboard" className="text-primary underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 px-4 py-10">
      <IDVerificationFlow />
      <WorkerScreeningForm />
    </div>
  );
}
