import { z } from "zod";

export const dataVaultRequestSchema = z
  .object({
    requestType: z
      .enum(["export", "portability", "deletion_review"])
      .default("export"),
  })
  .strict();
