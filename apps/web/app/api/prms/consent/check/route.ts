import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { apiForbidden } from "@/lib/auth/guards";
import { checkConsent } from "@/lib/consent/consent-service";
import { MOCK_CONSENT, isMockParticipant } from "@/lib/prms/mockPrmsData";
import {
  assertCanAccessParticipantData,
  ParticipantAccessError,
} from "@/lib/prms/participant-access";
import type { ConsentScope as PrmsConsentScope } from "@/lib/prms/types";
import type { ConsentScope } from "@/types/mapable";

const SCOPE_MAP: Record<string, PrmsConsentScope> = {
  transport: "transport_sharing",
  profile: "profile_sharing",
  billing: "billing_plan_manager",
  employment: "employment_adjustments",
  medical: "medical_documents",
};

const PURPOSE_TO_CONSENT_SCOPE: Record<string, ConsentScope> = {
  transport: "transport.trip_access",
  profile: "profile.read",
  billing: "billing.read",
  employment: "profile.read",
  medical: "profile.read",
};

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await request.json();
    const participantId =
      typeof body.participantId === "string" ? body.participantId : user.id;
    const purpose =
      typeof body.purpose === "string" ? body.purpose : "profile";

    try {
      await assertCanAccessParticipantData(user, participantId);
    } catch (e) {
      if (e instanceof ParticipantAccessError) {
        return apiForbidden(e.message);
      }
      throw e;
    }

    const scope = SCOPE_MAP[purpose] ?? "profile_sharing";

    if (!isMockParticipant(participantId)) {
      const consentScope =
        PURPOSE_TO_CONSENT_SCOPE[purpose] ?? "profile.read";
      const allowed = await checkConsent({
        subjectUserId: participantId,
        scope: consentScope,
        grantedToUserId: user.id !== participantId ? user.id : undefined,
      });
      return NextResponse.json({
        allowed,
        status: allowed ? "granted" : "needs_confirmation",
        scope,
        reason: allowed
          ? "Consent granted for this purpose."
          : `Consent for ${scope} is not granted.`,
      });
    }

    const record = MOCK_CONSENT.records.find((r) => r.scope === scope);

    if (!record || record.status !== "granted") {
      return NextResponse.json({
        allowed: false,
        status: "needs_confirmation",
        scope,
        reason: `Consent for ${scope} is not granted. Participant must approve sharing.`,
      });
    }

    if (MOCK_CONSENT.openConflicts.includes(scope)) {
      return NextResponse.json({
        allowed: false,
        status: "blocked",
        scope,
        reason: "Consent conflict — update consent settings first.",
      });
    }

    return NextResponse.json({
      allowed: true,
      status: "granted",
      scope,
      reason: "Consent granted for this purpose.",
    });
  } catch {
    return NextResponse.json(
      { error: "Consent check failed." },
      { status: 500 }
    );
  }
}
