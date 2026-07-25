import { Suspense } from "react";

import { getInterpreterDisplayName } from "@/lib/config/search-interpreter";

import ProviderFinderClient from "./ProviderFinderClient";

export default function Page() {
  const modelLabel = getInterpreterDisplayName();

  return (
    <Suspense
      fallback={
        <p className="container mx-auto px-4 py-12 text-muted-foreground">
          Loading provider finder…
        </p>
      }
    >
      <ProviderFinderClient modelLabel={modelLabel} />
    </Suspense>
  );
}

