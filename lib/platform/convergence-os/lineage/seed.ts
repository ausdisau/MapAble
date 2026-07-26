import { prisma } from "@/lib/prisma";

/**
 * Synthetic Passport doorway lineage sample (C-018 labelled).
 * No production participant data.
 */
export async function seedSyntheticPassportDoorwayLineage(): Promise<{
  nodes: number;
  edges: number;
  authorityChains: number;
}> {
  const nodes = [
    {
      nodeKey: "synth.doorway_requirement",
      label: "Doorway width requirement (synthetic)",
      dataClass: "access_passport",
      fieldPath: "AccessPassport.minimumDoorwayWidth",
      domainKey: "access.passport",
    },
    {
      nodeKey: "synth.passport_field",
      label: "AccessPassport.minimumDoorwayWidth",
      dataClass: "access_passport",
      fieldPath: "AccessPassport.minimumDoorwayWidth",
      domainKey: "access.passport",
    },
    {
      nodeKey: "synth.vault_view",
      label: "Vault selective disclosure view (synthetic)",
      dataClass: "participant_authority",
      fieldPath: "VaultDisclosureView.fields",
      domainKey: "vault.disclosure_view",
    },
    {
      nodeKey: "synth.rights_decision",
      label: "RightsOS purpose decision (synthetic)",
      dataClass: "consent",
      fieldPath: "RightsPolicyDecision.purpose",
      domainKey: "rights.purpose",
    },
    {
      nodeKey: "synth.transport_compat",
      label: "Transport doorway compatibility check",
      dataClass: "transport",
      fieldPath: "TransportTrip.accessibilityConstraints",
      domainKey: "transport.trip",
    },
    {
      nodeKey: "synth.recovery_proposal",
      label: "Recovery proposal (synthetic)",
      dataClass: "participant_authority",
      fieldPath: "AuraActionProposal.hash",
      domainKey: "missions.care_os",
    },
    {
      nodeKey: "synth.execution_receipt",
      label: "Execution receipt / AuditEvent",
      dataClass: "audit",
      fieldPath: "AuditEvent.id",
      domainKey: "governance.audit",
    },
  ] as const;

  for (const node of nodes) {
    await prisma.dataLineageNode.upsert({
      where: { nodeKey: node.nodeKey },
      create: {
        ...node,
        synthetic: true,
        metadataJson: { fixture: true, wave: 11, label: "C-018" },
      },
      update: {
        label: node.label,
        dataClass: node.dataClass,
        fieldPath: node.fieldPath,
        domainKey: node.domainKey,
        synthetic: true,
      },
    });
  }

  const edges = [
    {
      edgeKey: "synth.doorway_to_passport",
      fromNodeKey: "synth.doorway_requirement",
      toNodeKey: "synth.passport_field",
      transformation: "participant_selected_requirement",
      policyRef: "C-010",
    },
    {
      edgeKey: "synth.passport_to_vault",
      fromNodeKey: "synth.passport_field",
      toNodeKey: "synth.vault_view",
      transformation: "field_scoped_disclosure",
      policyRef: "C-008",
    },
    {
      edgeKey: "synth.vault_to_rights",
      fromNodeKey: "synth.vault_view",
      toNodeKey: "synth.rights_decision",
      transformation: "purpose_bound_disclosure",
      policyRef: "C-007",
    },
    {
      edgeKey: "synth.rights_to_transport",
      fromNodeKey: "synth.rights_decision",
      toNodeKey: "synth.transport_compat",
      transformation: "compatibility_evaluation",
      policyRef: "C-013",
    },
    {
      edgeKey: "synth.transport_to_proposal",
      fromNodeKey: "synth.transport_compat",
      toNodeKey: "synth.recovery_proposal",
      transformation: "proposal_generation",
      policyRef: "C-003",
    },
    {
      edgeKey: "synth.proposal_to_receipt",
      fromNodeKey: "synth.recovery_proposal",
      toNodeKey: "synth.execution_receipt",
      transformation: "deterministic_execution_receipt",
      policyRef: "C-014",
    },
  ] as const;

  for (const edge of edges) {
    await prisma.dataLineageEdge.upsert({
      where: { edgeKey: edge.edgeKey },
      create: edge,
      update: {
        transformation: edge.transformation,
        policyRef: edge.policyRef,
      },
    });
  }

  const chain = await prisma.authorityChain.upsert({
    where: { chainKey: "synth.passport_doorway_authority" },
    create: {
      chainKey: "synth.passport_doorway_authority",
      title: "Synthetic Passport doorway authority chain",
      participantSyntheticId: "fixture-participant-001",
      purpose: "transport_doorway_compatibility",
      status: "complete",
      gapFindingsJson: [],
    },
    update: {
      title: "Synthetic Passport doorway authority chain",
      status: "complete",
      gapFindingsJson: [],
    },
  });

  await prisma.authorityChainStep.deleteMany({ where: { chainId: chain.id } });

  const steps = [
    {
      stepOrder: 1,
      stepType: "participant_approval",
      actor: "fixture-participant-001",
      scope: "disclose_doorway_width",
      outcome: "granted",
      evidence: "synthetic approval record",
    },
    {
      stepOrder: 2,
      stepType: "proposal_hash",
      actor: "aura_proposal_service",
      scope: "transport_compat_check",
      outcome: "hashed",
      evidence: "sha256:fixture",
    },
    {
      stepOrder: 3,
      stepType: "execution_approval",
      actor: "fixture-care-coordinator",
      scope: "run_compat_check",
      outcome: "approved",
      evidence: "human approval",
    },
    {
      stepOrder: 4,
      stepType: "capability_lease",
      actor: "rights_os",
      scope: "read_passport_doorway",
      outcome: "leased",
      evidence: "purpose-bound lease",
    },
    {
      stepOrder: 5,
      stepType: "application_service",
      actor: "transport_compat_service",
      scope: "evaluate",
      outcome: "executed",
      evidence: "deterministic service",
    },
    {
      stepOrder: 6,
      stepType: "execution_receipt",
      actor: "audit_outbox",
      scope: "AuditEvent",
      outcome: "recorded",
      evidence: "synthetic AuditEvent id",
    },
    {
      stepOrder: 7,
      stepType: "postcondition",
      actor: "transport_compat_service",
      scope: "result_available",
      outcome: "satisfied",
      evidence: "compat=true (fixture)",
    },
  ];

  await prisma.authorityChainStep.createMany({
    data: steps.map((s) => ({ ...s, chainId: chain.id })),
  });

  // Gap example chain (incomplete)
  const gapChain = await prisma.authorityChain.upsert({
    where: { chainKey: "synth.authority_gap_example" },
    create: {
      chainKey: "synth.authority_gap_example",
      title: "Synthetic authority gap — action without receipt",
      participantSyntheticId: "fixture-participant-002",
      purpose: "demo_gap_detection",
      status: "gap",
      gapFindingsJson: [
        {
          kind: "missing_receipt",
          detail: "Execution step present without AuditEvent receipt",
        },
      ],
    },
    update: {
      status: "gap",
      gapFindingsJson: [
        {
          kind: "missing_receipt",
          detail: "Execution step present without AuditEvent receipt",
        },
      ],
    },
  });

  await prisma.authorityChainStep.deleteMany({ where: { chainId: gapChain.id } });
  await prisma.authorityChainStep.createMany({
    data: [
      {
        chainId: gapChain.id,
        stepOrder: 1,
        stepType: "participant_approval",
        actor: "fixture-participant-002",
        scope: "demo",
        outcome: "granted",
      },
      {
        chainId: gapChain.id,
        stepOrder: 2,
        stepType: "application_service",
        actor: "demo_service",
        scope: "write",
        outcome: "executed",
        evidence: "missing receipt by design (fixture)",
      },
    ],
  });

  return {
    nodes: nodes.length,
    edges: edges.length,
    authorityChains: 2,
  };
}
