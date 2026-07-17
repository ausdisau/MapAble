import { describe, expect, it, vi } from "vitest";

import * as ndisServiceDeliveryConfig from "@/lib/config/ndis-service-delivery";
import { validateDeliveryAuthorizationForClaim } from "@/lib/ndis/service-delivery/delivery-event-service";
import {
  defaultAuthorizationTypeForRoute,
  getDeliveryMechanism,
  listDeliveryMechanisms,
} from "@/lib/ndis/service-delivery/mechanism-catalog";

describe("NDIS service delivery mechanism catalog", () => {
  it("lists eight delivery mechanisms", () => {
    expect(listDeliveryMechanisms()).toHaveLength(8);
  });

  it("includes face-to-face with standard claim type", () => {
    const f2f = getDeliveryMechanism("face_to_face");
    expect(f2f?.label).toBe("Face-to-face");
    expect(f2f?.claimTypes).toContain("standard");
  });

  it("maps payment routes to authorization types", () => {
    expect(defaultAuthorizationTypeForRoute("self_managed")).toBe(
      "participant_self_managed"
    );
    expect(defaultAuthorizationTypeForRoute("plan_managed")).toBe(
      "plan_manager_approval"
    );
    expect(defaultAuthorizationTypeForRoute("ndia_managed")).toBe(
      "ndia_service_booking"
    );
  });
});

describe("delivery authorization validation", () => {
  it("returns no issues when mechanism tracking is disabled", async () => {
    vi.spyOn(
      ndisServiceDeliveryConfig,
      "isNdisServiceDeliveryMechanismEnabled"
    ).mockReturnValue(false);

    const issues = await validateDeliveryAuthorizationForClaim({
      participantId: "p1",
      providerOrgId: "org1",
      paymentRoute: "ndia_managed",
      deliveryMechanism: "face_to_face",
      serviceDate: new Date(),
    });
    expect(issues).toEqual([]);
  });
});
