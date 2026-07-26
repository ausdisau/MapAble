"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { PARTNER_API_KEY_SCOPES } from "@/lib/developer-api/partner-api-key-scopes";

type OrganisationOption = { id: string; name: string };

type CreatedKeyResponse = {
  apiKey: string;
  prefix: string;
  name: string;
  message: string;
  error?: string;
};

export function CreateApiKeyDialog({
  organisations,
}: {
  organisations: OrganisationOption[];
}) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [partnerId, setPartnerId] = useState(organisations[0]?.id ?? "");
  const [scopes, setScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<CreatedKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  function openDialog() {
    setOpen(true);
    setError(null);
    setCreatedKey(null);
    setCopied(false);
    setName("");
    setScopes([]);
    setPartnerId(organisations[0]?.id ?? "");
    queueMicrotask(() => dialogRef.current?.showModal());
  }

  function closeDialog() {
    dialogRef.current?.close();
    setOpen(false);
    setCreatedKey(null);
    setError(null);
    setCopied(false);
    router.refresh();
  }

  function toggleScope(scopeId: string) {
    setScopes((current) =>
      current.includes(scopeId)
        ? current.filter((s) => s !== scopeId)
        : [...current, scopeId]
    );
  }

  async function copyKey(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("Could not copy to clipboard. Please copy the key manually.");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch("/api/developer/apps/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          partnerId: partnerId || undefined,
          scopes,
        }),
      });
      const data = (await res.json()) as CreatedKeyResponse;

      if (!res.ok) {
        setError(data.error ?? "Failed to create API key");
        return;
      }

      setCreatedKey(data);
      setName("");
      setScopes([]);
    } catch {
      setError("Network error while creating API key");
    } finally {
      setLoading(false);
    }
  }

  if (organisations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Join or create an organisation before generating API keys.
      </p>
    );
  }

  return (
    <>
      <Button type="button" variant="default" size="default" onClick={openDialog}>
        Create New API Key
      </Button>

      {open ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          className="w-[min(100%,32rem)] rounded-xl border border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
          onClose={() => {
            setOpen(false);
            setCreatedKey(null);
            router.refresh();
          }}
        >
          <div className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold">
                  {createdKey ? "API key created" : "Create New API Key"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {createdKey
                    ? "Copy your key now. MapAble will not show it again."
                    : "Choose a name and the scopes your integration needs."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeDialog}
                aria-label="Close dialog"
              >
                Close
              </Button>
            </div>

            {createdKey ? (
              <div
                role="alert"
                className="space-y-3 rounded-lg border-2 border-amber-500 bg-amber-50 p-4 text-amber-950"
              >
                <p className="text-sm font-semibold">
                  This is the only time your API key will be shown. Store it in
                  a secrets manager before closing this dialog.
                </p>
                <p className="text-xs text-amber-900/80">{createdKey.message}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="block flex-1 break-all rounded-md bg-white/80 px-3 py-2 font-mono text-sm">
                    {createdKey.apiKey}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={() => void copyKey(createdKey.apiKey)}
                  >
                    {copied ? "Copied" : "Copy to clipboard"}
                  </Button>
                </div>
                <p className="text-xs">
                  Display prefix for later reference:{" "}
                  <span className="font-mono">{createdKey.prefix}</span>
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
                {organisations.length > 1 ? (
                  <AccessibleFormField
                    id="api-key-partner"
                    label="Partner organisation"
                    required
                  >
                    <select
                      id="api-key-partner"
                      className={formInputClass}
                      value={partnerId}
                      onChange={(e) => setPartnerId(e.target.value)}
                      required
                    >
                      {organisations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </AccessibleFormField>
                ) : null}

                <AccessibleFormField
                  id="api-key-name"
                  label="Key name"
                  required
                  hint="A label your team will recognise (for example, Production Wayfinding)."
                >
                  <input
                    id="api-key-name"
                    className={formInputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    required
                    autoComplete="off"
                  />
                </AccessibleFormField>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Requested scopes</legend>
                  <p className="text-xs text-muted-foreground">
                    Select only the scopes your integration needs.
                  </p>
                  <ul className="space-y-2">
                    {PARTNER_API_KEY_SCOPES.map((scope) => {
                      const checkboxId = `scope-${scope.id.replace(":", "-")}`;
                      return (
                        <li key={scope.id}>
                          <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-accent/40">
                            <input
                              id={checkboxId}
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-input"
                              checked={scopes.includes(scope.id)}
                              onChange={() => toggleScope(scope.id)}
                            />
                            <label htmlFor={checkboxId} className="cursor-pointer">
                              <span className="block text-sm font-medium">
                                {scope.label}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {scope.description}
                              </span>
                            </label>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>

                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={closeDialog}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="default"
                    disabled={loading || scopes.length === 0 || !name.trim()}
                  >
                    {loading ? "Creating…" : "Generate API key"}
                  </Button>
                </div>
              </form>
            )}

            {createdKey && error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            {createdKey ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={closeDialog}
                >
                  I have stored the key
                </Button>
              </div>
            ) : null}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
