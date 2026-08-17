import { createHash } from "crypto";

import type { BillingCentreClaimGateway } from "@prisma/client";

import { isPlanManagerLiveDeliveryEnabled } from "@/lib/billing/config";
import { prisma } from "@/lib/prisma";
import type {
  ClaimBatchState,
  ClaimCancellationResult,
  ClaimStatusResult,
  ClaimSubmissionResult,
  ClaimValidationResult,
  ClaimsGateway,
} from "@/types/billing";

const SIMULATED_LABEL =
  "[SIMULATED] This claims path does not submit to the NDIA. No live claim was sent.";

const LIVE_PLAN_MANAGER_LABEL =
  "[LIVE-PLAN-MANAGER] Delivery attempted via configured plan-manager channel. Not an NDIA claim.";

/**
 * In-memory / DB-backed mock gateway. Always simulated.
 */
export class MockClaimsGateway implements ClaimsGateway {
  readonly name = "mock" as const;
  readonly simulated = true as const;

  async validate(batchId: string): Promise<ClaimValidationResult> {
    const batch = await prisma.billingClaimBatch.findUnique({
      where: { id: batchId },
      include: { items: true },
    });
    if (!batch) {
      return {
        batchId,
        valid: false,
        errors: [{ code: "BATCH_NOT_FOUND", message: "Claim batch not found" }],
        simulated: true,
      };
    }

    const errors: ClaimValidationResult["errors"] = [];
    for (const item of batch.items) {
      if (item.amountCents <= 0) {
        errors.push({
          lineId: item.id,
          code: "INVALID_AMOUNT",
          message: "Claim line amount must be positive (cents)",
        });
      }
      if (!item.supportItemCode) {
        errors.push({
          lineId: item.id,
          code: "MISSING_SUPPORT_ITEM",
          message: "Support item code is required for claiming",
        });
      }
    }

    if (batch.items.length === 0) {
      errors.push({
        code: "EMPTY_BATCH",
        message: "Claim batch has no items",
      });
    }

    return {
      batchId,
      valid: errors.length === 0,
      errors,
      simulated: true,
    };
  }

  async submit(batchId: string): Promise<ClaimSubmissionResult> {
    const validation = await this.validate(batchId);
    if (!validation.valid) {
      return {
        batchId,
        status: "REJECTED",
        simulated: true,
        message: `${SIMULATED_LABEL} Validation failed (${validation.errors.length} error(s)).`,
      };
    }

    const externalReference = `MOCK-${batchId.slice(0, 8).toUpperCase()}-${Date.now()}`;
    await prisma.billingClaimBatch.update({
      where: { id: batchId },
      data: {
        status: "SUBMITTED",
        externalReference,
        simulated: true,
        submittedAt: new Date(),
        validationJson: validation as object,
      },
    });

    return {
      batchId,
      externalReference,
      status: "SUBMITTED",
      simulated: true,
      message: `${SIMULATED_LABEL} Mock submission accepted with reference ${externalReference}.`,
    };
  }

  async getStatus(externalReference: string): Promise<ClaimStatusResult> {
    const batch = await prisma.billingClaimBatch.findFirst({
      where: { externalReference },
    });
    return {
      externalReference,
      status: (batch?.status as ClaimBatchState) ?? "SUBMITTED",
      simulated: true,
      details: SIMULATED_LABEL,
    };
  }

  async cancel(externalReference: string): Promise<ClaimCancellationResult> {
    await prisma.billingClaimBatch.updateMany({
      where: { externalReference },
      data: { status: "CANCELLED" },
    });
    return {
      externalReference,
      cancelled: true,
      simulated: true,
      message: `${SIMULATED_LABEL} Mock cancellation recorded.`,
    };
  }
}

/**
 * CSV export gateway — produces an export checksum; never contacts NDIA.
 */
export class CsvExportClaimsGateway implements ClaimsGateway {
  readonly name = "csv_export" as const;
  readonly simulated = true as const;

  async validate(batchId: string): Promise<ClaimValidationResult> {
    return new MockClaimsGateway().validate(batchId);
  }

  async submit(batchId: string): Promise<ClaimSubmissionResult> {
    const validation = await this.validate(batchId);
    if (!validation.valid) {
      return {
        batchId,
        status: "REJECTED",
        simulated: true,
        message: `${SIMULATED_LABEL} CSV export blocked by validation.`,
      };
    }

    const batch = await prisma.billingClaimBatch.findUnique({
      where: { id: batchId },
      include: { items: true },
    });
    if (!batch) {
      return {
        batchId,
        status: "REJECTED",
        simulated: true,
        message: "Batch not found",
      };
    }

    const csvBody = [
      "supportItemCode,amountCents,invoiceId",
      ...batch.items.map(
        (i) =>
          `${i.supportItemCode ?? ""},${i.amountCents},${i.invoiceId ?? ""}`
      ),
    ].join("\n");
    const checksum = createHash("sha256").update(csvBody).digest("hex");

    await prisma.billingClaimBatch.update({
      where: { id: batchId },
      data: {
        status: "EXPORTED",
        simulated: true,
        exportChecksum: checksum,
        submittedAt: new Date(),
        validationJson: { ...validation, csvBytes: csvBody.length },
      },
    });

    return {
      batchId,
      externalReference: `CSV-${checksum.slice(0, 12)}`,
      status: "EXPORTED",
      simulated: true,
      message: `${SIMULATED_LABEL} CSV export ready (checksum ${checksum.slice(0, 12)}).`,
    };
  }

  async getStatus(externalReference: string): Promise<ClaimStatusResult> {
    return {
      externalReference,
      status: "EXPORTED",
      simulated: true,
      details: SIMULATED_LABEL,
    };
  }

  async cancel(externalReference: string): Promise<ClaimCancellationResult> {
    return {
      externalReference,
      cancelled: false,
      simulated: true,
      message: `${SIMULATED_LABEL} Exported CSV batches are not cancellable via gateway; mark cancelled in UI if needed.`,
    };
  }
}

/**
 * Plan-manager delivery gateway — packages for plan manager, not NDIA API.
 * Live delivery only when BILLING_PLAN_MANAGER_LIVE=true and credentials exist.
 */
export class PlanManagerClaimsGateway implements ClaimsGateway {
  readonly name = "plan_manager" as const;

  get simulated(): boolean {
    return !isPlanManagerLiveDeliveryEnabled();
  }

  async validate(batchId: string): Promise<ClaimValidationResult> {
    return new MockClaimsGateway().validate(batchId);
  }

  async submit(batchId: string): Promise<ClaimSubmissionResult> {
    const validation = await this.validate(batchId);
    if (!validation.valid) {
      return {
        batchId,
        status: "REJECTED",
        simulated: this.simulated,
        message: `${this.simulated ? SIMULATED_LABEL : LIVE_PLAN_MANAGER_LABEL} Plan-manager pack blocked by validation.`,
      };
    }

    const live = isPlanManagerLiveDeliveryEnabled();
    const externalReference = live
      ? `PM-LIVE-${batchId.slice(0, 8).toUpperCase()}-${Date.now()}`
      : `PM-PACK-${batchId.slice(0, 8).toUpperCase()}`;

    if (live) {
      // Authenticated environment only: attempt configured webhook delivery.
      // Failures fall back to EXPORTED (pack ready) without pretending NDIA success.
      const webhook = process.env.BILLING_PLAN_MANAGER_WEBHOOK_URL;
      let deliveryOk = false;
      let deliveryError: string | undefined;
      if (webhook) {
        try {
          const batch = await prisma.billingClaimBatch.findUnique({
            where: { id: batchId },
            include: { items: true },
          });
          const res = await fetch(webhook, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...(process.env.BILLING_PLAN_MANAGER_API_KEY
                ? {
                    authorization: `Bearer ${process.env.BILLING_PLAN_MANAGER_API_KEY}`,
                  }
                : {}),
            },
            body: JSON.stringify({
              batchId,
              externalReference,
              items: batch?.items ?? [],
              simulated: false,
            }),
          });
          deliveryOk = res.ok;
          if (!res.ok) {
            deliveryError = `Plan-manager webhook returned ${res.status}`;
          }
        } catch (e) {
          deliveryError =
            e instanceof Error ? e.message : "Plan-manager webhook failed";
        }
      }

      await prisma.billingClaimBatch.update({
        where: { id: batchId },
        data: {
          status: deliveryOk ? "SUBMITTED" : "EXPORTED",
          externalReference,
          simulated: false,
          submittedAt: new Date(),
          validationJson: {
            ...validation,
            liveDelivery: deliveryOk,
            deliveryError,
          } as object,
        },
      });

      return {
        batchId,
        externalReference,
        status: deliveryOk ? "SUBMITTED" : "EXPORTED",
        simulated: false,
        message: deliveryOk
          ? `${LIVE_PLAN_MANAGER_LABEL} Pack delivered (${externalReference}).`
          : `${LIVE_PLAN_MANAGER_LABEL} Pack exported; delivery pending or failed${deliveryError ? `: ${deliveryError}` : ""}.`,
      };
    }

    await prisma.billingClaimBatch.update({
      where: { id: batchId },
      data: {
        status: "EXPORTED",
        externalReference,
        simulated: true,
        submittedAt: new Date(),
        validationJson: validation as object,
      },
    });

    return {
      batchId,
      externalReference,
      status: "EXPORTED",
      simulated: true,
      message: `${SIMULATED_LABEL} Plan-manager invoice pack prepared (${externalReference}). Enable BILLING_PLAN_MANAGER_LIVE only after authenticated environment testing.`,
    };
  }

  async getStatus(externalReference: string): Promise<ClaimStatusResult> {
    const batch = await prisma.billingClaimBatch.findFirst({
      where: { externalReference },
    });
    return {
      externalReference,
      status: (batch?.status as ClaimBatchState) ?? "EXPORTED",
      simulated: batch?.simulated ?? true,
      details: batch?.simulated === false ? LIVE_PLAN_MANAGER_LABEL : SIMULATED_LABEL,
    };
  }

  async cancel(externalReference: string): Promise<ClaimCancellationResult> {
    await prisma.billingClaimBatch.updateMany({
      where: { externalReference },
      data: { status: "CANCELLED" },
    });
    return {
      externalReference,
      cancelled: true,
      simulated: this.simulated,
      message: `${this.simulated ? SIMULATED_LABEL : LIVE_PLAN_MANAGER_LABEL} Plan-manager pack marked cancelled.`,
    };
  }
}

/**
 * Official NDIA gateway — intentionally disabled. Never submits live.
 */
export class OfficialDisabledClaimsGateway implements ClaimsGateway {
  readonly name = "official_disabled" as const;
  readonly simulated = true as const;

  async validate(batchId: string): Promise<ClaimValidationResult> {
    return {
      batchId,
      valid: false,
      errors: [
        {
          code: "OFFICIAL_DISABLED",
          message:
            "Official NDIA claiming is disabled in this environment. Use mock, CSV export, or plan-manager gateway.",
        },
      ],
      simulated: true,
    };
  }

  async submit(batchId: string): Promise<ClaimSubmissionResult> {
    return {
      batchId,
      status: "NOT_READY",
      simulated: true,
      message: `${SIMULATED_LABEL} Official NDIA API submission is disabled.`,
    };
  }

  async getStatus(externalReference: string): Promise<ClaimStatusResult> {
    return {
      externalReference,
      status: "NOT_READY",
      simulated: true,
      details: "Official NDIA claiming is disabled.",
    };
  }

  async cancel(externalReference: string): Promise<ClaimCancellationResult> {
    return {
      externalReference,
      cancelled: false,
      simulated: true,
      message: "Official NDIA claiming is disabled; nothing to cancel.",
    };
  }
}

export type ClaimsGatewayName =
  | "mock"
  | "csv_export"
  | "plan_manager"
  | "official_disabled";

export function getClaimsGateway(
  name: ClaimsGatewayName | BillingCentreClaimGateway | string
): ClaimsGateway {
  switch (name) {
    case "mock":
      return new MockClaimsGateway();
    case "csv_export":
      return new CsvExportClaimsGateway();
    case "plan_manager":
      return new PlanManagerClaimsGateway();
    case "official_disabled":
      return new OfficialDisabledClaimsGateway();
    default:
      return new OfficialDisabledClaimsGateway();
  }
}
