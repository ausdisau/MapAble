import { readFileSync, existsSync } from "fs";
import { join } from "path";

import { prisma } from "@/lib/prisma";

export async function seedDriftFindings(snapshotId?: string | null) {
  const seeds = [
    {
      findingKey: "drift_schema_vs_claim",
      layer: "claim",
      title: "Public claim may exceed deployed twin evidence",
      expectedState: "claims ⊆ capability evidence",
      observedState: "advisory — verify before marketing",
      severity: "warning" as const,
      owner: "platform_assurance",
      suggestedAction: "Align claim registry with twin capability manifest",
    },
    {
      findingKey: "drift_flag_defaults",
      layer: "flag",
      title: "ConvergenceOS flags must remain default-off",
      expectedState: "all MAPABLE_CONVERGENCE_* default false",
      observedState: "enforced in lib/config/convergence-os.ts",
      severity: "info" as const,
      owner: "platform_assurance",
      suggestedAction: "Keep defaults false in .env.example",
    },
    {
      findingKey: "drift_migration_order",
      layer: "schema",
      title: "Open PR migration timestamp collisions",
      expectedState: "unique migration timestamps",
      observedState: "fixture collisions on pilot tips",
      severity: "high" as const,
      owner: "architecture",
      suggestedAction: "Rebase colliding tips before foundation train advance",
    },
  ];

  for (const seed of seeds) {
    await prisma.driftFinding.upsert({
      where: { findingKey: seed.findingKey },
      create: {
        ...seed,
        snapshotId: snapshotId ?? null,
        evidenceJson: { synthetic: true, wave: 15 },
        status: "open",
      },
      update: {
        title: seed.title,
        expectedState: seed.expectedState,
        observedState: seed.observedState,
        severity: seed.severity,
        suggestedAction: seed.suggestedAction,
        snapshotId: snapshotId ?? null,
      },
    });
  }

  return { upserted: seeds.length };
}

export async function seedEnvironmentParity() {
  const envs = [
    {
      environmentKey: "local",
      label: "Local development",
      syntheticData: true,
      dataClassification: "synthetic",
    },
    {
      environmentKey: "test",
      label: "CI / unit test",
      syntheticData: true,
      dataClassification: "synthetic",
    },
    {
      environmentKey: "preview",
      label: "Vercel preview",
      syntheticData: true,
      dataClassification: "synthetic",
      unsafeDifferences: ["execution flags must stay off"],
    },
    {
      environmentKey: "staging",
      label: "Staging",
      syntheticData: true,
      dataClassification: "synthetic_or_masked",
      unsafeDifferences: ["must not present fixtures as live claims"],
    },
    {
      environmentKey: "production",
      label: "Production",
      syntheticData: false,
      dataClassification: "live",
      unsafeDifferences: ["missing kill switch is unsafe"],
    },
  ];

  for (const env of envs) {
    await prisma.environmentParityRecord.upsert({
      where: { environmentKey: env.environmentKey },
      create: {
        ...env,
        appVersion: null,
        schemaVersion: null,
        featureFlagsJson: { convergenceOsDefault: false },
        secretsPresentJson: { valuesNeverStored: true },
      },
      update: {
        label: env.label,
        syntheticData: env.syntheticData,
        dataClassification: env.dataClassification,
        unsafeDifferences: env.unsafeDifferences ?? [],
      },
    });
  }

  const secrets = [
    {
      secretName: "DATABASE_URL",
      owner: "platform",
      purpose: "Postgres connection",
      required: true,
      environmentsJson: ["local", "test", "preview", "staging", "production"],
    },
    {
      secretName: "STRIPE_SECRET_KEY",
      owner: "billing",
      purpose: "Stripe API",
      required: false,
      associatedIntegration: "stripe",
      environmentsJson: ["staging", "production"],
      fallback: "disabled billing features",
    },
    {
      secretName: "MAPABLE_CONVERGENCE_OS_ENABLED",
      owner: "platform_assurance",
      purpose: "ConvergenceOS master flag (not a secret value)",
      required: false,
      environmentsJson: ["local", "preview", "staging"],
      expectedFormat: "true|false",
    },
  ];

  for (const secret of secrets) {
    await prisma.secretContract.upsert({
      where: { secretName: secret.secretName },
      create: secret,
      update: {
        owner: secret.owner,
        purpose: secret.purpose,
        required: secret.required,
        environmentsJson: secret.environmentsJson,
        associatedIntegration: secret.associatedIntegration,
        fallback: secret.fallback,
        expectedFormat: secret.expectedFormat,
      },
    });
  }

  return { environments: envs.length, secrets: secrets.length };
}

export async function seedSupplyChain(repoRoot = process.cwd()) {
  const pkgPath = join(repoRoot, "package.json");
  if (!existsSync(pkgPath)) return { upserted: 0 };

  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const highInterest = [
    "next",
    "react",
    "@prisma/client",
    "prisma",
    "stripe",
    "zod",
    "vitest",
  ];

  let upserted = 0;
  for (const name of highInterest) {
    const version =
      pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? null;
    if (!version) continue;
    await prisma.supplyChainDependency.upsert({
      where: {
        packageName_ecosystem: { packageName: name, ecosystem: "npm" },
      },
      create: {
        packageName: name,
        version,
        ecosystem: "npm",
        purpose: "runtime_or_tooling",
        owner: "platform",
        direct: true,
        securityStatus: "unknown",
        upgradePolicy: "rehearse_high_impact",
        affectedCapabilities: ["platform"],
      },
      update: {
        version,
        upgradePolicy: "rehearse_high_impact",
      },
    });
    upserted += 1;
  }

  return { upserted };
}
