export type CommunicationMode =
  | "plain_language"
  | "one_question_at_a_time"
  | "written_and_spoken"
  | "aac"
  | "auslan"
  | "support_person"
  | "written_only"
  | "sms"
  | "email"
  | "phone"
  | "extra_response_time";

export type CommunicationPassportInstruction = {
  id: string;
  mode: CommunicationMode;
  participantWording: string;
  workerFacingWording: string;
  required: boolean;
  sortOrder: number;
};

export type CommunicationPassport = {
  participantId: string;
  version: number;
  updatedAt: string;
  instructions: CommunicationPassportInstruction[];
  /** Fields that may be disclosed after consent — never diagnosis. */
  disclosableFieldKeys: string[];
};

export type WorkerPassportAcknowledgement = {
  workerUserId: string;
  participantId: string;
  passportVersion: number;
  acknowledgedAt: string;
  organisationId?: string;
};
