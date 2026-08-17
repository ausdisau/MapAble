import Link from "next/link";
import { redirect } from "next/navigation";

import { AmbassadorAuditForm } from "@/components/mapping/AmbassadorAuditForm";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole, isAmbassadorRole } from "@/lib/auth/roles";

export const metadata = {
  title: "MapAble Ambassador | Volunteer mapping",
  description:
    "Volunteer accessibility audits for venues and services — MapAble Ambassador programme.",
};

export default async function AmbassadorPage() {
  const user = await requireAuth();
  const allowed =
    isAmbassadorRole(user.primaryRole) ||
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "ambassador:audit");

  if (!allowed) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          MapAble Ambassador
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Volunteer accessibility mapping
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Submit venue accessibility checks for human review. This Year-One shell
          supports crowdsourced mapping similar to community audit programmes —
          it does not auto-publish or claim verified access.
        </p>
        <p>
          <Link
            href="/accessibility-map"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open Access Map
          </Link>
        </p>
      </header>

      <section aria-labelledby="ambassador-audit-heading" className="space-y-4">
        <h2 id="ambassador-audit-heading" className="text-lg font-semibold">
          Submit a venue audit
        </h2>
        <AmbassadorAuditForm />
      </section>
    </main>
  );
}
