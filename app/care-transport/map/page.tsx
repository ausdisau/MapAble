import Link from "next/link";

import { CareTransportMapShell } from "@/components/care-transport/CareTransportMapShell";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import {
  isAddInfrastructureEnabled,
  isCareTransportMapEnabled,
} from "@/lib/config/care-transport-map";

export const metadata = {
  title: "Care + Transport map | MapAble",
  description:
    "GPT-assisted OpenStreetMap discovery for MapAble Care providers and Transport infrastructure.",
  alternates: canonicalAlternate("/care-transport/map"),
};

export default function CareTransportMapPage() {
  if (!isCareTransportMapEnabled()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-12">
        <h1 className="font-heading text-2xl font-bold">
          Care + Transport map
        </h1>
        <p className="text-sm text-muted-foreground">
          This pilot map is not enabled in this environment. Set{" "}
          <code className="rounded bg-muted px-1">CARE_TRANSPORT_MAP_ENABLED=true</code>{" "}
          to preview.
        </p>
        <p className="text-sm">
          <Link href="/care/find" className="underline">
            Back to Care find
          </Link>
        </p>
      </div>
    );
  }

  return (
    <CareTransportMapShell
      addInfrastructureEnabled={isAddInfrastructureEnabled()}
    />
  );
}
