"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ScreeningSubmissionView } from "@/lib/workers/worker-screening-shared";
function statusClass(status: ScreeningSubmissionView["status"]): string {
  switch (status) {
    case "Verified":
      return "font-semibold text-green-700";
    case "Rejected":
      return "font-semibold text-red-700";
    case "Pending":
      return "font-semibold text-amber-700";
    default:
      return "font-medium text-slate-600";
  }
}

export function AdminScreeningDashboard() {
  const [verifications, setVerifications] = useState<ScreeningSubmissionView[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/screening-verifications");
    const data = (await res.json()) as {
      verifications?: ScreeningSubmissionView[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "Failed to load screening submissions");
      setVerifications([]);
      setLoading(false);
      return;
    }
    setVerifications(data.verifications ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="mapable-display text-2xl font-black text-[#0C1833]">
          Worker screening submissions
        </h1>
        <Button
          type="button"
          variant="secondary"
          size="default"
          onClick={() => void load()}
        >
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="p-2 font-bold">Worker</th>
                <th className="p-2 font-bold">Jurisdiction</th>
                <th className="p-2 font-bold">Submitted</th>
                <th className="p-2 font-bold">Status</th>
                <th className="p-2 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {verifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-slate-500">
                    No screening certificate uploads yet.
                  </td>
                </tr>
              ) : (
                verifications.map((v) => (
                  <tr key={v.id} className="border-t hover:bg-slate-50">
                    <td className="p-2 font-medium">{v.workerName}</td>
                    <td className="p-2">{v.jurisdiction}</td>
                    <td className="p-2">
                      {new Date(v.submittedAt).toLocaleString("en-AU")}
                    </td>
                    <td className={`p-2 ${statusClass(v.status)}`}>{v.status}</td>
                    <td className="p-2">
                      {v.workerProfileId ? (
                        <Link
                          href={`/admin/workers/${v.workerProfileId}`}
                          className="font-semibold text-[#005B7F] underline-offset-4 hover:underline"
                        >
                          Review
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
