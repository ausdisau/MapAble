import { z } from "zod";

export const PRE_REGISTRATION_ROLES = ["participant", "provider"] as const;

export type PreRegistrationRole = (typeof PRE_REGISTRATION_ROLES)[number];

export const preRegistrationRoleLabels: Record<PreRegistrationRole, string> = {
  participant: "Participant or carer",
  provider: "Provider or support worker",
};

export const preRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  role: z.enum(PRE_REGISTRATION_ROLES),
  organisation: z
    .string()
    .trim()
    .max(160, "Organisation name is too long")
    .optional(),
  notes: z.string().trim().max(2000, "Notes are too long").optional(),
  /** Explicit consent scopes recorded client-side before submit. */
  consentScopes: z.array(z.string().max(80)).max(12).optional(),
  /** Honeypot — must stay empty for legitimate submissions. */
  company: z.string().max(0).optional(),
});

export type PreRegistrationInput = z.infer<typeof preRegistrationSchema>;
