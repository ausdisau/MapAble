import type { FundingSourceType } from "@prisma/client";

import type { NdisPaymentRoute } from "@/lib/ndis/claiming/types";

export function fundingSourceToPaymentRoute(
  type: FundingSourceType | null | undefined
): NdisPaymentRoute | null {
  if (!type) return null;
  switch (type) {
    case "ndis_self_managed":
      return "self_managed";
    case "ndis_plan_managed":
      return "plan_managed";
    case "ndis_agency_managed":
      return "ndia_managed";
    default:
      return null;
  }
}

export function paymentRouteRequiresMyProviderCheck(
  route: NdisPaymentRoute
): boolean {
  return route === "ndia_managed";
}

export function paymentRouteRequiresPlanManager(route: NdisPaymentRoute): boolean {
  return route === "plan_managed";
}

export function paymentRouteUsesBulkExport(route: NdisPaymentRoute): boolean {
  return route === "ndia_managed";
}

export function paymentRouteUsesParticipantInvoice(
  route: NdisPaymentRoute
): boolean {
  return route === "self_managed";
}

export function paymentRouteUsesPlanManagerInvoice(
  route: NdisPaymentRoute
): boolean {
  return route === "plan_managed";
}
