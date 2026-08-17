import { z } from "zod";

export const CONTACT_TOPICS = [
  "pilot",
  "provider",
  "accessibility",
  "privacy",
  "general",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const contactTopicLabels: Record<ContactTopic, string> = {
  pilot: "Pilot or early access",
  provider: "Provider registration",
  accessibility: "Accessibility feedback",
  privacy: "Privacy or data request",
  general: "General enquiry",
};

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  topic: z.enum(CONTACT_TOPICS),
  message: z
    .string()
    .trim()
    .min(20, "Please add a few more details (at least 20 characters)")
    .max(5000, "Message is too long"),
  /** Explicit consent scopes recorded client-side before submit. */
  consentScopes: z.array(z.string().max(80)).max(12).optional(),
  /** Honeypot — must stay empty for legitimate submissions. */
  company: z.string().max(0).optional(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
