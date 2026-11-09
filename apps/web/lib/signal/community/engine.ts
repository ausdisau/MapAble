import { formHugAccessSurvey } from "./formhug-schema";
import type {
  DemoAuditAction, DemoAuditEvent, FormHugQuestion, FormHugSurveySchema,
  ForumRoomSlug, LocalReply, LocalTopic, LocalTopicStatus, SurveyAnswer,
  SurveyAnswers, SurveyPage, SurveyReview,
} from "./types";

export const PUBLIC_FORMHUG_URL = "https://formhug.ai/f/f50pAQ";

export const SENSITIVE_CAPTURE_FIELDS = new Set(["field_17", "field_28", "field_29", "field_33"]);
export const NO_EXTERNAL_UPLOAD = true;
const ACCEPTED_CONSENT = "hjpY";
const DECLINED_CONSENT = "X3ej";
const PUBLIC_CONSIDERATION_YES = "lDLp";
const MEASURED_SOURCE = "cZDm";

export function isSignalCommunityDemoEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.MAPABLE_SIGNAL_COMMUNITY_DEMO_ENABLED === "true" &&
    (env.VERCEL_ENV === "preview" ||
      (env.NODE_ENV === "development" && env.VERCEL_ENV !== "production"));
}

export function surveyPages(schema: FormHugSurveySchema = formHugAccessSurvey): SurveyPage[] {
  const pages: SurveyPage[] = [];
  let current: SurveyPage = { id: "intro", title: "Getting started", questions: [] };
  for (const field of schema.fields) {
    if (field.type === "page_break") {
      if (current.questions.length > 0) pages.push(current);
      current = {
        id: field.apiCode,
        title: field.label || "Getting started",
        questions: [],
      };
    } else {
      current.questions.push(field);
    }
  }
  if (current.questions.length > 0) pages.push(current);
  return pages;
}

export function surveyAborted(
  answers: SurveyAnswers,
  schema: FormHugSurveySchema = formHugAccessSurvey,
): boolean {
  return schema.rules.some((rule) => rule.kind === "abort" &&
    answers[rule.ifField] === rule.equals);
}

export function isQuestionVisible(
  field: FormHugQuestion,
  answers: SurveyAnswers,
  schema: FormHugSurveySchema = formHugAccessSurvey,
): boolean {
  if (surveyAborted(answers, schema) && field.apiCode !== "field_3" && field.apiCode !== "field_2") {
    return false;
  }
  const showRules = schema.rules.filter((rule) =>
    rule.kind === "show" && rule.targets.includes(field.apiCode));
  return showRules.length === 0 || showRules.some((rule) =>
    answers[rule.ifField] === rule.equals);
}

export function visibleQuestions(
  page: SurveyPage,
  answers: SurveyAnswers,
  schema: FormHugSurveySchema = formHugAccessSurvey,
): FormHugQuestion[] {
  return page.questions.filter((field) => isQuestionVisible(field, answers, schema));
}

export function isAnswerPresent(answer: SurveyAnswer | undefined): boolean {
  if (typeof answer === "string") return answer.trim().length > 0;
  return Array.isArray(answer) && answer.length > 0;
}

export function getSanitizedAnswers(
  answers: SurveyAnswers,
  schema: FormHugSurveySchema = formHugAccessSurvey,
): SurveyAnswers {
  const clean: SurveyAnswers = {};
  for (const field of schema.fields) {
    if (SENSITIVE_CAPTURE_FIELDS.has(field.apiCode)) continue;
    if (!isQuestionVisible(field, answers, schema)) continue;
    const answer = answers[field.apiCode];
    if (!isAnswerPresent(answer)) continue;
    if (field.choices.length > 0) {
      const allowedCodes = new Set(field.choices.map((x) => x.code));
      if (Array.isArray(answer)) {
        clean[field.apiCode] = answer.filter((item) => allowedCodes.has(item));
      } else if (typeof answer === "string" && allowedCodes.has(answer)) {
        clean[field.apiCode] = answer;
      }
    } else if (typeof answer === "string") {
      clean[field.apiCode] = answer.slice(0, 2000).trim();
    }
  }
  return clean;
}

export function validateSurveyPage(
  page: SurveyPage,
  answers: SurveyAnswers,
  schema: FormHugSurveySchema = formHugAccessSurvey,
): string[] {
  if (surveyAborted(answers, schema)) return ["You chose not to consent. This preview will not submit anything."];
  const errors: string[] = [];
  for (const field of visibleQuestions(page, answers, schema)) {
    if (field.type === "description" || SENSITIVE_CAPTURE_FIELDS.has(field.apiCode)) continue;
    const answer = answers[field.apiCode];
    if (field.required && !isAnswerPresent(answer)) {
      errors.push(field.label + " — please select or enter an answer.");
      continue;
    }
    if (!isAnswerPresent(answer)) continue;
    if (field.choices.length) {
      const allowed = new Set(field.choices.map((item) => item.code));
      const values: string[] = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
      if (values.some((value) => !allowed.has(value))) {
        errors.push(field.label + " — an unsupported choice was selected.");
      }
    } else if (Array.isArray(answer)) {
      errors.push(field.label + " — expected one value.");
    } else if (typeof answer === "string") {
      if (answer.length > 2000) errors.push(field.label + " — too much text.");
      if (field.type === "number") {
        const numeric = Number(answer);
        if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 10000) {
          errors.push(field.label + " — use a positive number within the supported range.");
        }
        if (answers.field_26 !== MEASURED_SOURCE) {
          errors.push("Only enter a measured width when the source is 'Measured with a tool'.");
        }
      }
      if (field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(answer) ||
        !Number.isFinite(Date.parse(answer)))) {
        errors.push(field.label + " — use a valid date.");
      }
    }
  }
  return errors;
}

export function validateFullSurvey(
  answers: SurveyAnswers,
  schema: FormHugSurveySchema = formHugAccessSurvey,
): string[] {
  if (answers.field_3 !== ACCEPTED_CONSENT) {
    return ["Consent to internal review is required. No response will be submitted without it."];
  }
  return surveyPages(schema).flatMap((page) => validateSurveyPage(page, answers, schema));
}

export function summariseLocalSurvey(
  answers: SurveyAnswers,
  schema: FormHugSurveySchema = formHugAccessSurvey,
): SurveyReview {
  const errors = validateFullSurvey(answers, schema);
  if (errors.length > 0) throw new Error(errors[0]);
  const clean = getSanitizedAnswers(answers, schema);
  const feature = schema.fields.find((field) => field.apiCode === "field_19");
  const featureCode = clean.field_19;
  const featureLabel =
    feature?.choices.find((choice) => choice.code === featureCode)?.label ?? "Not assessed";
  const observationKind = clean.field_4 === "580J"
    ? "journey" : clean.field_4 === "8opO" ? "place" : "not_specified";
  return {
    source: "local_synthetic_preview",
    formToken: "f50pAQ",
    consentForInternalReview: true,
    publicConsiderationRequested: clean.field_31 === PUBLIC_CONSIDERATION_YES,
    submitted: false,
    verified: false,
    publicRating: "unknown",
    publicationAllowed: false,
    sourceEvidenceClass: "unverified_community_report",
    questionCount: schema.fields.filter((f) =>
      f.type !== "page_break" && f.type !== "description").length,
    answeredCount: Object.keys(clean).length,
    observationKind,
    featureLabel,
    containsPersonalData: false,
  };
}

export const DEMO_FORUM_TOPICS: readonly LocalTopic[] = [
  {
    id: "demo-crossing",
    roomSlug: "access-and-places",
    title: "What information makes a crossing easier to assess?",
    body: "A fictional discussion about kerb transitions, signal timing, surfaces and missing observations. No real crossing has been assessed.",
    createdAt: "2026-11-09T02:00:00Z",
    authorLabel: "Demo contributor",
    moderation: "example",
    synthetic: true,
    public: false,
  },
  {
    id: "demo-entrance",
    roomSlug: "access-and-places",
    title: "Document an entrance without claiming the whole venue is accessible",
    body: "This example invites clear descriptions of thresholds, door opening and alternatives, plus what remains unknown.",
    createdAt: "2026-11-08T02:00:00Z",
    authorLabel: "Demo contributor",
    moderation: "example",
    synthetic: true,
    public: false,
  },
];

export function makeLocalTopic(
  input: { id: string; title: string; body: string; roomSlug: ForumRoomSlug; createdAt: string },
): LocalTopic {
  if (input.title.trim().length < 6 || input.title.trim().length > 120) {
    throw new Error("Enter a discussion title between 6 and 120 characters.");
  }
  if (input.body.trim().length < 10 || input.body.trim().length > 1200) {
    throw new Error("Enter a discussion description between 10 and 1200 characters.");
  }
  if (input.roomSlug !== "access-and-places") {
    throw new Error("The Signal preview only uses the existing Access & places PEERS room.");
  }
  return {
    id: input.id,
    title: input.title.trim(),
    body: input.body.trim(),
    roomSlug: input.roomSlug,
    createdAt: input.createdAt,
    authorLabel: "Demo contributor",
    moderation: "pending_local_review",
    synthetic: true,
    public: false,
  };
}

export function makeLocalReply(id: string, topicId: string, body: string): LocalReply {
  if (body.trim().length < 3 || body.trim().length > 1200) {
    throw new Error("Enter a reply between 3 and 1200 characters.");
  }
  return {
    id, topicId, body: body.trim(), moderation: "pending_local_review",
    synthetic: true, public: false,
  };
}

export function changeLocalTopicModeration(
  topic: LocalTopic, status: LocalTopicStatus,
): LocalTopic {
  if (topic.synthetic !== true || topic.public !== false) {
    throw new Error("Demo moderation cannot affect a public topic.");
  }
  if (!["pending_local_review", "visible_in_this_tab", "rejected_in_this_tab"].includes(status)) {
    throw new Error("Unsupported demo review action.");
  }
  return { ...topic, moderation: status, synthetic: true, public: false };
}

export function makeAuditEvent(
  id: string, action: DemoAuditAction, subjectId: string, at: string,
): DemoAuditEvent {
  return { id, action, subjectId, at, source: "in_memory_demo" };
}
