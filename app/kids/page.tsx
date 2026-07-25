import { ModuleComingSoonPage } from "@/components/modules/ModuleComingSoonPage";
import { enforceYearOneModulePath } from "@/lib/year-one/deferred-module-gate";

export const metadata = { title: "MapAble Kids | Coming soon" };

export default function KidsModulePage() {
  enforceYearOneModulePath("/kids");

  return (
    <ModuleComingSoonPage
      moduleName="MapAble Kids"
      description="Specialized services and support for children with disabilities."
    />
  );
}
