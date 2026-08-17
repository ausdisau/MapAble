"use client";

import { useCallback, useState } from "react";

import { submitICanIntake } from "@/lib/intake/submit-i-can-intake";
import { useIntakeStore } from "@/lib/intake/use-intake-store";
import type { ICanV6Intake } from "@/lib/validation/i-can-v6";

export type UseSubmitICanIntakeState = {
  pending: boolean;
  error: string | null;
  successId: string | null;
  notice: string | null;
};

export function useSubmitICanIntake() {
  const clear = useIntakeStore((s) => s.clear);
  const validateForSubmit = useIntakeStore((s) => s.validateForSubmit);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setPending(true);
    setError(null);
    setSuccessId(null);
    setNotice(null);

    try {
      const parsed = validateForSubmit();
      if (!parsed.success) {
        setError("Please complete all domains and consent before submitting.");
        setPending(false);
        return { ok: false as const };
      }

      const payload = parsed.data as ICanV6Intake;
      const result = await submitICanIntake(payload);

      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return { ok: false as const };
      }

      clear();
      setSuccessId(result.id);
      setNotice(result.notice ?? null);
      setPending(false);
      return { ok: true as const, id: result.id };
    } catch {
      setError("Unexpected error while submitting intake");
      setPending(false);
      return { ok: false as const };
    }
  }, [clear, validateForSubmit]);

  return {
    submit,
    pending,
    error,
    successId,
    notice,
  } satisfies UseSubmitICanIntakeState & {
    submit: () => Promise<{ ok: boolean; id?: string }>;
  };
}
