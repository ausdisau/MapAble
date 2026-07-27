"use client";

import { useRef, useState } from "react";

import {
  ConsentScopeCheckbox,
  type ConsentScopeOption,
} from "@/components/consent/ConsentScopeCheckbox";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { SensitiveDataBanner } from "@/components/forms/SensitiveDataBanner";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  PRE_REGISTRATION_ROLES,
  preRegistrationRoleLabels,
  type PreRegistrationRole,
} from "@/lib/pre-registration/schema";

const PRE_REG_CONSENT_SCOPES: ConsentScopeOption[] = [
  {
    id: "prereg_contact",
    label:
      "MapAble may use my contact details for pilot pre-registration follow-up",
    description: "Name and email only — not for unrelated marketing lists.",
  },
  {
    id: "no_sensitive_upload",
    label:
      "I confirm I have not pasted NDIS plan documents or clinical records into this form",
    description: "Use a secure MapAble workflow if those records are required.",
  },
];

type FieldErrors = Partial<
  Record<"name" | "email" | "role" | "consent" | "form", string>
>;

export function PreRegistrationSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PreRegistrationRole>("participant");
  const [organisation, setOrganisation] = useState("");
  const [notes, setNotes] = useState("");
  const [company, setCompany] = useState("");
  const [consentIds, setConsentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [successMessage, setSuccessMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function focusFirstInvalid(nextErrors: FieldErrors) {
    const map: Record<string, string> = {
      name: "prereg-name",
      email: "prereg-email",
      role: "prereg-role-legend",
      consent: "prereg-consent-legend",
    };
    for (const key of ["name", "email", "role", "consent"] as const) {
      if (!nextErrors[key]) continue;
      const el = document.getElementById(map[key]);
      if (el instanceof HTMLElement) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = "Enter your name.";
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    if (!PRE_REGISTRATION_ROLES.includes(role)) {
      nextErrors.role = "Choose participant or provider.";
    }
    if (!consentIds.includes("prereg_contact")) {
      nextErrors.consent =
        "Confirm you allow MapAble to use your contact details for follow-up.";
    }
    if (!consentIds.includes("no_sensitive_upload")) {
      nextErrors.consent =
        "Confirm you have not pasted NDIS plan or clinical records into this form.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("idle");
      queueMicrotask(() => focusFirstInvalid(nextErrors));
      return;
    }

    setErrors({});
    setStatus("loading");

    try {
      const response = await fetch("/api/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role,
          organisation: organisation.trim() || undefined,
          notes: notes.trim() || undefined,
          consentScopes: consentIds,
          company,
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setErrors({ form: payload.error ?? "Could not submit. Try again." });
        setStatus("idle");
        return;
      }

      setSuccessMessage(
        payload.message ?? "Thanks — pre-registration received.",
      );
      setStatus("success");
      setName("");
      setEmail("");
      setOrganisation("");
      setNotes("");
      setConsentIds([]);
      formRef.current?.reset();
    } catch {
      setErrors({ form: "Network error. Please try again." });
      setStatus("idle");
    }
  }

  return (
    <section
      id="pre-register"
      aria-labelledby="pre-register-heading"
      className="relative overflow-hidden border-y border-slate-200 bg-[#F6FBFC]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-[#005B7F]/10 blur-3xl motion-reduce:blur-none"
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:px-8 lg:py-16">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
            Early access
          </p>
          <h2
            id="pre-register-heading"
            className="mt-3 max-w-xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
          >
            Pre-register for the MapAble pilot
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Tell us whether you are joining as a participant or a provider. This
            is interest registration only — not an account, booking, or NDIS
            claim pathway.
          </p>
          <ul className="mt-6 space-y-3 text-sm font-semibold text-slate-700">
            <li className="flex gap-2">
              <span className="text-[#005B7F]" aria-hidden="true">
                •
              </span>
              Participants and carers: accessibility maps and support discovery
            </li>
            <li className="flex gap-2">
              <span className="text-[#005B7F]" aria-hidden="true">
                •
              </span>
              Providers: list interest for verified access-ready profiles
            </li>
          </ul>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {status === "success" ? (
            <div
              role="status"
              className="rounded-2xl border border-[#00A979]/30 bg-[#00A979]/10 p-5 text-sm leading-6 text-[#0C1833]"
            >
              <p className="font-black">You are on the list</p>
              <p className="mt-2">{successMessage}</p>
              <button
                type="button"
                className={`mt-4 inline-flex min-h-11 items-center rounded-xl border-2 border-[#0C1833] px-4 text-sm font-black ${mapableCareFocusRing}`}
                onClick={() => setStatus("idle")}
              >
                Submit another registration
              </button>
            </div>
          ) : (
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5"
            >
              <fieldset>
                <legend
                  id="prereg-role-legend"
                  tabIndex={-1}
                  className="text-sm font-black text-[#0C1833]"
                >
                  I am joining as
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {PRE_REGISTRATION_ROLES.map((option) => {
                    const selected = role === option;
                    return (
                      <label
                        key={option}
                        className={`flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border-2 px-4 text-center text-sm font-black transition ${
                          selected
                            ? "border-[#005B7F] bg-[#005B7F] text-white"
                            : "border-slate-200 bg-[#F6FBFC] text-[#0C1833] hover:border-[#005B7F]/40"
                        } ${mapableCareFocusRing}`}
                      >
                        <input
                          type="radio"
                          name="prereg-role"
                          value={option}
                          checked={selected}
                          onChange={() => setRole(option)}
                          className="sr-only"
                        />
                        {preRegistrationRoleLabels[option]}
                      </label>
                    );
                  })}
                </div>
                {errors.role ? (
                  <p className="mt-2 text-sm text-red-700" role="alert">
                    {errors.role}
                  </p>
                ) : null}
              </fieldset>

              <AccessibleFormField
                id="prereg-name"
                label="Full name"
                error={errors.name}
                required
              >
                <input
                  id="prereg-name"
                  name="name"
                  autoComplete="name"
                  className={formInputClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </AccessibleFormField>

              <AccessibleFormField
                id="prereg-email"
                label="Email"
                error={errors.email}
                required
              >
                <input
                  id="prereg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={formInputClass}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </AccessibleFormField>

              {role === "provider" ? (
                <AccessibleFormField
                  id="prereg-organisation"
                  label="Organisation (optional)"
                >
                  <input
                    id="prereg-organisation"
                    name="organisation"
                    autoComplete="organization"
                    className={formInputClass}
                    value={organisation}
                    onChange={(event) => setOrganisation(event.target.value)}
                  />
                </AccessibleFormField>
              ) : null}

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="prereg-notes"
                    className="block text-sm font-medium"
                  >
                    What are you hoping to use MapAble for? (optional)
                  </label>
                  <SensitiveDataBanner id="prereg-sensitive-tip" />
                </div>
                <textarea
                  id="prereg-notes"
                  name="notes"
                  rows={3}
                  className={formInputClass}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  aria-describedby="prereg-sensitive-tip"
                />
              </div>

              {/* Honeypot */}
              <div
                className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                aria-hidden="true"
              >
                <label htmlFor="prereg-company">Company</label>
                <input
                  id="prereg-company"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                />
              </div>

              <div id="prereg-consent-legend" tabIndex={-1}>
                <ConsentScopeCheckbox
                  scopes={PRE_REG_CONSENT_SCOPES}
                  checkedIds={consentIds}
                  onChange={setConsentIds}
                  legend="Consent for pre-registration"
                  error={errors.consent}
                  requiredScopeIds={["prereg_contact", "no_sensitive_upload"]}
                />
              </div>

              {errors.form ? (
                <p className="text-sm text-red-700" role="alert">
                  {errors.form}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className={`inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#005B7F] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#004766] disabled:opacity-60 sm:w-auto ${mapableCareFocusRing}`}
              >
                {status === "loading" ? "Submitting…" : "Pre-register interest"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
