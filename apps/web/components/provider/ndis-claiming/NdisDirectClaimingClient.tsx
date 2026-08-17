"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";
import { FUNDING_ROUTE_LABELS } from "@/lib/ndis/claiming/types";

type ClaimLineRow = {
  id: string;
  status: string;
  paymentRoute: string;
  participantName: string;
  supportItemCode: string;
  serviceStartDate: string;
  totalAmountCents: number;
  bookingId: string | null;
  batchId: string | null;
  rejectionCode: string | null;
  rejectionMessage: string | null;
  validationJson?: { issues?: Array<{ message: string; severity: string }> };
};

type View =
  | "ready"
  | "batches"
  | "errors"
  | "export"
  | "rejected"
  | "reconciliation";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  validated: "Validated",
  validation_failed: "Validation failed",
  included_in_batch: "In batch",
  exported: "Exported",
  submitted: "Submitted",
  pending: "Pending",
  paid: "Paid",
  rejected: "Rejected",
  corrected: "Corrected",
  resubmitted: "Resubmitted",
  voided: "Voided",
};

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const tone =
    status === "paid" || status === "validated"
      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
      : status === "rejected" || status === "validation_failed"
        ? "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100"
        : "bg-muted text-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        tone
      )}
    >
      <span className="sr-only">Status: </span>
      {label}
    </span>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function NdisDirectClaimingClient({
  organisationId,
  initialView = "ready",
}: {
  organisationId: string;
  initialView?: View;
}) {
  const [view, setView] = useState<View>(initialView);
  const [lines, setLines] = useState<ClaimLineRow[]>([]);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [batchId, setBatchId] = useState("");
  const [paymentRoute, setPaymentRoute] = useState("ndia_managed");
  const [bookingId, setBookingId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "export" | "submit" | null
  >(null);

  const loadLines = useCallback(
    async (status?: string) => {
      const params = new URLSearchParams({ providerOrgId: organisationId });
      if (status) params.set("status", status);
      const res = await fetch(`/api/ndis/claims/search?${params}`);
      const data = await res.json();
      setLines(data.lines ?? []);
    },
    [organisationId]
  );

  const readyLines = useMemo(
    () => lines.filter((l) => l.status === "validated" && !l.batchId),
    [lines]
  );
  const errorLines = useMemo(
    () => lines.filter((l) => l.status === "validation_failed"),
    [lines]
  );
  const rejectedLines = useMemo(
    () => lines.filter((l) => l.status === "rejected"),
    [lines]
  );

  async function createFromBooking() {
    if (!bookingId.trim()) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/ndis/claims/from-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: bookingId.trim(),
        providerOrgId: organisationId,
        evidenceJson: { deliveryRecorded: true, participantConfirmedAt: new Date().toISOString() },
      }),
    });
    const data = await res.json();
    if (data.error) setMessage(data.error);
    else {
      setMessage(`Draft claim line created (${data.line?.status}). Run validation if needed.`);
      void loadLines();
    }
    setBusy(false);
  }

  async function validateLine(id: string) {
    setBusy(true);
    const res = await fetch("/api/ndis/claims/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimLineId: id }),
    });
    const data = await res.json();
    setMessage(
      data.validation?.valid
        ? "Claim line passed validation."
        : data.validation?.issues?.map((i: { message: string }) => i.message).join(" ") ??
            data.error
    );
    void loadLines();
    setBusy(false);
  }

  async function createBatch() {
    if (selectedLineIds.length === 0) return;
    setBusy(true);
    const res = await fetch("/api/ndis/claim-batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerOrgId: organisationId,
        paymentRoute,
        claimLineIds: selectedLineIds,
      }),
    });
    const data = await res.json();
    if (data.batch?.id) {
      setBatchId(data.batch.id);
      setMessage(`Batch ${data.batch.id.slice(0, 8)}… created.`);
    } else {
      setMessage(
        data.validation?.issues?.map((i: { message: string }) => i.message).join(" ") ??
          data.error ??
          "Could not create batch"
      );
    }
    void loadLines();
    setBusy(false);
  }

  async function runExport() {
    if (!batchId.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/ndis/claim-batches/${batchId.trim()}/export`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.payloadBase64) {
      const blob = new Blob(
        [Uint8Array.from(atob(data.payloadBase64), (c) => c.charCodeAt(0))],
        { type: data.contentType ?? "text/csv" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName ?? "claim-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      setMessage(data.message ?? "Export downloaded.");
    } else {
      setMessage(data.error ?? "Export failed");
    }
    setConfirmAction(null);
    setBusy(false);
  }

  async function markSubmitted() {
    if (!batchId.trim()) return;
    setBusy(true);
    const res = await fetch(
      `/api/ndis/claim-batches/${batchId.trim()}/mark-submitted`,
      { method: "POST" }
    );
    const data = await res.json();
    setMessage(data.message ?? data.error ?? "Updated");
    setConfirmAction(null);
    setBusy(false);
  }

  async function updateLineStatus(
    lineId: string,
    status: string,
    extra?: Record<string, string>
  ) {
    setBusy(true);
    const res = await fetch(`/api/ndis/claim-lines/${lineId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    const data = await res.json();
    setMessage(data.line ? `Status updated to ${data.line.status}.` : data.error);
    void loadLines(status === "rejected" ? "rejected" : undefined);
    setBusy(false);
  }

  const nav: { id: View; label: string; href: string }[] = [
    { id: "ready", label: "Ready to claim", href: "/provider/ndis-claims/ready" },
    { id: "batches", label: "Batch builder", href: "/provider/ndis-claims/batches" },
    { id: "errors", label: "Validation errors", href: "/provider/ndis-claims/validation-errors" },
    { id: "export", label: "Export batch", href: "/provider/ndis-claims/export" },
    { id: "rejected", label: "Rejected claims", href: "/provider/ndis-claims/rejected" },
    {
      id: "reconciliation",
      label: "Reconciliation",
      href: "/provider/ndis-claims/reconciliation",
    },
  ];

  return (
    <div className="space-y-6">
      <div className={cn(mapableSectionCardClass, "p-4")} role="note">
        <p className="text-sm text-muted-foreground">
          Portal-assisted claiming only. MapAble does not access myplace, myID, RAM, or PRODA,
          and never stores government portal passwords. Export files for manual upload, or
          send invoices to participants and plan managers.
        </p>
      </div>

      <nav aria-label="NDIS claiming sections" className="flex flex-wrap gap-2">
        {nav.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              view === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/80"
            )}
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => {
              setView(item.id);
              void loadLines(
                item.id === "errors"
                  ? "validation_failed"
                  : item.id === "rejected"
                    ? "rejected"
                    : undefined
              );
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {message ? (
        <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm" role="status">
          {message}
        </p>
      ) : null}

      {view === "ready" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Ready to claim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="booking-id" className="text-sm font-medium">
                Completed booking ID
              </label>
              <input
                id="booking-id"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              />
            </div>
            <Button type="button" variant="default" size="default" disabled={busy} onClick={() => void createFromBooking()}>
              Create draft claim from booking
            </Button>
            <Button type="button" variant="outline" size="default" disabled={busy} onClick={() => void loadLines("validated")}>
              Refresh validated lines
            </Button>
            <ClaimTable
              rows={readyLines.length ? readyLines : lines}
              onValidate={validateLine}
              selectable
              selected={selectedLineIds}
              onSelectChange={setSelectedLineIds}
            />
          </CardContent>
        </Card>
      )}

      {view === "batches" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Claim batch builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="payment-route" className="text-sm font-medium">
                Funding route for batch
              </label>
              <select
                id="payment-route"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={paymentRoute}
                onChange={(e) => setPaymentRoute(e.target.value)}
              >
                <option value="ndia_managed">NDIA-managed</option>
                <option value="plan_managed">Plan-managed</option>
                <option value="self_managed">Self-managed</option>
              </select>
            </div>
            <Button type="button" variant="default" size="default" disabled={busy || selectedLineIds.length === 0} onClick={() => void createBatch()}>
              Create batch from selected lines ({selectedLineIds.length})
            </Button>
            {batchId ? (
              <p className="text-sm">
                Latest batch ID: <code>{batchId}</code>
              </p>
            ) : null}
            <ClaimTable
              rows={readyLines}
              selectable
              selected={selectedLineIds}
              onSelectChange={setSelectedLineIds}
            />
          </CardContent>
        </Card>
      )}

      {view === "errors" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Validation errors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {errorLines.map((line) => (
                <li key={line.id} className="rounded-lg border p-3">
                  <p className="font-medium">{line.participantName}</p>
                  <p className="text-sm text-muted-foreground">{line.supportItemCode}</p>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {(line.validationJson?.issues ?? []).map((issue, i) => (
                      <li key={i}>{issue.message}</li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    className="mt-2"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void validateLine(line.id)}
                  >
                    Re-run validation
                  </Button>
                </li>
              ))}
              {errorLines.length === 0 ? (
                <p className="text-sm text-muted-foreground">No validation errors.</p>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      )}

      {view === "export" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Export claim batch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="batch-id" className="text-sm font-medium">
                Batch ID
              </label>
              <input
                id="batch-id"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
              />
            </div>
            {confirmAction === "export" ? (
              <div className="rounded-lg border-2 border-primary p-4" role="dialog" aria-labelledby="confirm-export-title">
                <h2 id="confirm-export-title" className="font-medium">
                  Confirm export
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This downloads a file containing only participants in this batch. You will
                  upload NDIA-managed files yourself in myplace.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="default" size="default" disabled={busy} onClick={() => void runExport()}>
                    Confirm download
                  </Button>
                  <Button type="button" variant="outline" size="default" onClick={() => setConfirmAction(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="default" size="default" disabled={busy} onClick={() => setConfirmAction("export")}>
                Export batch file
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {view === "rejected" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Rejected claims</CardTitle>
          </CardHeader>
          <CardContent>
            <ClaimTable
              rows={rejectedLines}
              extraActions={(line) => (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const res = await fetch(`/api/ndis/claim-lines/${line.id}/status`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "resubmitted", resubmit: {} }),
                    });
                    const data = await res.json();
                    setMessage(data.newLine ? "Corrected line resubmitted." : data.error);
                    void loadLines("rejected");
                    setBusy(false);
                  }}
                >
                  Resubmit
                </Button>
              )}
            />
          </CardContent>
        </Card>
      )}

      {view === "reconciliation" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Reconciliation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mark lines paid or rejected after you reconcile portal outcomes or invoice payments.
            </p>
            <Button type="button" variant="outline" size="default" disabled={busy} onClick={() => void loadLines()}>
              Load all recent lines
            </Button>
            <ClaimTable
              rows={lines}
              extraActions={(line) => (
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={busy}
                    onClick={() => void updateLineStatus(line.id, "paid")}
                  >
                    Mark paid
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void updateLineStatus(line.id, "rejected", {
                        rejectionCode: "MANUAL",
                        rejectionMessage: "Rejected during reconciliation",
                      })
                    }
                  >
                    Mark rejected
                  </Button>
                </div>
              )}
            />
            {confirmAction === "submit" ? (
              <div className="rounded-lg border-2 border-primary p-4" role="dialog" aria-labelledby="confirm-submit-title">
                <h2 id="confirm-submit-title" className="font-medium">
                  Confirm portal submission
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Only confirm after you have manually submitted this batch in myplace.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="default" size="default" disabled={busy} onClick={() => void markSubmitted()}>
                    Confirm submitted
                  </Button>
                  <Button type="button" variant="outline" size="default" onClick={() => setConfirmAction(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="default"
                disabled={busy || !batchId}
                onClick={() => setConfirmAction("submit")}
              >
                Mark batch submitted in portal
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ClaimTable({
  rows,
  onValidate,
  selectable,
  selected = [],
  onSelectChange,
  extraActions,
}: {
  rows: ClaimLineRow[];
  onValidate?: (id: string) => void;
  selectable?: boolean;
  selected?: string[];
  onSelectChange?: (ids: string[]) => void;
  extraActions?: (line: ClaimLineRow) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">NDIS claim lines</caption>
        <thead>
          <tr className="border-b text-left">
            {selectable ? <th scope="col" className="p-2">Select</th> : null}
            <th scope="col" className="p-2">
              Participant
            </th>
            <th scope="col" className="p-2">
              Support item
            </th>
            <th scope="col" className="p-2">
              Route
            </th>
            <th scope="col" className="p-2">
              Amount
            </th>
            <th scope="col" className="p-2">
              Status
            </th>
            <th scope="col" className="p-2">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((line) => (
            <tr key={line.id} className="border-b">
              {selectable && onSelectChange ? (
                <td className="p-2">
                  <input
                    type="checkbox"
                    aria-label={`Select claim for ${line.participantName}`}
                    checked={selected.includes(line.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectChange([...selected, line.id]);
                      } else {
                        onSelectChange(selected.filter((id) => id !== line.id));
                      }
                    }}
                  />
                </td>
              ) : null}
              <td className="p-2">{line.participantName}</td>
              <td className="p-2">{line.supportItemCode}</td>
              <td className="p-2">
                {FUNDING_ROUTE_LABELS[line.paymentRoute as keyof typeof FUNDING_ROUTE_LABELS] ??
                  line.paymentRoute}
              </td>
              <td className="p-2">{formatMoney(line.totalAmountCents)}</td>
              <td className="p-2">
                <StatusBadge status={line.status} />
              </td>
              <td className="p-2">
                <div className="flex flex-wrap gap-1">
                  {onValidate ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onValidate(line.id)}
                    >
                      Validate
                    </Button>
                  ) : null}
                  {extraActions?.(line)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No claim lines to show.</p>
      ) : null}
    </div>
  );
}
