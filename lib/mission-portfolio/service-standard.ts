import { missionPortfolioConfig } from "@/lib/config/mission-portfolio";

export type ServiceStandardClause = {
  id: string;
  title: string;
  promise: string;
  measurableSignal: string;
  participantVisible: boolean;
};

export const STARTING_WORK_SERVICE_STANDARD: ServiceStandardClause[] = [
  {
    id: "ss.communication_passport",
    title: "Communication Passport acknowledged",
    promise:
      "The assigned worker acknowledges your Communication Passport before the visit starts.",
    measurableSignal: "passport acknowledgement receipt present",
    participantVisible: true,
  },
  {
    id: "ss.worker_readiness",
    title: "Worker readiness checked",
    promise:
      "Assignment only proceeds when readiness reasons are evaluated — readiness is not automatic competency.",
    measurableSignal: "readiness evaluation recorded",
    participantVisible: true,
  },
  {
    id: "ss.transport_confirmed",
    title: "Transport confirmed when required",
    promise:
      "If transport is part of the journey, vehicle accessibility and trip confirmation are explicit states.",
    measurableSignal: "transport trip confirmed or blocked with reason",
    participantVisible: true,
  },
  {
    id: "ss.participant_decision",
    title: "Participant decisions preserved",
    promise:
      "Replacement workers and material journey changes require your decision where the journey says so.",
    measurableSignal: "decision required items listed on mission projection",
    participantVisible: true,
  },
];

export function getServiceStandardForMission(missionKey: string) {
  if (!missionPortfolioConfig.serviceStandardEnabled) return [];
  if (missionKey === "mission.starting_work") {
    return STARTING_WORK_SERVICE_STANDARD;
  }
  return [];
}
