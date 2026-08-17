import type { Metadata } from "next";

import { CareOSAppointmentMissionPanel } from "@/components/intelligence/CareOSAppointmentMissionPanel";

export const metadata: Metadata = {
  title: "CareOS appointment mission",
  description:
    "Coordinate one appointment through participant authority, Care, Transport, Access evidence, confirmations and continuity.",
};

export default function CareOSAppointmentPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <CareOSAppointmentMissionPanel />
    </main>
  );
}
