import { CareOSPanel } from "@/components/intelligence/careos/CareOSPanel";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "CareOS | MapAble" };

export default async function CareOSPage() {
  await requireAuth();
  return <CareOSPanel />;
}
