import { IncidentIntakeWizard } from "@/components/incidents/IncidentIntakeWizard";
import { y1WedgeConfig } from "@/lib/config/y1-wedge";

import LegacyNewIncidentPage from "./legacy-form";

export default function NewSafetyIncidentPage() {
  if (y1WedgeConfig.incidentIntakeV2Enabled) {
    return <IncidentIntakeWizard />;
  }
  return <LegacyNewIncidentPage />;
}
