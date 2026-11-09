/**
 * MapAble Core boundary for optional MapAble Signal participation in Day.
 *
 * This is a choice inside one browser session, NOT a ConsentRecord, delegate
 * grant, place observation, map publication or booking. Production sharing must
 * use the existing Core ConsentRecord + AuditEvent authorities.
 */
export const SIGNAL_CHALLENGE_IDS = [
  "journeys",
  "entrances",
  "facilities",
  "sensory",
  "changes",
] as const;

export const SIGNAL_PARTICIPATION_MODES = ["remote", "field", "supported"] as const;
export const SIGNAL_CONTRIBUTOR_ROLES = ["mapper", "researcher", "reviewer"] as const;

export type SignalChallengeId = (typeof SIGNAL_CHALLENGE_IDS)[number];
export type SignalParticipationMode = (typeof SIGNAL_PARTICIPATION_MODES)[number];
export type SignalContributorRole = (typeof SIGNAL_CONTRIBUTOR_ROLES)[number];
export type SignalDemoTimeSlot = "13:15" | "15:15";

export type SignalParticipationChoice = {
  challengeId: SignalChallengeId;
  mode: SignalParticipationMode;
  role: SignalContributorRole;
  startTime: SignalDemoTimeSlot;
  /** The participant deliberately chose to add this local demonstration item. */
  participantReviewed: true;
  dataSource: "synthetic_local";
  visibility: "this_screen_only";
  sharingAuthorised: false;
  locationCaptureEnabled: false;
  submissionCreated: false;
  changesExternalRecords: false;
};

export class SignalParticipationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SignalParticipationError";
  }
}

export function isSignalDayPreviewEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (
    env.MAPABLE_DAY_DEMO_ENABLED === "true" &&
    env.MAPABLE_DAY_SIGNAL_BRIDGE_DEMO_ENABLED === "true"
  );
}

export function makeSignalParticipationChoice(input: {
  challengeId: SignalChallengeId;
  mode: SignalParticipationMode;
  role: SignalContributorRole;
  startTime: SignalDemoTimeSlot;
  participantReviewed: boolean;
}): SignalParticipationChoice {
  if (!input.participantReviewed) {
    throw new SignalParticipationError("Participant review is required.");
  }
  if (!SIGNAL_CHALLENGE_IDS.includes(input.challengeId)) {
    throw new SignalParticipationError("Choose a supported Mapping Challenge.");
  }
  if (!SIGNAL_PARTICIPATION_MODES.includes(input.mode)) {
    throw new SignalParticipationError("Choose a participation method.");
  }
  if (!SIGNAL_CONTRIBUTOR_ROLES.includes(input.role)) {
    throw new SignalParticipationError("Choose an optional contribution role.");
  }
  if (input.startTime !== "13:15" && input.startTime !== "15:15") {
    throw new SignalParticipationError("Choose an example time slot.");
  }

  return {
    challengeId: input.challengeId,
    mode: input.mode,
    role: input.role,
    startTime: input.startTime,
    participantReviewed: true,
    dataSource: "synthetic_local",
    visibility: "this_screen_only",
    sharingAuthorised: false,
    locationCaptureEnabled: false,
    submissionCreated: false,
    changesExternalRecords: false,
  };
}

/**
 * Defense in depth for callers handling untrusted JSON or stale state.
 * The UI alone must never be treated as an authorisation boundary.
 */
export function assertPrivateSignalChoice(
  choice: SignalParticipationChoice,
): void {
  if (
    choice.participantReviewed !== true ||
    choice.dataSource !== "synthetic_local" ||
    choice.visibility !== "this_screen_only" ||
    choice.sharingAuthorised !== false ||
    choice.locationCaptureEnabled !== false ||
    choice.submissionCreated !== false ||
    choice.changesExternalRecords !== false
  ) {
    throw new SignalParticipationError(
      "Signal preview cannot share data, capture location or change real records.",
    );
  }
  if (
    !SIGNAL_CHALLENGE_IDS.includes(choice.challengeId) ||
    !SIGNAL_PARTICIPATION_MODES.includes(choice.mode) ||
    !SIGNAL_CONTRIBUTOR_ROLES.includes(choice.role) ||
    (choice.startTime !== "13:15" && choice.startTime !== "15:15")
  ) {
    throw new SignalParticipationError("Invalid local participation choice.");
  }
}
