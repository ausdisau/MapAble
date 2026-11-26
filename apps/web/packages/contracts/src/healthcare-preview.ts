import encounterFixture from "./healthcare-preview-encounter.json";

export const visit = {
  title: "Speech pathology follow-up",
  clinician: "Amelia Torres",
  date: "Tuesday, 1 December 2026",
  time: "10:30 am AEDT",
  duration: `${encounterFixture.durationMinutes} minutes`,
} as const;

export const visitModes = [
  {
    id: "video",
    label: "Video",
    detail: "Camera and microphone are optional.",
  },
  { id: "audio", label: "Audio", detail: "Keep your camera off." },
  {
    id: "text",
    label: "Text",
    detail: "Type or use your AAC device. No microphone required.",
  },
] as const;

export const accessOptions = [
  {
    id: "responseTime",
    label: "Give me time to respond",
    detail: "Wait for me to finish before moving on.",
  },
  {
    id: "typing",
    label: "I may use typing or AAC",
    detail: "Give me space to communicate in my own way.",
  },
  {
    id: "captions",
    label: "Show captions",
    detail: "Try a sample of written speech during your practice visit.",
  },
  {
    id: "auslan",
    label: "I’d like an Auslan interpreter",
    detail: "Try sharing a request for an interpreter with your care team.",
  },
  {
    id: "supporter",
    label: "I’d like a support person",
    detail:
      "Try sharing a preference to have someone join with your permission.",
  },
] as const;

export const quickPhrases = [
  "Please give me a moment.",
  "I’ll type my response.",
  "Please repeat that.",
] as const;

export const maxMessageLength = 400;
const clinicianWelcome =
  "Hi, I’m Amelia. Take your time. You can type here or use a quick phrase.";
const clinicianReply =
  "Thanks for letting me know. I’ll wait until you’re ready to continue.";

export type VisitMode = (typeof visitModes)[number]["id"];
export type AccessOption = (typeof accessOptions)[number]["id"];
export type VisitStage = "prepare" | "waiting" | "consultation" | "complete";
type Message = {
  id: number;
  speaker: "You" | "Simulated clinician";
  text: string;
};

export type HealthcarePreview = {
  stage: VisitStage;
  mode: VisitMode;
  access: AccessOption[];
  shareAccess: boolean;
  acknowledged: boolean;
  admitted: boolean;
  callback: boolean;
  messages: Message[];
};

export type VisitAction =
  | { type: "chooseMode"; mode: VisitMode }
  | { type: "toggleAccess"; option: AccessOption }
  | { type: "shareAccess"; share: boolean }
  | { type: "acknowledge"; value: boolean }
  | { type: "enterWaitingRoom" }
  | { type: "simulateAdmission" }
  | { type: "returnToPreparation" }
  | { type: "joinConsultation" }
  | { type: "sendMessage"; text: string }
  | { type: "callback" }
  | { type: "leave" }
  | { type: "reset" };

export function startHealthcarePreview(): HealthcarePreview {
  return {
    stage: "prepare",
    mode: "video",
    access: [],
    shareAccess: false,
    acknowledged: false,
    admitted: false,
    callback: false,
    messages: [],
  };
}

export function updateHealthcarePreview(
  state: HealthcarePreview,
  action: VisitAction,
): HealthcarePreview {
  switch (action.type) {
    case "chooseMode":
      return state.stage === "prepare"
        ? { ...state, mode: action.mode }
        : state;
    case "toggleAccess":
      return {
        ...state,
        access: state.access.includes(action.option)
          ? state.access.filter((option) => option !== action.option)
          : [...state.access, action.option],
      };
    case "shareAccess":
      return { ...state, shareAccess: action.share };
    case "acknowledge":
      return state.stage === "prepare"
        ? { ...state, acknowledged: action.value }
        : state;
    case "enterWaitingRoom":
      return state.stage === "prepare" && state.acknowledged
        ? { ...state, stage: "waiting" }
        : state;
    case "simulateAdmission":
      return state.stage === "waiting" ? { ...state, admitted: true } : state;
    case "returnToPreparation":
      return state.stage === "waiting"
        ? { ...state, stage: "prepare", admitted: false, acknowledged: false }
        : state;
    case "joinConsultation":
      return state.stage === "waiting" && state.admitted
        ? {
            ...state,
            stage: "consultation",
            messages: [
              { id: 0, speaker: "Simulated clinician", text: clinicianWelcome },
            ],
          }
        : state;
    case "sendMessage": {
      const message = action.text.trim();
      if (
        state.stage !== "consultation" ||
        !message ||
        message.length > maxMessageLength
      ) {
        return state;
      }
      const messageId =
        (state.messages[state.messages.length - 1]?.id ?? 0) + 1;
      return {
        ...state,
        messages: [
          ...state.messages.slice(-18),
          { id: messageId, speaker: "You", text: message },
          {
            id: messageId + 1,
            speaker: "Simulated clinician",
            text: clinicianReply,
          },
        ],
      };
    }
    case "callback":
      return { ...state, callback: true };
    case "leave":
      return state.stage === "consultation" || state.stage === "waiting"
        ? {
            ...state,
            stage: "complete",
            messages: [],
            admitted: false,
            acknowledged: false,
            shareAccess: false,
          }
        : state;
    case "reset":
      return startHealthcarePreview();
  }
}
