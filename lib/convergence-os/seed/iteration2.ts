import { assertNoAutoMutation } from "@/lib/config/convergence-os";
import { createAgentPreflightContract } from "@/lib/convergence-os/agent/preflight";
import { seedCounterfactualSimulations } from "@/lib/convergence-os/blast/simulator";
import { seedArchitectureConstitution } from "@/lib/convergence-os/constitution/seed";
import { validateConstitutionAdvisory } from "@/lib/convergence-os/constitution/validate";
import { seedSyntheticPassportDoorwayLineage } from "@/lib/convergence-os/lineage/seed";
import {
  seedDriftFindings,
  seedEnvironmentParity,
  seedSupplyChain,
} from "@/lib/convergence-os/ops/drift-parity-supply";
import {
  seedOwnershipRegistry,
  seedFitnessFunctions,
  seedGoldenJourneys,
  seedFederation,
} from "@/lib/convergence-os/ops/ownership-fitness-federation";
import { runFoundationTrainRehearsal } from "@/lib/convergence-os/rehearsal/lab";
import { runTwinScan } from "@/lib/convergence-os/scans/twin-scan";
import { seedSemanticCandidates } from "@/lib/convergence-os/semantic/resolver";

/**
 * Seed Iteration 2 registries (advisory / fixture-backed).
 * Does not mutate GitHub, merge branches, or apply production migrations.
 */
export async function seedIteration2(options?: {
  actorUserId?: string | null;
  actorRole?: string | null;
  runTwin?: boolean;
}) {
  assertNoAutoMutation();

  const twin = options?.runTwin
    ? await runTwinScan({
        actorUserId: options.actorUserId,
        actorRole: options.actorRole,
      })
    : null;

  const constitution = await seedArchitectureConstitution();
  const constitutionValidation = await validateConstitutionAdvisory();
  const semantic = await seedSemanticCandidates();
  const lineage = await seedSyntheticPassportDoorwayLineage();
  const blast = await seedCounterfactualSimulations(twin?.snapshotId ?? null);
  const rehearsal = await runFoundationTrainRehearsal({
    snapshotId: twin?.snapshotId ?? null,
  });
  const drift = await seedDriftFindings(twin?.snapshotId ?? null);
  const parity = await seedEnvironmentParity();
  const supply = await seedSupplyChain();
  const ownership = await seedOwnershipRegistry();
  const fitness = await seedFitnessFunctions();
  const journeys = await seedGoldenJourneys();
  const federation = await seedFederation();

  const preflight = await createAgentPreflightContract({
    contractKey: "preflight_iteration2_example",
    objective:
      "Example preflight for ConvergenceOS Iteration 2 advisory surfaces",
    nonGoals: "No auto-merge, no production migration apply, no secret values",
    canonicalModels: ["RepositorySnapshot", "ArchitectureRule"],
    reusableServices: ["lib/convergence-os/*"],
    prohibitedConcepts: ["parallel_User", "parallel_Consent"],
    allowedPaths: ["lib/convergence-os/", "app/admin/convergence/", "docs/convergence-os/"],
    migrationsPermitted: false,
    testsRequired: ["tests/convergence-os/*"],
    authorityCeiling: "propose_only",
    releaseMode: "audit",
    rollbackExpectation: "Revert PR; flags default false",
    answers: {
      canonicalDomains: "convergence.control_plane",
      equivalentOpenPr: "no",
      duplicateModel: "no",
      migrationOrderUnresolved: "no",
      authorityExpansion: "no",
      sensitivePathway: "no",
      privacyClassUnclear: "no",
      productionClaimChange: "no",
    },
  });

  return {
    twin,
    constitution,
    constitutionValidation,
    semantic,
    lineage,
    blastCount: blast.length,
    rehearsal,
    drift,
    parity,
    supply,
    ownership,
    fitness,
    journeys,
    federation,
    preflight: {
      id: preflight.id,
      status: preflight.status,
      stopCount: preflight.stopConditions.length,
    },
    autoMergeEnabled: false,
    mutatesRealBranches: false,
  };
}
