import { prisma } from "@/lib/prisma";
import {
  PROGRAMME_IDS,
  type ProgrammeId,
} from "@/lib/programmes/safety-invariants";

export type ProgrammeRegistryView = {
  id: ProgrammeId | string;
  label: string;
  enabled: boolean;
  sortOrder: number;
};

const PROGRAMME_LABELS: Record<ProgrammeId, string> = {
  pathways: "Pathways",
  transition_home: "Transition Home",
  kids: "Kids",
  lifespan: "Lifespan",
  home: "Home",
  at_lifecycle: "AT Lifecycle",
  work_retention: "Work Retention",
  carer_continuity: "Carer Continuity",
  regional_capacity: "Regional Capacity",
  rights_navigator: "Rights Navigator",
  integration_foundry: "Integration Foundry",
  data_cooperative: "Data Cooperative",
};

/** Compile-time seed list used when DB is unavailable (tests / offline). */
export function getCompileTimeProgrammeRegistry(): ProgrammeRegistryView[] {
  return PROGRAMME_IDS.map((id, sortOrder) => ({
    id,
    label: PROGRAMME_LABELS[id],
    enabled: true,
    sortOrder,
  }));
}

export async function listProgrammeRegistry(options?: {
  enabledOnly?: boolean;
}): Promise<ProgrammeRegistryView[]> {
  try {
    const rows = await prisma.programmeRegistryEntry.findMany({
      where: options?.enabledOnly ? { enabled: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) {
      return getCompileTimeProgrammeRegistry().filter((r) =>
        options?.enabledOnly ? r.enabled : true,
      );
    }
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      enabled: r.enabled,
      sortOrder: r.sortOrder,
    }));
  } catch {
    return getCompileTimeProgrammeRegistry().filter((r) =>
      options?.enabledOnly ? r.enabled : true,
    );
  }
}

export function isKnownProgrammeId(id: string): id is ProgrammeId {
  return (PROGRAMME_IDS as string[]).includes(id);
}

export function assertKnownProgrammeId(id: string): asserts id is ProgrammeId {
  if (!isKnownProgrammeId(id)) {
    throw new Error(`Unknown programme id: ${id}`);
  }
}

/** Expected seed ids for parity tests (order-sensitive). */
export function expectedProgrammeRegistrySeedIds(): string[] {
  return [...PROGRAMME_IDS];
}
