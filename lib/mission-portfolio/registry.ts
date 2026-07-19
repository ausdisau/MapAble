import type { MissionRegistration } from "./types";

export const MISSION_REGISTRY: MissionRegistration[] = [
  {
    key: "mission.starting_work",
    publicName: "Starting Work",
    kind: "starting_work",
    maturity: "controlled_pilot",
    featureFlag: "MAPABLE_STARTING_WORK_PILOT_ENABLED",
    canonicalProjection: "lib/pilot/starting-work",
    writeOwners: [
      "lib/care",
      "lib/transport",
      "lib/billing",
      "lib/communication-passport",
      "lib/consent",
    ],
    prohibitedWriters: [
      "lib/mission-portfolio",
      "lib/ai-platform",
      "mission-copilot",
    ],
    description:
      "Taylor @ Harbour Civic Centre controlled pilot — projection over care, transport, billing, passport, readiness.",
  },
];

export function listMissions(): MissionRegistration[] {
  return [...MISSION_REGISTRY];
}

export function getMission(key: string): MissionRegistration | undefined {
  return MISSION_REGISTRY.find((m) => m.key === key);
}
