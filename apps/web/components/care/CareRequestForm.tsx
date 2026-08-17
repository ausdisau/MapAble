"use client";

import { CareRequestWizard } from "@/components/care/CareRequestWizard";

/** @deprecated Use CareRequestWizard — kept for import compatibility */
export function CareRequestForm({
  redirectBase = "/care",
}: {
  redirectBase?: string;
}) {
  return <CareRequestWizard redirectBase={redirectBase} />;
}
