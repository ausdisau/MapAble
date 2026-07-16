import type {
  HumanNavigatorAdapter,
  NavigatorAssignmentPreview,
  NavigatorProfileView,
  NavigatorSearchInput,
} from "@/lib/programmes/contracts/human-navigator-adapter";

const MOCK_NAVIGATORS: NavigatorProfileView[] = [
  {
    id: "mock-nav-1",
    displayName: "Alex Chen",
    specialisms: ["employment", "transport", "home_support"],
    regions: ["NSW-Sydney"],
    languages: ["en-AU", "zh-CN"],
    communicationModes: ["video", "phone", "plain_language"],
    visibility: "public",
    organisationName: "Community Navigator Co-op",
  },
  {
    id: "mock-nav-2",
    displayName: "Jordan Smith",
    specialisms: ["ndis_pathways", "advocacy"],
    regions: ["NSW-Regional"],
    languages: ["en-AU"],
    communicationModes: ["in_person", "Auslan"],
    visibility: "community",
  },
];

export class FixtureHumanNavigatorAdapter implements HumanNavigatorAdapter {
  readonly isMock = true;

  async searchNavigators(
    input: NavigatorSearchInput,
  ): Promise<NavigatorProfileView[]> {
    return MOCK_NAVIGATORS.filter((navigator) => {
      if (
        input.specialism &&
        !navigator.specialisms.includes(input.specialism)
      ) {
        return false;
      }
      if (
        input.regionCode &&
        !navigator.regions.some((r) => r.includes(input.regionCode!))
      ) {
        return false;
      }
      if (
        input.languageCode &&
        !navigator.languages.includes(input.languageCode)
      ) {
        return false;
      }
      return true;
    });
  }

  async previewAssignment(input: {
    participantId: string;
    navigatorId: string;
    requestedFields: string[];
  }): Promise<NavigatorAssignmentPreview> {
    const sensitive = [
      "diagnosis",
      "financial_records",
      "full_profile",
      "unrelated_missions",
      "health_information",
    ];

    return {
      navigatorId: input.navigatorId,
      sharedFields: input.requestedFields.filter((f) => !sensitive.includes(f)),
      excludedFields: sensitive,
      requiresParticipantApproval: true,
    };
  }
}

export function getFixtureHumanNavigatorAdapter(): FixtureHumanNavigatorAdapter {
  return new FixtureHumanNavigatorAdapter();
}
