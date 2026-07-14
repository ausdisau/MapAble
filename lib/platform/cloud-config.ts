import { z } from "zod";

export const cloudEnvironmentSchema = z
  .object({
    MAPABLE_ENVIRONMENT: z
      .enum(["local", "test", "development", "staging", "production"])
      .default("local"),
    DATABASE_URL: z.string().min(1).optional(),
    DIRECT_URL: z.string().min(1).optional(),
    NEXTAUTH_SECRET: z.string().min(32).optional(),
    CLOUD_OUTBOX_ENABLED: z.enum(["true", "false"]).default("false"),
    CLOUD_WORKFLOWS_ENABLED: z.enum(["true", "false"]).default("false"),
    CLOUD_STORAGE_PROVIDER: z.enum(["recording", "s3", "supabase"]).default("recording"),
    CLOUD_QUEUE_PROVIDER: z.enum(["recording", "managed"]).default("recording"),
    CLOUD_CACHE_PROVIDER: z.enum(["memory", "redis"]).default("memory"),
  })
  .superRefine((value, context) => {
    if (value.MAPABLE_ENVIRONMENT === "production") {
      for (const variable of ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET"] as const) {
        if (!value[variable]) {
          context.addIssue({
            code: "custom",
            path: [variable],
            message: `${variable} is required in production`,
          });
        }
      }
      if (
        value.CLOUD_STORAGE_PROVIDER === "recording" ||
        value.CLOUD_QUEUE_PROVIDER === "recording" ||
        value.CLOUD_CACHE_PROVIDER === "memory"
      ) {
        context.addIssue({
          code: "custom",
          path: ["MAPABLE_ENVIRONMENT"],
          message: "Recording or memory cloud providers cannot be used in production",
        });
      }
    }
  });

export function getCloudConfig(
  environment: Record<string, string | undefined> = process.env,
) {
  return cloudEnvironmentSchema.parse(environment);
}
