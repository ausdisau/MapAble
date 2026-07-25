import type { ICanV6Intake } from "@/lib/validation/i-can-v6";

export type SubmitICanIntakeResult =
  | {
      ok: true;
      id: string;
      status: string;
      notice?: string;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

/**
 * Sanitises and POSTs a validated I-CAN v6 payload to the intake API.
 * Caller should clear the Zustand store only after `ok: true`.
 */
export async function submitICanIntake(
  payload: ICanV6Intake,
): Promise<SubmitICanIntakeResult> {
  try {
    const res = await fetch("/api/participants/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      id?: string;
      status?: string;
      notice?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.error || "Submission failed",
        status: res.status,
      };
    }

    if (!data.id) {
      return {
        ok: false,
        error: "Submission response missing id",
        status: res.status,
      };
    }

    return {
      ok: true,
      id: data.id,
      status: data.status ?? "submitted_draft",
      notice: data.notice,
    };
  } catch {
    return {
      ok: false,
      error: "Network error while submitting intake",
      status: 0,
    };
  }
}
