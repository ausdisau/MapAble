import { CANONICAL_DOMAIN_SEEDS } from "@/lib/platform/convergence-os/seed/canonical-domains";
import { CAPABILITY_SEEDS } from "@/lib/platform/convergence-os/seed/capabilities";
import { prisma } from "@/lib/prisma";

export async function seedOwnershipRegistry() {
  let upserted = 0;
  for (const domain of CANONICAL_DOMAIN_SEEDS.slice(0, 20)) {
    await prisma.ownershipRecord.upsert({
      where: {
        subjectType_subjectKey: {
          subjectType: "canonical_domain",
          subjectKey: domain.domainKey,
        },
      },
      create: {
        subjectType: "canonical_domain",
        subjectKey: domain.domainKey,
        primaryOwner: domain.owningProgramme ?? "platform_assurance",
        organisation: "MapAble",
        knowledgeLocation: domain.authoritativePath ?? "docs/convergence-os",
        successionState: domain.owningProgramme ? "ok" : "at_risk",
      },
      update: {
        primaryOwner: domain.owningProgramme ?? "platform_assurance",
        successionState: domain.owningProgramme ? "ok" : "at_risk",
      },
    });
    upserted += 1;
  }

  for (const cap of CAPABILITY_SEEDS.slice(0, 15)) {
    await prisma.ownershipRecord.upsert({
      where: {
        subjectType_subjectKey: {
          subjectType: "capability",
          subjectKey: cap.capabilityKey,
        },
      },
      create: {
        subjectType: "capability",
        subjectKey: cap.capabilityKey,
        primaryOwner: cap.owner ?? cap.canonicalOwner ?? "unassigned",
        organisation: "MapAble",
        successionState: cap.owner ? "ok" : "gap",
      },
      update: {
        primaryOwner: cap.owner ?? cap.canonicalOwner ?? "unassigned",
        successionState: cap.owner ? "ok" : "gap",
      },
    });
    upserted += 1;
  }

  await prisma.ownershipGapFinding.upsert({
    where: { findingKey: "gap_unowned_flag_example" },
    create: {
      findingKey: "gap_unowned_flag_example",
      title: "Flags without owner metadata (advisory)",
      subjectType: "feature_flag",
      subjectKey: "MAPABLE_*",
      severity: "warning",
      evidence: "Scan twin flag manifest for missing owner (C-021)",
    },
    update: {
      title: "Flags without owner metadata (advisory)",
      evidence: "Scan twin flag manifest for missing owner (C-021)",
    },
  });

  return { upserted, gaps: 1 };
}

export async function seedFitnessFunctions() {
  const functions = [
    {
      fitnessKey: "single_canonical_writer",
      title: "Single canonical writer per concept",
      description: "No duplicate authoritative writers (C-001)",
    },
    {
      fitnessKey: "no_ai_direct_consequential_writes",
      title: "No AI tool direct consequential writes",
      description: "C-003 / C-005",
    },
    {
      fitnessKey: "action_endpoints_emit_audit",
      title: "Action endpoints emit AuditEvent",
      description: "C-014",
    },
    {
      fitnessKey: "flags_owned",
      title: "Feature flags have owners",
      description: "C-021",
    },
    {
      fitnessKey: "public_places_use_access_place",
      title: "Public places use AccessPlace",
      description: "C-011",
    },
    {
      fitnessKey: "production_claims_have_evidence",
      title: "Production claims have evidence",
      description: "C-025",
    },
  ];

  for (const fn of functions) {
    const row = await prisma.architectureFitnessFunction.upsert({
      where: { fitnessKey: fn.fitnessKey },
      create: { ...fn, advisoryOnly: true },
      update: {
        title: fn.title,
        description: fn.description,
        advisoryOnly: true,
      },
    });

    await prisma.fitnessFunctionResult.create({
      data: {
        fitnessId: row.id,
        passed: true,
        details: "Advisory baseline seed — not a production gate",
      },
    });
  }

  return { functions: functions.length };
}

export async function seedGoldenJourneys() {
  const journey = await prisma.goldenJourney.upsert({
    where: { journeyKey: "gj_passport_doorway_transport" },
    create: {
      journeyKey: "gj_passport_doorway_transport",
      title: "Passport doorway → Transport compatibility",
      description:
        "Synthetic golden journey: participant doorway requirement disclosed via Vault, purpose-checked by RightsOS, evaluated by Transport.",
      domainsJson: [
        "access.passport",
        "vault.disclosure_view",
        "rights.purpose",
        "transport.trip",
      ],
      apisJson: ["/api/convergence/lineage"],
      modelsJson: ["AccessPassport", "AuditEvent"],
      flagsJson: ["MAPABLE_CONVERGENCE_GOLDEN_JOURNEY_ENABLED"],
      rollbackNotes: "Disable journey flag; no schema rollback required",
    },
    update: {
      title: "Passport doorway → Transport compatibility",
      description:
        "Synthetic golden journey: participant doorway requirement disclosed via Vault, purpose-checked by RightsOS, evaluated by Transport.",
    },
  });

  await prisma.goldenJourneyStep.deleteMany({ where: { journeyId: journey.id } });
  await prisma.goldenJourneyStep.createMany({
    data: [
      {
        journeyId: journey.id,
        stepOrder: 1,
        title: "Select doorway requirement",
        expectation: "AccessPassport field set (synthetic)",
      },
      {
        journeyId: journey.id,
        stepOrder: 2,
        title: "Disclose via Vault view",
        expectation: "Field-scoped disclosure",
      },
      {
        journeyId: journey.id,
        stepOrder: 3,
        title: "RightsOS purpose decision",
        expectation: "Purpose-bound approval",
      },
      {
        journeyId: journey.id,
        stepOrder: 4,
        title: "Transport compatibility",
        expectation: "Deterministic evaluation + audit receipt",
      },
    ],
  });

  return { journeys: 1, steps: 4 };
}

export async function seedFederation() {
  const repos = [
    {
      repoKey: "mapableau-new",
      name: "MapAbleAU (primary)",
      url: "https://github.com/ausdisau/mapableau-new",
      role: "primary",
      contracts: [
        {
          contractKey: "conv_os_manifest_v1",
          domain: "convergence",
          version: "0.2.0",
          status: "draft",
          notes: "Read-only federated manifest exchange",
        },
      ],
    },
    {
      repoKey: "mapable-docs",
      name: "MapAble docs (related)",
      url: null,
      role: "related",
      contracts: [
        {
          contractKey: "public_claims_mirror",
          domain: "claims",
          version: "0.1.0",
          status: "draft",
          notes: "Claims must not exceed primary evidence (C-025)",
        },
      ],
    },
  ];

  for (const repo of repos) {
    const row = await prisma.federatedRepository.upsert({
      where: { repoKey: repo.repoKey },
      create: {
        repoKey: repo.repoKey,
        name: repo.name,
        url: repo.url,
        role: repo.role,
      },
      update: {
        name: repo.name,
        url: repo.url,
        role: repo.role,
      },
    });

    for (const c of repo.contracts) {
      await prisma.federatedContract.upsert({
        where: {
          repoId_contractKey: { repoId: row.id, contractKey: c.contractKey },
        },
        create: { ...c, repoId: row.id },
        update: {
          domain: c.domain,
          version: c.version,
          status: c.status,
          notes: c.notes,
        },
      });
    }
  }

  await prisma.complexityBudgetSnapshot.upsert({
    where: { snapshotKey: "iteration2_baseline" },
    create: {
      snapshotKey: "iteration2_baseline",
      dimensionsJson: {
        domain: { score: "elevated", note: "many interim domains" },
        data: { score: "elevated", note: "large Prisma surface" },
        integration: { score: "moderate" },
        runtime: { score: "moderate" },
        authority: { score: "elevated" },
        operational: { score: "moderate", note: "flag sprawl risk" },
      },
      breachesJson: [
        {
          dimension: "domain",
          rule: "new_canonical_model_requires_review",
          advisory: true,
        },
      ],
    },
    update: {
      dimensionsJson: {
        domain: { score: "elevated", note: "many interim domains" },
        data: { score: "elevated", note: "large Prisma surface" },
        integration: { score: "moderate" },
        runtime: { score: "moderate" },
        authority: { score: "elevated" },
        operational: { score: "moderate", note: "flag sprawl risk" },
      },
    },
  });

  await prisma.runtimeComponent.upsert({
    where: { componentKey: "web_next_app" },
    create: {
      componentKey: "web_next_app",
      name: "Next.js web application",
      environment: "production",
      owner: "platform",
      dataClassification: "live",
      healthCheck: "/api/health",
      credentialsPresent: true,
      metadataJson: { valuesNeverStored: true },
    },
    update: {
      name: "Next.js web application",
      healthCheck: "/api/health",
    },
  });

  return { repos: repos.length };
}
