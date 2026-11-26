import { quickPhrases } from "./healthcare-preview";

export const practiceScenarios = {
  moreTime: {
    phrase: quickPhrases[0],
    replies: [
      {
        id: "pause",
        text: "Of course. I’ll pause and wait until you tell me you’re ready.",
      },
      {
        id: "noRush",
        text: "Take the time you need. You can let me know when you’re ready to continue.",
      },
    ],
  },
  typeResponse: {
    phrase: quickPhrases[1],
    replies: [
      {
        id: "type",
        text: "Yes. I’ll read your typed response when you’re ready to send it.",
      },
      {
        id: "waitForText",
        text: "Typing works. I’ll wait and read what you write.",
      },
    ],
  },
  repeat: {
    phrase: quickPhrases[2],
    replies: [
      {
        id: "repeat",
        text: "Of course. I can repeat it slowly and pause between points.",
      },
      {
        id: "writeIt",
        text: "Happy to repeat it. Would you also like me to write it in the chat?",
      },
    ],
  },
} as const;

export type PracticeScenario = keyof typeof practiceScenarios;

export function isPracticeScenario(value: unknown): value is PracticeScenario {
  return typeof value === "string" && Object.hasOwn(practiceScenarios, value);
}
