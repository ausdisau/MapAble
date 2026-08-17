"use client";

import { useCallback, useEffect, useState } from "react";

type Complaint = {
  id: string;
  status: string;
  title: string | null;
  body: string;
  complaintId: string | null;
  acknowledgedAt: string | null;
  acknowledgementDueAt: string | null;
  resolvedAt: string | null;
  participant: { name: string };
  improvementActions: Array<{ id: string; ciReferenceCode: string | null; title: string }>;
  createdAt: string;
};

type Improvement = {
  id: string;
  title: string;
  summary: string;
  status: string;
  ciReferenceCode: string | null;
  sourceComplaintId: string | null;
  submission: {
    id: string;
    complaintId: string | null;
    title: string | null;
  } | null;
};

export function ProviderComplaintsRegister({ organisationId }: { organisationId: string }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/provider/engagement/complaints?organisationId=${organisationId}`
    );
    const data = await res.json();
    setComplaints(data.complaints ?? []);
    setLoading(false);
  }, [organisationId]);

  useEffect(() => {
    void load();
  }, [load]);

  function exportCsv() {
    const rows = [
      [
        "ID",
        "Participant",
        "Received",
        "Status",
        "Acknowledged",
        "Due",
        "Resolved",
        "ComplaintRef",
        "CIRefs",
      ],
      ...complaints.map((c) => [
        c.id,
        c.participant.name,
        c.createdAt,
        c.status,
        c.acknowledgedAt ?? "",
        c.acknowledgementDueAt ?? "",
        c.resolvedAt ?? "",
        c.complaintId ?? "",
        c.improvementActions.map((a) => a.ciReferenceCode).filter(Boolean).join(";"),
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaints-register-${organisationId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={exportCsv}
        className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
      >
        Export CSV
      </button>
      {complaints.length === 0 ? (
        <p className="text-muted-foreground">No complaints on record.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Participant</th>
                <th className="p-2">Received</th>
                <th className="p-2">Status</th>
                <th className="p-2">Acknowledged</th>
                <th className="p-2">CI ref</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="p-2">{c.participant.name}</td>
                  <td className="p-2">{new Date(c.createdAt).toLocaleDateString("en-AU")}</td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">
                    {c.acknowledgedAt
                      ? new Date(c.acknowledgedAt).toLocaleDateString("en-AU")
                      : c.acknowledgementDueAt
                        ? `Due ${new Date(c.acknowledgementDueAt).toLocaleDateString("en-AU")}`
                        : "—"}
                  </td>
                  <td className="p-2">
                    {c.improvementActions.map((a) => a.ciReferenceCode).filter(Boolean).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ProviderCiRegister({ organisationId }: { organisationId: string }) {
  const [actions, setActions] = useState<Improvement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch(
        `/api/provider/engagement/improvements?organisationId=${organisationId}`
      );
      const data = await res.json();
      setActions(data.improvements ?? []);
      setLoading(false);
    })();
  }, [organisationId]);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return actions.length === 0 ? (
    <p className="text-muted-foreground">No CI actions yet.</p>
  ) : (
    <ul className="space-y-3 text-sm">
      {actions.map((a) => (
        <li key={a.id} className="rounded-xl border border-border p-4">
          <p className="font-medium">
            {a.ciReferenceCode ?? a.id} — {a.title}
          </p>
          <p className="mt-1 text-muted-foreground">{a.summary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Status: {a.status}
            {a.submission?.complaintId
              ? ` · Complaint: ${a.submission.complaintId}`
              : a.sourceComplaintId
                ? ` · Complaint: ${a.sourceComplaintId}`
                : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
