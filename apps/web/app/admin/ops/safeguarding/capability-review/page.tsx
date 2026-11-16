import { notFound } from "next/navigation";

import { requireAdminScope } from "@/lib/auth/guards";
import { isCapabilityPassportPreviewEnabled } from "@/lib/config/capability-passport";

import { CapabilityReviewQueue } from "./CapabilityReviewQueue";

export const metadata = { title: "Capability Review | MapAble Admin" };

export default async function CapabilityReviewPage() {
  if (!isCapabilityPassportPreviewEnabled()) notFound();
  await requireAdminScope("admin:safeguarding:read");
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 motion-reduce:transition-none">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Capability Review</h1>
        <p className="text-sm text-muted-foreground">
          Human assessors only. You cannot approve your own records. Approve cannot
          override Exclusion, interim bar, suspension, or a participant block.
        </p>
      </header>
      <CapabilityReviewQueue />
    </div>
  );
}
