import Link from "next/link";

import { AddInfrastructureForm } from "@/components/care-transport/AddInfrastructureForm";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import { isAddInfrastructureEnabled } from "@/lib/config/care-transport-map";

export const metadata = {
  title: "Add infrastructure | MapAble",
  description:
    "Suggest Care or Transport infrastructure for moderated listing on MapAble maps.",
  alternates: canonicalAlternate("/add-infrastructure"),
};

export default function AddInfrastructurePage() {
  if (!isAddInfrastructureEnabled()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-12">
        <h1 className="font-heading text-2xl font-bold">Add infrastructure</h1>
        <p className="text-sm text-muted-foreground">
          This suggest flow is not enabled. Set{" "}
          <code className="rounded bg-muted px-1">
            ADD_INFRASTRUCTURE_ENABLED=true
          </code>{" "}
          to preview.
        </p>
        <p className="text-sm">
          <Link href="/access/add-place" className="underline">
            Suggest an Access place instead
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">Add infrastructure</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        GPT-assisted draft for Care and Transport places. Suggestions are
        moderated in MapAble Access and are never written automatically to
        OpenStreetMap.org.{" "}
        <Link href="/care-transport/map" className="underline">
          Back to Care + Transport map
        </Link>
      </p>
      <div className="mt-6">
        <AddInfrastructureForm />
      </div>
    </div>
  );
}
