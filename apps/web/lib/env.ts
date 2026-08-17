import { z } from "zod";

import {
  isVercelPreviewDeployment,
  isVercelProductionDeployment,
} from "@/lib/auth/nextauth-env";
import {
  validateProductionDatabaseUrls,
  validateProductionNextAuthSecret,
  validateProductionPublicUrls,
} from "@/lib/config/canonical-url";

const coreSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
});

type IntegrationEnvRule = {
  key: string;
  enabledWhen: () => boolean;
  requiredVars: string[];
};

function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

const integrationRules: IntegrationEnvRule[] = [
  {
    key: "postgres",
    enabledWhen: () => true,
    requiredVars: ["DATABASE_URL"],
  },
  {
    key: "stripe",
    enabledWhen: () => envTrue("STRIPE_ENABLED"),
    requiredVars: ["STRIPE_SECRET_KEY"],
  },
  {
    key: "twilio_verify",
    enabledWhen: () => envTrue("TWILIO_2FA_ENABLED"),
    requiredVars: [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_VERIFY_SERVICE_SID",
    ],
  },
  {
    key: "xero",
    enabledWhen: () => envTrue("XERO_ENABLED"),
    requiredVars: ["XERO_CLIENT_ID", "XERO_CLIENT_SECRET"],
  },
  {
    key: "keycloak",
    enabledWhen: () => envTrue("KEYCLOAK_ENABLED"),
    requiredVars: [
      "KEYCLOAK_BASE_URL",
      "KEYCLOAK_REALM",
      "KEYCLOAK_CLIENT_ID",
      "KEYCLOAK_CLIENT_SECRET",
      "KEYCLOAK_ISSUER_URL",
      "KEYCLOAK_REDIRECT_URI",
    ],
  },
  {
    key: "maplibre",
    enabledWhen: () => process.env.MAP_INTEGRATION_ENABLED === "true",
    requiredVars: ["NEXT_PUBLIC_MAP_STYLE_URL"],
  },
  {
    key: "openstreetmap",
    enabledWhen: () => process.env.OPENSTREETMAP_ENABLED === "true",
    requiredVars: [],
  },
  {
    key: "opensearch",
    enabledWhen: () => envTrue("OPENSEARCH_ENABLED"),
    requiredVars: [
      "OPENSEARCH_URL",
      "OPENSEARCH_USERNAME",
      "OPENSEARCH_PASSWORD",
    ],
  },
  {
    key: "temporal",
    enabledWhen: () => envTrue("TEMPORAL_ENABLED"),
    requiredVars: [
      "TEMPORAL_ADDRESS",
      "TEMPORAL_NAMESPACE",
      "TEMPORAL_TASK_QUEUE",
    ],
  },
  {
    key: "n8n",
    enabledWhen: () => envTrue("N8N_ENABLED"),
    requiredVars: ["N8N_BASE_URL", "N8N_API_KEY", "N8N_WEBHOOK_SECRET"],
  },
  {
    key: "directus",
    enabledWhen: () => envTrue("DIRECTUS_ENABLED"),
    requiredVars: ["DIRECTUS_URL", "DIRECTUS_STATIC_TOKEN"],
  },
  {
    key: "metabase",
    enabledWhen: () => envTrue("METABASE_ENABLED"),
    requiredVars: ["METABASE_SITE_URL", "METABASE_SECRET_KEY"],
  },
  {
    key: "medplum",
    enabledWhen: () => process.env.FHIR_PROVIDER === "medplum",
    requiredVars: [
      "MEDPLUM_BASE_URL",
      "MEDPLUM_CLIENT_ID",
      "MEDPLUM_CLIENT_SECRET",
    ],
  },
  {
    key: "hapi_fhir",
    enabledWhen: () => process.env.FHIR_PROVIDER === "hapi",
    requiredVars: ["HAPI_FHIR_BASE_URL"],
  },
  {
    key: "jitsi",
    enabledWhen: () => process.env.TELEHEALTH_VIDEO_PROVIDER === "jitsi",
    requiredVars: ["JITSI_BASE_URL"],
  },
  {
    key: "livekit",
    enabledWhen: () => process.env.TELEHEALTH_VIDEO_PROVIDER === "livekit",
    requiredVars: ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"],
  },
  {
    key: "calcom",
    enabledWhen: () => process.env.SCHEDULING_PROVIDER === "calcom",
    requiredVars: ["CALCOM_API_KEY", "CALCOM_BASE_URL"],
  },
  {
    key: "erpnext",
    enabledWhen: () => envTrue("ERPNEXT_ENABLED"),
    requiredVars: ["ERPNEXT_BASE_URL", "ERPNEXT_API_KEY", "ERPNEXT_API_SECRET"],
  },
  {
    key: "supabase",
    enabledWhen: () => envTrue("SUPABASE_ENABLED"),
    requiredVars: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  },
  {
    key: "socketio",
    enabledWhen: () => envTrue("SOCKETIO_ENABLED"),
    requiredVars: ["SOCKETIO_SERVER_URL"],
  },
];

export type EnvValidationIssue = {
  integrationKey?: string;
  variable: string;
  message: string;
};

export function validateCoreEnv(): EnvValidationIssue[] {
  const issues: EnvValidationIssue[] = [];
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    issues.push(...validateProductionDatabaseUrls(process.env));
    issues.push(...validateProductionPublicUrls(process.env));

    const hasPrimarySecret = Boolean(process.env.NEXTAUTH_SECRET?.trim());
    const hasPreviewSecret = Boolean(
      process.env.MAPABLE_PREVIEW_AUTH_SECRET?.trim(),
    );

    if (isVercelProductionDeployment() && !hasPrimarySecret) {
      issues.push({
        variable: "NEXTAUTH_SECRET",
        message: "Required on Vercel production deployments",
      });
    } else if (
      isVercelPreviewDeployment() &&
      !hasPrimarySecret &&
      !hasPreviewSecret
    ) {
      issues.push({
        variable: "NEXTAUTH_SECRET",
        message:
          "Required on Vercel preview (or set MAPABLE_PREVIEW_AUTH_SECRET in Preview env)",
      });
    } else {
      issues.push(...validateProductionNextAuthSecret(process.env));
    }
  }

  return issues;
}

export function validateIntegrationEnv(): EnvValidationIssue[] {
  const issues: EnvValidationIssue[] = [];

  for (const rule of integrationRules) {
    if (!rule.enabledWhen()) continue;
    for (const variable of rule.requiredVars) {
      if (!process.env[variable]?.trim()) {
        issues.push({
          integrationKey: rule.key,
          variable,
          message: `Required when ${rule.key} integration is enabled`,
        });
      }
    }
  }

  return issues;
}

export function validateAllEnv(): {
  ok: boolean;
  core: EnvValidationIssue[];
  integrations: EnvValidationIssue[];
} {
  const core = validateCoreEnv();
  const integrations = validateIntegrationEnv();
  return {
    ok: core.length === 0 && integrations.length === 0,
    core,
    integrations,
  };
}

export function parseCoreEnv() {
  return coreSchema.safeParse(process.env);
}

/** Safe summary for CLI — never includes secret values. */
export function formatEnvIssues(issues: EnvValidationIssue[]): string {
  return issues
    .map((i) => {
      const prefix = i.integrationKey ? `[${i.integrationKey}] ` : "";
      return `${prefix}${i.variable}: ${i.message}`;
    })
    .join("\n");
}
