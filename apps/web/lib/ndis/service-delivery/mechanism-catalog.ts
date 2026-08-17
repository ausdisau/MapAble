import type {
  NdisDeliveryAuthorizationType,
  NdisPaymentRoute,
} from "@prisma/client";

import type { DeliveryMechanismDefinition } from "@/lib/ndis/service-delivery/types";

export const NDIS_SERVICE_DELIVERY_MECHANISMS: DeliveryMechanismDefinition[] = [
  {
    code: "face_to_face",
    label: "Face-to-face",
    description: "Support delivered in person with the participant present.",
    claimTypes: ["standard"],
  },
  {
    code: "non_face_to_face",
    label: "Non face-to-face",
    description: "Remote support that is not a telehealth session (e.g. phone check-in).",
    claimTypes: ["non_face_to_face", "standard"],
  },
  {
    code: "telehealth",
    label: "Telehealth",
    description: "Live video or audio clinical or therapeutic session.",
    claimTypes: ["non_face_to_face", "standard"],
  },
  {
    code: "phone",
    label: "Phone",
    description: "Support delivered by telephone.",
    claimTypes: ["non_face_to_face", "standard"],
  },
  {
    code: "group",
    label: "Group",
    description: "Support delivered to a group of participants.",
    claimTypes: ["standard"],
  },
  {
    code: "centre_based",
    label: "Centre-based",
    description: "Support delivered at a provider centre or day program.",
    claimTypes: ["standard"],
  },
  {
    code: "remote_monitoring",
    label: "Remote monitoring",
    description: "Technology-enabled monitoring or check-in without direct contact.",
    claimTypes: ["non_face_to_face", "standard"],
  },
  {
    code: "transport",
    label: "Transport",
    description: "Participant transport as a distinct delivered support.",
    claimTypes: ["standard"],
  },
];

export function listDeliveryMechanisms() {
  return NDIS_SERVICE_DELIVERY_MECHANISMS;
}

export function getDeliveryMechanism(
  code: DeliveryMechanismDefinition["code"]
): DeliveryMechanismDefinition | undefined {
  return NDIS_SERVICE_DELIVERY_MECHANISMS.find((m) => m.code === code);
}

/** Default authorization type expected for each NDIS payment route. */
export function defaultAuthorizationTypeForRoute(
  route: NdisPaymentRoute
): NdisDeliveryAuthorizationType {
  switch (route) {
    case "self_managed":
      return "participant_self_managed";
    case "plan_managed":
      return "plan_manager_approval";
    case "ndia_managed":
      return "ndia_service_booking";
    default:
      return "service_agreement";
  }
}
