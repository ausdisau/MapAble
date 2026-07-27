import { MainframeSandboxPanel } from "@/components/intelligence/mainframe/MainframeSandboxPanel";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Intelligence Mainframe sandbox | MapAble Admin" };

export default async function CoreIntelligenceMainframePage() {
  await requireAdminScope("admin:agent-runs:read");
  return <MainframeSandboxPanel />;
}
