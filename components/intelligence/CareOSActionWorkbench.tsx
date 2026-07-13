"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ActionType = "submit_care_request" | "submit_transport_request";
type Prepared = {
  token: string;
  payloadHash: string;
  expiresAt: string;
  confirmationText: string;
};

type Receipt = {
  id: string;
  missionId?: string;
  actionType: ActionType;
  status: string;
  resultEntityType: string;
  resultEntityId: string;
};

async function digest(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function CareOSActionWorkbench({
  missionId,
  onReceipt,
}: {
  missionId?: string;
  onReceipt?: (receipt: Receipt) => void;
}) {
  const [actionType, setActionType] =
    useState<ActionType>("submit_care_request");
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [care, setCare] = useState({
    requestType: "appointment_support",
    title: "Support for my appointment",
    description: "I need support before, during or after my appointment.",
    preferredDate: "",
    startTime: "",
    endTime: "",
    address: "",
    suburb: "",
    state: "NSW",
    accessRequirementsSummary: "",
    linkedTransportRequired: true,
    shareAccessibility: false,
  });
  const [transport, setTransport] = useState({
    pickupAddress: "",
    pickupSuburb: "",
    dropoffAddress: "",
    dropoffSuburb: "",
    scheduledStart: "",
    scheduledEnd: "",
    accessNotes: "",
    requiresWheelchairAccessible: false,
    requiresRamp: false,
    requiresHoist: false,
    driverAssistanceRequired: false,
  });

  function payload() {
    if (actionType === "submit_care_request") {
      return {
        ...care,
        preferredDate: care.preferredDate
          ? new Date(care.preferredDate).toISOString()
          : undefined,
        shareAccessibilityConfirmed: care.shareAccessibility,
      };
    }
    return {
      pickupAddress: transport.pickupAddress,
      pickupSuburb: transport.pickupSuburb || undefined,
      dropoffAddress: transport.dropoffAddress,
      dropoffSuburb: transport.dropoffSuburb || undefined,
      scheduledStart: transport.scheduledStart
        ? new Date(transport.scheduledStart).toISOString()
        : "",
      scheduledEnd: transport.scheduledEnd
        ? new Date(transport.scheduledEnd).toISOString()
        : undefined,
      accessNotes: transport.accessNotes || undefined,
      mobilityRequirements: {
        requiresWheelchairAccessible:
          transport.requiresWheelchairAccessible,
        requiresRamp: transport.requiresRamp,
        requiresHoist: transport.requiresHoist,
        driverAssistanceRequired: transport.driverAssistanceRequired,
      },
      prefillFromProfile: false,
    };
  }

  async function prepare() {
    setBusy(true);
    setError(null);
    setReceipt(null);
    try {
      const bodyPayload = payload();
      const proposalPayloadHash = await digest(bodyPayload);
      const response = await fetch(
        "/api/intelligence/careos-actions/prepare",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalId: crypto.randomUUID(),
            requestId: missionId ?? crypto.randomUUID(),
            actionType,
            payload: bodyPayload,
            proposalPayloadHash,
            confirmedInformationToShare:
              actionType === "submit_care_request"
                ? [
                    "support request",
                    "timing",
                    "location",
                    "access details selected below",
                  ]
                : [
                    "pickup",
                    "destination",
                    "timing",
                    "mobility requirements",
                  ],
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "The action could not be prepared.");
      }
      setPrepared(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The action could not be prepared.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function execute() {
    if (!prepared) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/intelligence/careos-actions/execute",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: prepared.token, confirmed: true }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "The action was not completed.");
      }
      const nextReceipt = data.receipt as Receipt;
      setReceipt(nextReceipt);
      setPrepared(null);
      onReceipt?.(nextReceipt);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The action was not completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  const field =
    "min-h-11 w-full rounded-md border border-input bg-background px-3 py-2";
  return (
    <section aria-labelledby="careos-action-heading" className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          CareOS action workbench
        </p>
        <h2 id="careos-action-heading" className="text-2xl font-bold">
          Review, edit and confirm an action
        </h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Nothing is submitted until the final confirmation. Confirmed actions
          may also be disabled by the server-side safety switch.
        </p>
        {missionId ? (
          <p className="mt-2 text-sm text-muted-foreground">
            This action will be attached to appointment mission {missionId}.
          </p>
        ) : null}
      </div>
      <Card variant="elevated">
        <CardContent className="space-y-5 pt-6">
          <fieldset className="flex flex-wrap gap-4">
            <legend className="font-semibold">Action type</legend>
            <label>
              <input
                type="radio"
                checked={actionType === "submit_care_request"}
                onChange={() => {
                  setActionType("submit_care_request");
                  setPrepared(null);
                }}
              />{" "}
              Care request
            </label>
            <label>
              <input
                type="radio"
                checked={actionType === "submit_transport_request"}
                onChange={() => {
                  setActionType("submit_transport_request");
                  setPrepared(null);
                }}
              />{" "}
              Transport request
            </label>
          </fieldset>
          {actionType === "submit_care_request" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Support type
                <select
                  className={field}
                  value={care.requestType}
                  onChange={(event) =>
                    setCare({ ...care, requestType: event.target.value })
                  }
                >
                  <option value="appointment_support">Appointment support</option>
                  <option value="personal_care">Personal care</option>
                  <option value="community_access">Community access</option>
                  <option value="domestic_assistance">Domestic assistance</option>
                  <option value="therapy_assistance">Therapy assistance</option>
                  <option value="employment_support">Employment support</option>
                </select>
              </label>
              <label>
                Title
                <input
                  className={field}
                  value={care.title}
                  onChange={(event) =>
                    setCare({ ...care, title: event.target.value })
                  }
                />
              </label>
              <label className="md:col-span-2">
                Description
                <textarea
                  className={field}
                  rows={3}
                  value={care.description}
                  onChange={(event) =>
                    setCare({ ...care, description: event.target.value })
                  }
                />
              </label>
              <label>
                Date and time
                <input
                  className={field}
                  type="datetime-local"
                  value={care.preferredDate}
                  onChange={(event) =>
                    setCare({ ...care, preferredDate: event.target.value })
                  }
                />
              </label>
              <label>
                Address
                <input
                  className={field}
                  value={care.address}
                  onChange={(event) =>
                    setCare({ ...care, address: event.target.value })
                  }
                />
              </label>
              <label>
                Suburb
                <input
                  className={field}
                  value={care.suburb}
                  onChange={(event) =>
                    setCare({ ...care, suburb: event.target.value })
                  }
                />
              </label>
              <label>
                State
                <input
                  className={field}
                  value={care.state}
                  onChange={(event) =>
                    setCare({ ...care, state: event.target.value })
                  }
                />
              </label>
              <label className="md:col-span-2">
                Access requirements
                <textarea
                  className={field}
                  rows={2}
                  value={care.accessRequirementsSummary}
                  onChange={(event) =>
                    setCare({
                      ...care,
                      accessRequirementsSummary: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={care.linkedTransportRequired}
                  onChange={(event) =>
                    setCare({
                      ...care,
                      linkedTransportRequired: event.target.checked,
                    })
                  }
                />{" "}
                Linked transport required
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={care.shareAccessibility}
                  onChange={(event) =>
                    setCare({
                      ...care,
                      shareAccessibility: event.target.checked,
                    })
                  }
                />{" "}
                Share the access summary with the provider
              </label>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Pickup address
                <input
                  className={field}
                  value={transport.pickupAddress}
                  onChange={(event) =>
                    setTransport({
                      ...transport,
                      pickupAddress: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Pickup suburb
                <input
                  className={field}
                  value={transport.pickupSuburb}
                  onChange={(event) =>
                    setTransport({
                      ...transport,
                      pickupSuburb: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Destination
                <input
                  className={field}
                  value={transport.dropoffAddress}
                  onChange={(event) =>
                    setTransport({
                      ...transport,
                      dropoffAddress: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Destination suburb
                <input
                  className={field}
                  value={transport.dropoffSuburb}
                  onChange={(event) =>
                    setTransport({
                      ...transport,
                      dropoffSuburb: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Pickup time
                <input
                  className={field}
                  type="datetime-local"
                  value={transport.scheduledStart}
                  onChange={(event) =>
                    setTransport({
                      ...transport,
                      scheduledStart: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Expected finish
                <input
                  className={field}
                  type="datetime-local"
                  value={transport.scheduledEnd}
                  onChange={(event) =>
                    setTransport({
                      ...transport,
                      scheduledEnd: event.target.value,
                    })
                  }
                />
              </label>
              <label className="md:col-span-2">
                Driver and access notes
                <textarea
                  className={field}
                  rows={2}
                  value={transport.accessNotes}
                  onChange={(event) =>
                    setTransport({
                      ...transport,
                      accessNotes: event.target.value,
                    })
                  }
                />
              </label>
              {(
                [
                  "requiresWheelchairAccessible",
                  "requiresRamp",
                  "requiresHoist",
                  "driverAssistanceRequired",
                ] as const
              ).map((key) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={transport[key]}
                    onChange={(event) =>
                      setTransport({
                        ...transport,
                        [key]: event.target.checked,
                      })
                    }
                  />{" "}
                  {key.replaceAll(/([A-Z])/g, " $1").toLowerCase()}
                </label>
              ))}
            </div>
          )}
          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive"
            >
              {error}
            </p>
          ) : null}
          {prepared ? (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
              <p className="font-semibold">Final confirmation</p>
              <p className="mt-2 text-sm">{prepared.confirmationText}</p>
              <p className="mt-2 break-all text-xs">
                Payload hash: {prepared.payloadHash}
              </p>
              <p className="text-xs">
                Expires: {new Date(prepared.expiresAt).toLocaleString("en-AU")}
              </p>
              <Button
                className="mt-3"
                loading={busy}
                onClick={() => void execute()}
              >
                Confirm and submit
              </Button>
            </div>
          ) : (
            <Button loading={busy} onClick={() => void prepare()}>
              Prepare for confirmation
            </Button>
          )}
          {receipt ? (
            <div role="status" className="rounded-md border bg-muted/30 p-4">
              <p className="font-medium">Action completed</p>
              <p className="text-sm">Receipt: {receipt.id}</p>
              <p className="text-sm">
                Created {receipt.resultEntityType} {receipt.resultEntityId}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
