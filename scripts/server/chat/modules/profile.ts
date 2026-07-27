import { z } from "zod";
import type { ChatModule } from "../types";

const MOBILITY_AIDS = [
  "manual_wheelchair",
  "power_wheelchair",
  "walker",
  "cane",
  "crutches",
  "scooter",
  "none",
] as const;

const COMMUNICATION_MODES = ["text", "voice", "both", "aac"] as const;
const SENSITIVITY = ["low", "medium", "high"] as const;

/**
 * Validation for partial profile updates from chat. Every field is optional so a
 * user can change just one thing ("I can't do stairs anymore") without resetting
 * the rest of their profile.
 */
const updateProfileArgsSchema = z.object({
  mobilityAids: z.array(z.enum(MOBILITY_AIDS)).optional(),
  maxTransferM: z.number().int().min(10).max(500).optional(),
  stairsAllowed: z.boolean().optional(),
  communicationMode: z.enum(COMMUNICATION_MODES).optional(),
  noiseSensitivity: z.enum(SENSITIVITY).optional(),
  crowdSensitivity: z.enum(SENSITIVITY).optional(),
  lightSensitivity: z.enum(SENSITIVITY).optional(),
  fewerInterchanges: z.boolean().optional(),
  needsStaffAssistance: z.boolean().optional(),
  canTravelAlone: z.boolean().optional(),
  confirmed: z.boolean().optional(),
});

function plainLanguageErrors(error: z.ZodError): string[] {
  return error.errors.map((e) => {
    const field = e.path.join(".") || "value";
    if (e.code === "invalid_enum_value") {
      return `"${field}" must be one of: ${(e as any).options?.join(", ")}.`;
    }
    if (e.code === "too_small" || e.code === "too_big") {
      return `"${field}" is out of the allowed range (10m–500m for transfer distance).`;
    }
    return `"${field}": ${e.message}`;
  });
}

function snapshotProfile(profile: any) {
  const sensory = (profile?.sensoryPreferences as Record<string, any>) || {};
  const assistance = (profile?.assistancePreferences as Record<string, any>) || {};
  return {
    mobilityAids: profile?.mobilityAids ?? [],
    maxTransferM: profile?.maxTransferM ?? null,
    stairsAllowed: profile?.stairsAllowed ?? null,
    communicationMode: profile?.communicationMode ?? null,
    noiseSensitivity: sensory.noise ?? null,
    crowdSensitivity: sensory.crowd ?? null,
    lightSensitivity: sensory.light ?? null,
    fewerInterchanges: sensory.fewerInterchanges ?? null,
    needsStaffAssistance: assistance.needsStaff ?? null,
    canTravelAlone: assistance.canTravelAlone ?? null,
  };
}

export const profileModule: ChatModule = {
  name: "profile",
  description:
    "Reads and updates the user's accessibility context profile (mobility aids, transfer distance, stairs, sensory and assistance needs).",
  alwaysOn: true,
  intents: ["profile", "mobility", "access need", "preference", "stairs", "wheelchair", "sensory", "assistance", "update", "change", "edit"],
  quickActions: ["edit_profile", "update_profile"],
  tools: [
    {
      type: "function",
      function: {
        name: "get_user_profile",
        description:
          "Retrieve the user's accessibility context profile including mobility aids, transfer distance limits, stairs capability, sensory preferences, and assistance needs. Always call this to read current values before proposing any profile change.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    {
      type: "function",
      function: {
        name: "update_user_profile",
        description:
          "Update one or more fields of the user's accessibility profile. Only include the fields the user wants to change. You MUST first read current values with get_user_profile and get the user's explicit confirmation; only then call this with confirmed=true to perform the write. Calling with confirmed omitted/false returns a read-back for you to confirm with the user.",
        parameters: {
          type: "object",
          properties: {
            mobilityAids: {
              type: "array",
              items: { type: "string", enum: [...MOBILITY_AIDS] },
              description: "Full replacement list of mobility aids the user uses.",
            },
            maxTransferM: { type: "integer", description: "Maximum transfer/walk distance in metres (10–500)." },
            stairsAllowed: { type: "boolean", description: "Whether the user can manage stairs." },
            communicationMode: { type: "string", enum: [...COMMUNICATION_MODES], description: "Preferred communication mode." },
            noiseSensitivity: { type: "string", enum: [...SENSITIVITY], description: "Sensitivity to noise." },
            crowdSensitivity: { type: "string", enum: [...SENSITIVITY], description: "Sensitivity to crowds." },
            lightSensitivity: { type: "string", enum: [...SENSITIVITY], description: "Sensitivity to light." },
            fewerInterchanges: { type: "boolean", description: "Prefers routes with fewer interchanges." },
            needsStaffAssistance: { type: "boolean", description: "Needs staff assistance at stations/stops." },
            canTravelAlone: { type: "boolean", description: "Comfortable travelling alone." },
            confirmed: { type: "boolean", description: "Set true ONLY after the user has explicitly confirmed the change." },
          },
          required: [],
        },
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
      return JSON.stringify(snapshotProfile(profile));
    },

    update_user_profile: async (args, ctx) => {
      const parsed = updateProfileArgsSchema.safeParse(args);
      if (!parsed.success) {
        return JSON.stringify({
          success: false,
          validationErrors: plainLanguageErrors(parsed.error),
          message: "Some values weren't valid. Share these issues with the user in plain language and ask them to correct.",
        });
      }

      const data = parsed.data;
      const {
        confirmed,
        noiseSensitivity,
        crowdSensitivity,
        lightSensitivity,
        fewerInterchanges,
        needsStaffAssistance,
        canTravelAlone,
        ...topLevel
      } = data;

      const hasSensory =
        noiseSensitivity !== undefined ||
        crowdSensitivity !== undefined ||
        lightSensitivity !== undefined ||
        fewerInterchanges !== undefined;
      const hasAssistance = needsStaffAssistance !== undefined || canTravelAlone !== undefined;
      const changedKeys = Object.keys(topLevel);

      if (changedKeys.length === 0 && !hasSensory && !hasAssistance) {
        return JSON.stringify({
          success: false,
          message: "No fields were provided to change. Ask the user what they'd like to update.",
        });
      }

      const current = snapshotProfile(ctx.profile);

      const proposed: Record<string, any> = {};
      for (const k of changedKeys) proposed[k] = (topLevel as any)[k];
      if (noiseSensitivity !== undefined) proposed.noiseSensitivity = noiseSensitivity;
      if (crowdSensitivity !== undefined) proposed.crowdSensitivity = crowdSensitivity;
      if (lightSensitivity !== undefined) proposed.lightSensitivity = lightSensitivity;
      if (fewerInterchanges !== undefined) proposed.fewerInterchanges = fewerInterchanges;
      if (needsStaffAssistance !== undefined) proposed.needsStaffAssistance = needsStaffAssistance;
      if (canTravelAlone !== undefined) proposed.canTravelAlone = canTravelAlone;

      if (!confirmed) {
        return JSON.stringify({
          success: false,
          needsConfirmation: true,
          current,
          proposed,
          message:
            "Read these current vs proposed values back to the user and ask them to confirm before saving. Re-call update_user_profile with confirmed=true once they agree.",
        });
      }

      // Merge nested jsonb so a partial change does not wipe sibling fields.
      // Keys mirror what the profile wizard reads/writes (noise/crowd/light, needsStaff/canTravelAlone).
      const existingSensory = (ctx.profile?.sensoryPreferences as Record<string, any>) || {};
      const existingAssistance = (ctx.profile?.assistancePreferences as Record<string, any>) || {};

      const body: Record<string, any> = { ...topLevel };
      if (hasSensory) {
        const sensory = { ...existingSensory };
        if (noiseSensitivity !== undefined) sensory.noise = noiseSensitivity;
        if (crowdSensitivity !== undefined) sensory.crowd = crowdSensitivity;
        if (lightSensitivity !== undefined) sensory.light = lightSensitivity;
        if (fewerInterchanges !== undefined) sensory.fewerInterchanges = fewerInterchanges;
        body.sensoryPreferences = sensory;
      }
      if (hasAssistance) {
        const assistance = { ...existingAssistance };
        if (needsStaffAssistance !== undefined) assistance.needsStaff = needsStaffAssistance;
        if (canTravelAlone !== undefined) assistance.canTravelAlone = canTravelAlone;
        body.assistancePreferences = assistance;
      }

      const saved = await ctx.storage.upsertAccessProfile(ctx.userId, body);

      return JSON.stringify({
        success: true,
        message: "Profile updated. Confirm the new state to the user.",
        profile: snapshotProfile(saved),
      });
    },
  },
};
