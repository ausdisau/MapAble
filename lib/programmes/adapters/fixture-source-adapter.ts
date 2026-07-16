import type {
  ProgrammeSourceAdapter,
  ProgrammeSourceRecordView,
  ProgrammeSourceSearchInput,
} from "@/lib/programmes/contracts/programme-source-adapter";

const MOCK_SOURCES: ProgrammeSourceRecordView[] = [
  {
    id: "mock-source-ndis-act",
    sourceOrganisation: "Australian Government",
    jurisdiction: "AU-Commonwealth",
    title: "National Disability Insurance Scheme Act 2013",
    sourceType: "legislation",
    version: "2024-01",
    effectiveDate: new Date("2013-07-01"),
    authorityStatus: "authoritative",
    affectedProgrammes: ["pathways", "lifespan"],
    isSuperseded: false,
  },
  {
    id: "mock-source-ndis-guide",
    sourceOrganisation: "NDIA",
    jurisdiction: "AU-Commonwealth",
    title: "NDIS Operational Guidelines — Access",
    sourceType: "government_guidance",
    version: "2025-03-draft",
    authorityStatus: "draft",
    affectedProgrammes: ["pathways"],
    isSuperseded: false,
  },
];

export class FixtureProgrammeSourceAdapter implements ProgrammeSourceAdapter {
  readonly isMock = true;

  async searchSources(
    input: ProgrammeSourceSearchInput,
  ): Promise<ProgrammeSourceRecordView[]> {
    return MOCK_SOURCES.filter((source) => {
      if (input.jurisdiction && source.jurisdiction !== input.jurisdiction) {
        return false;
      }
      if (
        input.programmeId &&
        !source.affectedProgrammes.includes(input.programmeId)
      ) {
        return false;
      }
      if (
        input.query &&
        !source.title.toLowerCase().includes(input.query.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }

  async getSourceById(id: string): Promise<ProgrammeSourceRecordView | null> {
    return MOCK_SOURCES.find((source) => source.id === id) ?? null;
  }

  async getSupersessionWarning(id: string): Promise<{
    superseded: boolean;
    message?: string;
  }> {
    const source = await this.getSourceById(id);
    if (!source) {
      return { superseded: false };
    }
    if (source.authorityStatus === "draft") {
      return {
        superseded: false,
        message: "MOCK: Draft source — requires human review before use",
      };
    }
    return { superseded: source.isSuperseded };
  }
}

export function getFixtureProgrammeSourceAdapter(): FixtureProgrammeSourceAdapter {
  return new FixtureProgrammeSourceAdapter();
}
