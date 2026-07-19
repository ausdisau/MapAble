import { adaptiveAccessConfig } from "@/lib/config/adaptive-access";

import {
  assertRequiredTermsPreserved,
  resolvePresentationPolicy,
} from "../presentation-policy";
import type {
  FamiliarInterfaceState,
  ParticipantAccessProfile,
  SurfaceAdapterResult,
} from "../types";

export type ServiceAgreementReviewPresentation = SurfaceAdapterResult & {
  oneQuestionAtATime: boolean;
  requiredTermsCheck: ReturnType<typeof assertRequiredTermsPreserved>;
};

/**
 * Service agreement review — may pace questions; must retain required terms.
 */
export function adaptServiceAgreementReview(input: {
  profile: ParticipantAccessProfile | null;
  familiarInterface?: FamiliarInterfaceState | null;
  agreementText: string;
  renderedText: string;
  requiredTerms: string[];
}): ServiceAgreementReviewPresentation {
  if (!adaptiveAccessConfig.runtimeEnabled) {
    return {
      surface: "service_agreement_review",
      policy: null,
      applied: false,
      oneQuestionAtATime: false,
      requiredTermsCheck: assertRequiredTermsPreserved({
        originalText: input.agreementText,
        renderedText: input.renderedText,
        requiredTerms: input.requiredTerms,
      }),
    };
  }

  const policy = resolvePresentationPolicy({
    route: "/agreements/review",
    component: "ServiceAgreementReview",
    profile: input.profile,
    deviceCapability: {
      keyboard: true,
      screenReaderLikely: false,
      switchAccess: false,
      voiceControl: false,
      reducedMotionOs: false,
    },
    accessibilitySetting: { textZoomPercent: 100, highContrast: false },
    currentTask: "review_service_agreement",
    dataSensitivity: "restricted",
    familiarInterface: input.familiarInterface ?? null,
  });

  return {
    surface: "service_agreement_review",
    policy,
    applied: policy !== null,
    oneQuestionAtATime: policy?.navigationMode === "one_question",
    requiredTermsCheck: assertRequiredTermsPreserved({
      originalText: input.agreementText,
      renderedText: input.renderedText,
      requiredTerms: input.requiredTerms,
    }),
  };
}
