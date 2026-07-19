export interface DocumentChecklistItem {
  id: string;
  label: string;
  required: boolean;
  status: "unknown" | "required" | "provided" | "not_applicable";
  sourceRecordId?: string;
}

export interface DocumentChecklistService {
  buildChecklist(input: {
    programmeId: string;
    pathwayId?: string;
    jurisdiction?: string;
  }): Promise<DocumentChecklistItem[]>;
}
