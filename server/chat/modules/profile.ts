import type { ChatModule } from "../types";

export const profileModule: ChatModule = {
  name: "profile",
  description: "Reads the user's accessibility context profile (mobility aids, transfer distance, stairs, sensory and assistance needs).",
  alwaysOn: true,
  intents: ["profile", "mobility", "access need", "preference", "stairs", "wheelchair", "sensory", "assistance"],
  quickActions: ["edit_profile"],
  tools: [
    {
      type: "function",
      function: {
        name: "get_user_profile",
        description: "Retrieve the user's accessibility context profile including mobility aids, transfer distance limits, stairs capability, sensory preferences, and assistance needs.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
  ],
  handlers: {
    get_user_profile: async (_args, ctx) => {
      const profile = ctx.profile;
      if (!profile) {
        return JSON.stringify({
          message: "No accessibility profile found. The user hasn't set up their access profile yet.",
          suggestion: "Ask the user about their mobility needs, sensory preferences, and assistance requirements to provide better guidance.",
        });
      }
      return JSON.stringify({
        mobilityAids: profile.mobilityAids,
        maxTransferM: profile.maxTransferM,
        stairsAllowed: profile.stairsAllowed,
        sensoryPreferences: profile.sensoryPreferences,
        communicationMode: profile.communicationMode,
        assistancePreferences: profile.assistancePreferences,
      });
    },
  },
};
