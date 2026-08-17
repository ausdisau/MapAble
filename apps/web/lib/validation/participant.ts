import { z } from "zod";

export const participantProfileSchema = z.object({
  displayName: z.string().min(1).max(120),
  preferredName: z.string().max(120).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  ndisParticipantNumber: z.string().max(20).optional().nullable(),
  primaryContactMethod: z.enum(["email", "phone", "sms"]).optional(),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    })
    .optional()
    .nullable(),
  supportCoordinatorContact: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional()
    .nullable(),
  planManagerContact: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional()
    .nullable(),
  homeSuburb: z.string().max(100).optional().nullable(),
  homeState: z.string().max(10).optional().nullable(),
  timezone: z.string().optional(),
  participantNotes: z.string().max(5000).optional().nullable(),
});

export const adminParticipantUpdateSchema = participantProfileSchema.extend({
  adminNotes: z.string().max(5000).optional().nullable(),
});
