import { z } from "zod";

export const appointmentMissionRequestSchema = z.object({
  outcome: z.string().trim().min(3).max(3000),
  appointment: z.object({
    title: z.string().trim().min(2).max(240),
    startAt: z.string().datetime(),
    endAt: z.string().datetime().nullable().optional(),
    location: z.string().trim().min(2).max(500),
    accessPlaceId: z.string().nullable().optional(),