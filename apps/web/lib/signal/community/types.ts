/** Domain contracts for the local-only MapAble Signal community preview. */
export type FormHugQuestionType =
  | "page_break" | "description" | "radio" | "checkbox" | "short_text"
  | "long_text" | "dropdown" | "date" | "location" | "number"
  | "attachment" | "audio" | "email";

export type FormHugChoice = { code: string; label: string };
export type FormHugQuestion = {
  apiCode: string;
  type: FormHugQuestionType;
  label: string;
  required: boolean;
  choices: FormHugChoice[];
  help: string;
};

export type FormHugRule = {
  kind: "show" | "abort";
  ifField: string;
  equals: string;
  targets: string[];
};

export type FormHugSurveySchema = {
  formToken: string;
  formName: string;
  version: string;
  source: "formhug_schema_only";
  entriesAtInspection: number;
  fields: FormHugQuestion[];
  rules: FormHugRule[];
};

export type SurveyAnswer = string | string[];
export type SurveyAnswers = Record<string, SurveyAnswer | undefined>;
export type SurveyPage = {
  id: string;
  title: string;
  questions: FormHugQuestion[];
};
export type SurveyReview = {
  source: "local_synthetic_preview";
  formToken: "f50pAQ";
  consentForInternalReview: true;
  publicConsiderationRequested: boolean;
  submitted: false;
  verified: false;
  publicRating: "unknown";
  publicationAllowed: false;
  sourceEvidenceClass: "unverified_community_report";
  questionCount: number;
  answeredCount: number;
  observationKind: "place" | "journey" | "not_specified";
  featureLabel: string;
  /** No free-text, identifying, contact, coordinate or media data. */
  containsPersonalData: false;
};

export type ForumRoomSlug =
  | "access-and-places"
  | "work-and-income"
  | "care-and-support"
  | "advocacy-and-rights"
  | "introduce-yourself";

export type LocalTopicStatus = "example" | "pending_local_review" | "visible_in_this_tab" | "rejected_in_this_tab";
export type LocalTopic = {
  id: string;
  roomSlug: ForumRoomSlug;
  title: string;
  body: string;
  createdAt: string;
  authorLabel: "Demo contributor";
  moderation: LocalTopicStatus;
  synthetic: true;
  public: false;
};
export type LocalReply = {
  id: string;
  topicId: string;
  body: string;
  moderation: LocalTopicStatus;
  synthetic: true;
  public: false;
};
export type DemoAuditAction =
  | "topic_drafted" | "reply_drafted" | "topic_preview_approved"
  | "topic_preview_rejected" | "survey_reviewed" | "survey_withdrawn";
export type DemoAuditEvent = {
  id: string;
  action: DemoAuditAction;
  at: string;
  subjectId: string;
  /** No user-identifying content. */
  source: "in_memory_demo";
};
