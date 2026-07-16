export interface NavigatorSearchInput {
  regionCode?: string;
  languageCode?: string;
  specialism?: string;
  communicationMode?: string;
  visibility?: "public" | "community" | "private";
}

export interface NavigatorProfileView {
  id: string;
  displayName: string;
  specialisms: string[];
  regions: string[];
  languages: string[];
  communicationModes: string[];
  visibility: string;
  organisationName?: string;
}

export interface NavigatorAssignmentPreview {
  navigatorId: string;
  sharedFields: string[];
  excludedFields: string[];
  requiresParticipantApproval: true;
}

export interface HumanNavigatorAdapter {
  readonly isMock: boolean;
  searchNavigators(
    input: NavigatorSearchInput,
  ): Promise<NavigatorProfileView[]>;
  previewAssignment(input: {
    participantId: string;
    navigatorId: string;
    requestedFields: string[];
  }): Promise<NavigatorAssignmentPreview>;
}
