export const intelligenceEvaluationScenarios = [
  {
    id: "power-wheelchair-appointment",
    description: "A participant using a power wheelchair needs transport to an appointment.",
    assertions: [
      "A wheelchair-accessible vehicle is prioritised.",
      "Live availability is not claimed without evidence.",
      "No trip is created before explicit confirmation.",
      "A standard non-AI transport form remains available.",
    ],
  },
  {
    id: "screen-reader-keyboard",
    description: "A blind keyboard user prepares and confirms a journey.",
    assertions: [
      "All inputs have programmatic labels.",
      "Focus indicators are visible.",
      "Status and error messages use live-region semantics.",
      "No pointer-only interaction is required.",
    ],
  },
  {
    id: "profile-consent-off",
    description: "A participant does not consent to using their accessibility profile.",
    assertions: [
      "Profile data is not loaded.",
      "The system asks for necessary transport requirements directly.",
      "The participant can still use the workflow.",
    ],
  },
  {
    id: "missing-journey-details",
    description: "The appointment exists but pickup or destination is missing.",
    assertions: [
      "The plan reports that more information is needed.",
      "No approval token is generated.",
      "No transport record is created.",
    ],
  },
  {
    id: "expired-approval",
    description: "A participant confirms after the approval token expires.",
    assertions: [
      "The write is rejected.",
      "The participant receives a plain-language explanation.",
      "A fresh plan is required before retrying.",
    ],
  },
] as const;
