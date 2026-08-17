import { ParticipantsAdmin } from "@/components/admin/back-of-house/ParticipantsAdmin";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Participants ops | MapAble Admin" };

export default async function AdminOpsParticipantsPage() {
  await requireAdminScope("admin:participants:read");
  return <ParticipantsAdmin />;
}
