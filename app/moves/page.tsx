import { ModuleComingSoonPage } from "@/components/modules/ModuleComingSoonPage";
import { enforceYearOneModulePath } from "@/lib/year-one/deferred-module-gate";

export const metadata = { title: "MapAble Moves | Coming soon" };

export default function MovesModulePage() {
  enforceYearOneModulePath("/moves");

  return (
    <ModuleComingSoonPage
      moduleName="MapAble Moves"
      description="Physical therapy and rehabilitation to improve mobility and wellbeing."
    />
  );
}
