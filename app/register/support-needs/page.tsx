import { redirect } from "next/navigation";

import { SupportNeedsAssessor } from "@/components/onboarding/SupportNeedsAssessor";
import { defaultDashboardPath } from "@/lib/auth/roles";
import { requireAuth } from "@/lib/auth/guards";
import {
  REGISTRATION_ASSESSOR_STATUS,
} from "@/lib/intake/support-needs-assessor";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Support needs | MapAble",
  description:
    "Tell us where you need support so we can prepare your planning snapshot.",
};

export default async function RegisterSupportNeedsPage() {
  const user = await requireAuth();

  const isParticipant =
    user.primaryRole === "participant" ||
    user.roles.includes("participant");

  if (!isParticipant) {
    redirect(defaultDashboardPath(user.primaryRole));
  }

  const existingLite = await prisma.iCanV6IntakeSubmission.findFirst({
    where: {
      participantId: user.id,
      status: {
        in: [REGISTRATION_ASSESSOR_STATUS, "submitted_draft"],
      },
    },
    select: { id: true },
  });

  if (existingLite) {
    redirect("/dashboard");
  }

  return <SupportNeedsAssessor />;
}
