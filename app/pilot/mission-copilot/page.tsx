import Link from "next/link";

import { MissionCopilotPanel } from "@/components/mission-copilot/MissionCopilotPanel";
import { missionCopilotConfig } from "@/lib/config/mission-copilot";

export const metadata = {
  title: "Mission Copilot — Starting Work",
  description:
    "Read-only explanations of Starting Work mission status, unknowns, and decisions.",
};

export default function MissionCopilotPage() {
  if (!missionCopilotConfig.enabled) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Mission Copilot</h1>
        <p className="mt-4">
          This controlled pilot surface is disabled. Set{" "}
          <code>MAPABLE_MISSION_COPILOT_ENABLED=true</code> to preview.
        </p>
        <p className="mt-2">
          <Link href="/pilot/starting-work" className="underline">
            Starting Work pilot
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Mission Copilot</h1>
      <p className="mt-2 text-base">
        Evidence-aware, participant-controlled explanations for the Starting Work
        journey. Authority ceiling: read-only explain. No bookings, payments, or
        assignments are performed here.
      </p>
      <MissionCopilotPanel />
    </main>
  );
}
