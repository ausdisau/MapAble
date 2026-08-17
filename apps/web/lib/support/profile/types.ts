export type SupportProfileSectionItem = {
  label: string;
  detail: string;
};

export type SupportProfileEscalation = {
  primaryContact?: string;
  secondaryContact?: string;
  whenToEscalate?: string;
  emergencyInstructions?: string;
};

export type SupportProfileSections = {
  routinesJson: SupportProfileSectionItem[];
  preferencesJson: SupportProfileSectionItem[];
  boundariesJson: SupportProfileSectionItem[];
  escalationJson: SupportProfileEscalation;
};

export function defaultSupportProfileSections(): SupportProfileSections {
  return {
    routinesJson: [],
    preferencesJson: [],
    boundariesJson: [],
    escalationJson: {},
  };
}

export function mergeSupportProfileSections(
  current: SupportProfileSections,
  patch: Partial<SupportProfileSections>
): SupportProfileSections {
  return {
    routinesJson: patch.routinesJson ?? current.routinesJson,
    preferencesJson: patch.preferencesJson ?? current.preferencesJson,
    boundariesJson: patch.boundariesJson ?? current.boundariesJson,
    escalationJson: patch.escalationJson ?? current.escalationJson,
  };
}

export function parseSupportProfileSections(record: {
  routinesJson: unknown;
  preferencesJson: unknown;
  boundariesJson: unknown;
  escalationJson: unknown;
}): SupportProfileSections {
  const asItems = (value: unknown): SupportProfileSectionItem[] =>
    Array.isArray(value)
      ? value.filter(
          (item): item is SupportProfileSectionItem =>
            typeof item === "object" &&
            item !== null &&
            "label" in item &&
            "detail" in item
        )
      : [];

  const escalation =
    record.escalationJson &&
    typeof record.escalationJson === "object" &&
    !Array.isArray(record.escalationJson)
      ? (record.escalationJson as SupportProfileEscalation)
      : {};

  return {
    routinesJson: asItems(record.routinesJson),
    preferencesJson: asItems(record.preferencesJson),
    boundariesJson: asItems(record.boundariesJson),
    escalationJson: escalation,
  };
}

export function participantSafeSupportProfileSummary(
  sections: SupportProfileSections
) {
  return {
    routineCount: sections.routinesJson.length,
    preferenceCount: sections.preferencesJson.length,
    boundaryCount: sections.boundariesJson.length,
    hasEscalation: Boolean(
      sections.escalationJson.primaryContact ||
        sections.escalationJson.whenToEscalate
    ),
  };
}
