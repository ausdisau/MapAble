import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export default async function SupportCoordinatorHomePage() {
  await requirePermission("coordinator:portal");

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Support coordinator portal</h1>
      <p className="text-muted-foreground">
        Access is consent-based. You only see information participants have authorised.
      </p>
      <nav aria-label="Coordinator sections">
        <ul className="flex flex-col gap-3">
          <li>
            <Link className="text-primary underline" href="/support-coordinator/caseload">
              Caseload
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/support-coordinator/participants">
              Participants
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/support-coordinator/tasks">
              Tasks
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
